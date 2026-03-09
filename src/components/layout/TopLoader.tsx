
'use client';

import { useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
import NProgress from 'nprogress';

/**
 * TopLoader component provides a visual progress bar during route changes.
 * includes a global click listener to catch all internal link navigations.
 */
export function TopLoader() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      
      // Skip if no href, external link, or opening in new tab
      if (!href || targetAttr === '_blank' || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Only trigger for internal links
      const isInternal = (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#');
      
      if (isInternal) {
        // Don't trigger if it's the same page anchor
        if (href.startsWith('#')) return;
        
        NProgress.start();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <NextTopLoader
      color="hsl(28, 89%, 52%)" // Saffron primary color
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px hsl(28, 89%, 52%), 0 0 5px hsl(45, 85%, 55%)"
    />
  );
}
