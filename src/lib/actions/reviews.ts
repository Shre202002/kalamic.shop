'use server';

import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import KalamicProduct from '@/lib/models/KalamicProduct';
import Order from '@/lib/models/Order';
import { revalidatePath } from 'next/cache';

/**
 * Checks if a user has actually purchased the product to mark as verified.
 */
async function checkVerifiedPurchase(userId: string, productId: string) {
  try {
    await dbConnect();
    // Check against both model types for safety in this prototype environment
    const order = await Order.findOne({ 
      userId, 
      'items.productId': productId,
      orderStatus: { $in: ['placed', 'delivered', 'dispatched', 'confirmed', 'paid'] }
    });
    return !!order;
  } catch (err) {
    console.error("[REVIEWS] Verified purchase check failed:", err);
    return false;
  }
}

/**
 * Fetches all approved reviews for a specific product.
 */
export async function getProductReviews(productId: string) {
  await dbConnect();
  try {
    const reviews = await Review.find({ product_id: productId, status: 'approved' }).sort({ createdAt: -1 }).lean();
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
  userAvatar?: string;
  rating: number;
  reviewText: string;
  images?: Array<{ url: string; alt: string }>;
}) {
  await dbConnect();
  try {
    console.log(`[REVIEWS] Submitting review for product: ${data.productId} by user: ${data.userId}`);

    // 1. Check for existing review
    const existing = await Review.findOne({ product_id: data.productId, user_id: data.userId });
    if (existing) {
      throw new Error("You have already shared your feedback for this piece.");
    }

    // 2. Check verified status
    const isVerified = await checkVerifiedPurchase(data.userId, data.productId);

    // 3. Create the review
    const newReview = await Review.create({
      product_id: data.productId,
      user_id: data.userId,
      user_name: data.userName,
      user_avatar: data.userAvatar,
      rating: data.rating,
      comment: data.reviewText,
      review_images: data.images || [],
      is_verified_purchase: isVerified,
      status: 'approved' // Auto-approve for this prototype
    });

    // 4. Atomic Aggregate Calculation
    const stats = await Review.aggregate([
      { $match: { product_id: data.productId, status: 'approved' } },
      { 
        $group: {
          _id: '$product_id',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const avg = parseFloat(stats[0].avgRating.toFixed(1));
      const count = stats[0].count;
      
      console.log(`[REVIEWS] Updating product stats: Avg ${avg}, Count ${count}`);
      
      await KalamicProduct.findByIdAndUpdate(data.productId, {
        $set: { 
          'analytics.average_rating': avg,
          'analytics.review_count': count
        }
      });
    }

    revalidatePath(`/products/${data.productId}`);
    return { success: true, review: JSON.parse(JSON.stringify(newReview)) };
  } catch (error: any) {
    console.error("[REVIEWS] Submission Error:", error);
    throw new Error(error.message || "Failed to submit review");
  }
}
