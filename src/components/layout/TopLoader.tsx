
'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

function TopLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress with brand specific settings
    NProgress.configure({ 
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.08,
      easing: 'ease',
      speed: 400
    });
  }, []);

  useEffect(() => {
    // When the route fully changes, finish the progress bar
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    /**
     * Optimistic loading: detect clicks on links to show the bar instantly.
     * This bridges the gap between the click and the Next.js route event.
     */
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (
        anchor && 
        anchor.href && 
        anchor.target !== '_blank' && 
        !event.metaKey && 
        !event.ctrlKey
      ) {
        const url = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);
        
        // Only trigger if it's an internal link and the path is different
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          NProgress.start();
        }
      }
    };

    window.addEventListener('click', handleAnchorClick);
    return () => window.removeEventListener('click', handleAnchorClick);
  }, []);

  return null;
}

/**
 * TopLoader component provides a smooth animated page loader bar at the top
 * of the website during route changes. 
 * 
 * Wrapped in Suspense to prevent de-opting to client-side 
 * rendering for the entire layout when using useSearchParams.
 */
export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderContent />
    </Suspense>
  );
}
