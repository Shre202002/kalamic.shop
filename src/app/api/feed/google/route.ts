// src/app/api/feed/google/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Google Merchant Center Product Feed
// Generates a valid XML feed (RSS 2.0 + Google Shopping namespace)
// URL to paste in Merchant Center: https://www.kalamic.shop/api/feed/google
// Auto-updates every 24 hours when Merchant Center fetches it
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/actions/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const escapeXml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatPrice = (value: unknown, currency: string) =>
  `${Number(value || 0).toFixed(2)} ${currency || 'INR'}`;

export async function GET() {
  try {
    const products = await getProducts({ limit: 10000 });

    const items = products
      .filter((p: any) => p.price > 0)
      .map((p: any) => {
        const primaryImage =
          p.images?.find((img: any) => img.is_primary)?.url ||
          p.images?.[0]?.url ||
          '';

        const allImages = (p.images || [])
          .slice(0, 10)
          .map((img: any) => img.url)
          .filter(Boolean);

        const productUrl = `https://www.kalamic.shop/products/${encodeURIComponent(p.slug || p._id)}`;

        // Clean description — strip HTML tags and limit to 5000 chars
        const description = (p.description || p.short_description || '')
          .replace(/<[^>]*>/g, '')
          .substring(0, 5000);

        // Clean title — limit to 150 chars
        const title = (p.name || '')
          .substring(0, 150);

        // Additional images (index 2–10)
        const additionalImages = allImages
          .slice(1)
          .map(
            (url: string) =>
              `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`
          )
          .join('\n        ');

        return `
    <item>
      <g:id>${escapeXml(p.sku || p._id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(primaryImage)}</g:image_link>
      ${additionalImages}
      <g:price>${formatPrice(p.compare_at_price || p.price, p.currency)}</g:price>
      ${p.compare_at_price ? `<g:sale_price>${formatPrice(p.price, p.currency)}</g:sale_price>` : ''}
      <g:availability>${p.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Kalamic</g:brand>
      <g:mpn>${escapeXml(p.sku || p.slug || p._id)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
      <g:google_product_category>588</g:google_product_category>
      <g:product_type>Home &amp; Garden &gt; Decor &gt; Artwork</g:product_type>
      <g:shipping_weight>${p.shipping?.weight_kg || '1'} kg</g:shipping_weight>
      <g:custom_label_0>${escapeXml(p.category_id || 'home-decor')}</g:custom_label_0>
      <g:custom_label_1>handmade</g:custom_label_1>
      <g:custom_label_2>ceramic</g:custom_label_2>
    </item>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Kalamic — Handcrafted Ceramic Home Decor</title>
    <link>https://www.kalamic.shop</link>
    <description>Handcrafted ceramic wall art, mirrors and home decor made by artisans in Kanpur, India.</description>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Feed generation error:', error);
    return new NextResponse('Feed generation failed', { status: 500 });
  }
}
