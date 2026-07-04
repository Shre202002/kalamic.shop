import React from 'react';
import { CheckCircle2, Package } from 'lucide-react';

export function WhatsInTheBox({ productName }: { productName: string }) {
  const items = [
    `The ${productName} Piece`,
    'Handcrafted Care Instruction Card',
    'Artisan Certificate of Authenticity',
    'FragileCare™ Eco-friendly Packaging',
    'Studio Brand Label & Warranty Tag',
    'Secure Transit Insurance Certificate'
  ];

  return (
    <section className="py-12 px-10 md:px-16 rounded-[3rem] bg-foreground text-white overflow-hidden relative shadow-2xl">
      {/* Decorative pattern */}
      <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
      
      <div className="relative z-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-inner">
            <Package size={24} />
          </div>
          <h2 className="text-3xl font-display font-bold">What's in the Box</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-sm md:text-base font-medium text-white/80 group-hover:text-white transition-colors">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
