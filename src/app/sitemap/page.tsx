"use client"

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Map, ChevronRight, Home, ShoppingBag, Info, Shield, HelpCircle, Mail } from 'lucide-react';

const SITEMAP_DATA = [
  {
    title: "Main Experience",
    icon: Home,
    links: [
      { name: "Home", href: "/" },
      { name: "Artisan Story", href: "/about" },
      { name: "The Collection", href: "/products" },
      { name: "Discovery Survey", href: "/survey" }
    ]
  },
  {
    title: "The Studio",
    icon: ShoppingBag,
    links: [
      { name: "Your Bag", href: "/cart" },
      { name: "Saved Favorites", href: "/wishlist" },
      { name: "My Workspace", href: "/profile" },
      { name: "Acquisition History", href: "/orders" }
    ]
  },
  {
    title: "Help & Governance",
    icon: Shield,
    links: [
      { name: "Curiosity Corner (FAQ)", href: "/faq" },
      { name: "Contact Studio", href: "/contact" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Returns & Refunds", href: "/returns" }
    ]
  }
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <Map className="h-3 w-3" /> Navigation Map
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Kalamic Sitemap</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              A comprehensive directory of our artisan studio's digital footprint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {SITEMAP_DATA.map((section, idx) => (
              <div key={idx} className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-black text-primary uppercase tracking-widest text-sm">{section.title}</h2>
                </div>
                <ul className="space-y-4 pl-4 border-l-2 border-primary/10">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} className="group flex items-center justify-between text-muted-foreground hover:text-primary transition-all font-bold text-lg">
                        <span>{link.name}</span>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-[3rem] bg-white border border-dashed border-primary/20 text-center space-y-4 shadow-sm">
            <Mail className="h-8 w-8 mx-auto text-primary opacity-30" />
            <p className="text-muted-foreground font-medium italic">"Can't find what you're looking for? Reach out to our artisans directly."</p>
            <Link href="/contact" className="text-primary font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8">Contact Our Studio</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
