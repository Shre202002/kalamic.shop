
'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect when a user has scrolled past a certain percentage of the page.
 * Uses sessionStorage to ensure it only triggers once per session.
 */
export function useScrollTrigger(threshold: number = 40) {
  const [hasTriggered, setHasTriggered] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('survey_dismissed', 'true');
      setHasTriggered(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already dismissed in this session
    if (sessionStorage.getItem('survey_dismissed') === 'true') {
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Prevent division by zero if document is shorter than window
      if (documentHeight <= windowHeight) return;

      const scrollPercent = (scrollY / (documentHeight - windowHeight)) * 100;

      if (scrollPercent >= threshold && !hasTriggered) {
        setHasTriggered(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, hasTriggered]);

  return { hasTriggered, dismiss };
}
