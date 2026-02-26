
'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-primary">Our Story</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Kalamic was born from a passion for preserving India's rich ceramic heritage while bringing it into the modern home. 
                What started as a small workshop has grown into a community of master artisans.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" 
                alt="Artisan at work" 
                fill 
                className="object-cover"
                data-ai-hint="pottery artisan"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-primary">The Artisan Hands</h2>
              <p className="text-muted-foreground leading-relaxed">
                Every piece at Kalamic is hand-molded. We don't believe in mass production. Our artisans spend hours perfecting the Indigo patterns of our Mor Stambh pillars and the intricate geometry of our Mandala wheels.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                When you buy from Kalamic, you aren't just buying home decor; you're supporting a lineage of craft that spans generations. We ensure fair wages and ethical working conditions for every member of our creative family.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
