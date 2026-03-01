"use client"

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Sparkles, Truck, Heart, PenTool } from 'lucide-react';

const FAQS = [
  {
    category: "The Craft",
    icon: PenTool,
    questions: [
      {
        q: "What materials do you use for your ceramics?",
        a: "We use high-grade terracotta and stoneware clay sourced locally from the fertile plains of Uttar Pradesh. Every piece is hand-molded and kiln-fired at temperatures exceeding 1200°C to ensure durability."
      },
      {
        q: "Are the designs printed or hand-painted?",
        a: "Every pattern you see at Kalamic—whether it's the Indigo Mor Stambh or the Mandala Wheels—is meticulously hand-painted by our master artisans. No two pieces are exactly identical."
      },
      {
        q: "Can I request a custom design?",
        a: "Yes! We specialize in customized pillars and mirrors. Please contact us via WhatsApp or our Contact form with your specific requirements."
      }
    ]
  },
  {
    category: "Shipping & FragileCare™",
    icon: Truck,
    questions: [
      {
        q: "How do you ensure the ceramics don't break during transit?",
        a: "We use our proprietary FragileCare™ packaging system. This involves reinforced double-walled boxes, honeycomb padding, and custom foam inserts designed to absorb 99% of transit vibrations."
      },
      {
        q: "How long does delivery take?",
        a: "Most ready-to-ship items arrive within 5-7 business days. Custom orders take 14-21 days as they involve fresh molding, drying, and firing cycles."
      },
      {
        q: "What if my item arrives broken?",
        a: "While rare, if an item is damaged in transit, we offer a full replacement or refund. Simply provide a photo of the damaged piece within 24 hours of delivery."
      }
    ]
  },
  {
    category: "Care & Preservation",
    icon: Heart,
    questions: [
      {
        q: "How should I clean my Kalamic pieces?",
        a: "Use a soft, dry microfibre cloth for regular dusting. For deeper cleaning, a damp cloth with mild soap is safe. Avoid abrasive scrubbers that may scratch the glaze."
      },
      {
        q: "Are your items suitable for outdoor use?",
        a: "Our glazed ceramics are weather-resistant but we recommend keeping them in semi-covered areas to protect the hand-painted details from prolonged direct sunlight."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <HelpCircle className="h-3 w-3" /> Curiosity Corner
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Frequently Asked</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about our artisan processes, shipping security, and piece preservation.
            </p>
          </div>

          <div className="space-y-16">
            {FAQS.map((section, idx) => ( section.questions.length > 0 && (
              <div key={idx} className="space-y-8">
                <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-widest">{section.category}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {section.questions.map((faq, fIdx) => (
                    <AccordionItem key={fIdx} value={`item-${idx}-${fIdx}`} className="border rounded-[1.5rem] px-6 bg-white shadow-sm overflow-hidden data-[state=open]:border-primary/30 transition-all">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <span className="text-left font-bold text-primary text-sm md:text-base leading-tight">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 text-muted-foreground leading-relaxed text-sm md:text-base font-medium">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )))}
          </div>

          <div className="mt-24 p-10 md:p-16 rounded-[3rem] bg-primary text-white text-center space-y-6 shadow-2xl">
            <Sparkles className="h-12 w-12 mx-auto opacity-50" />
            <h2 className="text-3xl font-black tracking-tight">Still have questions?</h2>
            <p className="text-white/80 font-medium text-lg max-w-lg mx-auto">Our artisans are happy to help. Connect with us via WhatsApp or Email.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild variant="outline" className="h-14 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-primary font-black px-10">
                <a href="mailto:contact@kalamic.shop">Email Our Studio</a>
              </Button>
              <Button asChild className="h-14 rounded-2xl bg-[#1E1E1E] text-white hover:bg-black font-black px-10 border-none shadow-xl">
                <a href="https://wa.me/916387562920" target="_blank">Chat on WhatsApp</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
