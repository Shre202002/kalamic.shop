'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayUrl, getZoomUrl, getThumbnailUrl } from '@/lib/utils/imagekit';

interface ImageGalleryProps {
  images: Array<{ url: string; alt: string; is_primary: boolean }>;
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] || images[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    const x = ((touch.pageX - left - window.scrollX) / width) * 100;
    const y = ((touch.pageY - top - window.scrollY) / height) * 100;
    
    setZoomPos({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const lightboxContent = (
    <AnimatePresence>
      {isLightboxOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors z-[10000]"
            onClick={closeLightbox}
          >
            <X size={48} />
          </button>

          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[80vh]">
              <Image 
                src={getZoomUrl(images[activeIndex].url)} 
                alt={images[activeIndex].alt} 
                fill 
                className="object-contain"
                sizes="95vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={handleNext}
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
  );

  return (
    <div className="space-y-6">
      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="relative aspect-square rounded-[2rem] overflow-hidden bg-white border border-border shadow-xl shadow-primary/5 group cursor-crosshair touch-pan-y"
        onMouseEnter={() => {
          // Preload High-Res Zoom Image
          const preload = new window.Image();
          preload.src = getZoomUrl(activeImage.url);
          setShowZoom(true);
        }}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => {
          const preload = new window.Image();
          preload.src = getZoomUrl(activeImage.url);
          setShowZoom(true);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setShowZoom(false)}
        onClick={() => setIsLightboxOpen(true)}
      >
        <Image 
          src={getDisplayUrl(activeImage.url)} 
          alt={activeImage.alt || productName} 
          fill 
          className={cn(
            "object-cover transition-opacity duration-300",
            showZoom ? "opacity-0" : "opacity-100"
          )}
          priority
        />

        {/* Carousel Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 hover:bg-white active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 hover:bg-white active:scale-95"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Hover Zoom Overlay */}
        {showZoom && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${getZoomUrl(activeImage.url)})`,
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
            <Image src={getThumbnailUrl(img.url)} alt={img.alt} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Portaled Lightbox */}
      {mounted && createPortal(lightboxContent, document.body)}
    </div>
  );
}
