
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  images: string[];
  price: number;
  stock: number;
  is_active: boolean;
  tags: string[];
  compare_at_price?: number | string;
  short_description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  category_id: { type: String, index: true },
  images: [{ type: String }],
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  tags: [{ type: String }],
  compare_at_price: { type: Schema.Types.Mixed },
  short_description: { type: String }
}, { timestamps: true });

// Optimize search
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
