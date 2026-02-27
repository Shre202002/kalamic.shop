'use server';

import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all reviews for a specific product.
 */
export async function getProductReviews(productId: string) {
  await dbConnect();
  try {
    const reviews = await Review.find({ product_id: productId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(reviews));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

/**
 * Adds a new review and updates product aggregate stats.
 */
export async function submitReview(data: {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}) {
  await dbConnect();
  try {
    // 1. Check for existing review (Backend validation)
    const existing = await Review.findOne({ product_id: data.productId, user_id: data.userId });
    if (existing) {
      throw new Error("You have already shared your feedback for this piece.");
    }

    // 2. Create the review
    const newReview = await Review.create({
      product_id: data.productId,
      user_id: data.userId,
      user_name: data.userName,
      rating: data.rating,
      comment: data.comment
    });

    // 3. Update Product Stats
    const allReviews = await Review.find({ product_id: data.productId });
    const totalRating = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = totalRating / allReviews.length;

    await KalamicProduct.findByIdAndUpdate(data.productId, {
      $set: { 
        'analytics.average_rating': parseFloat(avg.toFixed(1)),
        'analytics.review_count': allReviews.length
      }
    });

    revalidatePath(`/products/${data.productId}`);
    return { success: true, review: JSON.parse(JSON.stringify(newReview)) };
  } catch (error: any) {
    console.error("Error submitting review:", error);
    throw new Error(error.message || "Failed to submit review");
  }
}
