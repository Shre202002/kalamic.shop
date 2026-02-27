"use client"

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-[#E8DFC9] text-[#2E2E2E] pt-16 pb-8 border-t border-primary/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand & About */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-primary">Kalamic</h2>
            <p className="text-[#6B6B6B] text-sm leading-relaxed max-w-xs">
              Handcrafting elegance for your home and spiritual spaces. Traditionally inspired, modernly curated.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 text-primary">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-xs">Quick Links</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B]">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-xs">Contact Us</h3>
            <ul className="space-y-4 text-sm text-[#6B6B6B]">
              <li className="flex gap-3"><MapPin className="h-5 w-5 text-primary opacity-60" /> 123 Ceramic Lane, Art District</li>
              <li className="flex gap-3"><Phone className="h-5 w-5 text-primary opacity-60" /> +91 (234) 567-890</li>
              <li className="flex gap-3"><Mail className="h-5 w-5 text-primary opacity-60" /> hello@kalamic.shop</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-xs">Join the Community</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">Get updates on new collections and artisan stories.</p>
            <div className="flex flex-col gap-2">
              <Input placeholder="Enter your email" className="bg-white/50 border-primary/20 text-[#2E2E2E] placeholder:text-[#9A9A9A]" />
              <Button className="bg-primary text-white hover:bg-[#A95C2B] rounded-lg">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#9A9A9A]">
          <p>© 2024 Kalamic. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#2E2E2E] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#2E2E2E] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}