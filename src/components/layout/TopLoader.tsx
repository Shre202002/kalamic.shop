'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TopLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When the route fully changes, finish the progress bar
    const timer = setTimeout(() => {
      setProgress(100);
      const finishTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(finishTimer);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Optimistic loading: detect clicks on links to show the bar instantly
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
          setLoading(true);
          setProgress(20);
          
          // Increment progress slowly while waiting
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 80) {
                clearInterval(interval);
                return prev;
              }
              return prev + 5;
            });
          }, 200);
        }
      }
    };

    window.addEventListener('click', handleAnchorClick);
    return () => window.removeEventListener('click', handleAnchorClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 pointer-events-none">
      <div 
        className="h-full bg-accent transition-all duration-500 ease-out shadow-[0_0_15px_rgba(236,196,68,0.8)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * TopLoader component wrapped in Suspense to prevent de-opting to client-side 
 * rendering for the entire layout when using useSearchParams.
 */
export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderContent />
    </Suspense>
  );
}
