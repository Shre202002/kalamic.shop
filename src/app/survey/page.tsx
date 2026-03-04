
'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/survey/HeroBanner';
import SurveyModal from '@/components/survey/SurveyModal';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { getProducts } from '@/lib/actions/products';
import { motion } from 'framer-motion';
import { Package, Search } from 'lucide-react';

export default function ArtisanInsightsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProducts();
        setProducts(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroBanner onFeedbackClick={() => setIsOpen(true)} />
        
        <section className="py-20 bg-white/50">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="mb-12 space-y-4 text-center">
              <div className="inline-flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-widest">
                <Package className="h-4 w-4" /> Specific Review
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-semibold text-black tracking-tight">
                Review an Artisan Piece
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-sm md:text-base">
                Already own a Kalamic treasure? Share your specific experience with any of our 
                current collections below.
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {products.map((p) => (
                  <ProductCard 
                    key={p._id}
                    id={p._id}
                    slug={p.slug}
                    name={p.name}
                    price={p.price}
                    description={p.short_description}
                    image={p.images?.[0] || 'https://placehold.co/600x800?text=Kalamic'}
                    rating={p.analytics?.average_rating || 4.8}
                    tag={p.tags?.[0]}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </section>

        <SurveyModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          isSinglePage={true} 
          product={null} 
        />
      </main>
      <Footer />
    </div>
  );
}
