'use server';

import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all reviews for a specific product.
 */
export async function getProductReviews(productId: string) {
  await dbConnect();
  try {
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(reviews));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

/**
 * Adds a new review to the database and updates product stats.
 */
export async function submitReview(data: {
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
}) {
  await dbConnect();
  try {
    const newReview = await Review.create(data);
    
    // Optional: Update product average rating and review count
    const reviews = await Review.find({ productId: data.productId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(data.productId, {
      $set: { 
        averageRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviews.length
      }
    });

    revalidatePath(`/products/${data.productId}`);
    return JSON.parse(JSON.stringify(newReview));
  } catch (error) {
    console.error("Error submitting review:", error);
    throw new Error("Failed to submit review");
  }
}
