
"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronRight, Package, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { getProfile } from '@/lib/actions/user-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('buyer');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useNavigation();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    async function fetchRole() {
      if (user) {
        const profile = await getProfile(user.uid);
        if (profile) setUserRole(profile.role || 'buyer');
      }
    }
    fetchRole();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'cart', 'cart', 'items');
  }, [firestore, user]);

  const { data: cartItems } = useCollection(cartQuery);
  const cartItemCount = cartItems?.length || 0;

  const navLinks = [
    { name: 'Products', href: '/products' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleSignOut = async () => {
    await auth.signOut();
    document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  const isAdmin = ['super_admin', 'admin', 'support'].includes(userRole);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500 transform-gpu ease-in-out",
      !mounted ? "bg-transparent h-20 md:h-24" : (
        isScrolled
          ? "bg-white/90 backdrop-blur-md h-16 border-b border-primary/10 shadow-sm"
          : "bg-transparent h-20 md:h-24"
      )
    )}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-full flex items-center justify-between">
        {/* Left: Mobile Menu */}
        <div className="flex items-center md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-background border-none">
              <SheetHeader className="p-8 border-b border-primary/5">
                <SheetTitle className="text-3xl font-display font-black text-primary tracking-tighter">Kalamic</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-primary/5"
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </Link>
                ))}
                {user ? (
                  <button onClick={handleSignOut} className="flex items-center gap-3 p-4 text-xs font-bold uppercase tracking-widest text-destructive">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                ) : (
                  <Link href="/auth/login" className="p-4 text-xs font-bold uppercase tracking-widest text-primary">Sign In</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className={cn(
          "font-display font-black text-primary tracking-tighter transition-all duration-500",
          (!mounted || !isScrolled) ? "text-2xl md:text-4xl" : "text-xl md:text-2xl"
        )}>
          Kalamic
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:text-primary text-foreground relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary hover:after:w-full after:transition-all"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="rounded-full">
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/wishlist" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-white border-2 border-background text-[9px] font-black rounded-full">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {mounted && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none p-1">
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-white shadow-md">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3 rounded-[2rem] shadow-2xl border-primary/5">
                <DropdownMenuLabel className="p-4">
                  <p className="text-sm font-black text-primary uppercase tracking-wider">{user.displayName || 'Collector'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="p-2">
                  <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer">
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-4 h-4 w-4 opacity-40" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer">
                    <Link href="/orders" className="flex items-center">
                      <Package className="mr-4 h-4 w-4 opacity-40" /> Orders
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer bg-accent/5">
                      <Link href="/admin/dashboard" className="flex items-center text-accent">
                        <LayoutDashboard className="mr-4 h-4 w-4" /> Admin Hub
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-2xl p-4 text-destructive font-black cursor-pointer">
                    <LogOut className="mr-4 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : mounted ? (
            <Link href="/auth/login">
              <Button className="hidden sm:flex bg-primary text-foreground font-black h-10 px-6 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-[10px] uppercase tracking-widest">
                Sign In
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-start pt-24 justify-center" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-3xl px-4" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground/40" />
              <Input
                placeholder="Search masterpieces..."
                className="pl-16 h-16 md:h-20 rounded-3xl bg-white border-none shadow-2xl text-lg md:text-xl font-medium"
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/5 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
