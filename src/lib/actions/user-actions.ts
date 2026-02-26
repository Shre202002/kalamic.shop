
'use server';

import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import WishlistItem from '@/lib/models/WishlistItem';
import Address from '@/lib/models/Address';

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

export async function updateProfile(firebaseId: string, data: { firstName?: string, lastName?: string, phone?: string }) {
  await dbConnect();
  try {
    const user = await User.findOneAndUpdate(
      { firebaseId },
      { $set: data },
      { new: true, upsert: true }
    ).lean();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

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

export async function getUserAddresses(userId: string) {
  await dbConnect();
  try {
    const addresses = await Address.find({ userId }).lean();
    return JSON.parse(JSON.stringify(addresses));
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
}

export async function addAddress(userId: string, data: any) {
  await dbConnect();
  try {
    const address = await Address.create({ ...data, userId });
    return JSON.parse(JSON.stringify(address));
  } catch (error) {
    console.error("Error adding address:", error);
    throw new Error("Failed to add address");
  }
}
