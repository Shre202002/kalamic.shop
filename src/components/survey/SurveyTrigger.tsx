
'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollTrigger } from '@/hooks/useScrollTrigger';
import { ScrollSurveyInvite } from './ScrollSurveyInvite';
import SurveyModal from './SurveyModal';
import { useUser } from '@/firebase';
import { AnimatePresence } from 'framer-motion';

/**
 * Global component that handles the scroll-triggered survey invitation.
 * Excludes pages under /survey.
 */
export function SurveyTrigger() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const { hasTriggered, dismiss } = useScrollTrigger(40);

  // Don't show on survey pages or for logged-in users
  if (pathname?.startsWith('/survey') || !!user) {
    return null;
  }

  const handleOpenSurvey = () => {
    setIsSurveyOpen(true);
  };

  const handleCloseSurvey = () => {
    setIsSurveyOpen(false);
    dismiss(); // Ensure it doesn't pop up again after closing
  };

  return (
    <>
      <AnimatePresence>
        {hasTriggered && !isSurveyOpen && (
          <ScrollSurveyInvite 
            onOpenSurvey={handleOpenSurvey} 
            onDismiss={dismiss} 
          />
        )}
      </AnimatePresence>

      <SurveyModal 
        isOpen={isSurveyOpen} 
        onClose={handleCloseSurvey} 
        isSinglePage={false} 
      />
    </>
  );
}
