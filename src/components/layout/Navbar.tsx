
"use client"

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronRight, Package, LogOut, LayoutDashboard, Sparkles, BookOpen } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('buyer');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const lastScrollY = useRef(0);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useNavigation();

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if we are at the top
      setIsScrolled(currentScrollY > 20);

      // Determine scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down and not at the very top
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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
    { name: 'Creations', href: '/products', icon: Package },
    { name: 'Gallery', href: '/gallery', icon: Sparkles },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Our Story', href: '/about', icon: Heart },
    { name: 'Contact', href: '/contact', icon: ChevronRight },
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const isAdmin = ['super_admin', 'admin', 'support'].includes(userRole);

  if (!mounted) return null;

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500 ease-in-out transform-gpu will-change-transform",
      isScrolled 
        ? "bg-white/80 backdrop-blur-xl h-16 border-b border-primary/10 shadow-lg" 
        : "bg-transparent h-20 md:h-24",
      !isVisible && "-translate-y-full"
    )}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-full flex items-center justify-between">
        
        {/* Left: Mobile Trigger & Logo */}
        <div className="flex items-center gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-primary/10 transition-colors">
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[350px] p-0 bg-background border-none shadow-2xl">
              <div className="flex flex-col h-full">
                <SheetHeader className="p-8 border-b border-primary/5 bg-primary/[0.02]">
                  <SheetTitle className="text-4xl font-display font-black text-primary tracking-tighter">Kalamic</SheetTitle>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Handcrafted Artistry</p>
                </SheetHeader>
                
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group flex items-center justify-between p-5 text-sm font-bold uppercase tracking-widest rounded-3xl hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <link.icon className="h-5 w-5" />
                        </div>
                        <span className="text-foreground">{link.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-30 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </nav>

                <div className="p-8 border-t border-primary/5 space-y-4">
                  {user ? (
                    <div className="space-y-2">
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full h-12 rounded-2xl font-bold justify-start px-6 gap-3">
                          <User className="h-5 w-5" /> Profile
                        </Button>
                      </Link>
                      <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full h-12 rounded-2xl font-bold justify-start px-6 gap-3">
                          <Package className="h-5 w-5" /> Orders
                        </Button>
                      </Link>
                      <Button variant="ghost" onClick={handleSignOut} className="w-full h-12 rounded-2xl text-destructive font-black uppercase tracking-widest gap-3 justify-start px-6 mt-4">
                        <LogOut className="h-5 w-5" /> Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Sign In to Studio</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className={cn(
            "font-display font-black text-primary tracking-tighter transition-all duration-500",
            isScrolled ? "text-2xl" : "text-3xl md:text-4xl"
          )}>
            Kalamic
          </Link>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group relative py-2"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground transition-colors group-hover:text-primary">
                {link.name}
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <TooltipProvider>
            <div className="flex items-center gap-1 md:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="rounded-full hover:bg-primary/5">
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px] font-bold uppercase">Search</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/wishlist" className="hidden sm:block">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px] font-bold uppercase">Wishlist</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/5">
                      <ShoppingCart className="h-5 w-5" />
                      <AnimatePresence>
                        {cartItemCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1"
                          >
                            <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-primary text-white border-2 border-background text-[9px] font-black rounded-full">
                              {cartItemCount}
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px] font-bold uppercase">Bag</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 bg-primary/10 hidden sm:block mx-2" />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none group">
                  <div className="flex items-center gap-3 pl-2 transition-opacity group-hover:opacity-80">
                    <div className="hidden lg:block text-right">
                      <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mb-1">Collector</p>
                      <p className="text-[11px] font-bold text-foreground leading-none">{user.displayName?.split(' ')[0] || 'Artisan'}</p>
                    </div>
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-primary/10 shadow-inner group-hover:border-primary/30 transition-all">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-4 rounded-[2.5rem] shadow-2xl border-primary/5 bg-white/95 backdrop-blur-xl">
                <DropdownMenuLabel className="p-4 pt-2">
                  <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Studio Identity</p>
                  <p className="text-lg font-bold text-foreground truncate">{user.displayName || 'Collector'}</p>
                  <p className="text-[10px] text-muted-foreground truncate opacity-60">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary/5" />
                <DropdownMenuGroup className="py-2">
                  <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer focus:bg-primary/5">
                    <Link href="/profile" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center mr-4">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-bold text-sm">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer focus:bg-primary/5">
                    <Link href="/orders" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center mr-4">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-bold text-sm">Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer bg-accent/5 focus:bg-accent/10">
                      <Link href="/admin/dashboard" className="flex items-center w-full text-accent">
                        <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center mr-4">
                          <LayoutDashboard className="h-4 w-4 text-accent" />
                        </div>
                        <span className="font-bold text-sm">Control Hub</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-primary/5" />
                <div className="pt-2">
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-2xl p-4 text-destructive font-black cursor-pointer focus:bg-destructive/5">
                    <LogOut className="mr-4 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button className="bg-primary text-white font-black h-11 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all text-[10px] uppercase tracking-widest border-none">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[100] flex items-start pt-24 md:pt-40 justify-center p-6" 
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div 
              initial={{ y: -20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.95 }}
              className="w-full max-w-4xl" 
              onClick={e => e.stopPropagation()}
            >
              <div className="relative group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-8 w-8 text-primary/40 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Find your masterpiece..."
                  className="pl-20 pr-32 h-20 md:h-28 rounded-[2.5rem] bg-white border-none shadow-2xl text-xl md:text-3xl font-display font-semibold text-primary"
                  autoFocus
                />
                <button 
                  onClick={() => setIsSearchOpen(false)} 
                  className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 bg-primary/5 hover:bg-primary/10 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="h-6 w-6 text-primary" />
                </button>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <p className="w-full text-center text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Artisan Shortcuts</p>
                {['Mor Stambh', 'Mandala', 'Wall Art', 'Pillars'].map(tag => (
                  <button key={tag} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all">
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
