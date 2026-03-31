'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Search, SlidersHorizontal, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.short_description || p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-widest"><Package className="h-4 w-4" /> The Collection</div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">Our Complete Collection</h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed font-body">Exquisite handcrafted ceramic pieces created with passion.</p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Search the collection..." className="pl-14 h-12 rounded-2xl bg-card border-none shadow-lg focus-visible:ring-2 focus-visible:ring-accent transition-all text-base font-body" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Button variant="outline" className="h-12 w-12 rounded-2xl bg-card shadow-lg border-none hover:bg-primary/5 hidden md:flex"><SlidersHorizontal className="h-5 w-5 text-primary" /></Button>
            </div>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" variants={gridVariants} initial="hidden" animate="visible">
            {filteredProducts.map((product, index) => (
              <motion.div key={product._id} variants={cardVariants}>
                <ProductCard id={product._id} slug={product.slug} name={product.name} description={product.short_description || product.description} price={product.price} originalPrice={product.compare_at_price} image={product.images?.[0]} rating={product.analytics?.average_rating || 4.8} priority={index < 4} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
