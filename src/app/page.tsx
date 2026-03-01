
"use client"

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/lib/actions/products';
import { ChevronRight, ChevronLeft, CheckCircle2, RefreshCcw, Loader2 } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'category',
    question: "What are you looking to enhance today?",
    description: "Tell us where you want to add a touch of handcrafted ceramic art.",
    options: [
      { label: "Spiritual Space", value: "spiritual", icon: "🕉️" },
      { label: "Wall Decor", value: "wall", icon: "🖼️" },
      { label: "Gifting Someone", value: "gift", icon: "🎁" },
      { label: "Small Accents", value: "accent", icon: "🐚" }
    ]
  },
  {
    id: 'vibe',
    question: "Which pattern style speaks to you?",
    description: "Our artisans specialize in traditional Indian motifs.",
    options: [
      { label: "Peacock (Mor) Motifs", value: "mor", icon: "🦚" },
      { label: "Mandala Patterns", value: "mandala", icon: "🌀" },
      { label: "Floral Designs", value: "floral", icon: "🌸" }
    ]
  }
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    async function preload() {
      try {
        const data = await getProducts();
        setAllProducts(data);
      } finally {
        setIsDataLoading(false);
      }
    }
    preload();
  }, []);

  const progress = ((step) / QUESTIONS.length) * 100;

  const handleOptionSelect = (value: string) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: value };
    setAnswers(newAnswers);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      generateRecommendations(newAnswers);
    }
  };

  const generateRecommendations = (finalAnswers: Record<string, string>) => {
    let filtered = [...allProducts];
    
    if (finalAnswers.vibe === 'mor') {
      filtered = allProducts.filter(p => p.name.toLowerCase().includes('mor') || p.slug.includes('mor'));
    } else if (finalAnswers.vibe === 'mandala') {
      filtered = allProducts.filter(p => p.name.toLowerCase().includes('mandala') || p.slug.includes('mandala'));
    }

    if (filtered.length === 0) filtered = allProducts.slice(0, 4);
    
    setRecommendedProducts(filtered.slice(0, 4));
    setShowResults(true);
  };

  const resetSurvey = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  };

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Curation in Progress...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {!showResults ? (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-primary">Discovery Step {step + 1} of {QUESTIONS.length}</span>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-primary leading-tight tracking-tight">{QUESTIONS[step].question}</h1>
                  <p className="text-sm md:text-base text-muted-foreground font-medium">{QUESTIONS[step].description}</p>
                </div>
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-muted-foreground font-bold text-xs uppercase tracking-widest hover:text-primary">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                )}
              </div>
              <Progress value={progress} className="h-1.5 bg-muted" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUESTIONS[step].options.map((option) => (
                <Card 
                  key={option.value} 
                  className={`group cursor-pointer transition-all duration-500 border-2 rounded-[1.5rem] hover:shadow-2xl hover:shadow-primary/5 ${answers[QUESTIONS[step].id] === option.value ? 'border-primary bg-primary/[0.03] scale-[1.02]' : 'border-border bg-white'}`}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-primary text-base md:text-lg">{option.label}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${answers[QUESTIONS[step].id] === option.value ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl animate-in fade-in zoom-in-95 duration-700 py-8 px-4">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3" /> Artisan Discovery Complete
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-semibold text-primary tracking-tighter">Your Handcrafted Matches</h1>
              <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Based on your preference for <span className="text-primary font-bold underline decoration-primary/20 underline-offset-4">{QUESTIONS[0].options.find(o => o.value === answers.category)?.label.toLowerCase()}</span>, we've curated these perfect pieces.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {recommendedProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  id={product._id} 
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.compare_at_price ? Number(product.compare_at_price) : undefined}
                  image={product.images?.[0] || 'https://placehold.co/600x600?text=No+Image'}
                  rating={product.analytics?.average_rating || 4.8}
                  tag="Recommended"
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-6 pt-12 border-t border-primary/10">
              <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest opacity-60">Want to explore a different style?</p>
              <Button variant="outline" size="lg" onClick={resetSurvey} className="border-primary text-primary hover:bg-primary/5 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/5 transition-all active:scale-95">
                <RefreshCcw className="mr-2 h-4 w-4" /> Restart Discovery Journey
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
