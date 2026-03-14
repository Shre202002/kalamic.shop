
"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Paper,
  alpha as muiAlpha
} from '@mui/material';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  ShieldCheck, 
  Loader2, 
  Maximize2,
  ArrowLeft,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, trackProductAction, untrackWishlistAction, incrementProductViews } from '@/lib/actions/products';
import { getProductReviews, submitReview } from '@/lib/actions/reviews';
import { uploadToImageKit } from '@/lib/actions/upload-actions';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Guard to prevent compilation loop during revalidation
  const hasInitialized = useRef<string | null>(null);

  const productId = typeof params?.id === 'string' ? params.id : '';

  const wishlistDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !productId) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
  }, [firestore, user, productId]);

  const { data: wishlistDoc } = useDoc(wishlistDocRef);
  const isFavorited = !!wishlistDoc;

  async function loadData() {
    if (!productId || hasInitialized.current === productId) return;
    
    try {
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
        hasInitialized.current = data._id;
        
        // Single-fire tracking
        incrementProductViews(data._id);

        const reviewData = await getProductReviews(data._id);
        setReviews(reviewData);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!user || !firestore || !product) {
      toast({ title: "Please sign in", description: "You need an account to add items to your cart." });
      router.push('/auth/login');
      return;
    }
    const id = product._id;
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      name: product.name,
      priceAtAddToCart: product.price ?? 0,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    trackProductAction(id, 'cart_add_count');
    toast({ title: "Added to cart", description: `${product.name} added to bag.` });
  };

  const handleAddToWishlist = async () => {
    if (!user || !firestore || !product) {
      toast({ title: "Please sign in", description: "You need an account to save pieces." });
      return;
    }
    const id = product._id;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    try {
      if (isFavorited) {
        await deleteDoc(wishlistItemRef);
        await untrackWishlistAction(id);
        toast({ title: "Removed from favorites" });
      } else {
        await setDoc(wishlistItemRef, {
          id,
          productId: id,
          name: product.name,
          price: product.price ?? 0,
          imageUrl: product.images?.[0]?.url,
          addedAt: new Date().toISOString()
        });
        await trackProductAction(id, 'wishlist_count');
        toast({ title: "Saved to wishlist" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (!product) return <div className="p-20 text-center"><h1 className="text-2xl font-bold mb-4">Piece Not Found</h1><Button asChild><Link href="/products">Back to Shop</Link></Button></div>;

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl pt-12">
          <Link href="/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-3 w-3" /> Back to Collection
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-7 space-y-6">
              <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-white border-4 border-white group">
                <Image 
                  src={galleryImages[activeImageIndex]?.url} 
                  alt={product.name} 
                  fill 
                  className="object-cover cursor-zoom-in" 
                  onClick={() => { setLightboxImage(galleryImages[activeImageIndex].url); setIsLightboxOpen(true); }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10" />
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4">
                {galleryImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative h-20 w-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all",
                      activeImageIndex === idx ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={img.url} alt={`Angle ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-display font-semibold text-foreground tracking-tight">{product.name}</h1>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-black text-primary">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through opacity-40">₹{product.compare_at_price.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
              </div>

              <div className="flex flex-col gap-4">
                <Button size="lg" onClick={handleAddToCart} className="h-16 rounded-2xl gradient-saffron text-white font-bold text-lg shadow-xl">
                  <ShoppingCart className="mr-3 h-6 w-6" /> Add to Bag
                </Button>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleAddToWishlist} variant="outline" className={cn("h-14 rounded-2xl", isFavorited && "bg-primary/5 text-primary")}>
                    <Heart className={cn("mr-2 h-5 w-5", isFavorited && "fill-current")} /> {isFavorited ? "Saved" : "Save for later"}
                  </Button>
                  <Button variant="outline" className="h-14 rounded-2xl" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link Copied" });
                  }}>
                    <Share2 className="mr-2 h-5 w-5" /> Share
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t">
                <div className="text-center space-y-1">
                  <ShieldCheck className="h-5 w-5 mx-auto text-primary/60" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Certified</p>
                </div>
                <div className="text-center space-y-1">
                  <Star className="h-5 w-5 mx-auto text-primary/60" />
                  <p className="text-[9px] font-black uppercase text-muted-foreground">High Rated</p>
                </div>
                <div className="text-center space-y-1">
                  <Badge variant="outline" className="text-[8px] font-black uppercase">Handmade</Badge>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="description" className="mb-20">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start p-0 h-auto mb-8">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-8 py-4 font-black uppercase text-[10px]">Description</TabsTrigger>
              <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-8 py-4 font-black uppercase text-[10px]">Specifications</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="prose prose-stone max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </TabsContent>
            <TabsContent value="specs">
              <TableContainer component={Paper} elevation={0} className="rounded-3xl border border-primary/10 overflow-hidden">
                <Table>
                  <TableBody>
                    {(product.specifications || []).map((spec: any, i: number) => (
                      <TableRow key={i} sx={{ '&:nth-of-type(odd)': { bgcolor: muiAlpha('#C97A40', 0.02) } }}>
                        <TableCell className="font-black uppercase text-[10px] text-muted-foreground">{spec.key}</TableCell>
                        <TableCell align="right" className="font-bold text-primary">{spec.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {isLightboxOpen && lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
              <X className="h-10 w-10" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-square"
              onClick={e => e.stopPropagation()}
            >
              <Image src={lightboxImage} alt="Fullscreen" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
