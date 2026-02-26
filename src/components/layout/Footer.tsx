
"use client"

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand & About */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Kalamic</h2>
            <p className="opacity-80 text-sm leading-relaxed max-w-xs">
              Handcrafting elegance for your home and spiritual spaces. Traditionally inspired, modernly curated.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="hover:bg-accent/20 text-primary-foreground">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-accent/20 text-primary-foreground">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-accent/20 text-primary-foreground">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm opacity-80">
              <li><Link href="/products" className="hover:text-accent transition-colors">All Products</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-accent transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm opacity-80">
              <li className="flex gap-3"><MapPin className="h-5 w-5 text-accent" /> 123 Ceramic Lane, Art District</li>
              <li className="flex gap-3"><Phone className="h-5 w-5 text-accent" /> +91 (234) 567-890</li>
              <li className="flex gap-3"><Mail className="h-5 w-5 text-accent" /> hello@kalamic.shop</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Join the Community</h3>
            <p className="text-sm opacity-80 mb-4">Get updates on new collections and artisan stories.</p>
            <div className="flex flex-col gap-2">
              <Input placeholder="Enter your email" className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
          <p>© 2024 Kalamic. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
