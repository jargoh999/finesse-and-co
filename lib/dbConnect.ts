import mongoose from 'mongoose';

// Get the MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Throw an error if MONGODB_URI is not defined
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

console.log('Connecting to MongoDB...');

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

global.mongoose = cached;

async function dbConnect() {
  console.log('dbConnect called with MONGODB_URI:', MONGODB_URI ? '***' : 'not set');
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
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
export default dbConnect;
