
import mongoose, { Schema, Document } from 'mongoose';

export type GalleryMediaType = 'image' | 'video';
export type GallerySource = 'upload' | 'review' | 'instagram';

export interface IGalleryItem extends Document {
  name: string;
  description?: string;
  mediaType: GalleryMediaType;
  url: string;               
  fileId: string;            
  thumbnailUrl?: string;     
  format: string;            
  width?: number;
  height?: number;
  duration?: number;         
  category: 'Pillars & Stambh' | 'Photo Frames' | 'Wall Art' | 'Mandala' | 'Gifting' | 'Other';
  altText: string;           
  caption?: string;          
  isFeatured: boolean;       
  isActive: boolean;
  sortOrder: number;
  uploadedBy: string;        
  source: GallerySource;
  instagramMediaId?: string;
  instagramPermalink?: string;
  instagramUsername?: string;
  instagramCaption?: string;
  instagramTimestamp?: Date;
  productIds?: string[];
  syncStatus?: 'active' | 'unavailable' | 'error';
  sourceReviewId?: string;
  sourceReviewMediaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  mediaType: { 
    type: String, 
    enum: ['image', 'video'], 
    required: true, 
    default: 'image' 
  },
  url: { type: String, required: true },
  fileId: { type: String, required: true },
  thumbnailUrl: { type: String },
  format: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
  duration: { type: Number },
  category: {
    type: String,
    enum: ['Pillars & Stambh', 'Photo Frames', 'Wall Art', 'Mandala', 'Gifting', 'Other'],
    default: 'Other'
  },
  altText: { type: String, required: true },
  caption: { type: String },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  uploadedBy: { type: String, required: true },
  source: { type: String, enum: ['upload', 'review', 'instagram'], default: 'upload', index: true },
  instagramMediaId: { type: String, index: true, sparse: true },
  instagramPermalink: { type: String },
  instagramUsername: { type: String },
  instagramCaption: { type: String, maxlength: 2200 },
  instagramTimestamp: { type: Date },
  productIds: { type: [String], default: [] },
  syncStatus: { type: String, enum: ['active', 'unavailable', 'error'], default: 'active' },
  sourceReviewId: { type: String, index: true },
  sourceReviewMediaId: { type: String, index: true },
}, {
  timestamps: true,
  collection: 'Gallery_Items'
});

export default mongoose.models.GalleryItem || mongoose.model<IGalleryItem>('GalleryItem', GalleryItemSchema);
