import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Schema for blog comments.
 * Supports nested replies and spam protection rules.
 */

export interface IComment extends Document {
  blogId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId: string | null;
  status: 'active' | 'flagged' | 'hidden';
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  blogId: { type: Schema.Types.ObjectId, ref: 'BlogPost', required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  content: { type: String, required: true, maxlength: 1000 },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
  status: { type: String, enum: ['active', 'flagged', 'hidden'], default: 'active' }
}, { 
  timestamps: true,
  collection: 'Blog_Comments'
});

// Prevent duplicate content from same user within a short window
CommentSchema.index({ blogId: 1, userId: 1, content: 1 }, { unique: true });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
