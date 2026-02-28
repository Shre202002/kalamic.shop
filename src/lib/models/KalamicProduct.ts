import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Official Schema for the Kalamic_Products collection.
 * Fully managed via Admin Panel with strict validation and nested structures.
 */

export interface IKalamicProduct extends Document {
  name: string;
  slug: string;
  short_description?: string;
  description: string;
  category_id: mongoose.Types.ObjectId;
  tags: string[];
  images: Array<{
    url: string;
    alt: string;
    is_primary: boolean;
  }>;
  price: number;
  compare_at_price?: number;
  currency: string;
  stock: number;
  sku?: string;
  track_inventory: boolean;
  is_active: boolean;
  is_featured: boolean;
  visibility_priority: number;
  is_deleted: boolean;
  specifications: Array<{
    key: string;
    value: string;
  }>;
  shipping: {
    weight_kg: number;
    package_dimensions_cm: {
      length: number;
      width: number;
      height: number;
    };
  };
  analytics: {
    total_views: number;
    total_orders: number;
    wishlist_count: number;
    cart_add_count: number;
    share_count: number;
    average_rating?: number;
    review_count?: number;
  };
  seo: {
    meta_title: string;
    meta_description: string;
    meta_keywords: string[];
  };
  created_by_admin?: string;
  updated_by_admin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KalamicProductSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, lowercase: true },
  short_description: { type: String, default: '' },
  description: { type: String, required: true },
  category_id: { type: Schema.Types.ObjectId, required: true, index: true },
  tags: [{ type: String, trim: true }],
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    is_primary: { type: Boolean, default: false }
  }],
  price: { type: Number, required: true, min: 0 },
  compare_at_price: {
    type: Number,
    validate: {
      validator: function (this: any, v: number) { return !v || v > this.price; },
      message: "compare_at_price must be greater than price"
    }
  },
  currency: { type: String, default: 'INR' },
  stock: { type: Number, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  track_inventory: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  visibility_priority: { type: Number, default: 0 },
  is_deleted: { type: Boolean, default: false },
  specifications: [{
    key: { type: String, required: true },
    value: { type: String, default: '' }
  }],
  shipping: {
    weight_kg: { type: Number, default: 0 },
    package_dimensions_cm: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 }
    }
  },
  analytics: {
    total_views: { type: Number, default: 0 },
    total_orders: { type: Number, default: 0 },
    wishlist_count: { type: Number, default: 0 },
    cart_add_count: { type: Number, default: 0 },
    share_count: { type: Number, default: 0 },
    average_rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 }
  },
  seo: {
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    meta_keywords: [{ type: String }]
  },
  created_by_admin: { type: String },
  updated_by_admin: { type: String }
}, { 
  timestamps: true,
  collection: 'Kalamic_Products'
});

export default mongoose.models.KalamicProduct || mongoose.model<IKalamicProduct>('KalamicProduct', KalamicProductSchema);
