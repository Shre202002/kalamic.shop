'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, User, MessageCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface ReviewsSectionProps {
  productId: string;
  reviews: any[];
  user: any;
  isEligible: boolean;
}

export function ReviewsSection({ productId, reviews, user, isEligible }: ReviewsSectionProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return {
      star,
      count,
      percent: reviews.length > 0 ? (count / reviews.length) * 100 : 0
    };
  });

  return (
    <section className="py-24 border-t border-border/50">
      <div className="space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Collector Stories</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground">Community Feedback</h2>
          </div>
          
          <div className="flex items-center gap-8 bg-white p-6 rounded-[2rem] shadow-xl border border-primary/5">
             <div className="text-center">
                <p className="text-5xl font-black text-foreground leading-none mb-2">{averageRating}</p>
                <div className="flex text-amber-500 mb-1">
                   {[...Array(5)].map((_, i) => <Star key={i} size={16} className={cn("fill-current", i >= Math.round(Number(averageRating)) && "opacity-20")} />)}
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{reviews.length} Verified Reviews</p>
             </div>
             
             <div className="h-16 w-px bg-border hidden sm:block" />

             <div className="space-y-1.5 w-48 hidden sm:block">
                {distribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-muted-foreground w-4">{d.star}★</span>
                     <Progress value={d.percent} className="h-1 flex-1 bg-muted" />
                     <span className="text-[9px] font-bold text-muted-foreground w-4">{d.count}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Review Entry Prompt */}
        <div className="bg-primary/[0.03] p-8 md:p-10 rounded-[2.5rem] border border-dashed border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-xl">
                 <MessageCircle size={28} />
              </div>
              <div className="space-y-1 text-center md:text-left">
                 <h4 className="text-lg font-bold text-foreground">Have this piece in your space?</h4>
                 <p className="text-sm text-muted-foreground font-medium">Share your studio experience and help fellow collectors.</p>
              </div>
           </div>
           
           {!user ? (
             <Button asChild className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                <a href="/auth/login">Sign In to Review</a>
             </Button>
           ) : isEligible ? (
             <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                Write a Story
             </Button>
           ) : (
             <div className="px-6 py-3 rounded-xl bg-white border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                Only Verified Owners can Review
             </div>
           )}
        </div>

        {/* Review List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.length === 0 ? (
            <div className="md:col-span-2 py-20 text-center bg-white rounded-[3rem] border border-dashed border-border">
               <p className="text-muted-foreground font-medium">No stories shared for this piece yet. Be the first!</p>
            </div>
          ) : (
            reviews.map((review, i) => (
              <Card key={i} className="p-8 rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-inner">
                      {review.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{review.user_name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, j) => <Star key={j} size={12} className={cn("fill-current", j >= review.rating && "opacity-20")} />)}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified Owner
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                    {isMounted ? dayjs(review.createdAt).format('DD MMM YYYY') : ''}
                  </span>
                </div>
                
                <p className="text-muted-foreground text-base leading-relaxed font-medium">
                  "{review.comment}"
                </p>
              </Card>
            ))
          )}
        </div>

        {reviews.length > 10 && (
          <div className="text-center pt-8">
             <Button variant="outline" className="h-12 px-12 rounded-full border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                Load More Stories <ArrowRight size={14} className="ml-2" />
             </Button>
          </div>
        )}
      </div>
    </section>
  );
}
