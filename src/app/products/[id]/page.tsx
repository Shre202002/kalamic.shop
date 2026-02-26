
"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  ShieldCheck, 
  Undo2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle2,
  Tag,
  Package,
  StarHalf,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getProductById, getProductBySlug, getFeaturedProducts } from '@/lib/actions/products';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  
  useEffect(() => {
    async function loadData() {
      try {
        const id = params.id as string;
        let data = await getProductById(id);
        if (!data) data = await getProductBySlug(id);
        
        if (data) {
          setProduct(data);
          const featured = await getFeaturedProducts();
          setRelatedProducts(featured.filter((p: any) => p._id !== data._id).slice(0, 4));
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to add items to your cart." });
      return;
    }

    const id = product._id || product.id;
    const cartItemRef = doc(firestore, 'users', user.uid, 'cart', 'cart', 'items', id);
    await setDoc(cartItemRef, {
      id,
      productVariantId: id,
      name: product.name,
      priceAtAddToCart: product.price,
      imageUrl: product.images?.[0] || `https://picsum.photos/seed/${id}/600/600`,
      quantity: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your shopping bag.`,
    });
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to save favorites." });
      return;
    }

    const id = product._id || product.id;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', 'wishlist', 'items', id);
    await setDoc(wishlistItemRef, {
      id,
      productId: id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0] || `https://picsum.photos/seed/${id}/600/600`,
      addedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Saved to wishlist",
      description: `${product.name} is now in your favorites.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Piece Not Found</h1>
          <p className="text-muted-foreground mb-8">The artisan treasure you're looking for might have been retired.</p>
          <Button onClick={() => router.push('/products')}>Back to Catalog</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [`https://picsum.photos/seed/${product.slug}/800/800`];
  const mockReviews = [
    { id: 1, user: "Amit K.", rating: 5, date: "2 days ago", comment: "The craftsmanship is absolute perfection. The patterns are so detailed!", avatar: "https://picsum.photos/seed/amit/50/50" },
    { id: 2, user: "Sneha R.", rating: 4, date: "1 week ago", comment: "Beautiful addition to my home. Packaged very safely.", avatar: "https://picsum.photos/seed/sneha/50/50" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-4 md:py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-primary">Collection</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* Left: Image Gallery (Span 5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24">
                <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-lg border border-primary/5">
                  <Image 
                    src={images[selectedImage]} 
                    alt={product.name} 
                    fill 
                    className="object-cover animate-fade-in" 
                    priority 
                  />
                  {product.compare_at_price && (
                    <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                      SALE
                    </Badge>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img: string, i: number) => (
                      <button 
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`relative min-w-[80px] h-[80px] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Product Info (Span 4) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-accent uppercase tracking-widest">{product.category || 'Handcrafted Ceramic'}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 py-1">
                  <div className="flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-100">
                    <span className="text-sm font-bold text-green-700 mr-1">{product.rating || '4.8'}</span>
                    <Star className="h-3 w-3 fill-green-700 text-green-700" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium underline underline-offset-4 cursor-pointer">
                    {product.reviews || '42'} Ratings & {mockReviews.length} Reviews
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">₹{(product.price).toFixed(2)}</span>
                  {product.compare_at_price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">₹{Number(product.compare_at_price).toFixed(2)}</span>
                      <span className="text-sm font-bold text-green-600">
                        {Math.round(((Number(product.compare_at_price) - product.price) / Number(product.compare_at_price)) * 100)}% off
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">inclusive of all taxes</p>
              </div>

              {/* Special Offers */}
              <div className="p-4 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2 text-accent font-bold text-sm">
                  <Tag className="h-4 w-4" /> Available Offers
                </div>
                <ul className="space-y-2 text-xs md:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><b>Bank Offer</b> 10% instant discount on Axis Bank Credit Cards.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span><b>Artisan Direct</b> Get 5% extra off on your first handcrafted order.</span>
                  </li>
                </ul>
              </div>

              {/* Highlights */}
              <div className="space-y-3">
                <h3 className="font-bold text-primary">Product Highlights</h3>
                <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary" /> Genuine Indian Ceramic</li>
                  <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary" /> Kiln-fired for durability</li>
                  <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary" /> Hand-painted heritage motifs</li>
                  <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-primary" /> Eco-friendly sustainable clay</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="font-bold text-primary">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Right: Buy Actions (Span 3) */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold">In Stock</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold">FAST SHIP</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={handleAddToCart}
                        className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20"
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Bag
                      </Button>
                      <Button 
                        onClick={() => router.push('/cart')}
                        variant="outline" 
                        className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-bold rounded-xl"
                      >
                        Buy Now
                      </Button>
                    </div>

                    <div className="pt-4 space-y-3 text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Truck className="h-4 w-4 text-accent" />
                        <span>Delivery by <b>Tuesday, Mar 4</b></span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-accent" />
                        <span>7 Days Replacement Policy</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Undo2 className="h-4 w-4 text-accent" />
                        <span>Authentic Artisan Product</span>
                      </div>
                    </div>

                    <Separator />
                    
                    <div className="flex items-center justify-center gap-4 pt-2">
                      <Button variant="ghost" size="sm" onClick={handleAddToWishlist} className="text-xs font-bold gap-2 rounded-full">
                        <Heart className="h-4 w-4" /> Save to Wishlist
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs font-bold gap-2 rounded-full">
                        <Share2 className="h-4 w-4" /> Share Piece
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Seller Info */}
                <div className="p-4 rounded-xl border bg-white flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">K</div>
                  <div>
                    <p className="text-xs font-bold">Sold by Kalamic Studio</p>
                    <p className="text-[10px] text-muted-foreground font-medium">4.9 ★ Rating over 1000+ sales</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Section: Specifications & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t">
            <div className="lg:col-span-2 space-y-12">
              
              {/* Specs Table */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-primary">Technical Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex justify-between border-b py-2">
                    <span className="text-sm font-bold text-muted-foreground">Material</span>
                    <span className="text-sm text-primary font-medium">Clay/Ceramic</span>
                  </div>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-sm font-bold text-muted-foreground">Firing Method</span>
                    <span className="text-sm text-primary font-medium">Kiln-fired (1200°C)</span>
                  </div>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-sm font-bold text-muted-foreground">Weight</span>
                    <span className="text-sm text-primary font-medium">850g</span>
                  </div>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-sm font-bold text-muted-foreground">Artisan Origin</span>
                    <span className="text-sm text-primary font-medium">Rajasthan, India</span>
                  </div>
                </div>
              </section>

              {/* Reviews Section */}
              <section className="space-y-8" id="reviews">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-primary">Customer Reviews</h2>
                  <Button variant="outline" size="sm" className="rounded-full">Write a Review</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Rating Summary */}
                  <div className="space-y-4">
                    <div className="text-center md:text-left">
                      <p className="text-5xl font-extrabold text-primary">{product.rating || '4.8'}</p>
                      <div className="flex justify-center md:justify-start gap-1 my-2">
                        {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                        <StarHalf className="h-4 w-4 fill-primary text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Based on 42 verified ratings</p>
                    </div>
                    <div className="space-y-2">
                      {[5,4,3,2,1].map(star => (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-2 font-bold">{star}</span>
                          <Star className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: star === 5 ? '80%' : star === 4 ? '15%' : '2%' }} />
                          </div>
                          <span className="w-8 text-right opacity-60">{star === 5 ? '80%' : star === 4 ? '15%' : '2%'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  <div className="md:col-span-2 space-y-6">
                    {mockReviews.map(review => (
                      <div key={review.id} className="p-6 rounded-2xl bg-white shadow-sm border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden">
                              <Image src={review.avatar} alt={review.user} fill className="object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{review.user}</p>
                              <div className="flex gap-0.5">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />)}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">"{review.comment}"</p>
                        <div className="flex items-center gap-4 pt-2">
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold gap-1 text-muted-foreground"><MessageSquare className="h-3 w-3" /> Helpful?</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-primary font-bold">View More Reviews</Button>
                  </div>
                </div>
              </section>
            </div>

            {/* Sticky Related Column */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-primary">Similar Treasures</h2>
              <div className="grid grid-cols-1 gap-6">
                {relatedProducts.map(related => (
                  <ProductCard 
                    key={related._id}
                    id={related._id}
                    slug={related.slug}
                    name={related.name}
                    price={related.price}
                    image={related.images?.[0] || 'https://placehold.co/200x200'}
                    rating={4.8}
                    category="Recommended"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
