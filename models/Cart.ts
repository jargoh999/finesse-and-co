import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import CartItem, { ICartItem } from './CartItem';
import User from './User';
import Product from './Product';

// Ensure models are loaded
import './User';
import './Product';
import './CartItem';

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  COMPLETED = 'completed'
}

export const cartSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CartItem'
  }],
  status: {
    type: String,
    enum: Object.values(CartStatus),
    default: CartStatus.ACTIVE
  },
  total: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
});

// Update timestamps on save
cartSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Calculate total and item count
  if (this.isModified('items')) {
    this.itemCount = this.items.length;
    // Note: We'll populate items to calculate total in a virtual or separate query
  }

  next();
});

// Interface for populated cart item
interface IPopulatedCartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  addedAt: Date;
}

// Virtual for cart total
cartSchema.virtual('calculateTotal').get(async function () {
  const populatedCart = await this.populate<{ items: ICartItem[] }>({
    path: 'items',
    populate: {
      path: 'product',
      model: 'Product'
    }
  });

  if (!populatedCart.items || !Array.isArray(populatedCart.items)) {
    return 0;
  }

  return populatedCart.items.reduce((sum, item) => {
    const itemPrice = item.product?.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);
});

// Static method to get or create active cart for user
cartSchema.static('getOrCreateActiveCart', async function (userId: string) {
  const Cart = this.model('Cart');
  let cart = await Cart.findOne({
    user: userId,
    status: CartStatus.ACTIVE
  });

  if (!cart) {
    cart = new Cart({
      user: userId,
      status: CartStatus.ACTIVE,
      items: [],
      total: 0,
      itemCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    await cart.save();
  }

  return cart;
});

// Method to add item to cart
cartSchema.methods.addItem = async function (productId: string, quantity: number, price: number) {
  const CartItem = (await import('./CartItem')).default;

  // Check if item already exists in cart
  const existingItem = await CartItem.findOne({
    cart: this._id,
    product: productId
  });

  if (existingItem) {
    // Update quantity if item exists
    existingItem.quantity += quantity;
    await existingItem.save();
    return existingItem;
  } else {
    // Create new cart item
    const newItem = new CartItem({
      cart: this._id,
      product: productId,
      quantity,
      price
    });

    await newItem.save();

    // Add to cart's items array
    this.items.push(newItem._id);
    await this.save();

    return newItem;
  }
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function (itemId: string) {
  const CartItem = require('./CartItem').CartItem;

  // Remove from items array
  this.items = this.items.filter((id: any) => id.toString() !== itemId);
  await this.save();

  // Delete the cart item
  await CartItem.findByIdAndDelete(itemId);

  return this;
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function (itemId: string, quantity: number) {
  if (quantity <= 0) {
    return this.removeItem(itemId);
  }

  const CartItem = require('./CartItem').CartItem;
  const item = await CartItem.findById(itemId);

  if (item) {
    item.quantity = quantity;
    await item.save();
  }

  return this;
};

// Define the Cart document interface
export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[];
  status: CartStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  calculateTotal: Promise<number>;
  addItem: (productId: string, quantity: number, price: number) => Promise<ICartItem>;
  removeItem: (itemId: string) => Promise<ICart | null>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<ICart | null>;
}

// Define the Cart model interface with static methods
interface ICartModel extends Model<ICart> {
  getOrCreateActiveCart(userId: string): Promise<ICart>;
}

// Create and export the model
const Cart: ICartModel = (mongoose.models.Cart || mongoose.model<ICart, ICartModel>('Cart', cartSchema)) as ICartModel;

export default Cart;
