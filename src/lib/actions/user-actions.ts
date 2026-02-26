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
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: data },
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

/**
 * Adds a product to the user's wishlist in MongoDB.
 */
export async function addToWishlist(userId: string, product: any) {
  await dbConnect();
  try {
    const productId = product._id || product.id;
    const item = await WishlistItem.findOneAndUpdate(
      { userId, productId },
      { 
        $set: { 
          userId, 
          productId,
          slug: product.slug,
          name: product.name,
          price: product.price,
          imageUrl: product.images?.[0] || product.imageUrl
        } 
      },
      { upsert: true, new: true }
    ).lean();
    return JSON.parse(JSON.stringify(item));
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw new Error("Failed to add to wishlist");
  }
}

/**
 * Removes a product from the user's wishlist in MongoDB.
 */
export async function removeFromWishlist(userId: string, productId: string) {
  await dbConnect();
  try {
    await WishlistItem.findOneAndDelete({ userId, productId });
    return true;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw new Error("Failed to remove from wishlist");
  }
}
