import mongoose from 'mongoose';

// Import models to ensure they're registered
import '../models/User';
import '../models/Product';
import '../models/CartItem';
import '../models/Cart';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rayo';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // Ensure all models are registered after connection
      require('../models/User');
      require('../models/Product');
      require('../models/CartItem');
      require('../models/Cart');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDB;
