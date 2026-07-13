export const GA_MEASUREMENT_ID = 'G-LB5YT7T165';

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, parameters: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  window.gtag('event', name, parameters);
  return true;
}

export function toAnalyticsItem(product: any, quantity = 1): AnalyticsItem {
  return {
    item_id: String(product._id || product.id || product.productVariantId || ''),
    item_name: product.name || 'Kalamic product',
    item_brand: 'Kalamic',
    item_category: product.category_id?.name || product.category || 'Handcrafted ceramic decor',
    price: Number(product.price ?? product.priceAtAddToCart ?? 0),
    quantity,
  };
}
