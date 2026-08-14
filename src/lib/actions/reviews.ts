'use server';

import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedSession } from '@/lib/server-auth';
import { consumeRateLimit } from '@/lib/security/rate-limit';

/**
 * Checks if a user has actually purchased the product and it has been delivered.
 */
export async function checkUserReviewEligibility(userId: string, productId: string) {
  await dbConnect();
  try {
    const order = await OrderedItem.findOne({
      userId,
      'items.productId': productId,
      orderStatus: 'Delivered'
    });
    return !!order;
  } catch (error) {
    console.error("[REVIEWS] Eligibility Check Error:", error);
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
    console.error("[REVIEWS] Fetch Error:", error);
    return [];
  }
}

/**
 * Submits or updates a review for a specific product.
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
  const session = await getAuthenticatedSession();
  if (!session || session.uid !== data.userId) throw new Error('Unauthorized');
  if (!await consumeRateLimit(`review-submit:${session.uid}:${data.productId}`, 3, 60 * 60 * 1000)) {
    throw new Error('Review submission rate limit exceeded.');
  }
  if (typeof data.productId !== 'string' || data.productId.length > 100 || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    throw new Error('Invalid review details.');
  }
  if (typeof data.reviewText !== 'string' || data.reviewText.trim().length < 3 || data.reviewText.length > 3000) {
    throw new Error('Review text must be between 3 and 3000 characters.');
  }
  if (typeof data.userName !== 'string' || data.userName.trim().length < 2 || data.userName.length > 100) {
    throw new Error('Invalid reviewer name.');
  }
  const eligible = await checkUserReviewEligibility(session.uid, data.productId);
  if (!eligible) throw new Error('Only verified owners can submit a review.');

  const images = Array.isArray(data.images) ? data.images.slice(0, 4) : [];
  if (images.some((image) => typeof image?.url !== 'string' || !/^https:\/\//i.test(image.url) || image.url.length > 2048 || !image.url.includes('imagekit.io'))) {
    throw new Error('Review media must be secure ImageKit URLs.');
  }

  await dbConnect();
  
  try {
    const result = await Review.findOneAndUpdate(
      { product_id: data.productId, user_id: data.userId },
      { 
        $set: {
          user_name: data.userName,
          user_avatar: data.userAvatar,
          rating: data.rating,
          comment: data.reviewText,
          review_images: images,
          status: 'approved',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          is_verified_purchase: true,
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

    // Atomic Aggregate Recalculation
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
      
      await KalamicProduct.findByIdAndUpdate(data.productId, {
        $set: { 
          'analytics.average_rating': newAverage,
          'analytics.review_count': newCount
        }
      });
    }

    revalidatePath(`/products/${data.productId}`);
    return { success: true, review: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("[REVIEWS] SUBMISSION_FAILED:", error);
    throw new Error(error.message || "Failed to process your feedback.");
  }
}
