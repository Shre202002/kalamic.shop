import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/BlogPost';
import Comment from '@/lib/models/Comment';
import { getSuggestedBlogs } from '@/lib/actions/blog-actions';
import BlogPostClient from './BlogPostClient';

/**
 * @fileOverview Blog Post Detail Server Component (Next.js 15).
 * Fetches blog content and comments on the server for optimal SEO and crawler friendliness.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const post = await BlogPost.findOne({ slug, status: 'published' }).lean();
  if (!post) return { title: 'Story Not Found | Kalamic' };
  
  return {
    title: post.seo?.metaTitle || `${post.title} | Kalamic`,
    description: post.seo?.metaDescription || post.excerpt,
    keywords: post.seo?.metaKeywords?.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage?.url || '' }],
      type: 'article',
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  await dbConnect();

  const post = await BlogPost.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!post) notFound();

  // Fetch comments on the server
  const comments = await Comment.find({ blogId: post._id, status: 'active' })
    .sort({ createdAt: -1 })
    .lean();

  const suggested = await getSuggestedBlogs(post.slug, post.tags || []);

  return (
    <BlogPostClient 
      post={JSON.parse(JSON.stringify(post))} 
      initialComments={JSON.parse(JSON.stringify(comments))}
      suggested={JSON.parse(JSON.stringify(suggested))}
    />
  );
}
