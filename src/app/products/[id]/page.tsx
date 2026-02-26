
"use client"

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Heart, Share2, Star, Truck, ShieldCheck, Undo2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

const MOCK_PRODUCTS = [
  {
    _id: "699026a8ae873e1fa69cb18a",
    slug: "mor_stambh",
    name: "Mor Stambh Ceramic Customized Pillar",
    price: 1499,
    stock: 5,
    category: "Home Decor",
    description: "Bahut sundar handmade ceramic pillar jo Bhagwan ke Jhula ke liye perfect hai. Crafted with intricate details and vibrant colors to add a spiritual touch to your home.",
    rating: 4.9,
    reviews: 24,
  },
  {
    _id: "699026a8ae873e1fa69cb18b",
    slug: "mirror",
    name: "Handmade Ceramic Mirror",
    price: 999,
    compare_at_price: 2599,
    stock: 5,
    category: "Home Decor",
    description: "Elegant aur stylish handmade ceramic mirror with beautiful Indian motifs. This piece serves as both a functional mirror and a stunning wall art decor.",
    rating: 4.8,
    reviews: 18,
  },
  {
    _id: "699026a8ae873e1fa69cb18c",
    slug: "peacock_embrace_frame",
    name: "Customized Ceramic Photo Frame",
    price: 699,
    stock: 13,
    category: "Gifts",
    description: "Personalized ceramic photo frame with lovely cultural designs – apni photos ko ek traditional look dein. Perfect for gifting on anniversaries or housewarming parties.",
    rating: 4.7,
    reviews: 42,
  },
  {
    _id: "699026a8ae873e1fa69cb18d",
    slug: "ceramic_fridge_magnet",
    name: "Handmade Ceramic Fridge Magnet – Indian Floral Motif",
    price: 299,
    stock: 5,
    category: "Accessories",
    description: "Cute set of handmade ceramic fridge magnets with traditional Indian floral patterns. A small touch of art for your kitchen space.",
    rating: 4.5,
    reviews: 56,
  },
  {
    _id: "699026a8ae873e1fa69cb18e",
    slug: "mandala_wheel",
    name: "Handmade Ceramic Mandala Wheel",
    price: 2499,
    compare_at_price: 4999,
    stock: 5,
    category: "Home Decor",
    description: "Stunning handmade ceramic mandala wheel in golden finish – peacocks (mor) designs highlight the spiritual significance of the mandala pattern.",
    rating: 5.0,
    reviews: 12,
  }
];

export default function ProductDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  
  const product = useMemo(() => {
    return MOCK_PRODUCTS.find(p => p._id === params.id || p.slug === params.id);
  }, [params.id]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-primary">Product Not Found</h1>
            <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
            <Button asChild><a href="/">Back to Home</a></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const productImage = PlaceHolderImages.find(i => i.id === product._id)?.imageUrl || "https://picsum.photos/seed/placeholder/800/800";

  const handleAddToCart = () => {
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your shopping bag.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-xl border border-primary/5">
                <Image 
                  src={productImage} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-accent transition-all">
                    <Image 
                      src={`https://picsum.photos/seed/${product.slug}-${i}/400/400`} 
                      alt={`${product.name} view ${i}`} 
                      fill 
                      className="object-cover opacity-60 hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                    {product.category}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="text-sm font-bold ml-1">{product.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({product.reviews} customer reviews)</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
                  {product.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through">₹{Number(product.compare_at_price).toFixed(2)}</span>
                  )}
                  {product.compare_at_price && (
                    <Badge variant="destructive" className="ml-2">
                      {Math.round(((Number(product.compare_at_price) - product.price) / Number(product.compare_at_price)) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-destructive'}`}></div>
                    <span className="text-sm font-semibold">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Only {product.stock} pieces remaining!</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="flex-1 h-14 bg-primary text-white hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-primary border-primary">
                  Buy Now
                </Button>
              </div>

              {/* Service Features */}
              <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-5 w-5 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Safe Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Undo2 className="h-5 w-5 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Artisan Crafted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
