
'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import WishlistItem from '@/lib/models/WishlistItem';

/**
 * Fetches the user profile from MongoDB by Firebase UID.
 */
export async function getProfile(firebaseId: string) {
  await dbConnect();
  try {
    const user = await User.findOne({ firebaseId }).lean();
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Creates a base profile for a new user without marking it as verified.
 */
export async function getOrCreateProfile(firebaseId: string, email: string) {
  await dbConnect();
  try {
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { 
        $setOnInsert: { 
          email, 
          emailVerified: false,
          phoneVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      },
      { new: true, upsert: true }
    ).lean();
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
      { $set: { emailVerified: true, email } },
      { new: true, upsert: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error verifying email in DB:", error);
    throw new Error("Failed to verify email record.");
  }
}

/**
 * Marks a user's phone as verified in MongoDB.
 */
export async function verifyUserPhone(firebaseId: string, phone: string) {
  await dbConnect();
  try {
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: { phoneVerified: true, phone } },
      { new: true, upsert: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error verifying phone in DB:", error);
    throw new Error("Failed to verify phone record.");
  }
}

/**
 * Updates or creates the user profile with integrated address details.
 */
export async function updateProfile(firebaseId: string, data: { 
  email: string,
  firstName: string, 
  lastName: string, 
  phone: string,
  address: string,
  state: string,
  city: string,
  pincode: string,
  landmark: string
}) {
  await dbConnect();
  try {
    // Preserve verification flags during general update
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: { ...data } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile. Ensure all required fields are filled.");
  }
}

/**
 * Fetches orders for a specific user.
 */
export async function getUserOrders(userId: string) {
  await dbConnect();
  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

/**
 * Fetches wishlist items for a specific user.
 */
export async function getWishlistItems(userId: string) {
  await dbConnect();
  try {
    const items = await WishlistItem.find({ userId }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return [];
  }
}
