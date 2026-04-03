'use client';

import { useRouter } from 'next/navigation';
import NProgress from 'nprogress';

/**
 * Custom hook that wraps Next.js router to manually trigger the top loader 
 * for programmatic navigation events.
 * Includes resilience wrappers to handle fetch interruptions during transitions.
 */
export function useNavigation() {
  const router = useRouter();

  const push = (href: string, options?: any) => {
    try {
      NProgress.start();
      router.push(href, options);
    } catch (err) {
      // Silence transition-related fetch errors that can occur during rapid redirects
      // or sign-out cycles where prefetches might be aborted.
      if (err instanceof Error && (err.message.includes('fetch') || err.name === 'TypeError')) {
        return;
      }
      throw err;
    }
  };

  const replace = (href: string, options?: any) => {
    try {
      NProgress.start();
      router.replace(href, options);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('fetch') || err.name === 'TypeError')) {
        return;
      }
      throw err;
    }
  };

  const back = () => {
    NProgress.start();
    router.back();
  };

  const forward = () => {
    NProgress.start();
    router.forward();
  };

  const refresh = () => {
    NProgress.start();
    router.refresh();
  };

  return { ...router, push, replace, back, forward, refresh };
}
