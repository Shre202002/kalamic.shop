
"use client"

import React from 'react';
import Link from 'next/link';
import { Instagram, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white text-[#2E2E2E] pt-24 pb-12 border-t border-primary/10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-12">
          {/* Brand & About */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold tracking-tight text-[#271E1B]">Kalamic</h2>
            <p className="text-[#6B6B6B] text-sm leading-relaxed max-w-xs font-medium">
              Slow-made ceramics for intentional living. Handcrafted in our studio since 1994.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Globe className="h-4 w-4" /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-4 w-4" /></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#271E1B] mb-8">Shop</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B] font-medium">
              <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#271E1B] mb-8">Support</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B] font-medium">
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">Care Guide</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#271E1B] mb-8">Company</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B] font-medium">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/sitemap" className="hover:text-primary transition-colors">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/10 mt-24 pt-12 text-center">
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[#9A9A9A]">
            © 2024 Kalamic Ceramic Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
