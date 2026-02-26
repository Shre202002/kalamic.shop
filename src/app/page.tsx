
"use client"

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShoppingBag, Zap, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const featuredProducts = [
    { 
      id: '699026a8ae873e1fa69cb18a', 
      name: 'Mor Stambh Ceramic Customized Pillar', 
      price: 1499, 
      image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18a')?.imageUrl || '', 
      rating: 4.9, 
      category: 'Home Decor', 
      badge: 'Bestseller' 
    },
    { 
      id: '699026a8ae873e1fa69cb18b', 
      name: 'Handmade Ceramic Mirror', 
      price: 999, 
      originalPrice: 2599,
      image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18b')?.imageUrl || '', 
      rating: 4.8, 
      category: 'Home Decor',
      badge: 'Sale'
    },
    { 
      id: '699026a8ae873e1fa69cb18c', 
      name: 'Customized Ceramic Photo Frame', 
      price: 699, 
      image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18c')?.imageUrl || '', 
      rating: 4.7, 
      category: 'Gifts' 
    },
    { 
      id: '699026a8ae873e1fa69cb18e', 
      name: 'Handmade Ceramic Mandala Wheel', 
      price: 2499, 
      originalPrice: 4999,
      image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18e')?.imageUrl || '', 
      rating: 5.0, 
      category: 'Home Decor', 
      badge: 'Premium' 
    },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center overflow-hidden bg-primary/5">
          <div className="absolute inset-0 z-0">
            <Image 
              src={PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18a')?.imageUrl || ''}
              alt="Hero"
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6 animate-slide-in-up">
              <Badge className="bg-accent text-accent-foreground px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                Exquisite Ceramic Collection
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight">
                Handcrafted <br /> <span className="text-accent">Indian Artistry.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover our curated selection of premium handmade ceramics. From spiritual pillars to modern home decor, each piece tells a story of tradition and skill.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/products">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg h-14 px-8 w-full sm:w-auto">
                    Shop Collection <ShoppingBag className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/survey">
                  <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 text-lg h-14 px-8 w-full sm:w-auto">
                    Take Discovery Quiz
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
              <h2 className="text-3xl font-bold text-primary mb-2">Featured Products</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Our most exquisite handmade ceramic pieces chosen for you.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button size="lg" variant="outline" className="border-primary text-primary px-10">
                Explore All Products
              </Button>
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
                <h3 className="text-xl font-bold text-primary">Handmade with Love</h3>
                <p className="text-muted-foreground text-sm">Every product is carefully crafted by skilled artisans, ensuring unique character and premium quality.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Safe Delivery</h3>
                <p className="text-muted-foreground text-sm">We use specialized eco-friendly packaging to ensure your delicate ceramics reach you in perfect condition.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Traditional Designs</h3>
                <p className="text-muted-foreground text-sm">Celebrating Indian cultural heritage through beautiful motifs like Peacocks, Mandalas, and Floral patterns.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
