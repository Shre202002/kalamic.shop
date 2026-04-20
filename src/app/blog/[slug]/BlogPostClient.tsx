'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, ArrowUp, 
  ChevronRight, Sparkles, Send, Loader2,
  Share2, MessageSquare, Reply, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useUser, useAuth } from '@/firebase';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useToast } from '@/hooks/use-toast';

// Extend dayjs with the relativeTime plugin to support .fromNow()
dayjs.extend(relativeTime);

const BLOG_PLACEHOLDER = "https://picsum.photos/seed/kalamic-blog/1200/675";

export default function BlogPostClient({ post, initialComments, suggested }: any) {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId: post._id,
          content: commentText,
          parentId: replyTo?._id || null,
          idToken
        })
      });

      const data = await res.json();
      if (res.ok) {
        setComments([data, ...comments]);
        setCommentText('');
        setReplyTo(null);
        toast({ title: 'Comment shared!' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommentReplies = (parentId: string) => {
    return comments.filter((c: any) => c.parentId === parentId);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 h-1 bg-primary z-[100] transition-all" style={{ width: `${scrollProgress}%` }} />
      <Navbar />

      <section className="relative w-full h-[45vh] md:h-[60vh] overflow-hidden mt-16 md:mt-24">
        <Image src={post.coverImage?.url || BLOG_PLACEHOLDER} alt={post.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <div className="absolute bottom-8 md:bottom-12 left-0 w-full">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <Badge className="mb-3 md:mb-4 bg-primary text-white text-[10px] md:text-sm uppercase tracking-widest">{post.category}</Badge>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold text-white tracking-tight leading-tight">{post.title}</h1>
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-white/80 text-[10px] md:text-xs font-black mt-4 md:mt-6 uppercase tracking-widest">
              <span className="flex items-center gap-2"><User size={14} /> {post.author.name}</span>
              <span className="flex items-center gap-2"><Clock size={14} /> {post.readTime} MIN READ</span>
              <span>{dayjs(post.publishedAt).format('MMM D, YYYY')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 max-w-7xl py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <main className="lg:col-span-8">
            <article className="prose prose-base sm:prose-lg md:prose-xl prose-stone max-w-none prose-img:rounded-2xl prose-img:shadow-xl">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* Comments System */}
            <section className="mt-20 md:mt-32 pt-12 border-t border-primary/10">
              <div className="flex items-center gap-4 mb-8 md:mb-12">
                <MessageSquare className="text-primary h-6 w-6 md:h-8 md:w-8" />
                <h2 className="text-2xl md:text-3xl font-display font-bold">Collector Discussions</h2>
              </div>

              {user ? (
                <div className="mb-12 md:mb-16 bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-primary/5">
                  {replyTo && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-primary/5 rounded-xl">
                      <span className="text-xs font-bold text-primary">Replying to @{replyTo.userName}</span>
                      <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-primary transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handlePostComment} className="space-y-4">
                    <textarea 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                      placeholder="Share your thoughts with the studio..."
                      className="w-full h-32 p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <Button disabled={isSubmitting} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] w-full sm:w-auto">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Post Comment'}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="mb-12 md:mb-16 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-primary/5 border border-dashed border-primary/20 text-center">
                  <p className="text-sm font-bold text-muted-foreground mb-4">Please sign in to join the discussion.</p>
                  <Link href="/auth/login"><Button size="sm">Sign In</Button></Link>
                </div>
              )}

              <div className="space-y-12">
                {comments.filter((c: any) => !c.parentId).map((comment: any) => (
                  <div key={comment._id} className="space-y-6">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary uppercase shadow-inner flex-shrink-0">
                        {comment.userName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-sm">{comment.userName}</span>
                          <span className="text-[10px] text-muted-foreground">{dayjs(comment.createdAt).fromNow()}</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{comment.content}</p>
                        <button 
                          onClick={() => setReplyTo(comment)} 
                          className="mt-2 text-[10px] font-black uppercase text-primary flex items-center gap-1 hover:underline"
                        >
                          <Reply size={12}/> Reply
                        </button>
                      </div>
                    </div>
                    
                    {/* Replies */}
                    <div className="ml-8 md:ml-16 space-y-6 border-l-2 border-primary/5 pl-4 md:pl-6">
                      {getCommentReplies(comment._id).map((reply: any) => (
                        <div key={reply._id} className="flex gap-3 md:gap-4">
                          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-[10px] md:text-xs uppercase shadow-inner flex-shrink-0">
                            {reply.userName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-xs">{reply.userName}</span>
                              <span className="text-[10px] text-muted-foreground">{dayjs(reply.createdAt).fromNow()}</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="lg:col-span-4 mt-20 lg:mt-0">
            <div className="lg:sticky lg:top-32 space-y-12">
              <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <Sparkles className="mb-6 opacity-40 h-8 w-8" />
                <h3 className="text-2xl font-display font-bold mb-2">Artisan Loop</h3>
                <p className="text-white/70 text-sm mb-6 font-medium">Get notified about kiln firings and new heritage stories.</p>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <Input placeholder="Collector Email" className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-xl" />
                  <Button className="w-full bg-white text-primary font-black uppercase tracking-widest text-[10px] h-12 rounded-xl hover:bg-white/90">Join Circle</Button>
                </form>
              </div>

              {suggested.length > 0 && (
                <div className="space-y-6 px-2 md:px-0">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Read Next</h4>
                  <div className="space-y-6">
                    {suggested.map((s: any) => (
                      <Link key={s._id} href={`/blog/${s.slug}`} className="group flex gap-4 items-start sm:items-center">
                        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
                          <Image src={s.coverImage?.url || BLOG_PLACEHOLDER} alt={s.title} fill className="object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h5 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">{s.title}</h5>
                          <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest">{dayjs(s.publishedAt).format('MMM D, YYYY')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {scrollProgress > 20 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform active:scale-95"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
