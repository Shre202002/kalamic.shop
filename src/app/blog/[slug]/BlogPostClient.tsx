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
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 h-1 bg-primary z-[100] transition-all" style={{ width: `${scrollProgress}%` }} />
      <Navbar />

      <main className="flex-1">
        <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
          <Image 
            src={post.coverImage?.url || BLOG_PLACEHOLDER} 
            alt={post.title} 
            fill 
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
          />
          {/* Strong multi-stop gradient for readability on any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/15" />
          {/* Additional bottom boost for text area */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
          
          <div className="absolute bottom-8 md:bottom-12 left-0 w-full z-10">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
              <Badge className="mb-3 md:mb-4 bg-primary text-white text-[10px] md:text-sm uppercase tracking-widest border-none px-4 py-1">
                {post.category}
              </Badge>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold text-white tracking-tight leading-tight max-w-4xl">
                {post.title}
              </h1>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-white/80 text-[10px] md:text-xs font-black mt-4 md:mt-6 uppercase tracking-widest">
                <span className="flex items-center gap-2"><User size={14} className="text-primary" /> {post.author?.name}</span>
                <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {post.readTime} MIN READ</span>
                <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> {dayjs(post.publishedAt).format('MMM D, YYYY')}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 max-w-7xl py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <main className="lg:col-span-8">
              <>
                <style>{`
                  .blog-content h1 { font-size: 2.2rem; font-weight: 900; margin: 1.5rem 0 0.75rem; line-height: 1.2; }
                  .blog-content h2 { font-size: 1.7rem; font-weight: 800; margin: 2.5rem 0 1rem; line-height: 1.25; color: var(--primary, #EA781E); }
                  .blog-content h3 { font-size: 1.35rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
                  .blog-content h4 { font-size: 1.1rem; font-weight: 700; margin: 1rem 0 0.4rem; }
                  .blog-content p  { font-size: 1rem; line-height: 1.85; margin: 0.85rem 0; color: #374151; }
                  .blog-content ul { list-style: disc; padding-left: 1.75rem; margin: 1rem 0; }
                  .blog-content ol { list-style: decimal; padding-left: 1.75rem; margin: 1rem 0; }
                  .blog-content li { font-size: 1rem; line-height: 1.7; margin: 0.4rem 0; }
                  .blog-content blockquote { border-left: 4px solid #EA781E; padding: 1rem 1.5rem; margin: 2rem 0; background: #FAF4EB; border-radius: 0 1rem 1rem 0; font-style: italic; color: #5a3e28; }
                  .blog-content strong { font-weight: 800; color: #111827; }
                  .blog-content a { color: #EA781E; text-decoration: underline; font-weight: 600; }
                  .blog-content hr { border: none; border-top: 1px solid #e5e0d8; margin: 3rem 0; }
                  .blog-content img { max-width: 100%; height: auto; border-radius: 1.25rem; margin: 2.5rem auto; display: block; box-shadow: 0 20px 50px rgba(0,0,0,0.08); }
                  .blog-content code { background: #f3ede4; padding: 0.15rem 0.4rem; border-radius: 0.3rem; font-family: monospace; font-size: 0.9rem; }
                  .blog-content pre { background: #1e1e1e; color: #f8f8f2; padding: 1.25rem; border-radius: 0.75rem; overflow-x: auto; margin: 2rem 0; }
                  .blog-content table { width: 100%; border-collapse: collapse; margin: 2rem 0; font-size: 0.9rem; }
                  .blog-content th { background: #f3ede4; font-weight: 800; padding: 0.75rem 1rem; border: 1px solid #e0d8cc; text-align: left; }
                  .blog-content td { padding: 0.75rem 1rem; border: 1px solid #e0d8cc; }
                  
                  /* Callout box equivalent styles */
                  .blog-content .bg-blue-50   { background-color: #EFF6FF; }
                  .blog-content .bg-green-50  { background-color: #F0FDF4; }
                  .blog-content .bg-yellow-50 { background-color: #FFFBEB; }
                  .blog-content .bg-red-50    { background-color: #FEF2F2; }
                  .blog-content .border-blue-200   { border-color: #BFDBFE; border-width: 1px; border-style: solid; }
                  .blog-content .border-green-200  { border-color: #BBF7D0; border-width: 1px; border-style: solid; }
                  .blog-content .border-yellow-200 { border-color: #FDE68A; border-width: 1px; border-style: solid; }
                  .blog-content .border-red-200    { border-color: #FECACA; border-width: 1px; border-style: solid; }
                  .blog-content .text-blue-800   { color: #1E40AF; }
                  .blog-content .text-blue-700   { color: #1D4ED8; }
                  .blog-content .text-green-800  { color: #166534; }
                  .blog-content .text-green-700  { color: #15803D; }
                  .blog-content .text-yellow-800 { color: #92400E; }
                  .blog-content .text-yellow-700 { color: #B45309; }
                  .blog-content .text-red-800    { color: #991B1B; }
                  .blog-content .font-bold { font-weight: 700; }
                  .blog-content .rounded-2xl { border-radius: 1rem; }
                  .blog-content .p-5 { padding: 1.25rem; }
                  .blog-content .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
                  .blog-content .my-8 { margin-top: 2rem; margin-bottom: 2rem; }
                  .blog-content .mb-1 { margin-bottom: 0.25rem; }
                  .blog-content .grid { display: grid; }
                  .blog-content .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                  .blog-content .gap-8 { gap: 2rem; }
                  
                  @media (max-width: 640px) {
                    .blog-content .grid-cols-2 { grid-template-columns: 1fr; }
                    .blog-content h2 { font-size: 1.4rem; }
                    .blog-content p { font-size: 0.95rem; }
                  }
                  
                  /* Responsive image wrappers */
                  .blog-content .blog-image-wrapper { width: 100%; }
                  .blog-content .blog-image-wrapper img { width: 100%; height: auto; }
                  
                  /* Product CTA links */
                  .blog-content a.inline-flex.items-center {
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.75rem 1.5rem; border-radius: 1rem;
                    background: rgba(234, 120, 30, 0.08); color: #EA781E;
                    font-weight: 800; font-size: 0.85rem; text-decoration: none;
                    border: 1px solid rgba(234, 120, 30, 0.2);
                    transition: all 0.3s ease;
                    text-transform: uppercase; letter-spacing: 0.05em;
                  }
                  .blog-content a.inline-flex.items-center:hover { 
                    background: #EA781E; color: white; 
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(234, 120, 30, 0.2);
                  }
                `}</style>
                
                <article
                  className="blog-content max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </>

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
                  <form className="space-y-3" onSubmit={(e) => {
                    e.preventDefault();
                    toast({ title: "Coming Soon", description: "Our newsletter system is launching next month!" });
                  }}>
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
                            <Image 
                              src={s.coverImage?.url || BLOG_PLACEHOLDER} 
                              alt={s.title} 
                              fill 
                              className="object-cover transition-transform group-hover:scale-110" 
                              sizes="80px"
                            />
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
      </main>

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
