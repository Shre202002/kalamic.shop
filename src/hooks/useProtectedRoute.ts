'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * Custom hook to protect client-side routes.
 * Redirects to home if user is not authenticated after loading.
 */
export function useProtectedRoute() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      // Use replace to prevent back-button loops
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  return { user, loading: isUserLoading };
}
