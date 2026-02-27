
'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import WishlistItem from '@/lib/models/WishlistItem';

const PERMANENT_SUPER_ADMIN = 'sriyanshgupta24@gmail.com';

/**
 * Fetches the user profile from MongoDB by Firebase UID.
 * Enforces the permanent super_admin role for the designated email.
 */
export async function getProfile(firebaseId: string) {
  await dbConnect();
  try {
    const user = await User.findOne({ firebaseId }).lean();
    
    // Auto-elevate the specific Super Admin email if it matches
    if (user && user.email === PERMANENT_SUPER_ADMIN && user.role !== 'super_admin') {
      await User.updateOne({ _id: user._id }, { role: 'super_admin' });
      user.role = 'super_admin';
    }
    
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Creates a base profile for a new user.
 * Handles cases where email might be missing (e.g. phone login).
 */
export async function getOrCreateProfile(firebaseId: string, email?: string | null) {
  await dbConnect();
  try {
    const cleanEmail = email?.trim().toLowerCase();
    
    // Role determination: Hardcoded override for Super Admin
    const role = cleanEmail === PERMANENT_SUPER_ADMIN ? 'super_admin' : 'buyer';
    
    // Construct base update object
    const onInsert: any = {
      role,
      emailVerified: false,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only include email if it exists and is not an empty string
    if (cleanEmail) {
      onInsert.email = cleanEmail;
    }

    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $setOnInsert: onInsert },
      { new: true, upsert: true }
    ).lean();
    
    // Safety check for role elevation on newly created or existing profile
    if (user && user.email === PERMANENT_SUPER_ADMIN && user.role !== 'super_admin') {
      const elevated = await User.findOneAndUpdate(
        { firebaseId },
        { $set: { role: 'super_admin' } },
        { new: true }
      ).lean();
      return JSON.parse(JSON.stringify(elevated));
    }

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error provisioning profile:", error);
    throw new Error("Failed to provision profile.");
  }
}

/**
 * Marks a user's email as verified in MongoDB.
 */
export async function verifyUserEmail(firebaseId: string, email: string) {
  await dbConnect();
  try {
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: { emailVerified: true, email: email.toLowerCase() } },
      { new: true, upsert: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error verifying email in DB:", error);
    throw new Error("Failed to verify email record.");
  }
}

/**
 * Updates user profile with address details.
 */
export async function updateProfile(firebaseId: string, data: any) {
  await dbConnect();
  try {
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile.");
  }
}

export async function getUserOrders(userId: string) {
  await dbConnect();
  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    return [];
  }
}

export async function getWishlistItems(userId: string) {
  await dbConnect();
  try {
    const items = await WishlistItem.find({ userId }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch (error) {
    return [];
  }
}
