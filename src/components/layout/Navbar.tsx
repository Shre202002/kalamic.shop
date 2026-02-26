
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartItemCount = 2; // Mock

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Electronics', href: '/products?category=electronics' },
    { name: 'Fashion', href: '/products?category=fashion' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile Menu Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle className="text-2xl font-bold text-primary">NexGenShop</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center justify-between p-4 text-lg font-medium border-b last:border-0 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {link.highlight && <Sparkles className="h-4 w-4 text-accent fill-accent" />}
                      {link.name}
                    </span>
                    <ChevronRight className="h-5 w-5 opacity-50" />
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">NexGenShop</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${link.highlight ? 'text-accent font-bold hover:text-accent/80' : 'hover:text-primary'}`}
            >
              {link.highlight && <Sparkles className="h-3.5 w-3.5 fill-accent" />}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden sm:flex"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5 text-primary" />
          </Button>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-5 w-5 text-primary" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Link href="/auth/login">
            <Button variant="primary" size="sm" className="hidden sm:flex">
              Sign In
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <User className="h-5 w-5 text-primary" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-16 left-0 w-full p-4 bg-white border-b animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10" autoFocus />
            </div>
            <Button variant="ghost" onClick={() => setIsSearchOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </header>
  );
}
