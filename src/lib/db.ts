
import mongoose from 'mongoose';

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
  const MONGODB_URI = process.env.MONGODB_URI;

  // Moved check inside function to prevent top-level crash during compilation
  if (!MONGODB_URI) {
    console.warn('[DB] MONGODB_URI is not defined. Database operations will be disabled.');
    return null;
  }

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
       * SELF-HEALING: Cleanup legacy snake_case unique index if it exists.
       */
      try {
        const collection = m.connection.db?.collection('Ordered_Items');
        if (collection) {
          await collection.dropIndex('order_number_1');
          console.log('[DB] Successfully purged legacy index: order_number_1');
        }
      } catch (e) {
        // Index likely doesn't exist; ignore safely.
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
