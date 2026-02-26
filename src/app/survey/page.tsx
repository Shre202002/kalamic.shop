
"use client"

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronRight, ChevronLeft, Sparkles, CheckCircle2, RefreshCcw } from 'lucide-react';
import Image from 'next/image';

const QUESTIONS = [
  {
    id: 'category',
    question: "What are you looking to upgrade today?",
    description: "Tell us the area of your life that needs a little NexGen touch.",
    options: [
      { label: "Daily Productivity", value: "productivity", icon: "💻" },
      { label: "Home Comfort", value: "furniture", icon: "🏠" },
      { label: "Personal Style", value: "fashion", icon: "👕" },
      { label: "On-the-go Tech", value: "tech", icon: "🎧" }
    ]
  },
  {
    id: 'budget',
    question: "What's your preferred investment range?",
    description: "We have quality picks for every budget level.",
    options: [
      { label: "Under $100", value: "low", icon: "💵" },
      { label: "$100 - $300", value: "mid", icon: "💳" },
      { label: "$300+", value: "high", icon: "💎" }
    ]
  },
  {
    id: 'style',
    question: "Which vibe resonates with you most?",
    description: "Help us match your unique aesthetic.",
    options: [
      { label: "Minimalist & Clean", value: "minimal", icon: "⚪" },
      { label: "Bold & Technical", value: "technical", icon: "⚡" },
      { label: "Professional & Classic", value: "pro", icon: "💼" }
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
    // Logic to map survey answers to placeholder products
    const products = [
      { id: 'prod-1', name: 'Premium Noise Cancelling Headphones', price: 299, originalPrice: 349, image: PlaceHolderImages.find(i => i.id === 'prod-1')?.imageUrl || '', rating: 4.8, category: 'Electronics', badge: 'Best Match' },
      { id: 'prod-2', name: 'Elite Smart Fitness Tracker', price: 149, image: PlaceHolderImages.find(i => i.id === 'prod-2')?.imageUrl || '', rating: 4.7, category: 'Electronics' },
      { id: 'prod-3', name: 'Handcrafted Leather Laptop Sleeve', price: 79, originalPrice: 99, image: PlaceHolderImages.find(i => i.id === 'prod-3')?.imageUrl || '', rating: 4.9, category: 'Accessories', badge: 'Perfect Fit' },
      { id: 'prod-4', name: 'Signature Ergonomic Desk Chair', price: 449, image: PlaceHolderImages.find(i => i.id === 'prod-4')?.imageUrl || '', rating: 4.6, category: 'Furniture' },
    ];

    // Simple filtering based on category
    let filtered = products;
    if (finalAnswers.category === 'productivity' || finalAnswers.category === 'tech') {
      filtered = products.filter(p => p.category === 'Electronics' || p.category === 'Accessories');
    } else if (finalAnswers.category === 'furniture') {
      filtered = products.filter(p => p.category === 'Furniture');
    }

    setRecommendedProducts(filtered);
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
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">Question {step + 1} of {QUESTIONS.length}</span>
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
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">Your NexGen Recommendations</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Based on your preference for <span className="text-primary font-semibold">{QUESTIONS[0].options.find(o => o.value === answers.category)?.label.toLowerCase()}</span>, we've curated these perfect matches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 pt-8 border-t">
              <p className="text-muted-foreground text-sm font-medium">Not quite what you were looking for?</p>
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
