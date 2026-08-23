'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, User, MessageCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { submitReview } from '@/lib/actions/reviews';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { uploadReviewMedia } from '@/lib/actions/upload-actions';

type ReviewMedia = {
  id: string;
  name: string;
  previewUrl: string;
  url: string;
  fileId?: string;
  format?: string;
  mediaType: 'image' | 'video';
};

interface ReviewsSectionProps {
  productId: string;
  reviews: any[];
  user: any;
  isEligible: boolean;
}

export function ReviewsSection({ productId, reviews, user, isEligible }: ReviewsSectionProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewMedia, setReviewMedia] = useState<ReviewMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) return;
    if (reviewText.trim().length < 3) return;

    setIsSubmitting(true);
    try {
      await submitReview({
        productId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Kalamic Collector',
        userAvatar: user.photoURL || undefined,
        rating,
        reviewText: reviewText.trim(),
        images: reviewMedia.map((media) => ({
          url: media.url,
          fileId: media.fileId,
          format: media.format,
          mediaType: media.mediaType,
          alt: `${media.name} customer review`,
        })),
      });
      reviewMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl));
      setReviewMedia([]);
      setReviewText('');
      setRating(5);
      setShowReviewForm(false);
      toast({ title: 'Review submitted', description: 'Thank you for sharing your Kalamic experience.' });
      router.refresh();
    } catch (error: any) {
      console.error('[REVIEWS] Submit failed:', error);
      toast({ variant: 'destructive', title: 'Review could not be submitted', description: error?.message || 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.currentTarget.value = '';
    if (!files.length || !user?.uid) return;
    if (reviewMedia.length + files.length > 4) {
      toast({ variant: 'destructive', title: 'Maximum four files', description: 'Please remove a file before adding another.' });
      return;
    }

    setIsUploadingMedia(true);
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const allowed = isVideo
          ? ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)
          : ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
        if (!allowed || file.size <= 0 || file.size > maxSize) {
          toast({ variant: 'destructive', title: 'Unsupported media', description: `${file.name} is not a supported format or is too large.` });
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        const uploaded = await uploadReviewMedia(formData, productId);
        const previewUrl = URL.createObjectURL(file);
        const mediaType: ReviewMedia['mediaType'] = uploaded.mediaType === 'video' ? 'video' : 'image';
        setReviewMedia((current) => [...current, {
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          previewUrl,
          url: uploaded.url,
          fileId: uploaded.fileId,
          format: uploaded.format,
          mediaType,
        }]);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Media upload failed', description: error?.message || 'Please try again.' });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeReviewMedia = (mediaId: string) => {
    setReviewMedia((current) => {
      const media = current.find((item) => item.id === mediaId);
      if (media) URL.revokeObjectURL(media.previewUrl);
      return current.filter((item) => item.id !== mediaId);
    });
  };

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
             <Button type="button" onClick={() => setShowReviewForm((open) => !open)} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                {showReviewForm ? 'Close Review' : 'Write a Story'}
             </Button>
           ) : (
             <div className="px-6 py-3 rounded-xl bg-white border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                Only Verified Owners can Review
             </div>
           )}
        </div>

        {user && isEligible && showReviewForm && (
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-primary/15 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Write your review</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your review will appear after it is submitted.</p>
              </div>
              <div className="flex items-center gap-1" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star rating`} className="rounded p-1 text-amber-500">
                    <Star size={22} className={cn(value <= rating && 'fill-current')} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              minLength={3}
              maxLength={3000}
              required
              placeholder="Tell other collectors about your experience..."
              className="mt-6 min-h-32 w-full rounded-2xl border border-border bg-muted/30 p-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-5 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Add photos or a video</p>
                  <p className="mt-1 text-xs text-muted-foreground">Up to 4 files · JPG, PNG, WebP (5 MB) · MP4, MOV, WebM (25 MB)</p>
                </div>
                <label className="inline-flex cursor-pointer rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5">
                  {isUploadingMedia ? 'Uploading…' : 'Choose media'}
                  <input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" disabled={isUploadingMedia || reviewMedia.length >= 4} onChange={handleMediaSelect} />
                </label>
              </div>
              {reviewMedia.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {reviewMedia.map((media) => (
                    <div key={media.id} className="relative overflow-hidden rounded-xl border border-border bg-white">
                      {media.mediaType === 'video' ? <video src={media.previewUrl} muted controls className="h-24 w-full object-cover" /> : <img src={media.previewUrl} alt={media.name} className="h-24 w-full object-cover" />}
                      <button type="button" onClick={() => removeReviewMedia(media.id)} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white" aria-label={`Remove ${media.name}`}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">{reviewText.length}/3000</span>
              <Button type="submit" disabled={isSubmitting || reviewText.trim().length < 3} className="rounded-xl px-6 font-bold">
                {isSubmitting ? 'Submitting…' : 'Submit Review'}
              </Button>
            </div>
          </form>
        )}

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
                {Array.isArray(review.review_images) && review.review_images.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {review.review_images.map((media: any, mediaIndex: number) => (
                      <div key={`${media.fileId || media.url}-${mediaIndex}`} className="overflow-hidden rounded-xl border border-border bg-muted/20">
                        {media.mediaType === 'video' ? (
                          <video src={media.url} controls muted playsInline className="h-28 w-full object-cover" />
                        ) : (
                          <img src={media.url} alt={media.alt || `${review.user_name || 'Customer'} review media`} loading="lazy" className="h-28 w-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
