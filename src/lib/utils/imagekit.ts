/**
 * Generates ImageKit transformation URLs on the fly.
 * Small/compressed for fast display, large/high-quality for zoom.
 */

export function getDisplayUrl(url: string): string {
  return transformUrl(url, 'w-800,q-75,f-webp');
}

export function getZoomUrl(url: string): string {
  return transformUrl(url, 'w-2000,q-90,f-webp');
}

export function getThumbnailUrl(url: string): string {
  return transformUrl(url, 'w-160,q-70,f-webp');
}

/**
 * Internal helper to strip existing transformations and apply new ones.
 * Supports both path-based (tr:...) and query-param (?tr=...) syntax.
 */
function transformUrl(url: string, transformation: string): string {
  if (!url || (!url.includes('ik.imagekit.io') && !url.includes('imagekit.io'))) {
    return url;
  }

  // 1. Remove existing path-based transformations (e.g., /tr:w-800,q-80/)
  let cleanUrl = url.replace(/\/tr:[^/]+\//, '/');

  // 2. Remove existing query-param transformations if any
  const urlObj = new URL(cleanUrl);
  urlObj.searchParams.delete('tr');
  
  // 3. Re-apply transformation via query parameter for reliability
  urlObj.searchParams.set('tr', transformation);

  return urlObj.toString();
}
