
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronRight, Package, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems } = useCollection(cartQuery);
  const cartItemCount = cartItems?.length || 0;

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Collection', href: '/products' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle className="text-2xl font-bold text-primary">Kalamic</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center justify-between p-4 text-lg font-medium border-b last:border-0 hover:text-primary transition-colors"
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="h-5 w-5 opacity-50" />
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">Kalamic</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </nav>

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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="flex items-center">
                    <Package className="mr-2 h-4 w-4" /> Order History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" /> My Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button variant="primary" size="sm" className="hidden sm:flex">
                Sign In
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <User className="h-5 w-5 text-primary" />
              </Button>
            </Link>
          )}
        </div>
      </div>

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
