import { Metadata } from 'next';
import { getGalleryItems } from '@/lib/actions/gallery-actions';
import GalleryClient from './GalleryClient';

/**
 * @fileOverview Server component for the Kalamic Visual Archive.
 * Handles SEO metadata generation and JSON-LD structured data.
 */

export async function generateMetadata(): Promise<Metadata> {
  const items = await getGalleryItems({ isActive: true });
  const imageCount = items.filter(i => i.mediaType === 'image').length;
  const videoCount = items.filter(i => i.mediaType === 'video').length;

  return {
    title: 'Gallery | Kalamic — Handcrafted Ceramic Art',
    description: `Browse ${imageCount} handcrafted ceramic art pieces and ${videoCount} studio reels from Kalamic. Traditional Indian ceramic décor — Mor Stambh, photo frames, wall art and more.`,
    keywords: [
      'ceramic art gallery India',
      'handmade ceramic photos',
      'Indian traditional décor gallery',
      'mor stambh ceramic images',
      'handcrafted ceramic wall art pictures',
    ],
    alternates: { canonical: 'https://kalamic.shop/gallery' },
    openGraph: {
      title: 'Kalamic Gallery — Handcrafted Ceramic Art',
      description: 'Visual archive of handcrafted Indian ceramic art.',
      url: 'https://kalamic.shop/gallery',
      siteName: 'Kalamic',
      type: 'website',
      images: items
        .filter(i => i.mediaType === 'image')
        .slice(0, 3)
        .map(i => ({ url: i.url, alt: i.altText })),
      locale: 'en_IN',
    },
  };
}

export default async function GalleryPage() {
  const items = await getGalleryItems({ isActive: true });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Kalamic Ceramic Art Gallery',
    description: 'A visual archive of handcrafted ceramic art from our Lucknow studio.',
    url: 'https://kalamic.shop/gallery',
    image: items
      .filter(i => i.mediaType === 'image')
      .map(i => ({
        '@type': 'ImageObject',
        url: i.url,
        name: i.name,
        description: i.altText,
        width: i.width || 1200,
        height: i.height || 1200,
        encodingFormat: 'image/webp',
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryClient items={items} />
    </>
  );
}
