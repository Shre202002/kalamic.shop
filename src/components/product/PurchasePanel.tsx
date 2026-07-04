'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  MessageCircle, 
  Flag,
  Info,
  Clock,
  Truck,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PurchasePanelProps {
  product: any;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function PurchasePanel({ product, onAddToCart, onBuyNow }: PurchasePanelProps) {
  return (
    <div className="space-y-8">
      {/* Category & Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary">
            {product.is_featured ? 'Bestseller' : 'Limited Batch'}
          </Badge>
          <div className="flex items-center gap-1 text-amber-500">
            <CheckCircle2 size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Handcrafted in Kanpur</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight leading-[1.1]">
          {product.name}
        </h1>
        <p className="text-lg text-muted-foreground font-medium italic leading-relaxed">
          {product.short_description}
        </p>
      </div>

      {/* Pricing */}
      <div className="flex items-baseline gap-4">
        <span className="text-5xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</span>
        {product.compare_at_price && (
          <div className="flex items-center gap-2">
            <span className="text-xl text-muted-foreground line-through font-medium">₹{product.compare_at_price.toLocaleString()}</span>
            <Badge className="bg-accent text-foreground border-none text-[10px] font-black px-2 py-0.5">
              SAVE {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Trust Badge Callout */}
      <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-foreground">FragileCare™ Protection</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
              Every creation is shipped in reinforced double-walled packaging. We've got you covered for any transit breakage.
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={onAddToCart}
            className="h-16 rounded-2xl bg-white border-2 border-primary text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 transition-all shadow-lg active:scale-95"
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Bag
          </Button>
          <Button 
            onClick={onBuyNow}
            className="h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <Zap className="mr-2 h-4 w-4" /> Buy Now
          </Button>
        </div>
        
        <Button 
          asChild
          className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-green-500/10"
        >
          <a href={`https://wa.me/916387562920?text=I'm interested in the ${product.name}. Could you share more details?`} target="_blank">
            <MessageCircle size={18} /> Chat with the Studio
          </a>
        </Button>
      </div>

      {/* Stock & Delivery Info */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>In Stock · Ships in 2 days</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-primary" />
            <span>Free Pan-India Delivery</span>
          </div>
        </div>
        
        {/* Support Callout */}
        <div className="p-5 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center text-primary shadow-sm">
                <Info size={14} />
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground">First Time Buyer?</p>
                <p className="text-[9px] text-muted-foreground font-medium">Authenticity guaranteed with every piece.</p>
             </div>
          </div>
          <a href="tel:+916387562920" className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
             <Phone size={10} /> Call Support
          </a>
        </div>
      </div>

      {/* Feature Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
        {[
          { label: 'Made in India', icon: Flag },
          { label: 'Lead-Free Glaze', icon: CheckCircle2 },
          { label: 'Safe Delivery', icon: ShieldCheck },
          { label: 'Secure UPI', icon: Clock },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary/40 shadow-sm">
              <item.icon size={16} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
