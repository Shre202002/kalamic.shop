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
  const post: any = await BlogPost.findOne({ slug, status: 'published' }).lean();
  if (!post) return { title: 'Story Not Found | Kalamic' };

  const isMorStambhGuide = slug === 'what-is-mor-stambh-history-meaning-why-it-belongs-in-your-home';
  const title = isMorStambhGuide
    ? 'Stambh Meaning in English: What Is a Mor Stambh?'
    : post.seo?.metaTitle || post.title;
  const description = isMorStambhGuide
    ? 'Learn the meaning of Stambh in English, the history and symbolism of Mor Stambh, and how peacock pillars are used in Indian home and temple decor.'
    : post.seo?.metaDescription || post.excerpt;
  
  return {
    title,
    description,
    keywords: post.seo?.metaKeywords?.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage?.url || '' }],
      type: 'article',
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  await dbConnect();

  const post: any = await BlogPost.findOneAndUpdate(
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
  const postUrl = `https://www.kalamic.shop/blog/${post.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage?.url ? [post.coverImage.url] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author?.name || 'Kalamic Artisan Studio',
      url: 'https://www.kalamic.shop/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kalamic',
      url: 'https://www.kalamic.shop',
    },
    mainEntityOfPage: postUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogPostClient
        post={JSON.parse(JSON.stringify(post))}
        initialComments={JSON.parse(JSON.stringify(comments))}
        suggested={JSON.parse(JSON.stringify(suggested))}
      />
    </>
  );
}
