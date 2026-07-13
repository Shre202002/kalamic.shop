
import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: {
    url: string;
    alt: string;
  };
  images: Array<{
    url: string;
    alt: string;
    caption?: string;
  }>;
  author: {
    name: string;
    avatar?: string;
  };
  category: 'Tips' | 'Heritage' | 'Product Spotlight' | 'How-to' | 'News' | 'Care Guide';
  tags: string[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
  };
  linkedProducts: Array<{
    productId: string;
    productName: string;
    productImage: string;
    productPrice: number;
    productSlug: string;
  }>;
  status: 'draft' | 'published';
  isFeatured: boolean;
  readTime: number;
  views: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  excerpt: { type: String, maxlength: 300 },
  content: { type: String, required: true },
  coverImage: {
    url: { type: String, required: true },
    alt: { type: String, required: true }
  },
  images: [{
    url: String,
    alt: String,
    caption: String
  }],
  author: {
    name: { type: String, default: 'Kalamic Artisan' },
    avatar: String
  },
  category: { 
    type: String, 
    enum: ['Tips', 'Heritage', 'Product Spotlight', 'How-to', 'News', 'Care Guide'],
    default: 'Heritage',
    index: true
  },
  tags: [String],
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    canonicalUrl: String,
    ogImage: String
  },
  linkedProducts: [{
    productId: String,
    productName: String,
    productImage: String,
    productPrice: Number,
    productSlug: String
  }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  readTime: { type: Number, default: 1 },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date, index: true }
}, { 
  timestamps: true,
  collection: 'Blog_Posts'
});

// Middleware to generate slug and readTime
BlogPostSchema.pre('save', function(this: IBlogPost, next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  if (this.isModified('content')) {
    const wordCount = this.content.trim().split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }

  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
