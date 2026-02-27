"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronRight, Package, LogOut, Settings, CreditCard, LayoutDashboard } from 'lucide-react';
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
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    async function fetchRole() {
      if (user) {
        if (user.email === 'sriyanshgupta24@gmail.com') {
          setUserRole('super_admin');
        }
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
    { name: 'Collection', href: '/products' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleSignOut = () => auth.signOut();
  const isAdmin = ['super_admin', 'admin', 'support'].includes(userRole);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isScrolled ? "bg-white/90 backdrop-blur-lg shadow-sm h-16 border-b" : "bg-transparent h-20"
    )}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle className="text-2xl font-display font-bold text-primary">Kalamic</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 font-body">
                <Link href="/" className="flex items-center justify-between p-4 text-lg font-medium border-b hover:text-primary transition-colors">Home</Link>
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

        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl md:text-3xl font-display font-black text-primary tracking-tighter group-hover:scale-105 transition-transform">Kalamic</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 font-body">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:text-primary opacity-60 hover:opacity-100"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden sm:flex hover:bg-primary/5 text-primary"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-primary/5 text-primary">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 text-primary">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground border-2 border-white text-[10px] font-body font-black border-none">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 p-0.5 border-2 border-transparent focus-visible:ring-accent">
                  <Avatar className="h-8 w-8 border shadow-sm">
                    <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-body font-bold text-xs">
                      {user.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-primary/10 font-body">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none text-primary">{user.displayName || 'Artisan Collector'}</p>
                    <p className="text-[10px] font-medium leading-none text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-primary/5 focus:text-primary">
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-3 h-4 w-4 opacity-70" />
                      <span className="text-sm font-semibold">My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-primary/5 focus:text-primary">
                    <Link href="/orders" className="flex items-center w-full">
                      <Package className="mr-3 h-4 w-4 opacity-70" />
                      <span className="text-sm font-semibold">Order History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-primary/5 focus:text-primary">
                    <Link href="/wishlist" className="flex items-center w-full">
                      <Heart className="mr-3 h-4 w-4 opacity-70" />
                      <span className="text-sm font-semibold">Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="opacity-50" />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-primary/5 focus:text-primary">
                        <Link href="/admin/dashboard" className="flex items-center w-full">
                          <LayoutDashboard className="mr-3 h-4 w-4 opacity-70 text-accent" />
                          <span className="text-sm font-bold text-accent">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
                
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-xl cursor-pointer p-3 text-destructive focus:bg-destructive/10 focus:text-destructive font-bold">
                  <LogOut className="mr-3 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button className="hidden sm:flex bg-primary text-white font-body font-black h-10 px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs">
                Sign In
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden text-primary">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="absolute top-16 left-0 w-full p-6 bg-white border-b animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl font-body">
          <div className="container mx-auto flex gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search the collection..." 
                className="pl-14 h-14 rounded-2xl bg-muted/20 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-accent transition-all text-lg font-medium" 
                autoFocus 
              />
            </div>
            <Button variant="ghost" onClick={() => setIsSearchOpen(false)} className="h-14 px-6 font-bold text-muted-foreground hover:text-primary">Cancel</Button>
          </div>
        </div>
      )}
    </header>
  );
}
