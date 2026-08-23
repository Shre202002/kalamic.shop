import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { getProductById, getProducts } from '@/lib/actions/products';
import { getProductReviews, getReviewEligibility } from '@/lib/actions/reviews';
import ProductDetailClient from './ProductDetailClient';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/firebase-admin';
import { getProductSeoFaqs } from '@/components/product/ProductSeoContent';
import { getProductInstagramMedia } from '@/lib/actions/gallery-actions';
import { getProductSeo } from '@/lib/product-seo';

/**
 * @fileOverview Product Detail Server Component (Next.js 15).
 * Orchestrates data fetching for the sticky-gallery detail page.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Product Not Found | Kalamic' };

  const productPath = `/products/${product.slug || product._id}`;
  const { title: seoTitle, description: seoDescription, keywords } = getProductSeo(product);
  const productImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    robots: { index: true, follow: true },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      ...(productImage ? { images: [{ url: productImage, alt: product.name }] } : {}),
      url: `https://www.kalamic.shop${productPath}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      ...(productImage ? { images: [productImage] } : {}),
    },
    alternates: {
      canonical: productPath,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  await dbConnect();

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // Fetch reviews and related products in parallel
  const [reviews, relatedProducts, instagramMedia] = await Promise.all([
    getProductReviews(product._id.toString()),
    getProducts({ limit: 4 }),
    getProductInstagramMedia(product._id.toString()),
  ]);

  // Filter out the current product from related items
  const filteredRelated = relatedProducts.filter(
    (p: any) => p._id.toString() !== product._id.toString()
  );

  const productUrl = `https://www.kalamic.shop/products/${product.slug || product._id}`;
  const { description: seoDescription } = getProductSeo(product);
  const productJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: seoDescription,
    image: product.images?.map((image: any) => image.url).filter(Boolean),
    sku: product.sku || String(product._id),
    mpn: product.sku || product.slug || String(product._id),
    brand: {
      '@type': 'Brand',
      name: 'Kalamic',
    },
    material: 'Handcrafted ceramic',
    category: product.category_id?.name || product.tags?.[0] || 'Indian home decor',
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: Number(product.price).toFixed(2),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Kalamic',
      },
    },
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (
              reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) /
              reviews.length
            ).toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  if (reviews.length > 0) {
    productJsonLd.review = reviews.slice(0, 5).map((review: any) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.user_name || 'Kalamic customer' },
      datePublished: review.createdAt,
      reviewBody: review.comment || review.review_text,
      reviewRating: { '@type': 'Rating', ratingValue: Number(review.rating), bestRating: 5, worstRating: 1 },
    }));
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.kalamic.shop/' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://www.kalamic.shop/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };
  const productFaqs = getProductSeoFaqs(product.slug, product.faqs);
  const faqJsonLd = productFaqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: productFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  // Check review eligibility if user is logged in
  let isEligible = false;
  let reviewEligibilityReason = 'Verify your email and add a phone number to your profile before writing a review.';
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (sessionCookie) {
      const decodedToken = await verifySession(sessionCookie);
      if (decodedToken) {
        const eligibility = await getReviewEligibility(decodedToken.uid);
        isEligible = eligibility.eligible;
        reviewEligibilityReason = eligibility.reason;
      }
    }
  } catch (error) {
    console.error("[PRODUCT_PAGE] Eligibility check failed:", error);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ProductDetailClient
        initialProduct={JSON.parse(JSON.stringify(product))}
        initialReviews={JSON.parse(JSON.stringify(reviews))}
        relatedProducts={JSON.parse(JSON.stringify(filteredRelated))}
        instagramMedia={JSON.parse(JSON.stringify(instagramMedia))}
        isEligible={isEligible}
        reviewEligibilityReason={reviewEligibilityReason}
      />
    </>
  );
}
