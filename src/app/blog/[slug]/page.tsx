import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogBySlug, getSuggestedBlogs } from '@/lib/actions/blog-actions';
import BlogPostClient from './BlogPostClient';

/**
 * @fileOverview Blog Post Detail Server Component (Next.js 15).
 * Responsible for data fetching, SEO Metadata generation, and rendering the interactive Client UI.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamically generates SEO metadata based on the article content.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return { title: 'Story Not Found | Kalamic' };
  
  const coverUrl = post.coverImage?.url || 'https://kalamic.shop/logo.png';

  return {
    title: post.seo?.metaTitle || `${post.title} | Kalamic Journal`,
    description: post.seo?.metaDescription || post.excerpt,
    keywords: post.seo?.metaKeywords?.join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      images: [{ url: coverUrl }],
      type: 'article',
      publishedTime: post.publishedAt,
      section: post.category,
      tags: post.tags
    },
    alternates: {
      canonical: `https://kalamic.shop/blog/${post.slug}`
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  
  // Data Fetching: High-performance parallel execution
  const [post, allSuggested] = await Promise.all([
    getBlogBySlug(slug),
    getSuggestedBlogs(slug, []) // Fetch base suggested in case tags are empty
  ]);
  
  if (!post) notFound();

  // If the post has tags, fetch contextually relevant suggestions
  const suggested = post.tags?.length > 0 
    ? await getSuggestedBlogs(post.slug, post.tags) 
    : allSuggested;

  // Rich Results for Search Engines (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.coverImage?.url,
    "author": {
      "@type": "Person",
      "name": post.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kalamic Ceramic Studio",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kalamic.shop/logo.png"
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "description": post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kalamic.shop/blog/${post.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} suggested={suggested} />
    </>
  );
}
