import React from 'react';
import { Separator } from '@/components/ui/separator';

interface SpecificationsSectionProps {
  product: any;
}

export function SpecificationsSection({ product }: SpecificationsSectionProps) {
  const specs = product.specifications || [];
  
  if (specs.length === 0) return null;

  return (
    <section className="space-y-8 py-12 border-t border-border/50">
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold text-foreground">Specifications</h2>
        <p className="text-sm text-muted-foreground font-medium">Detailed technical attributes of this handcrafted creation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
          <div className="divide-y divide-border/50">
            {specs.map((spec: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-primary/[0.01] transition-colors group">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">
                  {spec.key}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-muted/30 border border-border border-dashed flex flex-col justify-center space-y-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Technical Note</h3>
           <p className="text-sm text-muted-foreground leading-relaxed font-medium">
             As each piece is individually handcrafted in our Lucknow studio, dimensions and weight may vary slightly (approx ±5%). These variations are the signature of authentic ceramic art and part of its unique soul.
           </p>
        </div>
      </div>
    </section>
  );
}
