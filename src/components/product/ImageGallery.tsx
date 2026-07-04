'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: Array<{ url: string; alt: string; is_primary: boolean }>;
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] || images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="space-y-6">
      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="relative aspect-square md:aspect-[4/5] rounded-[2rem] overflow-hidden bg-white border border-border shadow-md group cursor-crosshair"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
      >
        <Image 
          src={activeImage.url} 
          alt={activeImage.alt || productName} 
          fill 
          className={cn(
            "object-cover transition-opacity duration-300",
            showZoom ? "opacity-0" : "opacity-100"
          )}
          priority
        />

        {/* Desktop Hover Zoom */}
        {showZoom && (
          <div 
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage: `url(${activeImage.url})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: '250%',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}

        {/* Lightbox Trigger */}
        <button className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-white/80 backdrop-blur-md shadow-xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
          <Maximize2 className="h-5 w-5" />
        </button>

        {/* Image Counter */}
        <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
        {images.map((img, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveImageIndex(idx)}
            className={cn(
              "relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0",
              activeIndex === idx 
                ? "border-primary shadow-lg scale-105" 
                : "border-transparent opacity-60 hover:opacity-100"
            )}
          >
            <Image src={img.url} alt={img.alt} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button 
              className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={48} />
            </button>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-5xl h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full h-full max-h-[80vh]">
                <Image 
                  src={images[activeIndex].url} 
                  alt={images[activeIndex].alt} 
                  fill 
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImageIndex((activeIndex - 1 + images.length) % images.length)}
                    className="absolute left-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button 
                    onClick={() => setActiveImageIndex((activeIndex + 1) % images.length)}
                    className="absolute right-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
