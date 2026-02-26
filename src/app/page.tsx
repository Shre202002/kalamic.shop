
"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Zap, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getFeaturedProducts } from '@/lib/actions/products';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await getFeaturedProducts();
        setFeaturedProducts(products);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center overflow-hidden bg-primary/5">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2000"
              alt="Handcrafted Kalamic Hero"
              fill
              className="object-cover opacity-20"
              priority
              data-ai-hint="ceramic pottery"
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6 animate-slide-in-up">
              <Badge className="bg-accent text-accent-foreground px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                Authentic Ceramic Art
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight">
                Kalamic: <br /> <span className="text-accent">Soulful Craft.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover our curated selection of premium handmade ceramics. From spiritual pillars to modern home decor, each piece is a celebration of Indian heritage.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/products">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg h-14 px-8 w-full sm:w-auto">
                    View Catalog <ShoppingBag className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/survey">
                  <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 text-lg h-14 px-8 w-full sm:w-auto">
                    Find Your Style
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-primary mb-2">Artisan Collection</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Exquisite handmade ceramic pieces selected for your home.</p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard 
                    key={product._id} 
                    id={product._id} 
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined}
                    image={product.images?.[0] || 'https://placehold.co/600x600?text=No+Image'}
                    rating={4.8}
                    category="Handmade"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>No products found in the collection yet.</p>
              </div>
            )}
            
            <div className="text-center mt-12">
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-primary text-primary px-10">
                  Shop All Kalamic
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 border-t bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Artisan Crafted</h3>
                <p className="text-muted-foreground text-sm">Every Kalamic piece is unique, hand-molded and painted by traditional Indian masters.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">FragileCare™ Shipping</h3>
                <p className="text-muted-foreground text-sm">Our signature triple-layer packaging ensures your ceramics arrive safely, or your money back.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Timeless Heritage</h3>
                <p className="text-muted-foreground text-sm">We preserve ancient motifs like Peacock and Mandalas in designs that fit perfectly in modern homes.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
