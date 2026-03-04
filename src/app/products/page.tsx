
"use client"

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { getProducts } from '@/lib/actions/products';
import { Search, SlidersHorizontal, Package, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadAllProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.short_description || p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.92 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-[1200px]">
          
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-widest">
                <Package className="h-4 w-4" /> The Collection
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                Our Complete Collection
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed font-body">
                Exquisite handcrafted ceramic pieces created with passion – from sacred temple pillars to ornate mandala wheels and decorative accents.
              </p>
            </div>
            
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search the collection..." 
                  className="pl-14 h-12 rounded-2xl bg-card border-none shadow-lg focus-visible:ring-2 focus-visible:ring-accent transition-all text-base font-body"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-12 w-12 rounded-2xl bg-card shadow-lg border-none hover:bg-primary/5 hidden md:flex">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </motion.div>

          {/* Grid Section */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProducts.map((product) => (
                <motion.div key={product._id} variants={cardVariants}>
                  <ProductCard 
                    id={product._id} 
                    slug={product.slug}
                    name={product.name}
                    description={product.short_description || product.description}
                    price={product.price}
                    originalPrice={product.compare_at_price}
                    image={product.images?.[0] || 'https://placehold.co/600x800?text=Kalamic'}
                    rating={product.analytics?.average_rating || 4.8}
                    tag={product.tags?.[0] || "Artisan"}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="col-span-full text-center py-32 bg-card rounded-[40px] shadow-sm border border-dashed border-primary/20 px-8"
            >
              <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-muted-foreground opacity-30" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">No masterpieces found</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto font-body">We couldn't find any ceramic pieces matching "{searchQuery}". Try a different keyword.</p>
              <Button 
                variant="link" 
                className="text-accent font-bold mt-4 text-base"
                onClick={() => setSearchQuery('')}
              >
                View all items
              </Button>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
