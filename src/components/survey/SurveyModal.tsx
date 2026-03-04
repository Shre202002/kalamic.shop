
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// --- Survey Configuration ---

export type QuestionType = 'single' | 'multiple' | 'text';

export interface SurveyOption {
  id: string;
  label: string;
}

export type AnswerValue = string | string[] | Record<string, string>;

export interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: SurveyOption[];
  showIf?: (answers: Record<string, AnswerValue>) => boolean;
  optional?: boolean;
  isDynamic?: boolean;
}

const productOptions: SurveyOption[] = [
  { id: 'mor_stambh', label: 'Mor Stambh / Ceramic Pillars' },
  { id: 'mirror', label: 'Handmade Ceramic Mirrors' },
  { id: 'photo_frame', label: 'Customized Ceramic Photo Frames' },
  { id: 'fridge_magnet', label: 'Handmade Ceramic Fridge Magnets' },
  { id: 'mandala', label: 'Handmade Ceramic Mandala Wheel' },
];

const priceRanges: Record<string, SurveyOption[]> = {
  mor_stambh: [
    { id: '1000_1500', label: '₹1,000 – ₹1,500' },
    { id: '1500_2000', label: '₹1,500 – ₹2,000' },
    { id: 'above_2000', label: 'Above ₹2,000' },
  ],
  mirror: [
    { id: '1500_2000', label: '₹1,500 – ₹2,000' },
    { id: '2000_3000', label: '₹2,000 – ₹3,000' },
    { id: 'above_3000', label: 'Above ₹3,000' },
  ],
  photo_frame: [
    { id: '500_1000', label: '₹500 – ₹1,000' },
    { id: '1000_2000', label: '₹1,000 – ₹2,000' },
    { id: 'above_2000', label: 'Above ₹2,000' },
  ],
  fridge_magnet: [
    { id: '150_250', label: '₹150 – ₹250' },
    { id: '250_350', label: '₹250 – ₹350' },
    { id: 'above_350', label: 'Above ₹350' },
  ],
  mandala: [
    { id: '1500_2000', label: '₹1,500 – ₹2,000' },
    { id: '2000_3000', label: '₹2,000 – ₹3,000' },
    { id: 'above_3000', label: 'Above ₹3,000' },
  ],
};

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'age_group',
    question: 'What is your age group?',
    type: 'single',
    options: [
      { id: 'below_18', label: 'Below 18' },
      { id: '18_24', label: '18–24' },
      { id: '25_34', label: '25–34' },
      { id: '35_44', label: '35–44' },
      { id: '45_54', label: '45–54' },
      { id: '55_plus', label: '55+' },
    ],
  },
  {
    id: 'location',
    question: 'Where do you live?',
    type: 'single',
    options: [
      { id: 'metro', label: 'Metro city' },
      { id: 'tier2', label: 'Tier-2 city' },
      { id: 'small_town', label: 'Small town' },
      { id: 'village', label: 'Village' },
    ],
  },
  {
    id: 'handmade_experience',
    question: 'Have you ever purchased handmade products?',
    type: 'single',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
  },
  {
    id: 'recent_purchase',
    question: 'Have you bought any home decor in the last 6 months?',
    type: 'single',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    showIf: (answers) => answers.handmade_experience === 'yes',
  },
  {
    id: 'recent_purchase_what',
    question: 'What did you buy?',
    type: 'text',
    optional: true,
    showIf: (answers) => answers.handmade_experience === 'yes' && answers.recent_purchase === 'yes',
  },
  {
    id: 'purchase_barriers',
    question: 'What stops you from buying handcrafted decor online?',
    type: 'multiple',
    options: [
      { id: 'quality_unsure', label: 'Not sure about quality' },
      { id: 'damage_fear', label: 'Fear of damage during delivery' },
      { id: 'expensive', label: 'Feels too expensive' },
      { id: 'trust_issue', label: "Don't trust new brands" },
    ],
    showIf: (answers) => answers.handmade_experience === 'no' || answers.recent_purchase === 'no',
  },
  {
    id: 'purchase_purpose',
    question: 'What was the purpose of your last decor purchase?',
    type: 'multiple',
    options: [
      { id: 'own_home', label: 'For my own home' },
      { id: 'gift', label: 'Gift for someone' },
      { id: 'festival', label: 'Festival decoration' },
      { id: 'office_cafe', label: 'Office/café/shop' },
      { id: 'dont_remember', label: "I don't remember" },
    ],
  },
  {
    id: 'products_interest',
    question: 'Which ceramic products would you consider buying?',
    type: 'multiple',
    options: productOptions,
  },
  {
    id: 'price_range',
    question: 'Which price range feels reasonable for these products?',
    type: 'single',
    isDynamic: true,
    showIf: (answers) => (answers.products_interest as string[])?.length > 0,
  },
  {
    id: 'purchase_channel',
    question: 'Where would you prefer to purchase from?',
    type: 'multiple',
    options: [
      { id: 'offline', label: 'Offline local stores' },
      { id: 'exhibitions', label: 'Exhibitions/craft fairs' },
      { id: 'brand_website', label: "Brand's own website" },
      { id: 'marketplaces', label: 'Online marketplaces' },
      { id: 'social', label: 'Instagram / WhatsApp' },
    ],
  },
  {
    id: 'product_feedback',
    question: 'What did you like about our collection? (Design, Price, etc.)',
    type: 'text',
    optional: true,
  },
  {
    id: 'user_name',
    question: 'Name',
    type: 'text',
  },
  {
    id: 'user_email',
    question: 'Email',
    type: 'text',
  },
  {
    id: 'user_phone',
    question: 'Phone Number',
    type: 'text',
  },
];

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null;
  isSinglePage?: boolean;
}

export default function SurveyModal({ isOpen, onClose, product, isSinglePage }: SurveyModalProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({
    source_page: product ? product.name : 'General Discovery'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter questions based on conditional logic
  const visibleQuestions = surveyQuestions.filter(q => !q.showIf || q.showIf(answers));

  const handleAnswer = (id: string, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    if (errors.has(id)) {
      const next = new Set(errors);
      next.delete(id);
      setErrors(next);
    }
  };

  const handleToggleMultiple = (id: string, optionId: string) => {
    const current = (answers[id] as string[]) || [];
    const next = current.includes(optionId)
      ? current.filter(i => i !== optionId)
      : [...current, optionId];
    handleAnswer(id, next);
  };

  const handleSubmit = async () => {
    // Validation
    const nextErrors = new Set<string>();
    visibleQuestions.forEach(q => {
      if (q.optional) return;
      const ans = answers[q.id];
      if (!ans || (Array.isArray(ans) && ans.length === 0)) {
        nextErrors.add(q.id);
      }
    });

    if (nextErrors.size > 0) {
      setErrors(nextErrors);
      // Scroll to first error
      const firstErrorId = Array.from(nextErrors)[0];
      const element = document.getElementById(`q-container-${firstErrorId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast({ variant: "destructive", title: "Insights Missing", description: "Please complete all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      // NOTE: Replace with your actual deployed Web App URL
      const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzp_REPLACE_WITH_YOUR_ID/exec';
      
      // Formatting dynamic price range for sheet
      const formattedAnswers = { ...answers };
      if (typeof formattedAnswers.price_range === 'object') {
        formattedAnswers.price_range = JSON.stringify(formattedAnswers.price_range);
      }
      if (Array.isArray(formattedAnswers.products_interest)) {
        formattedAnswers.products_interest = formattedAnswers.products_interest.join(', ');
      }
      if (Array.isArray(formattedAnswers.purchase_barriers)) {
        formattedAnswers.purchase_barriers = formattedAnswers.purchase_barriers.join(', ');
      }
      if (Array.isArray(formattedAnswers.purchase_purpose)) {
        formattedAnswers.purchase_purpose = formattedAnswers.purchase_purpose.join(', ');
      }
      if (Array.isArray(formattedAnswers.purchase_channel)) {
        formattedAnswers.purchase_channel = formattedAnswers.purchase_channel.join(', ');
      }

      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors for simple POSTs
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedAnswers)
      });

      setIsSuccess(true);
      toast({ title: "Dhanyavad!", description: "Your feedback is recorded in our artisan archive." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Archive Error", description: "Could not send data. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (q: SurveyQuestion) => {
    const hasError = errors.has(q.id);

    // Special Case: Dynamic Price Range
    if (q.isDynamic && q.id === 'price_range') {
      const selectedProducts = (answers.products_interest as string[]) || [];
      return (
        <div className="space-y-6 mt-4">
          {selectedProducts.map((pId) => (
            <div key={pId} className="space-y-3 p-6 rounded-2xl bg-white border border-primary/5 shadow-sm">
              <Label className="text-black font-normal text-sm leading-tight flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Valuation for: <span className="font-medium">{productOptions.find(o => o.id === pId)?.label}</span>
              </Label>
              <RadioGroup 
                onValueChange={(val) => {
                  const currentRanges = (answers.price_range as Record<string, string>) || {};
                  handleAnswer('price_range', { ...currentRanges, [pId]: val });
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                {priceRanges[pId]?.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2 p-3 rounded-xl border border-primary/5 hover:bg-primary/5 transition-all cursor-pointer">
                    <RadioGroupItem value={opt.id} id={`${pId}-${opt.id}`} />
                    <Label htmlFor={`${pId}-${opt.id}`} className="text-xs font-normal text-black cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      );
    }

    switch (q.type) {
      case 'single':
        return (
          <RadioGroup 
            value={answers[q.id] as string || ''} 
            onValueChange={(val) => handleAnswer(q.id, val)}
            className="grid grid-cols-1 gap-2 mt-4"
          >
            {q.options?.map((opt) => (
              <div 
                key={opt.id} 
                className={cn(
                  "flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                  answers[q.id] === opt.id ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-primary/5 hover:border-primary/10",
                  hasError && !answers[q.id] && "border-destructive/30"
                )}
                onClick={() => handleAnswer(q.id, opt.id)}
              >
                <RadioGroupItem value={opt.id} id={opt.id} className="border-primary" />
                <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal text-black text-sm leading-tight">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'multiple':
        return (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {q.options?.map((opt) => {
              const isChecked = (answers[q.id] as string[])?.includes(opt.id);
              return (
                <div 
                  key={opt.id} 
                  className={cn(
                    "flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    isChecked ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-primary/5 hover:border-primary/10",
                    hasError && (!answers[q.id] || (answers[q.id] as string[]).length === 0) && "border-destructive/30"
                  )}
                  onClick={() => handleToggleMultiple(q.id, opt.id)}
                >
                  <Checkbox 
                    id={opt.id} 
                    checked={isChecked} 
                    onCheckedChange={() => handleToggleMultiple(q.id, opt.id)}
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal text-black text-sm leading-tight">{opt.label}</Label>
                </div>
              );
            })}
          </div>
        );
      case 'text':
        return (
          <div className="mt-4">
            {q.id.includes('feedback') ? (
              <Textarea
                placeholder="Share your artisan experience..."
                className={cn(
                  "min-h-[120px] rounded-2xl bg-white border-2 border-primary/10 focus-visible:ring-primary p-4 text-base font-normal text-black",
                  hasError && "border-destructive/30"
                )}
                value={answers[q.id] as string || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              />
            ) : (
              <Input
                placeholder={q.question}
                className={cn(
                  "h-14 rounded-2xl bg-white border-2 border-primary/10 focus-visible:ring-primary px-4 text-base font-normal text-black",
                  hasError && "border-destructive/30"
                )}
                value={answers[q.id] as string || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        );
    }
  };

  const formBody = (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" ref={scrollRef}>
        <div className="space-y-12 py-6">
          <AnimatePresence>
            {visibleQuestions.map((q, idx) => (
              <motion.div 
                key={q.id}
                id={`q-container-${q.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-serif font-medium text-black leading-tight">
                      {q.question} {!q.optional && <span className="text-accent">*</span>}
                    </h3>
                    {errors.has(q.id) && (
                      <p className="text-[10px] font-normal uppercase text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                        <AlertCircle className="h-3 w-3" /> This insight is required
                      </p>
                    )}
                  </div>
                </div>

                <div className="pl-12">
                  {renderQuestionInput(q)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-8 border-t border-primary/5 bg-background mt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full h-16 rounded-2xl bg-primary text-white font-medium uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 active:scale-95 transition-all"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Recording Verdict...</>
          ) : (
            <>Submit Feedback</>
          )}
        </Button>
        <p className="text-[9px] text-center text-muted-foreground mt-4 uppercase tracking-[0.2em] font-normal opacity-60">
          Kalamic Ceramic Studio — Handcrafted Heritage
        </p>
      </div>
    </div>
  );

  const successView = (
    <div className="text-center py-16 space-y-8 animate-in zoom-in-95 duration-700">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150" />
        <div className="relative h-24 w-24 rounded-full bg-green-50 flex items-center justify-center mx-auto border-4 border-white shadow-2xl">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-normal text-black tracking-tight leading-none">Dhanyavad!</h3>
        <p className="text-muted-foreground font-medium text-lg">Your verdict has been immortalized in our artisan archive.</p>
      </div>
      {isSinglePage && (
        <Button asChild className="rounded-2xl px-12 h-14 font-medium text-xs uppercase tracking-widest shadow-xl">
          <a href="/products">Return to Collection</a>
        </Button>
      )}
    </div>
  );

  if (isSinglePage) {
    if (!isOpen) return null;
    return (
      <div className="bg-[#FAF4EB] rounded-[3rem] shadow-2xl border border-primary/5 p-8 md:p-12 overflow-hidden relative max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="relative z-10">
          <div className="mb-10 space-y-2">
            <h2 className="text-3xl font-serif font-medium text-black tracking-tight">Share Your Feedback</h2>
            <p className="text-muted-foreground font-medium text-sm">Help us shape the future of Kanpur's handmade ceramic heritage.</p>
          </div>
          {isSuccess ? successView : formBody}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] border-none p-0 overflow-hidden bg-[#FAF4EB] shadow-2xl">
        <div className="p-8 sm:p-10">
          <DialogHeader className="mb-8 flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-2xl font-serif font-medium text-black">Share Your Feedback</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-1">Takes about 2 minutes to complete.</DialogDescription>
            </div>
            <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-primary/5 flex items-center justify-center transition-colors">
              <X className="h-5 w-5 text-primary/40" />
            </button>
          </DialogHeader>
          {isSuccess ? successView : formBody}
        </div>
      </DialogContent>
    </Dialog>
  );
}
