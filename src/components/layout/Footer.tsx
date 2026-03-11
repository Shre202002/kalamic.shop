
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
              Handcrafted décor inspired by Indian heritage, refined for contemporary living. Every piece carries the warmth of skilled hands and the weight of cultural memory.
            </p>
            <div className="flex gap-6">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors" title="Website">
                <Globe className="h-5 w-5" />
              </Link>
              <Link 
                href="https://www.instagram.com/kala_mic_04/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#271E1B] mb-8">Shop</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B] font-medium">
              <li><Link href="/products" className="hover:text-primary transition-colors">Artisan Gallery</Link></li>
              <li><Link href="/products?category=temple" className="hover:text-primary transition-colors">Spiritual Decor</Link></li>
              <li><Link href="/products?category=wall-art" className="hover:text-primary transition-colors">Wall Artistry</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Private Favorites</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#271E1B] mb-8">Support</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B] font-medium">
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">Artisanal FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Speak with Studio</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">Financial Ledger</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#271E1B] mb-8">Company</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B] font-medium">
              <li><Link href="/about" className="hover:text-primary transition-colors">Our Studio Story</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Digital Security</Link></li>
              <li><Link href="/sitemap" className="hover:text-primary transition-colors">Navigation Map</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/10 mt-24 pt-12 text-center">
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[#9A9A9A]">
            © 2026 Kalamic Ceramic Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
