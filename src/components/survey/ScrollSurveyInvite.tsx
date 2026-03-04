
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareHeart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollSurveyInviteProps {
  onOpenSurvey: () => void;
  onDismiss: () => void;
}

export function ScrollSurveyInvite({ onOpenSurvey, onDismiss }: ScrollSurveyInviteProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-[#FAF4EB] border-t-4 border-primary shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <MessageSquareHeart className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-black font-medium text-sm md:text-base leading-tight">
              Share your feedback
            </p>
            <p className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-widest font-normal mt-0.5">
              Takes only 2 minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            onClick={onOpenSurvey}
            className="rounded-full px-6 md:px-8 h-10 md:h-12 bg-primary text-white font-medium text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            Share Now
          </Button>
          <button 
            onClick={onDismiss}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-black/5 flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
