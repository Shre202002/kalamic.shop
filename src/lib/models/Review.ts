import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true, collection: 'reviews' });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
