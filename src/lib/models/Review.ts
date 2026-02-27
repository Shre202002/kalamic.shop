import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Official Schema for the Product_Reviews collection.
 */

export interface IReview extends Document {
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  product_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { 
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'Product_Reviews' 
});

// Compound index to ensure one review per user per product
ReviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
