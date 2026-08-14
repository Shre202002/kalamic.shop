'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export type Testimonial = {
  name: string;
  location: string;
  rating: number;
  text: string;
  product: string;
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function TestimonialsColumn({
  testimonials,
  duration = 18,
  className = '',
}: {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={`w-full max-w-sm overflow-hidden ${className}`}>
      <motion.div
        animate={{ y: '-50%' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        className="flex flex-col gap-5 pb-5"
      >
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {testimonials.map((testimonial) => (
              <article
                key={`${copy}-${testimonial.name}`}
                className="rounded-[2rem] border border-border bg-white p-6 shadow-lg shadow-primary/5"
              >
                <div className="flex gap-1 text-primary" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} aria-hidden="true" className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-base font-medium leading-7 text-muted-foreground">“{testimonial.text}”</p>
                <div className="mt-6 flex items-center gap-3 border-t border-primary/10 pt-5">
                  <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                    {initials(testimonial.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black tracking-tight text-foreground">{testimonial.name}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {testimonial.location} · {testimonial.product}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
