
'use server';

import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { revalidatePath } from 'next/cache';

/**
 * Checks if a user has actually purchased the product to mark as verified.
 */
async function checkVerifiedPurchase(userId: string, productId: string) {
  // In a production environment, this would query the MongoDB Orders collection.
  // For this prototype, we'll return false or true based on business logic.
  return false;
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
    console.error("[REVIEWS] Fetch Error:", error);
    return [];
  }
}

/**
 * Submits or updates a review for a specific product.
 * Ensures one review per user per product using an atomic upsert.
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
  
  console.log(`[REVIEWS] >>> SUBMIT_REVIEW_START`);
  console.log(`[REVIEWS] Piece ID: ${data.productId}`);
  console.log(`[REVIEWS] Collector ID: ${data.userId}`);

  try {
    // 1. Perform Atomic Upsert
    // Matches by product and user. Updates fields if exists, otherwise inserts.
    const result = await Review.findOneAndUpdate(
      { product_id: data.productId, user_id: data.userId },
      { 
        $set: {
          user_name: data.userName,
          user_avatar: data.userAvatar,
          rating: data.rating,
          comment: data.reviewText,
          review_images: data.images || [],
          status: 'approved', // Auto-approval for prototype simplicity
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          is_verified_purchase: false,
          likes_count: 0
        }
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );

    const isUpdate = result.updatedAt.getTime() > result.createdAt.getTime();
    console.log(`[REVIEWS] DB Success: ${isUpdate ? 'REFINED' : 'CREATED'} review ${result._id}`);

    // 2. Atomic Aggregate Recalculation
    // We must recalculate the product's analytics every time a review changes.
    const stats = await Review.aggregate([
      { $match: { product_id: data.productId, status: 'approved' } },
      { 
        $group: {
          _id: '$product_id',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const newAverage = parseFloat(stats[0].avgRating.toFixed(1));
      const newCount = stats[0].totalReviews;
      
      console.log(`[REVIEWS] Updating Piece Analytics -> Avg: ${newAverage}, Count: ${newCount}`);
      
      const productSync = await KalamicProduct.findByIdAndUpdate(data.productId, {
        $set: { 
          'analytics.average_rating': newAverage,
          'analytics.review_count': newCount
        }
      });

      if (!productSync) {
        console.warn(`[REVIEWS] WARNING: Review saved but Piece ${data.productId} not found for sync.`);
      }
    }

    // 3. Purge Caches
    revalidatePath(`/products/${data.productId}`);
    revalidatePath(`/`);
    
    console.log(`[REVIEWS] <<< SUBMIT_REVIEW_SUCCESS`);
    
    return { 
      success: true, 
      review: JSON.parse(JSON.stringify(result)) 
    };
  } catch (error: any) {
    console.error("[REVIEWS] SUBMISSION_FAILED:", error);
    throw new Error(error.message || "Failed to process your feedback in the archive.");
  }
}
