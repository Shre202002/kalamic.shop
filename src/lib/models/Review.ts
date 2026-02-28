import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Upgraded Schema for the Product_Reviews collection.
 * Supports media uploads, verified status, and engagement metrics.
 */

export interface IReview extends Document {
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  review_text: string;
  review_images: Array<{
    url: string;
    alt: string;
  }>;
  is_verified_purchase: boolean;
  likes_count: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  product_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, required: true },
  user_avatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, required: true },
  review_images: {
    type: [{
      url: { type: String, required: true },
      alt: { type: String, default: "" }
    }],
    _id: false
  },
  is_verified_purchase: { type: Boolean, default: false },
  likes_count: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: "approved" 
  },
}, { 
  timestamps: true,
  collection: 'Product_Reviews' 
});

// Ensure one review per user per product
ReviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
