'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackProductAction, incrementProductViews } from '@/lib/actions/products';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { ImageGallery } from '@/components/product/ImageGallery';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { SpecificationsSection } from '@/components/product/SpecificationsSection';
import { WhatsInTheBox } from '@/components/product/WhatsInTheBox';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';

interface ProductDetailClientProps {
  initialProduct: any;
  initialReviews: any[];
  relatedProducts: any[];
  isEligible: boolean;
}

export default function ProductDetailClient({ 
  initialProduct: product, 
  initialReviews: reviews, 
  relatedProducts,
  isEligible
}: ProductDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  useEffect(() => {
    incrementProductViews(product._id);
  }, [product._id]);

  const handleAddToCart = async () => {
    if (!user || !firestore) {
      router.push('/auth/login');
      return;
    }
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', product._id);
    await setDoc(cartItemRef, {
      id: product._id,
      productVariantId: product._id,
      name: product.name,
      priceAtAddToCart: product.price,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      requiresHandling: product.requiresHandling ?? true,
      requiresPremiumProtection: product.requiresPremiumProtection ?? true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    trackProductAction(product._id, 'cart_add_count');
    toast({ title: "Added to Bag", description: "This treasure is now in your collection." });
  };

  const handleBuyNow = async () => {
    if (!user || !firestore) {
      router.push('/auth/login');
      return;
    }
    await handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFAF6]">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-6 max-w-7xl pt-20 md:pt-24 pb-20">
          
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link href="/products" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-all">
              <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> 
              Back to Catalog
            </Link>
          </nav>

          {/* TWO-COLUMN STICKY SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start mb-24">
            
            {/* LEFT COLUMN: Sticky Image Gallery */}
            <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-20 h-fit">
              <div className="space-y-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent pl-1">
                  Collection: {product.category_id?.name || 'Handcrafted Art'}
                </span>
                <ImageGallery images={product.images} productName={product.name} />
              </div>
            </div>

            {/* RIGHT COLUMN: Scrolling Details */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-24">
              {/* i. Purchase Panel */}
              <PurchasePanel 
                product={product} 
                onAddToCart={handleAddToCart} 
                onBuyNow={handleBuyNow} 
              />

              {/* ii. Cross-sell Banner */}
              <div className="p-8 rounded-[2.5rem] bg-accent/10 border border-accent/20 space-y-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 h-32 w-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                 <div className="relative z-10 space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                       🎁 Complete the Set
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                       Collecting our artisan dinnerware? This piece has matching serving bowls from the same kiln firing — available as a limited edition bundle.
                    </p>
                    <div className="flex gap-4">
                       <Link href="/products" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Explore Bundles</Link>
                    </div>
                 </div>
              </div>

              {/* iii. Specifications */}
              <SpecificationsSection product={product} />

              {/* iv. What's in the Box */}
              <WhatsInTheBox productName={product.name} />
            </div>
          </div>

          {/* FULL-WIDTH LOWER SECTIONS */}
          <div className="space-y-32">
            {/* Related Products */}
            <RelatedProducts products={relatedProducts} />

            {/* Customer Reviews */}
            <ReviewsSection 
              productId={product._id} 
              reviews={reviews} 
              user={user} 
              isEligible={isEligible} 
            />
          </div>
        </div>
      </main>

      {/* STICKY PAGE-LEVEL WHATSAPP */}
      <div className="fixed bottom-10 right-10 z-[60] group">
         <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-2xl border border-border whitespace-nowrap">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest">Inquiry for {product.name}?</p>
            </div>
         </div>
         <a 
          href={`https://wa.me/917376761679?text=I'm inquiring about the ${product.name}. Reference: ${product.sku || product.slug}`}
          target="_blank"
          className="h-16 w-16 rounded-full bg-[#25D366] shadow-2xl flex items-center justify-center text-white hover:scale-110 hover:shadow-green-500/20 transition-all active:scale-95"
         >
           <MessageCircle size={32} />
         </a>
      </div>

      <Footer />
    </div>
  );
}
