import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { getProductById, getProducts } from '@/lib/actions/products';
import { getProductReviews, checkUserReviewEligibility } from '@/lib/actions/reviews';
import ProductDetailClient from './ProductDetailClient';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/firebase-admin';
import { getProductSeoFaqs } from '@/components/product/ProductSeoContent';

/**
 * @fileOverview Product Detail Server Component (Next.js 15).
 * Orchestrates data fetching for the sticky-gallery detail page.
 */

interface Props {
  params: Promise<{ id: string }>;
}

const productSeoOverrides: Record<string, { title: string; description: string }> = {
  'customized-ceramic-photo-frame': {
    title: 'Customized Ceramic Photo Frame Online',
    description:
      'Order a handcrafted customized ceramic photo frame for 4x6 photos. Floral and owl detailing, secure delivery and a thoughtful personalized gift.',
  },
  'handmade-ceramic-peacock-floral-wall-mirror': {
    title: 'Handmade Peacock Ceramic Wall Mirror',
    description:
      'Shop a handmade ceramic wall mirror with peacock and floral motifs in an antique gold finish. Statement decor for living rooms, bedrooms and gifting.',
  },
  'handcrafted-antique-gold-floral-wall-mirror-23x18': {
    title: 'Antique Gold Oval Wall Mirror 23 x 18 Inches',
    description:
      'Buy a 23 x 18 inch handcrafted antique gold floral wall mirror. A decorative oval ceramic frame for entryways, bedrooms and elegant Indian interiors.',
  },
  'handcrafted-peacock-mor-stambh-decorative-pillar-set': {
    title: 'Peacock Mor Stambh Set of 2 for Home Decor',
    description:
      'Shop a handcrafted pair of ceramic Peacock Mor Stambh pillars for home temples, entryways and festive decor, securely packed by Kalamic in Kanpur.',
  },
};

function withoutDuplicateBrand(title: string) {
  return title.replace(/\s*[|–—-]\s*Kalamic(?:\s+Shop)?\s*$/i, '').trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Product Not Found | Kalamic' };

  const productPath = `/products/${product.slug || product._id}`;
  const seoOverride = productSeoOverrides[product.slug];
  const title = withoutDuplicateBrand(seoOverride?.title || product.seo?.meta_title || product.name);
  const description = seoOverride?.description || product.seo?.meta_description || product.short_description;
  const socialImage = product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: socialImage ? [{ url: socialImage, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: socialImage ? [socialImage] : [],
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
  const [reviews, relatedProducts] = await Promise.all([
    getProductReviews(product._id.toString()),
    getProducts({ limit: 4 }) 
  ]);

  // Filter out the current product from related items
  const filteredRelated = relatedProducts.filter(
    (p: any) => p._id.toString() !== product._id.toString()
  );

  const productUrl = `https://www.kalamic.shop/products/${product.slug || product._id}`;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: product.short_description || product.description,
    image: product.images?.map((image: any) => image.url).filter(Boolean),
    sku: product.sku || String(product._id),
    ...(product.sku ? { mpn: product.sku } : {}),
    brand: {
      '@type': 'Brand',
      name: 'Kalamic',
    },
    material: 'Handcrafted ceramic',
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
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        merchantReturnLink: 'https://www.kalamic.shop/returns',
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.kalamic.shop/' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://www.kalamic.shop/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };
  const productFaqs = getProductSeoFaqs(product.slug);
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
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (sessionCookie) {
      const decodedToken = await verifySession(sessionCookie);
      if (decodedToken) {
        isEligible = await checkUserReviewEligibility(decodedToken.uid, product._id.toString());
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
        isEligible={isEligible}
      />
    </>
  );
}
