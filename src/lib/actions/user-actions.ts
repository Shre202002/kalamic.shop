
'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import OrderedItem from '@/lib/models/OrderedItem';
import WishlistItem from '@/lib/models/WishlistItem';

const PERMANENT_SUPER_ADMIN = 'sriyanshgupta24@gmail.com';

/**
 * Fetches the user profile from MongoDB by Firebase UID.
 * Distinguishes between "not found" and "connection error".
 */
export async function getProfile(firebaseId: string) {
  try {
    await dbConnect();
    const user = await User.findOne({ firebaseId }).lean();
    
    if (user && user.email === PERMANENT_SUPER_ADMIN && user.role !== 'super_admin') {
      await User.updateOne({ _id: user._id }, { role: 'super_admin' });
      user.role = 'super_admin';
    }
    
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error: any) {
    console.error(`[DB_ERROR] getProfile for ${firebaseId}:`, error.message);
    // We throw the error so the caller knows it's a system failure, not just a missing user
    throw error;
  }
}

/**
 * Creates a base profile for a new user using an atomic upsert.
 */
export async function getOrCreateProfile(firebaseId: string, email?: string | null) {
  try {
    await dbConnect();
    const cleanEmail = email?.trim().toLowerCase();
    const role = cleanEmail === PERMANENT_SUPER_ADMIN ? 'super_admin' : 'buyer';
    
    const onInsert: any = {
      firebaseId, 
      role,
      emailVerified: false,
      phoneVerified: false,
      status: 'active',
      // Note: createdAt and updatedAt are managed automatically by Mongoose timestamps: true
    };

    if (cleanEmail) {
      onInsert.email = cleanEmail;
    }

    // Use $setOnInsert to only apply fields if creating a new document.
    // Mongoose handles 'updatedAt' via $set and 'createdAt' via $setOnInsert internally.
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $setOnInsert: onInsert },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    
    return JSON.parse(JSON.stringify(user));
  } catch (error: any) {
    console.error(`[DB_ERROR] getOrCreateProfile failed:`, error.message);
    // Re-throw the original error to surface the root cause
    throw new Error(`Profile Provisioning Failed: ${error.message}`);
  }
}

/**
 * Marks a user's email as verified.
 */
export async function verifyUserEmail(firebaseId: string, email: string) {
  try {
    await dbConnect();
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: { emailVerified: true, email: email.toLowerCase() } },
      { new: true, upsert: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error: any) {
    console.error(`[DB_ERROR] verifyUserEmail failed:`, error.message);
    throw error;
  }
}

/**
 * Updates user profile with address details.
 */
export async function updateProfile(firebaseId: string, data: any) {
  try {
    await dbConnect();
    // Remove sensitive fields that shouldn't be updated via this general method
    const { role, firebaseId: _, emailVerified, ...updateData } = data;
    
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error: any) {
    console.error(`[DB_ERROR] updateProfile failed:`, error.message);
    throw error;
  }
}

export async function getUserOrders(userId: string) {
  try {
    await dbConnect();
    const orders = await OrderedItem.find({ userId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(orders));
  } catch (error: any) {
    console.error(`[DB_ERROR] getUserOrders failed:`, error.message);
    return [];
  }
}

export async function getWishlistItems(userId: string) {
  try {
    await dbConnect();
    const items = await WishlistItem.find({ userId }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch (error: any) {
    console.error(`[DB_ERROR] getWishlistItems failed:`, error.message);
    return [];
  }
}
