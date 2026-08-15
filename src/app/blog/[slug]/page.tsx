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
    ? 'What Is Stambh? Meaning in English & Mor Stambh Guide'
    : post.seo?.metaTitle || post.title;
  const description = isMorStambhGuide
    ? 'Learn the meaning of Stambh in English, the history and symbolism of Mor Stambh, and how peacock pillars are used in Indian home and temple decor.'
    : post.seo?.metaDescription || post.excerpt;
  const canonical = post.seo?.canonicalUrl || `https://www.kalamic.shop/blog/${slug}`;
  const socialImage = post.seo?.ogImage || post.coverImage?.url;
  
  return {
    title,
    description,
    keywords: post.seo?.metaKeywords?.join(', '),
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      ...(socialImage ? { images: [{ url: socialImage, alt: post.coverImage?.alt || post.title }] } : {}),
      type: 'article',
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      section: post.category,
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
    alternates: { canonical },
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
  const keywords = post.seo?.metaKeywords?.length ? post.seo.metaKeywords : post.tags || [];
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage?.url ? [post.coverImage.url] : undefined,
    url: postUrl,
    inLanguage: 'en-IN',
    articleSection: post.category,
    keywords: keywords.length ? keywords.join(', ') : undefined,
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
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.kalamic.shop/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.kalamic.shop/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogPostClient
        post={JSON.parse(JSON.stringify(post))}
        initialComments={JSON.parse(JSON.stringify(comments))}
        suggested={JSON.parse(JSON.stringify(suggested))}
      />
    </>
  );
}
