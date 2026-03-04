
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import SurveyModal from '@/components/survey/SurveyModal';
import { getProductById } from '@/lib/actions/products';
import { Loader2, ArrowLeft, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductSurveyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getProductById(id as string);
        if (!data) {
          router.push('/survey');
          return;
        }
        setProduct(data);
      } catch (e) {
        router.push('/survey');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF4EB]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-primary font-bold uppercase tracking-widest text-[10px]">Identifying Artisan Piece...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF4EB]">
      <Navbar />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/survey" className="hover:text-primary transition-colors">Artisan Insights</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">{product.name}</span>
          </nav>

          {/* Product Header Card */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-primary/5 flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-3xl overflow-hidden shadow-inner flex-shrink-0 bg-muted">
              <Image 
                src={product.images?.[0]?.url || 'https://placehold.co/200x200?text=Kalamic'} 
                alt={product.name} 
                fill 
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 text-accent font-bold text-[9px] uppercase tracking-widest">
                <Package className="h-3 w-3" /> Product Context
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-semibold text-black leading-tight">
                Reviewing: {product.name}
              </h1>
              <p className="text-primary font-bold text-lg">₹{product.price.toLocaleString()}</p>
            </div>
            <Button variant="ghost" onClick={() => router.back()} className="rounded-2xl h-12 text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </div>

          {/* Inline Survey */}
          <SurveyModal 
            isOpen={true} 
            onClose={() => router.push(`/products/${product.slug || product._id}`)} 
            isSinglePage={true} 
            product={product} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
