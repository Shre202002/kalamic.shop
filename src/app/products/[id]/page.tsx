import { Metadata } from 'next';
import { getProductById } from '@/lib/actions/products';
import ProductDetailClient from './ProductDetailClient';

/**
 * @fileOverview Product Detail Server Wrapper
 * Handles dynamic SEO metadata generation and JSON-LD structured data.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The artisan piece you are looking for does not exist in our archive.',
    };
  }

  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0];
  const canonicalUrl = `https://kalamic.shop/products/${product.slug || id}`;
  const keywords = product.seo?.meta_keywords?.join(', ') || product.name;

  return {
    title: product.seo?.meta_title || `${product.name} | Handcrafted Artistry`,
    description: product.seo?.meta_description || product.short_description,
    keywords: keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.seo?.meta_title || product.name,
      description: product.seo?.meta_description || product.short_description,
      url: canonicalUrl,
      siteName: 'Kalamic',
      type: 'website',
      images: primaryImage ? [
        {
          url: primaryImage.url,
          width: 800,
          height: 800,
          alt: primaryImage.alt || product.name,
        }
      ] : [],
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.seo?.meta_title || product.name,
      description: product.seo?.meta_description || product.short_description,
      images: primaryImage ? [primaryImage.url] : [],
    },
    robots: {
      index: product.is_active && !product.is_deleted,
      follow: true,
      googleBot: {
        index: product.is_active && !product.is_deleted,
        follow: true,
      },
    },
  };
}

function generateJsonLd(product: any) {
  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || product.description,
    image: product.images?.map((img: any) => img.url) || [],
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Kalamic',
    },
    offers: {
      '@type': 'Offer',
      url: `https://kalamic.shop/products/${product.slug || product._id}`,
      priceCurrency: product.currency || 'INR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Kalamic',
      },
    },
    aggregateRating: product.analytics?.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.analytics.average_rating,
      reviewCount: product.analytics.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJsonLd(product)),
          }}
        />
      )}
      <ProductDetailClient />
    </>
  );
}
