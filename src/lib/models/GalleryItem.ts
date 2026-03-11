
import mongoose, { Schema, Document } from 'mongoose';

export type GalleryMediaType = 'image' | 'video';

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
}, {
  timestamps: true,
  collection: 'Gallery_Items'
});

export default mongoose.models.GalleryItem || mongoose.model<IGalleryItem>('GalleryItem', GalleryItemSchema);
