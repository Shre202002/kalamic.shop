
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroBannerProps {
  onFeedbackClick?: () => void;
}

export function HeroBanner({ onFeedbackClick }: HeroBannerProps) {
  const router = useRouter();

  const benefits = [
    { 
      icon: MessageSquare, 
      title: "Voice Your Opinion", 
      desc: "Your insights directly guide our kiln firings.",
      color: "bg-blue-500/10 text-blue-600"
    },
    { 
      icon: Zap, 
      title: "Shape Products", 
      desc: "Help us decide which motifs to paint next.",
      color: "bg-amber-500/10 text-amber-600"
    },
    { 
      icon: Heart, 
      title: "Support Artisans", 
      desc: "Direct feedback empowers Kanpur's local talent.",
      color: "bg-rose-500/10 text-rose-600"
    },
    { 
      icon: Sparkles, 
      title: "Early Access", 
      desc: "Participants get priority on custom Mor Stambhs.",
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container mx-auto px-4 max-w-[1200px] text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-[0.3em]">
            <ShieldCheck className="h-3 w-3" /> Artisan Insights Hub
          </div>
          <h1 className="text-4xl md:text-7xl font-display font-semibold text-black tracking-tight leading-[1.1]">
            Your opinion, <br />
            <span className="italic text-primary">our strength.</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Help us shape the future of handcrafted Indian heritage. Every insight you share 
            strengthens the bond between master artisans and your modern home.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button 
              onClick={onFeedbackClick}
              className="h-14 px-10 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Start General Survey
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/products')}
              className="h-14 px-10 rounded-full border-primary/20 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/5"
            >
              Review a Specific Piece <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="bg-white/60 backdrop-blur-sm border border-white p-8 rounded-[2.5rem] text-left hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group"
            >
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500", benefit.color)}>
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-black text-black uppercase tracking-widest mb-2">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full pattern-paisley opacity-[0.03] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full pattern-paisley opacity-[0.03] pointer-events-none rotate-180" />
    </section>
  );
}
