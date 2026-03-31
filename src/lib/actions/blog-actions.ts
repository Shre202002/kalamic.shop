
'use server';

import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/BlogPost';
import { unstable_cache } from 'next/cache';

export async function getPublishedBlogs(options?: {
  limit?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
  excludeSlug?: string;
}) {
  return unstable_cache(
    async () => {
      await dbConnect();
      const query: any = { status: 'published' };
      
      if (options?.category && options.category !== 'All') {
        query.category = options.category;
      }
      
      if (options?.tag) {
        query.tags = options.tag;
      }
      
      if (options?.featured) {
        query.isFeatured = true;
      }
      
      if (options?.excludeSlug) {
        query.slug = { $ne: options.excludeSlug };
      }

      const blogs = await BlogPost.find(query)
        .sort({ publishedAt: -1 })
        .limit(options?.limit || 100)
        .lean();
        
      return JSON.parse(JSON.stringify(blogs));
    },
    ['published-blogs', JSON.stringify(options)],
    { revalidate: 60, tags: ['blogs'] }
  )();
}

export async function getBlogBySlug(slug: string) {
  await dbConnect();
  try {
    const blog = await BlogPost.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    
    return blog ? JSON.parse(JSON.stringify(blog)) : null;
  } catch (error) {
    return null;
  }
}

export async function getSuggestedBlogs(currentSlug: string, tags: string[], limit = 3) {
  await dbConnect();
  try {
    let suggested = await BlogPost.find({
      status: 'published',
      slug: { $ne: currentSlug },
      tags: { $in: tags }
    })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

    if (suggested.length < limit) {
      const more = await BlogPost.find({
        status: 'published',
        slug: { $ne: currentSlug },
        _id: { $趕ne: suggested.map(s => s._id) }
      })
      .sort({ publishedAt: -1 })
      .limit(limit - suggested.length)
      .lean();
      suggested = [...suggested, ...more];
    }

    return JSON.parse(JSON.stringify(suggested));
  } catch (error) {
    return [];
  }
}

export async function getFeaturedBlogs(limit = 3) {
  return unstable_cache(
    async () => {
      await dbConnect();
      const blogs = await BlogPost.find({
        status: 'published',
        isFeatured: true
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
      return JSON.parse(JSON.stringify(blogs));
    },
    ['featured-blogs', limit],
    { revalidate: 300, tags: ['blogs'] }
  )();
}

export async function getAllBlogSlugs() {
  await dbConnect();
  const blogs = await BlogPost.find({ status: 'published' }).select('slug updatedAt').lean();
  return JSON.parse(JSON.stringify(blogs));
}
