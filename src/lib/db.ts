
import mongoose from 'mongoose';

/**
 * @fileOverview Database connection utility with robust caching and timeout prevention.
 * Ensures Mongoose does not buffer commands while waiting for a connection.
 */

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.warn('[DB_WARNING] MONGODB_URI is not defined in environment variables.');
}

// Global caching to prevent connection leaks during Next.js Hot Module Replacement (HMR)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) return null;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Globally disable buffering to avoid the 10s timeout "buffering timed out" errors
    mongoose.set('bufferCommands', false);

    const opts = {
      bufferCommands: false,
      dbName: process.env.DB_NAME || 'kalamic',
      serverSelectionTimeoutMS: 5000, // Fail fast if connection cannot be established
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('[DB_SUCCESS] Established fresh MongoDB connection');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Clear promise on failure to allow retry
    console.error('[DB_ERROR] Connection failed:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
