
"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Map, 
  ChevronRight, 
  Home, 
  ShoppingBag, 
  Shield, 
  Mail, 
  Package, 
  Heart, 
  User, 
  History, 
  Truck, 
  MessageSquare,
  Sparkles,
  Search,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getProducts } from '@/lib/actions/products';

const STATIC_SITEMAP = [
  {
    title: "Curated Experience",
    icon: Sparkles,
    links: [
      { name: "Artisan Gallery", href: "/products", icon: Package },
      { name: "Visual Archive", href: "/gallery", icon: Sparkles },
      { name: "Our Studio Story", href: "/about", icon: Home },
      { name: "Home Dashboard", href: "/", icon: Home }
    ]
  },
  {
    title: "Collector Workspace",
    icon: User,
    links: [
      { name: "Shopping Bag", href: "/cart", icon: ShoppingBag },
      { name: "Private Favorites", href: "/wishlist", icon: Heart },
      { name: "Identity Profile", href: "/profile", icon: User },
      { name: "Orders History", href: "/orders", icon: History }
    ]
  },
  {
    title: "Studio Support",
    icon: Shield,
    links: [
      { name: "Artisanal FAQ", href: "/faq", icon: MessageSquare },
      { name: "Speak with Studio", href: "/contact", icon: Mail },
      { name: "Digital Security", href: "/privacy", icon: Shield },
      { name: "Acquisition Returns", href: "/returns", icon: Truck }
    ]
  }
];

export default function SitemapPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (e) {
        console.error("Failed to load products for sitemap", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
              <Map className="h-3 w-3" /> Navigation Map
            </div>
            <h1 className="text-4xl md:text-7xl font-display font-semibold text-foreground tracking-tight">Sitemap</h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto font-medium">A comprehensive directory of our artisan studio's digital footprint.</p>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12" variants={containerVariants} initial="hidden" animate="visible">
            {STATIC_SITEMAP.map((section, idx) => (
              <motion.div key={idx} variants={itemVariants} className="space-y-8">
                <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><section.icon className="h-6 w-6" /></div>
                  <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em]">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-primary/[0.03] transition-all duration-300">
                        <div className="flex items-center gap-4"><link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" /><span className="text-muted-foreground group-hover:text-foreground font-bold text-sm md:text-base">{link.name}</span></div>
                        <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Dynamic Pieces Section */}
            <motion.div variants={itemVariants} className="space-y-8 lg:col-span-full mt-12">
              <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner"><Package className="h-6 w-6" /></div>
                <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em]">Artisan Masterpieces</h2>
              </div>
              
              {isLoading ? (
                <div className="flex items-center gap-3 p-8 text-muted-foreground font-bold text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Retrieving collections...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <Link 
                      key={p._id} 
                      href={`/products/${p.slug || p._id}`} 
                      className="group p-4 rounded-2xl border border-primary/5 bg-white hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-foreground font-bold text-sm line-clamp-1">{p.name}</p>
                          <p className="text-[10px] font-black uppercase text-accent tracking-widest">₹{p.price.toLocaleString()}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
