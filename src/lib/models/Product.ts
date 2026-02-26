
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
  technical_details: {
    material: string;
    firing_method: string;
    weight: string;
    origin: string;
    dimensions: string;
    [key: string]: string;
  };
  averageRating: number;
  reviewCount: number;
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
  short_description: { type: String },
  technical_details: {
    material: { type: String, default: 'N/A' },
    firing_method: { type: String, default: 'N/A' },
    weight: { type: String, default: 'N/A' },
    origin: { type: String, default: 'N/A' },
    dimensions: { type: String, default: 'N/A' },
  },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

// Optimize search
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
