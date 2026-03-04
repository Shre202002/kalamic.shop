
"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow, 
  Paper,
  Box as MuiBox,
  alpha as muiAlpha
} from '@mui/material';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  ShieldCheck, 
  Loader2, 
  ChevronRight,
  Zap,
  Package,
  MessageSquare,
  Lock,
  CheckCircle2,
  Box,
  Scale,
  MapPin,
  Maximize2,
  HelpCircle,
  Hammer,
  Camera,
  X,
  ArrowLeft
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
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailApi, setThumbnailApi] = useState<CarouselApi>();
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Use the canonical ID for Firestore references
  const productId = typeof params?.id === 'string' ? params.id : '';

  const wishlistDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !productId) return null;
    return doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', productId);
  }, [firestore, user, productId]);

  const { data: wishlistDoc } = useDoc(wishlistDocRef);
  const isFavorited = !!wishlistDoc;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!product?.images?.length || isSliderPaused) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % product.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [product, isSliderPaused]);

  async function loadData() {
    if (!productId) return;
    try {
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
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
      cartId: user.uid,
      name: product.name,
      priceAtAddToCart: product.price ?? 0,
      imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
      quantity: 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    trackProductAction(id, 'cart_add_count');
    toast({ title: "Added to cart", description: `${product.name} has been added to your bag.` });
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (user) router.push('/checkout');
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

  const handleShare = async () => {
    if (!product) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: window.location.href,
        });
        trackProductAction(product._id, 'share_count');
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "You can now paste it anywhere." });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewFiles.length > 3) {
      toast({ variant: "destructive", title: "Limit Exceeded", description: "You can upload a maximum of 3 photos." });
      return;
    }
    const newFiles = [...reviewFiles, ...files];
    setReviewFiles(newFiles);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setReviewPreviews([...reviewPreviews, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...reviewFiles];
    newFiles.splice(index, 1);
    setReviewFiles(newFiles);
    const newPreviews = [...reviewPreviews];
    newPreviews.splice(index, 1);
    setReviewPreviews(newPreviews);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const uploadedImages = [];
      for (const file of reviewFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', '/kalamic/reviews');
        const result = await uploadToImageKit(formData);
        uploadedImages.push({ url: result.url, alt: `Collector photo of ${product.name}` });
      }

      const response = await submitReview({
        productId: product._id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Collector",
        userAvatar: user.photoURL || undefined,
        rating: reviewRating,
        reviewText: reviewComment,
        images: uploadedImages
      });
      
      if (response.success) {
        setReviewComment('');
        setReviewFiles([]);
        setReviewPreviews([]);
        setReviewRating(5);
        await loadData();
        router.refresh();
        toast({ title: "Feedback Saved", description: "Your experience has been immortalized in our archive." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /><p className="mt-4 text-primary font-bold uppercase tracking-widest text-[10px]">Curation in Progress...</p></div>;
  if (!product) return <div className="p-20 text-center bg-background min-h-screen flex flex-col items-center justify-center"><h1 className="text-3xl font-display font-semibold text-foreground mb-6">Piece Not Found</h1><Button asChild className="rounded-2xl h-12 px-8 font-body"><Link href="/products">Return to Shop</Link></Button></div>;

  const galleryImages = [...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl pt-6 md:pt-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Collection
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7 space-y-6 lg:sticky lg:top-28 self-start"
            >
              <div 
                className="relative aspect-square rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl bg-white border-2 sm:border-4 border-white group"
                onMouseEnter={() => setIsSliderPaused(true)}
                onMouseLeave={() => setIsSliderPaused(false)}
              >
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-zoom-in",
                      activeImageIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}
                    onClick={() => { setLightboxImage(img.url); setIsLightboxOpen(true); }}
                  >
                    <Image 
                      src={img.url} 
                      alt={img.alt || product.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      priority={idx === 0}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-20 flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 drop-shadow-xl" />
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {galleryImages.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={cn("h-1.5 rounded-full transition-all", activeImageIndex === idx ? "w-8 bg-primary shadow-lg" : "w-2 bg-white/50 hover:bg-white")} />
                  ))}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="px-4">
                  <Carousel setApi={setThumbnailApi} opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                      {galleryImages.map((img, idx) => (
                        <CarouselItem key={idx} className="pl-4 basis-1/4 sm:basis-1/5 md:basis-1/6">
                          <div className={cn("relative aspect-square rounded-2xl overflow-hidden border-2 shadow-md cursor-pointer transition-all", activeImageIndex === idx ? "border-primary scale-90 ring-4 ring-primary/10" : "border-white hover:border-primary/30")} onClick={() => setActiveImageIndex(idx)}>
                            <Image 
                              src={img.url} 
                              alt={img.alt || `Angle ${idx + 1}`} 
                              fill 
                              className="object-cover" 
                              sizes="(max-width: 768px) 25vw, 15vw"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 space-y-8 sm:space-y-10"
            >
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-foreground tracking-tight leading-[1.05]">{product.name}</h1>
                <div className="flex items-baseline gap-5 py-4">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tighter">₹{product.price.toLocaleString()}</span>
                  {product.compare_at_price && (
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-lg text-muted-foreground line-through decoration-primary/30 opacity-40">₹{product.compare_at_price.toLocaleString()}</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Heritage Pricing</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden shadow-sm">
                  {(product.specifications || []).slice(0, 3).map((spec: any, i: number) => (
                    <div key={i} className="bg-white p-4 flex flex-col gap-1 h-full">
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{spec.key}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-primary leading-tight">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 gap-4"
                >
                  <Button 
                    size="lg"
                    onClick={handleBuyNow} 
                    className="w-full h-16 md:h-20 rounded-2xl gradient-saffron text-primary-foreground font-bold text-lg px-10 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <ShoppingCart className="mr-3 h-6 w-6" />
                    Buy Now
                  </Button>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-14 md:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-primary/20 text-primary font-black text-sm"><Link href={`https://wa.me/916387562920?text=Hi, I am interested in ${encodeURIComponent(product.name)}`} target="_blank">Enquire Now</Link></Button>
                  <Button onClick={handleShare} variant="outline" className="h-14 md:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-border text-muted-foreground font-black text-sm">Share Piece</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary/60" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Secure SSL</p>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <MapPin className="h-5 w-5 text-primary/60" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pan India</p>
                </div>
                <button onClick={handleAddToWishlist} className="flex flex-col items-center text-center gap-2 group outline-none">
                  <div className={cn("h-10 w-10 rounded-full transition-all flex items-center justify-center", isFavorited ? "bg-primary/10 text-primary" : "bg-muted text-primary/60 group-hover:bg-primary/5")}>
                    <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">{isFavorited ? "In Wishlist" : "Wishlist"}</p>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Details Section */}
          <section className="mb-32">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
              <div className="w-full lg:w-1/3 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">Behind the Craft</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">The technical precision behind our artistry ensures longevity for generations to come.</p>
              </div>
              <div className="flex-1">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-8 overflow-x-auto overflow-y-hidden scrollbar-none whitespace-nowrap flex-nowrap">
                    <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 sm:px-10 py-4 font-black uppercase tracking-widest text-[10px] sm:text-xs">Description</TabsTrigger>
                    <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 sm:px-10 py-4 font-black uppercase tracking-widest text-[10px] sm:text-xs">Specifications</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="animate-in fade-in duration-500">
                    <div className="prose prose-stone max-w-none">
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="specs" className="animate-in fade-in duration-500">
                    <TableContainer component={Paper} elevation={0} className="rounded-[2rem] border border-primary/10 overflow-hidden bg-white/50 backdrop-blur-sm">
                      <Table>
                        <TableBody>
                          {(product.specifications || []).map((spec: any, i: number) => (
                            <TableRow 
                              key={i} 
                              className="hover:bg-primary/[0.02] transition-colors"
                              sx={{ 
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:nth-of-type(odd)': { bgcolor: muiAlpha('#C97A40', 0.01) }
                              }}
                            >
                              <TableCell className="border-primary/5 py-5 sm:py-6">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                                  {spec.key}
                                </span>
                              </TableCell>
                              <TableCell align="right" className="border-primary/5 py-5 sm:py-6">
                                <span className="text-xs sm:text-sm font-bold text-primary">
                                  {spec.value}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="mb-32">
            <div className="text-center space-y-4 mb-16 px-4">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-semibold text-foreground tracking-tight">FragileCare™ Shipping</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">Expert Logistics for Handcrafted Masterpieces</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white shadow-xl border border-border space-y-4 transition-all hover:border-primary/20">
                <Scale className="h-6 w-6 text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Weight Metrics</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">Artisan weight verified at {product.shipping?.weight_kg || '1.2'} KG.</p>
              </div>
              <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white shadow-xl border border-border space-y-4 transition-all hover:border-primary/20">
                <Box className="h-6 w-6 text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Package Profile</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">Dimensions: {product.shipping?.package_dimensions_cm?.length || '30'}x{product.shipping?.package_dimensions_cm?.width || '30'}x{product.shipping?.package_dimensions_cm?.height || '15'} CM.</p>
              </div>
              <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-primary text-white shadow-xl space-y-4 md:col-span-2 lg:col-span-1">
                <Truck className="h-6 w-6" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">FragileCare™ Priority</h4>
                <p className="text-sm opacity-80 leading-relaxed text-white font-medium">Every ceramic treasure is encased in reinforced honeycomb padding and insured transit.</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          {product.faqs?.length > 0 && (
            <section className="mb-32">
              <div className="max-w-4xl mx-auto px-4">
                <div className="text-center space-y-4 mb-16">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-semibold text-foreground">Curiosity Corner</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Artisanal FAQ & Preservation</p>
                </div>
                <Accordion type="single" collapsible className="space-y-4">
                  {product.faqs.map((faq: any, i: number) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-white overflow-hidden data-[state=open]:border-primary/30 transition-all shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <span className="text-left font-black text-foreground text-sm sm:text-base">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 text-muted-foreground leading-relaxed text-sm font-medium">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mb-32">
            <div className="text-center space-y-4 mb-16 px-4">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-semibold text-foreground tracking-tight">Collector Experiences</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Authentic feedback from the Kalamic Community</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4 space-y-8">
                <div className="p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] bg-white shadow-xl border border-border sticky top-28">
                  <h3 className="text-lg sm:text-xl font-black text-foreground mb-8 flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-accent" /> Collector Verdict
                  </h3>
                  <div className="flex items-center gap-6 mb-10">
                    <p className="text-5xl sm:text-6xl md:text-7xl font-black text-foreground tracking-tighter">{product.analytics?.average_rating || 4.8}</p>
                    <div>
                      <div className="flex gap-1 text-primary mb-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={cn("h-4 w-4", i <= Math.floor(product.analytics?.average_rating || 5) ? "fill-current" : "opacity-20")} />)}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Community Trust Score</p>
                    </div>
                  </div>
                  
                  {user ? (
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Artisan Rating</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setReviewRating(star)} className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm", reviewRating >= star ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                              <Star className={cn("h-5 w-5", reviewRating >= star && "fill-current")} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Collector Feedback</Label>
                        <textarea required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Describe the texture, the intricate patterns..." className="w-full h-32 p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm font-medium resize-none shadow-inner" />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Artisan Photos (Max 3)</Label>
                        <div className="flex flex-wrap gap-2">
                          {reviewPreviews.map((preview, i) => (
                            <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group">
                              <img src={preview} className="h-full w-full object-cover" />
                              <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                            </div>
                          ))}
                          {reviewPreviews.length < 3 && (
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-primary/40 hover:bg-primary/5 transition-all">
                              <Camera className="h-6 w-6" />
                              <span className="text-[8px] font-black uppercase mt-1">Upload</span>
                            </button>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                      </div>

                      <Button type="submit" disabled={isSubmittingReview} className="w-full h-14 rounded-2xl bg-primary text-white font-black shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest">
                        {isSubmittingReview ? <Loader2 className="animate-spin h-5 w-5" /> : "Post Experience"}
                      </Button>
                    </form>
                  ) : (
                    <div className="p-8 rounded-[2rem] bg-muted/50 border border-dashed border-border text-center space-y-6">
                      <Lock className="mx-auto h-8 w-8 text-primary opacity-20" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase leading-relaxed tracking-widest">Sign in to share your experience.</p>
                      <Button asChild variant="outline" className="w-full rounded-2xl border-primary text-primary font-black text-xs h-12 hover:bg-primary hover:text-white transition-all"><Link href="/auth/login">Join the Community</Link></Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="p-8 rounded-[2.5rem] sm:rounded-[3rem] bg-white shadow-sm border border-border space-y-6 transition-all hover:shadow-xl group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black overflow-hidden shadow-inner text-sm uppercase">
                              {review.user_avatar ? <img src={review.user_avatar} className="h-full w-full object-cover" /> : review.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground flex items-center gap-2">
                                {review.user_name || 'Collector'}
                                {review.is_verified_purchase && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{dayjs(review.createdAt).format('DD MMM YYYY')}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 text-primary">
                            {[...Array(5)].map((_, i) => <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-current" : "opacity-20")} />)}
                          </div>
                        </div>
                        
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                          "{review.comment || review.review_text}"
                        </p>

                        {review.review_images?.length > 0 && (
                          <div className={cn("grid gap-2", review.review_images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                            {review.review_images.map((img: any, i: number) => (
                              <div key={i} className="relative aspect-video rounded-2xl overflow-hidden cursor-zoom-in border border-border/50 group/img" onClick={() => { setLightboxImage(img.url); setIsLightboxOpen(true); }}>
                                <Image 
                                  src={img.url} 
                                  alt={img.alt || 'Review photo'} 
                                  fill 
                                  className="object-cover transition-transform duration-500 group-hover/img:scale-110" 
                                  sizes="(max-width: 768px) 100vw, 400px"
                                />
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[3rem] sm:rounded-[4rem] border border-dashed border-border shadow-inner">
                    <MessageSquare className="mx-auto h-16 w-16 text-primary opacity-10 mb-6" />
                    <p className="text-xl sm:text-2xl font-display font-semibold text-foreground/60">Be the first to share your verdict</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
