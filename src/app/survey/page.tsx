
"use client"

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronRight, ChevronLeft, CheckCircle2, RefreshCcw } from 'lucide-react';

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
      { label: "Peacock (Mor) Motifs", value: "peacock", icon: "🦚" },
      { label: "Mandala Patterns", value: "mandala", icon: "🌀" },
      { label: "Floral Designs", value: "floral", icon: "🌸" }
    ]
  }
];

export default function SurveyPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

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
    const products = [
      { id: '699026a8ae873e1fa69cb18a', name: 'Mor Stambh Ceramic Customized Pillar', price: 1499, image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18a')?.imageUrl || '', rating: 4.9, category: 'Home Decor', badge: 'Best Match' },
      { id: '699026a8ae873e1fa69cb18b', name: 'Handmade Ceramic Mirror', price: 999, image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18b')?.imageUrl || '', rating: 4.8, category: 'Home Decor' },
      { id: '699026a8ae873e1fa69cb18c', name: 'Customized Ceramic Photo Frame', price: 699, image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18c')?.imageUrl || '', rating: 4.7, category: 'Gifts' },
      { id: '699026a8ae873e1fa69cb18d', name: 'Ceramic Fridge Magnet', price: 299, image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18d')?.imageUrl || '', rating: 4.5, category: 'Accessories' },
      { id: '699026a8ae873e1fa69cb18e', name: 'Handmade Ceramic Mandala Wheel', price: 2499, image: PlaceHolderImages.find(i => i.id === '699026a8ae873e1fa69cb18e')?.imageUrl || '', rating: 5.0, category: 'Home Decor', badge: 'Artisan Pick' },
    ];

    let filtered = products;
    if (finalAnswers.category === 'spiritual') {
      filtered = products.filter(p => p.id === '699026a8ae873e1fa69cb18a' || p.id === '699026a8ae873e1fa69cb18e');
    } else if (finalAnswers.category === 'gift') {
      filtered = products.filter(p => p.id === '699026a8ae873e1fa69cb18c' || p.id === '699026a8ae873e1fa69cb18b');
    } else if (finalAnswers.vibe === 'peacock') {
      filtered = products.filter(p => p.id === '699026a8ae873e1fa69cb18a' || p.id === '699026a8ae873e1fa69cb18e');
    }

    setRecommendedProducts(filtered.slice(0, 4));
    setShowResults(true);
  };

  const resetSurvey = () => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {!showResults ? (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">Step {step + 1} of {QUESTIONS.length}</span>
                  <h1 className="text-3xl font-bold text-primary">{QUESTIONS[step].question}</h1>
                  <p className="text-muted-foreground">{QUESTIONS[step].description}</p>
                </div>
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-muted-foreground">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                )}
              </div>
              <Progress value={progress} className="h-2 bg-muted" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUESTIONS[step].options.map((option) => (
                <Card 
                  key={option.value} 
                  className={`cursor-pointer transition-all border-2 hover:border-accent hover:shadow-lg hover:shadow-accent/5 ${answers[QUESTIONS[step].id] === option.value ? 'border-accent bg-accent/5 scale-[1.02]' : 'border-border bg-white'}`}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shadow-inner">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-primary">{option.label}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${answers[QUESTIONS[step].id] === option.value ? 'text-accent' : 'text-muted-foreground/30'}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl animate-fade-in py-8">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Discovery Complete
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">Your Ceramic Recommendations</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Based on your preference for <span className="text-primary font-semibold">{QUESTIONS[0].options.find(o => o.value === answers.category)?.label.toLowerCase()}</span>, we've found these perfect handcrafted matches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 pt-8 border-t">
              <p className="text-muted-foreground text-sm font-medium">Want to try again?</p>
              <Button variant="outline" size="lg" onClick={resetSurvey} className="border-primary text-primary hover:bg-primary/5 h-12 px-8">
                <RefreshCcw className="mr-2 h-4 w-4" /> Restart Discovery Quiz
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
