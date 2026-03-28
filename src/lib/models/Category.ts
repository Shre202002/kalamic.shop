
import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Schema for the categories collection.
 */

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'categories' 
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
