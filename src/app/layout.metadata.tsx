import React from 'react';
import { Metadata } from 'next';

/**
 * @fileOverview Global SEO Metadata for Kalamic.
 * Prioritizes keywords "Handcrafted Ceramic Artistry" for better search rankings.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://www.kalamic.shop'),
  title: {
    default: "Handcrafted Ceramic Home Decor | Kalamic — Made in Kanpur, India",
    template: '%s | Kalamic',
  },
  description: 'Shop premium handcrafted ceramics including traditional Mor Stambh pillars, mandala wall art, and custom home decor. Made by master artisans in Kanpur, India.',
  keywords: [
    'handcrafted ceramics India',
    'ceramic home decor',
    'traditional Indian pottery',
    'Mor Stambh',
    'ceramic wall art',
    'handpainted ceramics',
    'Kanpur artisans',
    'Kalamic shop'
  ],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Handcrafted Ceramic Home Decor | Kalamic — Made in Kanpur, India",
    description: 'Bespoke ceramic treasures for modern homes, rooted in Indian heritage.',
    url: 'https://www.kalamic.shop',
    siteName: 'Kalamic',
    images: [
      {
        url: 'https://ik.imagekit.io/ari07rsa2/kalamic/products/22_IvfYSYJoa.png?updatedAt=1772308420053',
        width: 1200,
        height: 630,
        alt: 'Kalamic Handcrafted Ceramics',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Handcrafted Ceramic Home Decor | Kalamic — Made in Kanpur, India",
    description: 'Earthy, intentional, and unique ceramic pieces for your space.',
  },
  alternates: {
    canonical: 'https://www.kalamic.shop',
  },
  verification: {
    google: "QigR6xvzIwr05ex0jqejL0EbHZsR3l7LophSQkCHbvQ",
  }
};

/**
 * Structured Data for Local Business.
 * Helps Google display business information, address, and ratings in search results.
 */
export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Kalamic",
    "image": "https://www.kalamic.shop/logo.png",
    "@id": "https://www.kalamic.shop/#business",
    "url": "https://www.kalamic.shop",
    "telephone": "+917376761679",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kidwai Nagar",
      "addressLocality": "Kanpur",
      "addressRegion": "Uttar Pradesh",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 26.4499,
      "longitude": 80.3319
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "10:00",
      "closes": "19:00"
    },
    "sameAs": [
      "https://www.instagram.com/kala_mic_04/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+917376761679",
      "contactType": "customer service",
      "areaServed": ["IN"],
      "availableLanguage": ["English", "Hindi"]
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "merchantReturnLink": "https://www.kalamic.shop/returns"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
