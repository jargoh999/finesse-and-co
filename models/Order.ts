import mongoose, { Document, Schema } from 'mongoose';

// Interface for Order Item
interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  image: string;
  specifications?: {
    color?: string;
    size?: string;
    bodySize?: string;
    numericSize?: string;
  };
}

// Interface for Shipping Info
interface IShippingInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

// Interface for Payment Info
interface IPaymentInfo {
  method: 'card' | 'bank_transfer' | 'on_delivery';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  amountPaid: number;
  paidAt?: Date;
}

// Main Order Interface
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  total: number;
  itemCount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingInfo: IShippingInfo;
  paymentInfo: IPaymentInfo;
  paidAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Function to generate a unique order number
const generateOrderNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Generate a random 4-digit number
  const random = Math.floor(1000 + Math.random() * 9000);
  
  // Format: YYMMDD-RRRR
  const baseNumber = `${year}${month}${day}-${random}`;
  
  // Check if order number already exists (very unlikely but just to be safe)
  const existingOrder = await mongoose.models.Order?.findOne({ orderNumber: baseNumber });
  if (existingOrder) {
    // If by chance it exists, try again with a new random number
    return generateOrderNumber();
  }
  
  return baseNumber;
};

// Order Schema
const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        image: {
          type: String,
          required: true,
        },
        specifications: {
          color: String,
          size: String,
          bodySize: String,
          numericSize: String,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    itemCount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingInfo: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ['card', 'bank_transfer', 'on_delivery'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
      transactionId: String,
      amountPaid: {
        type: Number,
        default: 0,
      },
      paidAt: Date,
    },
    paidAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// Create indexes
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save hook to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await generateOrderNumber();
  }
  next();
});

// Pre-save hook to calculate totals
orderSchema.pre<IOrder>('save', function (next) {
  if (this.isModified('items')) {
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.total = this.subtotal; // Add shipping costs if any
  }
  next();
});

// Create and export the model
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export default Order;
