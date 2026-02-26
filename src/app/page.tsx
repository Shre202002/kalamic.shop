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
  // Mock data derived from placeholder-images
  const featuredProducts = [
    { id: '1', name: 'Premium Noise Cancelling Headphones', price: 299, originalPrice: 349, image: PlaceHolderImages.find(i => i.id === 'prod-1')?.imageUrl || '', rating: 4.8, category: 'Electronics', badge: 'New' },
    { id: '2', name: 'Elite Smart Fitness Tracker', price: 149, image: PlaceHolderImages.find(i => i.id === 'prod-2')?.imageUrl || '', rating: 4.7, category: 'Electronics' },
    { id: '3', name: 'Handcrafted Leather Laptop Sleeve', price: 79, originalPrice: 99, image: PlaceHolderImages.find(i => i.id === 'prod-3')?.imageUrl || '', rating: 4.9, category: 'Accessories', badge: 'Hot' },
    { id: '4', name: 'Signature Ergonomic Desk Chair', price: 449, image: PlaceHolderImages.find(i => i.id === 'prod-4')?.imageUrl || '', rating: 4.6, category: 'Furniture' },
  ];

  const categories = [
    { name: 'Mobile', image: PlaceHolderImages.find(i => i.id === 'cat-mobile')?.imageUrl || '' },
    { name: 'Watches', image: PlaceHolderImages.find(i => i.id === 'cat-watch')?.imageUrl || '' },
    { name: 'Footwear', image: PlaceHolderImages.find(i => i.id === 'cat-shoe')?.imageUrl || '' },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center overflow-hidden bg-primary/5">
          <div className="absolute inset-0 z-0">
            <Image 
              src={PlaceHolderImages.find(i => i.id === 'hero-electronics')?.imageUrl || ''}
              alt="Hero"
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6 animate-slide-in-up">
              <Badge className="bg-accent text-accent-foreground px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                Summer Collection 2024
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight">
                Experience Quality <br /> <span className="text-accent">Redefined.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover our curated selection of premium electronics and accessories designed for the modern lifestyle. Fast, secure, and made for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg h-14 px-8">
                  Shop Now <ShoppingBag className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 text-lg h-14 px-8">
                  View Collections
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">Shop by Category</h2>
                <p className="text-muted-foreground">Find exactly what you need with our curated categories.</p>
              </div>
              <Link href="/categories" className="hidden sm:flex items-center text-accent font-semibold hover:underline group">
                View all categories <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link key={cat.name} href={`/products?category=${cat.name.toLowerCase()}`} className="group relative h-64 overflow-hidden rounded-2xl">
                  <Image 
                    src={cat.image} 
                    alt={cat.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-8">
                    <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                      <h3 className="text-2xl font-bold text-white mb-1">{cat.name}</h3>
                      <p className="text-white/80 text-sm font-medium">Explore Collection</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-primary mb-2">Featured Products</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Our most popular items chosen by the NexGen community this month.</p>
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
                <h3 className="text-xl font-bold text-primary">Lightning Fast Delivery</h3>
                <p className="text-muted-foreground text-sm">We ensure your orders reach you in record time with our optimized logistics network.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Secure Payments</h3>
                <p className="text-muted-foreground text-sm">Industry-standard encryption and secure payment gateways for a worry-free shopping experience.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Free Global Shipping</h3>
                <p className="text-muted-foreground text-sm">Enjoy free shipping on all orders over $150, delivered straight to your doorstep.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
