
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, User, ArrowRight, BookOpen, 
  ChevronRight, Sparkles, Loader2, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const CATEGORIES = ["All", "Tips", "Heritage", "Product Spotlight", "How-to", "News", "Care Guide"];

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/blogs?limit=100`);
        const data = await res.json();
        setBlogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(b => 
    activeCategory === "All" || b.category === activeCategory
  );

  const featuredPost = blogs.find(b => b.isFeatured) || blogs[0];
  const remainingPosts = filteredBlogs.filter(b => b._id !== (featuredPost?._id)).slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <BookOpen className="h-3 w-3 mr-2" /> The Kalamic Journal
              </Badge>
              <h1 className="text-5xl md:text-8xl font-display font-bold text-foreground leading-[1.05] tracking-tight">
                Stories of <span className="italic font-normal text-primary">Heritage</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium mt-6 leading-relaxed">
                Dive deep into the soul of Indian ceramics. From studio techniques to home preservation guides.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-6 max-w-7xl pb-32">
          {/* FEATURED POST */}
          {featuredPost && activeCategory === "All" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-24"
            >
              <Link href={`/blog/${featuredPost.slug}`}>
                <div className="group relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-primary/5">
                  <Image src={featuredPost.coverImage.url} alt={featuredPost.coverImage.alt} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-3/4 space-y-4">
                    <Badge className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5">Featured Story</Badge>
                    <h2 className="text-3xl md:text-6xl font-display font-bold text-white leading-tight tracking-tight">
                      {featuredPost.title}
                    </h2>
                    <p className="text-white/70 text-base md:text-lg line-clamp-2 max-w-2xl font-medium">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-6 pt-4 text-white/60 text-xs font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {featuredPost.readTime} Min Read</span>
                      <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {dayjs(featuredPost.publishedAt).format('MMM D, YYYY')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* FILTER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 pb-8 border-b border-primary/5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    activeCategory === cat 
                      ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                      : "bg-white border border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary/60">
              <Filter className="h-3 w-3" /> Showing {filteredBlogs.length} Stories
            </div>
          </div>

          {/* BLOG GRID */}
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {remainingPosts.map((post, idx) => (
                <motion.article 
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx % 3 * 0.1 }}
                  className="group"
                >
                  <Link href={`/blog/${post.slug}`} className="space-y-6 block">
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-primary/5">
                      <Image src={post.coverImage.url} alt={post.coverImage.alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 backdrop-blur-md text-primary text-[8px] font-black uppercase tracking-widest border-none px-3 py-1 shadow-sm">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3 px-2">
                      <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-sm font-medium line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                            {post.author?.name?.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {post.author?.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {post.readTime} Min
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {filteredBlogs.length > visibleCount && (
            <div className="mt-20 text-center">
              <Button 
                onClick={() => setVisibleCount(prev => prev + 9)}
                variant="outline"
                className="h-14 px-12 rounded-2xl border-2 border-primary/20 text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 shadow-lg transition-all"
              >
                Explore More Stories
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
