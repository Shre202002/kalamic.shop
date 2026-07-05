import React from 'react';

interface SpecificationsSectionProps {
  product: any;
}

export function SpecificationsSection({ product }: SpecificationsSectionProps) {
  const specs = product.specifications || [];
  
  if (specs.length === 0) return null;

  return (
    <section className="space-y-8 py-12 border-t border-border/50 w-full">
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold text-foreground">Specifications</h2>
        <p className="text-sm text-muted-foreground font-medium">Detailed technical attributes of this handcrafted creation.</p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Full-width Specifications Table */}
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm w-full">
          <div className="divide-y divide-border/50">
            {specs.map((spec: any, i: number) => (
              <div key={i} className="grid grid-cols-[110px_1fr] md:grid-cols-[180px_1fr] gap-6 items-center px-6 md:px-10 py-5 hover:bg-primary/[0.01] transition-colors group">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">
                  {spec.key}
                </span>
                <span className="text-sm font-bold text-foreground break-words">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Note Box - Now responsive and below the table */}
        <div className="p-8 md:p-10 rounded-[2.5rem] bg-muted/30 border border-border border-dashed space-y-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
             <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Technical Note
           </h3>
           <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-4xl">
             As each piece is individually handcrafted in our studio, dimensions and weight may vary slightly (approx ±5%). These subtle variations in form and glaze are the hallmark of authentic ceramic art and part of each piece's unique soul.
           </p>
        </div>
      </div>
    </section>
  );
}
