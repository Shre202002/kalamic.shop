"use client"

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RefreshCcw, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ReturnsPage() {
  const steps = [
    {
      title: "Reporting Damage",
      content: "Since ceramics are fragile, please inspect your piece upon delivery. If damaged, send photos of the piece and packaging to contact@kalamic.shop within 24 hours.",
      icon: AlertCircle
    },
    {
      title: "Handcrafted Nature",
      content: "Minor variations in pattern, color, and texture are hallmarks of hand-molded art and are not considered defects. Returns are not accepted for these unique characteristics.",
      icon: RefreshCcw
    },
    {
      title: "The Refund Path",
      content: "Once approved, refunds are processed within 7 business days to your original payment method. Alternatively, we can issue a studio credit for future acquisitions.",
      icon: CheckCircle2
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <RefreshCcw className="h-3 w-3" /> Piece Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Returns & Refunds</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Our policy regarding the safe handling and return of handcrafted ceramic treasures.
            </p>
          </div>

          <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-xl border space-y-12">
            <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 flex gap-6 items-start">
              <Truck className="h-8 w-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-amber-900 mb-2">Fragile Handling Notice</h3>
                <p className="text-amber-800/80 font-medium leading-relaxed">
                  Every Kalamic piece is double-checked for quality before dispatch. Due to the high risk of transit damage during return shipping, we only accept returns for items damaged during their initial delivery to you.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-8 items-start p-8 rounded-[2rem] hover:bg-primary/[0.02] transition-colors border border-transparent hover:border-primary/10">
                  <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <s.icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-primary">{s.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed font-medium italic">"{s.content}"</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t space-y-6">
              <h2 className="text-2xl font-black text-primary">Custom Orders</h2>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                Please note that <span className="text-primary font-bold italic underline decoration-primary/20 underline-offset-4">Customized Mor Stambh pillars and Personalized Mirrors</span> are non-returnable and non-refundable once the production cycle begins, as these are created specifically for your space.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
