
'use client';

import { useRouter } from 'next/navigation';
import NProgress from 'nprogress';

/**
 * Custom hook that wraps Next.js router to manually trigger the top loader 
 * for programmatic navigation events.
 */
export function useNavigation() {
  const router = useRouter();

  const push = (href: string, options?: any) => {
    NProgress.start();
    router.push(href, options);
  };

  const replace = (href: string, options?: any) => {
    NProgress.start();
    router.replace(href, options);
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
