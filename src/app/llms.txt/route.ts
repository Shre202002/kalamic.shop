import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/actions/products';

export const revalidate = 3600;

function cleanText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  const products = await getProducts({ limit: 100 });
  const catalog = products
    .filter((product: any) => product.slug && product.is_active && !product.is_deleted)
    .map((product: any) => {
      const summary = cleanText(product.short_description || product.description).slice(0, 240);
      return `- [${cleanText(product.name)}](https://www.kalamic.shop/products/${product.slug}): ₹${Number(product.price).toLocaleString('en-IN')} INR. ${summary}`;
    })
    .join('\n');

  const content = `# Kalamic

> Kalamic is an online handcrafted ceramic home-decor and gifting shop based in Kidwai Nagar, Kanpur, Uttar Pradesh, India.

## Official information

- Website: https://www.kalamic.shop/
- Product catalog: https://www.kalamic.shop/products
- Google-compatible product feed: https://www.kalamic.shop/api/feed/google
- Business phone and WhatsApp: +91 73767 61679
- Delivery coverage: India and supported international destinations; charges and timing depend on destination.
- Returns: Kalamic does not offer general change-of-mind cash refunds. Eligible damaged, defective, incorrect or materially different deliveries are reviewed for replacement under the published policy.

## Current products

${catalog || '- View the live catalog: https://www.kalamic.shop/products'}

## Guides and policies

- [Mor Stambh meaning, history and placement](https://www.kalamic.shop/blog/what-is-mor-stambh-history-meaning-why-it-belongs-in-your-home)
- [Ceramic gifts in Kidwai Nagar, Kanpur](https://www.kalamic.shop/ceramic-gift-shop-kanpur)
- [Return and replacement policy](https://www.kalamic.shop/returns)
- [Privacy policy](https://www.kalamic.shop/privacy)
- [Terms of service](https://www.kalamic.shop/terms)
- [Contact Kalamic](https://www.kalamic.shop/contact)

Product availability, prices and descriptions should always be verified on the linked live product page before making a recommendation.
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
