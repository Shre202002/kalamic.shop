
import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  name: string; // e.g., "Size", "Color"
  options: string[]; // e.g., ["S", "M", "L"], ["Red", "Blue"]
}

export interface IProductSku {
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { "Size": "M", "Color": "Red" }
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  subCategory?: string;
  images: string[];
  basePrice: number;
  rating: number;
  numReviews: number;
  variants: IProductVariant[];
  skus: IProductSku[];
  isFeatured: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String },
  images: [{ type: String }],
  basePrice: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  variants: [
    {
      name: { type: String },
      options: [{ type: String }]
    }
  ],
  skus: [
    {
      sku: { type: String, required: true },
      price: { type: Number, required: true },
      stock: { type: Number, required: true },
      attributes: { type: Map, of: String }
    }
  ],
  isFeatured: { type: Boolean, default: false },
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }]
  }
}, { timestamps: true });

// Optimize search
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
