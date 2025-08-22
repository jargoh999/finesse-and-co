import mongoose, { Schema, Document, Model } from 'mongoose';

export const cartItemSchema = new Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for getting the subtotal
cartItemSchema.virtual('subtotal').get(function () {
  return this.quantity * this.price;
});

// Ensure virtuals are included when converting to JSON
cartItemSchema.set('toJSON', { virtuals: true });
cartItemSchema.set('toObject', { virtuals: true });

// Define the CartItem document interface
export interface ICartItem extends Document {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  addedAt: Date;
  subtotal: number;
}

// Define the CartItem model interface
export interface ICartItemModel extends Model<ICartItem> { }

// Create and export the model
const CartItem: ICartItemModel = mongoose.models.CartItem || mongoose.model<ICartItem, ICartItemModel>('CartItem', cartItemSchema);

export default CartItem;
