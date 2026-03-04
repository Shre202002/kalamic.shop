'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare } from 'lucide-react';

export function SurveyPopup() {
  const { user, isUserLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // Check if already triggered in this session to prevent repeat popups
    if (typeof window !== 'undefined' && sessionStorage.getItem('kalamic_survey_triggered')) {
      setHasTriggered(true);
    }
  }, []);

  useEffect(() => {
    // Only monitor scroll if user is NOT logged in and we haven't shown it yet
    if (isUserLoading || user || hasTriggered) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Prevent division by zero if the document is too short
      if (documentHeight <= windowHeight) return;

      const scrollPercent = (scrollY / (documentHeight - windowHeight)) * 100;

      if (scrollPercent >= 40) {
        setIsOpen(true);
        setHasTriggered(true);
        sessionStorage.setItem('kalamic_survey_triggered', 'true');
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, isUserLoading, hasTriggered]);

  const handleRedirect = () => {
    // Redirect to the external survey site
    window.location.href = 'https://survey.kalamic.shop/';
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none bg-[#FAF4EB] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-500">
        <DialogHeader className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Sparkles className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-display font-bold text-primary text-center">
            Your Opinion Matters
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium text-sm leading-relaxed">
            We are constantly refining our artisan collection. Please share your thoughts to help us preserve heritage for modern homes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-6">
          <Button 
            onClick={handleRedirect}
            className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Take the Survey <MessageSquare className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
