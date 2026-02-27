
import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Represents a handcrafted ceramic product in the Kalamic catalog.
 * Follows the structured schema for media, inventory, shipping, and engagements.
 */

export interface IProduct extends Document {
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
  currency: "INR";

  stock: number;
  sku: string;
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

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  short_description: { type: String },
  description: { type: String, required: true },

  category_id: { type: Schema.Types.ObjectId, index: true },
  tags: [{ type: String }],

  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    is_primary: { type: Boolean, default: false }
  }],

  price: { type: Number, required: true },
  compare_at_price: { type: Number },
  currency: { type: String, default: 'INR' },

  stock: { type: Number, default: 0 },
  sku: { type: String },
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
    share_count: { type: Number, default: 0 }
  },

  seo: {
    meta_title: { type: String },
    meta_description: { type: String },
    meta_keywords: [{ type: String }]
  },

  created_by_admin: { type: String },
  updated_by_admin: { type: String }
}, { timestamps: true });

// Optimize search for discovery
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
