import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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
cartItemSchema.virtual('subtotal').get(function() {
  return this.quantity * this.price;
});

// Ensure virtuals are included when converting to JSON
cartItemSchema.set('toJSON', { virtuals: true });
cartItemSchema.set('toObject', { virtuals: true });

export const CartItem = mongoose.models.CartItem || mongoose.model('CartItem', cartItemSchema);
export type ICartItem = mongoose.InferSchemaType<typeof cartItemSchema>;
