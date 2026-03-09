
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('buyer');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useNavigation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    async function fetchRole() {
      if (user) {
        const profile = await getProfile(user.uid);
        if (profile) setUserRole(profile.role || 'buyer');
      } else {
        setUserRole('buyer');
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
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleSignOut = async () => {
    await auth.signOut();
    // Clear session cookie for Middleware access
    document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
    router.refresh();
    setIsMobileMenuOpen(false);
  };

  const isAdmin = ['super_admin', 'admin', 'support'].includes(userRole);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500",
      isScrolled ? "bg-white/90 backdrop-blur-xl h-16 border-b border-primary/5 shadow-sm" : "bg-transparent h-20 md:h-24"
    )}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-full flex items-center justify-between">
        {/* Left: Mobile Menu Trigger */}
        <div className="flex items-center md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/5 rounded-full">
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-none bg-background">
              <SheetHeader className="p-8 border-b border-primary/5 text-left bg-white/50">
                <SheetTitle className="text-3xl font-display font-black text-primary tracking-tighter">Kalamic</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-6 space-y-1">
                <Link 
                  href="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors rounded-2xl hover:bg-primary/5"
                >
                  Home
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors rounded-2xl hover:bg-primary/5"
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </Link>
                ))}
                
                <DropdownMenuSeparator className="my-4 bg-primary/5" />
                
                <Link 
                  href="/wishlist" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors rounded-2xl hover:bg-primary/5"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="h-4 w-4" /> Wishlist
                  </span>
                </Link>

                {user ? (
                  <>
                    <Link 
                      href="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors rounded-2xl hover:bg-primary/5"
                    >
                      <span className="flex items-center gap-3">
                        <User className="h-4 w-4" /> Profile
                      </span>
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-colors rounded-2xl w-full text-left"
                    >
                      <span className="flex items-center gap-3">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </span>
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/auth/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-primary/5 transition-colors rounded-2xl mt-4"
                  >
                    Sign In
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <span className={cn(
            "font-display font-black text-primary tracking-tighter transition-all duration-500",
            isScrolled ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"
          )}>
            Kalamic
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-[10px] font-black uppercase tracking-[0.25em] transition-all hover:text-primary text-foreground relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-primary hover:after:w-full after:transition-all duration-300"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden sm:flex hover:bg-primary/5 rounded-full text-foreground transition-colors"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/wishlist" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="hover:bg-primary/5 rounded-full text-foreground transition-colors">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 rounded-full text-foreground transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-white border-2 border-background text-[9px] font-black rounded-full animate-in zoom-in duration-300">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none group p-1">
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-white shadow-md group-hover:border-primary/20 transition-all duration-500">
                    <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px] uppercase">
                      {user.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-3 rounded-[2rem] shadow-2xl border-primary/5 bg-white/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-500">
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black text-primary uppercase tracking-wider">{user.displayName || 'Collector'}</p>
                    <p className="text-[10px] font-medium text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                <DropdownMenuGroup className="p-2 space-y-1">
                  <DropdownMenuItem asChild className="rounded-2xl cursor-pointer p-4 focus:bg-primary/5 focus:text-primary transition-all duration-300">
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-4 h-4 w-4 opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-widest">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-2xl cursor-pointer p-4 focus:bg-primary/5 focus:text-primary transition-all duration-300">
                    <Link href="/orders" className="flex items-center w-full">
                      <Package className="mr-4 h-4 w-4 opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-widest">Orders</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                    <DropdownMenuGroup className="p-2">
                      <DropdownMenuItem asChild className="rounded-2xl cursor-pointer p-4 bg-accent/5 focus:bg-accent/10 focus:text-accent transition-all duration-300">
                        <Link href="/admin/dashboard" className="flex items-center w-full">
                          <LayoutDashboard className="mr-4 h-4 w-4 text-accent" />
                          <span className="text-xs font-black uppercase tracking-widest text-accent">Admin Hub</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
                
                <DropdownMenuSeparator className="bg-primary/5 mx-2" />
                <div className="p-2">
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-2xl cursor-pointer p-4 text-destructive focus:bg-destructive/5 focus:text-destructive font-black transition-all duration-300">
                    <LogOut className="mr-4 h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button className="hidden sm:flex bg-primary text-foreground font-black h-10 px-6 md:h-11 md:px-8 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                Sign In
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden text-foreground rounded-full hover:bg-primary/5">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-0 left-0 w-full h-[100vh] bg-black/40 backdrop-blur-md z-[60] flex items-start pt-24 justify-center animate-in fade-in duration-500" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-3xl px-4" onClick={e => e.stopPropagation()}>
            <div className="relative group animate-in slide-in-from-top-10 duration-700">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground/40 group-focus-within:text-foreground transition-colors" />
              <Input 
                placeholder="Search products..." 
                className="pl-16 h-16 md:h-20 rounded-2xl md:rounded-3xl bg-white border-none shadow-2xl focus-visible:ring-4 focus-visible:ring-primary/10 transition-all text-lg md:text-xl font-medium" 
                autoFocus 
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-primary/5 text-foreground/40 hover:text-foreground transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
