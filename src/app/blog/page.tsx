'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { BookOpen, Mail, Search, Sparkles, Tag, ArrowRight, Loader2, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Tips', 'Heritage', 'Product Spotlight', 'How-to', 'News', 'Care Guide'];
const PLACEHOLDER = 'https://picsum.photos/seed/kalamic-community/1200/675';
const cover = (url?: string) => url?.trim() || PLACEHOLDER;
const dateLabel = (value?: string) => value ? dayjs(value).format('D MMM') : 'New';

export default function BlogListPage() {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFeed, setActiveFeed] = useState<'popular' | 'newest' | 'following'>('popular');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/blogs?limit=100');
        const data = await response.json();
        setBlogs(Array.isArray(data) ? data : []);
      } catch {
        toast({ variant: 'destructive', title: 'Stories unavailable', description: 'Please try again shortly.' });
      } finally { setLoading(false); }
    };
    fetchBlogs();
  }, [toast]);

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = blogs.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(' ')}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
    return [...result].sort((a, b) => activeFeed === 'popular'
      ? Number(b.views || 0) - Number(a.views || 0)
      : new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime());
  }, [activeCategory, activeFeed, blogs, search]);

  const featuredPost = blogs.find((post) => post.isFeatured) || blogs[0];
  const feedPosts = filteredBlogs.filter((post) => post._id !== featuredPost?._id).slice(0, visibleCount);
  const newestPosts = [...blogs].sort((a, b) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime()).slice(0, 3);
  const popularPosts = [...blogs].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 3);

  const subscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Enter a valid email', description: 'We need a valid email to send Kalamic stories.' });
      return;
    }
    toast({ title: 'You are on the list', description: 'Newsletter delivery will be connected to your mailing provider next.' });
    setEmail('');
  };

  return <div className="min-h-screen bg-[#f7f4ef] text-[#271e1b]"><Navbar /><main>
    <section className="border-b border-[#271e1b]/10 px-6 pb-16 pt-32 md:pb-24 md:pt-40"><div className="mx-auto max-w-7xl"><div className="grid items-end gap-10 lg:grid-cols-[1fr_360px]"><div><Badge className="mb-6 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/10"><BookOpen className="mr-2 h-3.5 w-3.5" /> Kalamic Journal</Badge><h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">A community of makers who keep Indian craft moving forward.</h1><p className="mt-6 max-w-2xl text-base font-medium leading-8 text-muted-foreground md:text-lg">Discover studio notes, heritage stories, decor guides, and thoughtful conversations from the Kalamic artisan community.</p></div><div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Find your next story</p><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(8); }} placeholder="Search the journal" className="h-11 rounded-xl border-primary/10 bg-[#f7f4ef] pl-10" /></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Search by title, topic, or tag.</p></div></div></div></section>
    <section className="px-6 py-12 md:py-16"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="min-w-0">
      {featuredPost && activeCategory === 'All' && !search && <Link href={`/blog/${featuredPost.slug}`} className="group mb-12 block overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-sm"><div className="grid md:grid-cols-[1.05fr_0.95fr]"><div className="relative aspect-[4/3] min-h-[260px] overflow-hidden md:aspect-auto"><Image src={cover(featuredPost.coverImage?.url)} alt={featuredPost.coverImage?.alt || featuredPost.title} fill priority className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 55vw" /></div><div className="flex flex-col justify-center p-7 md:p-10"><span className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Featured story</span><h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{featuredPost.title}</h2><p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">{featuredPost.excerpt}</p><div className="mt-7 flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>{featuredPost.author?.name || 'Kalamic Artisan'}</span><span>·</span><span>{dateLabel(featuredPost.publishedAt)}</span><span>·</span><span>{featuredPost.readTime || 1} min read</span></div></div></div></Link>}
      <div className="mb-8 flex flex-col gap-5 border-b border-[#271e1b]/10 pb-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-2 overflow-x-auto pb-1">{(['popular', 'newest', 'following'] as const).map((feed) => <button key={feed} onClick={() => { setActiveFeed(feed); setVisibleCount(8); }} className={cn('whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold capitalize transition', activeFeed === feed ? 'bg-[#271e1b] text-white' : 'text-muted-foreground hover:bg-white')}>{feed}</button>)}</div><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Tag className="h-3.5 w-3.5" /> {filteredBlogs.length} stories</div></div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map((category) => <button key={category} onClick={() => { setActiveCategory(category); setVisibleCount(8); }} className={cn('whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition', activeCategory === category ? 'border-primary bg-primary text-white' : 'border-primary/10 bg-white text-muted-foreground hover:border-primary/30')}>{category}</button>)}</div>
      {loading ? <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : activeFeed === 'following' ? <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 font-display text-2xl font-bold">Build your craft circle</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Following will be available when community profiles are enabled. Explore Popular and Newest stories meanwhile.</p></div> : feedPosts.length === 0 ? <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-10 text-center text-sm text-muted-foreground">No stories match this search yet.</div> : <div className="space-y-5">{feedPosts.map((post, index) => <motion.article key={post._id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index * 0.04, 0.2) }} className="group rounded-2xl border border-primary/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5"><div className="flex gap-4 md:gap-6"><Link href={`/blog/${post.slug}`} className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl md:h-36 md:w-44"><Image src={cover(post.coverImage?.url)} alt={post.coverImage?.alt || post.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="176px" /></Link><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary"><span>{post.category}</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">{dateLabel(post.publishedAt)}</span></div><Link href={`/blog/${post.slug}`}><h2 className="line-clamp-2 font-display text-xl font-bold leading-tight transition group-hover:text-primary md:text-2xl">{post.title}</h2></Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p><div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-muted-foreground"><span>{post.author?.name || 'Kalamic Artisan'}</span><span>·</span><span>{post.views || 0} reads</span><span>·</span><span>{post.readTime || 1} min</span></div></div></div></motion.article>)}</div>}
      {filteredBlogs.length - (featuredPost ? 1 : 0) > visibleCount && activeFeed !== 'following' && <div className="mt-10 text-center"><Button onClick={() => setVisibleCount((count) => count + 8)} variant="outline" className="rounded-xl border-primary/20 px-8 font-bold text-primary">Show more stories <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
    </div><aside className="space-y-6"><div className="rounded-3xl bg-[#271e1b] p-7 text-white"><MessageCircle className="h-6 w-6 text-primary" /><h3 className="mt-5 font-display text-2xl font-bold">New discussions</h3><div className="mt-5 space-y-5">{newestPosts.map((post) => <Link key={post._id} href={`/blog/${post.slug}`} className="block border-t border-white/10 pt-4"><p className="line-clamp-2 text-sm font-semibold leading-6 hover:text-primary">{post.title}</p><span className="mt-2 block text-[10px] uppercase tracking-widest text-white/50">{dateLabel(post.publishedAt)} · {post.readTime || 1} min</span></Link>)}</div></div><div className="rounded-3xl border border-primary/10 bg-white p-7"><h3 className="font-display text-2xl font-bold">Popular reads</h3><div className="mt-5 space-y-5">{popularPosts.map((post, index) => <Link key={post._id} href={`/blog/${post.slug}`} className="flex gap-3 border-t border-primary/10 pt-4"><span className="font-display text-2xl font-bold text-primary/40">0{index + 1}</span><div><p className="line-clamp-2 text-sm font-bold leading-5 hover:text-primary">{post.title}</p><span className="mt-1 block text-[10px] text-muted-foreground">{post.views || 0} reads</span></div></Link>)}</div></div><div className="rounded-3xl border border-primary/10 bg-primary/10 p-7"><Sparkles className="h-6 w-6 text-primary" /><h3 className="mt-4 font-display text-2xl font-bold">Craft resources</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Practical guides for choosing, styling, and caring for handcrafted ceramics.</p><Link href="/products" className="mt-5 inline-flex items-center text-xs font-black uppercase tracking-widest text-primary">Explore the collection <ArrowRight className="ml-2 h-4 w-4" /></Link></div><div className="rounded-3xl border border-primary/10 bg-white p-7"><Mail className="h-6 w-6 text-primary" /><h3 className="mt-4 font-display text-2xl font-bold">Stories in your inbox</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Occasional notes from our studio, never noise.</p><form onSubmit={subscribe} className="mt-5 space-y-3"><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" type="email" className="rounded-xl bg-[#f7f4ef]" /><Button type="submit" className="w-full rounded-xl font-bold">Subscribe</Button></form></div></aside></div></section>
  </main><Footer /></div>;
}
