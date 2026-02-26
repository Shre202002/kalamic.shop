
import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlistItem extends Document {
  userId: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: Date;
}

const WishlistItemSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  slug: { type: String },
  name: { type: String },
  price: { type: Number },
  imageUrl: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'wishlist_items' });

export default mongoose.models.WishlistItem || mongoose.model<IWishlistItem>('WishlistItem', WishlistItemSchema);
