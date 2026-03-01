import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to trigger animations when an element scrolls into view.
 * Uses the IntersectionObserver API for high performance.
 * 
 * @param threshold Percentage of the element that must be visible before triggering (0 to 1).
 * @returns An object containing the ref to attach to the element and the visibility status.
 */
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    // Safety check for environment
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, we can stop observing to maintain the state
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};
