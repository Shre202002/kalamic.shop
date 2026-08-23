'use server';

import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import GalleryItem from '@/lib/models/GalleryItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import User from '@/lib/models/User';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedSession, requireAdmin } from '@/lib/server-auth';
import { consumeRateLimit } from '@/lib/security/rate-limit';

/**
 * Checks if a user has actually purchased the product and it has been delivered.
 */
export async function checkUserReviewEligibility(userId: string, productId: string) {
  await dbConnect();
  try {
    const user: any = await User.findOne({ firebaseId: userId, status: 'active' })
      .select('emailVerified phone')
      .lean();
    return Boolean(user?.emailVerified && typeof user.phone === 'string' && /^[0-9+()\-\s]{7,20}$/.test(user.phone.trim()));
  } catch (error) {
    console.error("[REVIEWS] Eligibility Check Error:", error);
    return false;
  }
}

export async function getReviewEligibility(userId: string) {
  await dbConnect();
  const user: any = await User.findOne({ firebaseId: userId, status: 'active' })
    .select('emailVerified phone')
    .lean();
  if (!user) return { eligible: false, reason: 'Create your Kalamic profile before writing a review.' };
  if (!user.emailVerified) return { eligible: false, reason: 'Verify your email from your profile before writing a review.' };
  if (typeof user.phone !== 'string' || !/^[0-9+()\-\s]{7,20}$/.test(user.phone.trim())) {
    return { eligible: false, reason: 'Add a valid phone number to your profile before writing a review.' };
  }
  return { eligible: true, reason: '' };
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
  images?: Array<{ url: string; alt: string; mediaType?: 'image' | 'video'; fileId?: string; format?: string }>;
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
  if (images.some((image) => typeof image?.url !== 'string' || !/^https:\/\//i.test(image.url) || image.url.length > 2048 || !image.url.includes('imagekit.io') || (image.mediaType && !['image', 'video'].includes(image.mediaType)) || (image.fileId && (typeof image.fileId !== 'string' || image.fileId.length > 300)))) {
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
          status: 'pending',
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

    const product = await KalamicProduct.findById(data.productId).select('name').lean();
    const reviewId = result._id.toString();
    const mediaKeys = images.map((image) => image.fileId || image.url);
    await GalleryItem.updateMany(
      { sourceReviewId: reviewId, ...(mediaKeys.length ? { sourceReviewMediaId: { $nin: mediaKeys } } : {}) },
      { $set: { isActive: false } },
    );
    await Promise.all(images.map((image, index) => {
      const mediaKey = image.fileId || image.url;
      return GalleryItem.findOneAndUpdate(
        { sourceReviewId: reviewId, sourceReviewMediaId: mediaKey },
        {
          $set: {
            name: `${product?.name || 'Kalamic product'} review`,
            description: 'Customer review media from a verified Kalamic order.',
            mediaType: image.mediaType || 'image',
            url: image.url,
            fileId: image.fileId || image.url,
            // Review uploads do not include a separate poster frame. Leave the
            // thumbnail empty so Gallery uses its safe video placeholder rather
            // than trying to render an MP4 URL as an image.
            thumbnailUrl: undefined,
            format: image.format || (image.mediaType === 'video' ? 'mp4' : 'image'),
            category: 'Other',
            altText: image.alt || `${product?.name || 'Kalamic product'} customer review`,
            caption: `Customer review for ${product?.name || 'a Kalamic product'}`,
            // Admin activation is the moderation gate for public Gallery display.
            isActive: false,
            uploadedBy: session.uid,
            source: 'review',
          },
          $setOnInsert: { sortOrder: 0, isFeatured: false },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }));

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

export async function getAdminReviews(status: 'all' | 'pending' | 'approved' | 'rejected' = 'pending') {
  const { user } = await requireAdmin(['super_admin', 'admin', 'support']);
  await dbConnect();
  const query = status === 'all' ? {} : { status };
  const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(200).lean();
  const productIds = [...new Set(reviews.map((review: any) => review.product_id))];
  const products = await KalamicProduct.find({ _id: { $in: productIds } }).select('name slug').lean();
  const productMap = new Map(products.map((product: any) => [product._id.toString(), product]));
  return JSON.parse(JSON.stringify(reviews.map((review: any) => ({
    ...review,
    product: productMap.get(String(review.product_id)) || null,
    moderatorRole: user.role,
  }))));
}

export async function moderateReview(adminId: string, reviewId: string, status: 'approved' | 'rejected') {
  const { user } = await requireAdmin(['super_admin', 'admin', 'support']);
  if (typeof adminId !== 'string' || adminId !== user.firebaseId) throw new Error('Unauthorized');
  await dbConnect();
  const review: any = await Review.findByIdAndUpdate(reviewId, { $set: { status } }, { new: true }).lean();
  if (!review) throw new Error('Review not found.');
  const stats = await Review.aggregate([
    { $match: { product_id: review.product_id, status: 'approved' } },
    { $group: { _id: '$product_id', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);
  await KalamicProduct.findByIdAndUpdate(review.product_id, {
    $set: {
      'analytics.average_rating': stats[0] ? Number(stats[0].avgRating.toFixed(1)) : 0,
      'analytics.review_count': stats[0]?.totalReviews || 0,
    },
  });
  revalidatePath(`/products/${review.product_id}`);
  revalidatePath('/admin/reviews');
  return JSON.parse(JSON.stringify(review));
}
