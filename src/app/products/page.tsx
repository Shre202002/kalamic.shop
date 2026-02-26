
"use client"

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/lib/actions/products';
import { Loader2, Search, SlidersHorizontal, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
                <Package className="h-4 w-4" /> The Collection
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight">Kalamic Catalog</h1>
              <p className="text-sm md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                Discover our curated selection of premium handcrafted ceramic treasures for your space.
              </p>
            </div>
            
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search the collection..." 
                  className="pl-12 h-14 rounded-2xl bg-white border-none shadow-lg focus-visible:ring-2 focus-visible:ring-accent transition-all text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-14 w-14 rounded-2xl bg-white shadow-lg border-none hover:bg-primary/5 hidden md:flex">
                <SlidersHorizontal className="h-6 w-6 text-primary" />
              </Button>
            </div>
          </div>

          {/* Grid Section */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">Revealing artisan treasures...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  id={product._id} 
                  slug={product.slug}
                  name={product.name}
                  description={product.short_description || product.description}
                  price={product.price}
                  originalPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined}
                  image={product.images?.[0] || 'https://placehold.co/600x800?text=No+Image'}
                  rating={product.averageRating || 4.8}
                  tag={product.tags?.[0] || "Artisan"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[40px] shadow-sm border border-dashed border-primary/20 px-8">
              <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground opacity-30" />
              </div>
              <h2 className="text-2xl font-bold text-primary">No masterpieces found</h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">We couldn't find any ceramic pieces matching "{searchQuery}". Try a different keyword.</p>
              <Button 
                variant="link" 
                className="text-accent font-bold mt-4 text-lg"
                onClick={() => setSearchQuery('')}
              >
                View all items
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
