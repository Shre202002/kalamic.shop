"use client"

import React from 'react';
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
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';

const SITEMAP_DATA = [
  {
    title: "Curated Experience",
    icon: Sparkles,
    links: [
      { name: "Artisan Gallery", href: "/products", icon: Package },
      { name: "Our Studio Story", href: "/about", icon: Home },
      { name: "Search Collection", href: "/products", icon: Search },
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
      { name: "Financial Ledger", href: "/orders", icon: History }
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
              <Map className="h-3 w-3" /> Navigation Map
            </div>
            <h1 className="text-4xl md:text-7xl font-display font-semibold text-foreground tracking-tight">Sitemap</h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto font-medium">
              A comprehensive directory of our artisan studio's digital footprint and collector ecosystem.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {SITEMAP_DATA.map((section, idx) => (
              <motion.div key={idx} variants={itemVariants} className="space-y-8">
                <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em]">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link 
                        href={link.href} 
                        className="group flex items-center justify-between p-4 rounded-2xl hover:bg-primary/[0.03] transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-muted-foreground group-hover:text-foreground font-bold text-sm md:text-base">
                            {link.name}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-24 p-12 md:p-20 rounded-[3rem] md:rounded-[4rem] bg-white border border-dashed border-primary/20 text-center space-y-6 shadow-sm">
            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary opacity-40" />
            </div>
            <p className="text-muted-foreground font-medium italic text-lg max-w-lg mx-auto">
              "Can't find what you're looking for? Reach out to our artisans directly for personalized guidance."
            </p>
            <div className="pt-4">
              <Link 
                href="/contact" 
                className="inline-flex h-14 items-center px-10 rounded-full bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Contact Our Studio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
