'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, ArrowUp, 
  ChevronRight, Sparkles, Send, Loader2,
  Facebook, Twitter, Linkedin, Share2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

const BLOG_PLACEHOLDER = "https://picsum.photos/seed/kalamic-blog/1200/675";

const getCoverImage = (url?: string) => {
  if (!url || url.trim() === "") return BLOG_PLACEHOLDER;
  return url;
};

interface BlogPostClientProps {
  post: any;
  suggested: any[];
}

export default function BlogPostClient({ post, suggested }: BlogPostClientProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subMessage, setSubMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setSubStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSubStatus('success');
        setSubMessage(data.message);
        setEmail('');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setSubStatus('error');
      setSubMessage(err.message || 'Something went wrong.');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 relative">
      {/* READING PROGRESS BAR */}
      <div 
        className="fixed top-0 left-0 h-1 bg-primary z-[100] transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      <Navbar />

      {/* HERO SECTION - EDGE TO EDGE */}
      <section className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden pt-20">
        <Image 
          src={getCoverImage(post.coverImage?.url)} 
          alt={post.coverImage?.alt || post.title} 
          fill 
          className="object-cover" 
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute inset-0 flex items-end pb-12 md:pb-20">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl space-y-6"
            >
              <Badge className="bg-primary text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-lg">
                {post.category}
              </Badge>
              <h1 className="text-4xl md:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight text-balance">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground pt-4">
                <span className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  <User className="h-3 w-3 text-primary" /> {post.author.name}
                </span>
                <span className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  <Clock className="h-3 w-3 text-primary" /> {post.readTime} MIN READ
                </span>
                <span className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  <Calendar className="h-3 w-3 text-primary" /> {dayjs(post.publishedAt).format('MMM D, YYYY')}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTENT GRID */}
      <div className="container mx-auto px-6 max-w-7xl py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* LEFT: MAIN ARTICLE */}
          <main className="lg:col-span-8">
            <article className="prose prose-lg md:prose-xl prose-stone max-w-none 
              prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:font-medium prose-p:mb-8
              prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
              prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8
              prose-strong:text-foreground prose-strong:font-black
              prose-a:text-primary prose-a:font-bold hover:prose-a:underline
              prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:my-16
              prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-[2rem] prose-blockquote:py-6 prose-blockquote:px-10 prose-blockquote:italic prose-blockquote:text-foreground
            ">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* TAGS & SOCIALS */}
            <div className="mt-24 pt-12 border-t border-primary/5 space-y-12">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/blog?tag=${tag}`} 
                    className="px-6 py-2.5 rounded-full bg-muted border border-border text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              <div className="p-8 md:p-12 rounded-[3rem] bg-white border border-primary/5 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Share2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Share this Article</h3>
                    <p className="text-xs font-medium text-muted-foreground">Spread the artisanal story</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                    <button key={i} className="h-12 w-12 rounded-2xl bg-muted hover:bg-primary hover:text-white transition-all flex items-center justify-center text-muted-foreground shadow-sm">
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT: STICKY SIDEBAR */}
          <aside className="lg:col-span-4">
            <div className="sticky top-32 space-y-12">
              
              {/* NEWSLETTER BOX */}
              <div className="bg-primary rounded-[3rem] p-10 md:p-12 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center text-white mx-auto shadow-xl">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">Stay in the Loop</h3>
                    <p className="text-white/70 text-xs font-medium leading-relaxed">Join 2,000+ collectors. Get new stories and first-access to limited pieces.</p>
                  </div>

                  <form onSubmit={handleSubscribe} className="space-y-3 pt-4">
                    {subStatus === 'success' ? (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                        <p className="text-[10px] font-black uppercase text-white tracking-widest">{subMessage}</p>
                      </motion.div>
                    ) : (
                      <>
                        <Input 
                          type="email" 
                          placeholder="artisan@example.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40 text-center font-bold"
                          required
                        />
                        <Button 
                          type="submit" 
                          disabled={subStatus === 'loading'}
                          className="w-full h-14 rounded-2xl bg-white text-primary font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl"
                        >
                          {subStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe Now'}
                        </Button>
                        {subStatus === 'error' && (
                          <div className="flex items-center gap-2 justify-center text-red-100 text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3" /> {subMessage}
                          </div>
                        )}
                      </>
                    )}
                  </form>
                </div>
              </div>

              {/* AUTHOR BOX */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-xl space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted overflow-hidden relative border-2 border-primary/10 shadow-inner">
                    <User className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Written by</p>
                    <p className="text-lg font-bold text-foreground">{post.author.name}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">Artisan curator and heritage preservationist at Kalamic Studio.</p>
                <div className="pt-4 border-t border-primary/5">
                   <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-2 transition-transform">
                    Learn about our Studio <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* RELATED ARTICLES */}
      {suggested.length > 0 && (
        <section className="bg-primary/5 py-24 md:py-32 border-y border-primary/5">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex items-center justify-between mb-16">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Continue Reading</span>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">More from the Studio</h2>
              </div>
              <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 px-8 rounded-full border border-primary/10 hidden md:flex">
                <Link href="/blog" className="flex items-center gap-3">The Journal Archive <ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {suggested.map((s: any) => (
                <Link key={s._id} href={`/blog/${s.slug}`} className="group space-y-6">
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-lg border-4 border-white bg-muted">
                    <Image 
                      src={getCoverImage(s.coverImage?.url)} 
                      alt={s.coverImage?.alt || s.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                  <div className="space-y-3">
                    <Badge className="bg-primary/10 text-primary border-none px-3 py-1 text-[8px] font-black uppercase tracking-widest">{s.category}</Badge>
                    <h3 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">{s.title}</h3>
                    <div className="flex items-center justify-between pt-4 border-t border-primary/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                       <span>{dayjs(s.publishedAt).format('MMM D, YYYY')}</span>
                       <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {s.readTime} MIN</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-10 right-10 z-50 h-16 w-16 rounded-[1.5rem] bg-foreground text-white flex items-center justify-center shadow-2xl hover:bg-primary transition-colors group"
          >
            <ArrowUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
