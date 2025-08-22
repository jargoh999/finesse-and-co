import mongoose from 'mongoose';
import Cart from '@/models/Cart';
import CartItem from '@/models/CartItem';
import User from '@/models/User';
import Product from '@/models/Product';

// This ensures models are registered only once
const registerModels = () => {
  // Register models if they don't exist
  if (!mongoose.models.CartItem) {
    mongoose.model('CartItem', require('@/models/CartItem').cartItemSchema);
  }
  
  if (!mongoose.models.Cart) {
    mongoose.model('Cart', require('@/models/Cart').cartSchema);
  }
  
  if (!mongoose.models.User) {
    mongoose.model('User', require('@/models/User').userSchema);
  }
  
  if (!mongoose.models.Product) {
    mongoose.model('Product', require('@/models/Product').productSchema);
  }
};

export default registerModels;
