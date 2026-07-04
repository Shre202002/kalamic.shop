import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';

interface RelatedProductsProps {
  products: any[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-24 border-t border-border/50">
      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold text-foreground">You May Also Like</h2>
            <p className="text-sm text-muted-foreground font-medium">Curated artisanal picks from the same kiln firing.</p>
          </div>
          <Link href="/products" className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
            View Full Gallery
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p) => (
            <ProductCard 
              key={p._id} 
              id={p._id} 
              slug={p.slug} 
              name={p.name} 
              price={p.price} 
              image={p.images?.[0]} 
              rating={p.analytics?.average_rating || 5} 
            />
          ))}
        </div>

        <div className="sm:hidden text-center">
           <Link href="/products" className="text-[10px] font-black uppercase tracking-widest text-primary">
            View All Creations
          </Link>
        </div>
      </div>
    </section>
  );
}
