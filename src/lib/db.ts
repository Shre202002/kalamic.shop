
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: process.env.DB_NAME || 'kalamic',
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then(async (m) => {
      /**
       * SELF-HEALING: Cleanup legacy snake_case unique index.
       * The 'order_number_1' index causes E11000 errors on the new schema
       * because new documents lack the field (duplicate nulls).
       */
      try {
        const collection = m.connection.db?.collection('Ordered_Items');
        if (collection) {
          await collection.dropIndex('order_number_1');
          console.log('[DB] Successfully purged legacy index: order_number_1');
        }
      } catch (e) {
        // Index likely doesn't exist or collection is empty; ignore safely.
      }
      
      return m;
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
