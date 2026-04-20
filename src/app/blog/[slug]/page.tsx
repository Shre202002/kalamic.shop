import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, User, ArrowRight, 
  ChevronRight, Share2, Facebook, Twitter, Linkedin,
  ChevronLeft, Award, Sparkles
} from 'lucide-react';
import { getBlogBySlug, getSuggestedBlogs } from '@/lib/actions/blog-actions';
import dayjs from 'dayjs';

const BLOG_PLACEHOLDER = "https://picsum.photos/seed/kalamic-blog/1200/675";

const getCoverImage = (url?: string) => {
  if (!url || url.trim() === "") return BLOG_PLACEHOLDER;
  return url;
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return {};
  
  return {
    title: post.seo?.metaTitle || `${post.title} | Kalamic Blog`,
    description: post.seo?.metaDescription || post.excerpt,
    keywords: post.seo?.metaKeywords?.join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      images: [{ url: post.seo?.ogImage || getCoverImage(post.coverImage?.url) }],
      type: 'article',
      publishedTime: post.publishedAt,
      tags: post.tags
    },
    alternates: {
      canonical: `https://kalamic.shop/blog/${post.slug}`
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  
  if (!post) notFound();

  const suggested = await getSuggestedBlogs(post.slug, post.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": getCoverImage(post.coverImage?.url),
    "author": {
      "@type": "Person",
      "name": post.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kalamic Ceramic Studio",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kalamic.shop/logo.png"
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "description": post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://kalamic.shop/blog/${post.slug}`
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      
      <main className="flex-1">
        {/* PROGRESS BREADCRUMB */}
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-primary transition-colors">Journal</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">{post.category}</span>
          </div>
        </div>

        {/* HEADER */}
        <header className="max-w-4xl mx-auto px-6 pb-12 text-center space-y-6">
          <Badge className="bg-primary/5 text-primary border-primary/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
            {post.category}
          </Badge>
          <h1 className="text-4xl md:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
            {post.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed italic">
            "{post.excerpt}"
          </p>
          <div className="flex items-center justify-center gap-6 pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-t border-primary/5">
            <span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> {post.author.name}</span>
            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> {post.readTime} Min Read</span>
            <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" /> {dayjs(post.publishedAt).format('MMM D, YYYY')}</span>
          </div>
        </header>

        {/* COVER IMAGE */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-primary/5 bg-muted">
            <Image 
              src={getCoverImage(post.coverImage?.url)} 
              alt={post.coverImage?.alt || post.title} 
              fill 
              className="object-cover" 
              priority 
              sizes="100vw"
            />
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="container mx-auto px-6 max-w-7xl pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            
            {/* MAIN STORY */}
            <div className="lg:col-span-8">
              <div 
                className="prose prose-lg md:prose-xl prose-stone max-w-none
                  prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                  prose-p:font-medium prose-p:leading-relaxed prose-p:text-muted-foreground
                  prose-a:text-primary prose-a:font-black prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-[2rem] prose-img:shadow-2xl prose-img:my-16
                  prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-[2rem] prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:italic
                  prose-strong:text-foreground prose-strong:font-black"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              
              {/* TAGS */}
              <div className="flex flex-wrap gap-2 mt-20 pt-12 border-t border-primary/5">
                {post.tags.map(tag => (
                  <Link key={tag} href={`/blog?tag=${tag}`} className="px-5 py-2.5 rounded-full bg-muted border border-border text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all">
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* SOCIAL SHARE */}
              <div className="mt-12 p-8 rounded-[2rem] bg-white border border-primary/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Share this Story</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Inspire others with artisanal heritage</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                    <button key={i} className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4 space-y-10">
              <div className="sticky top-28 space-y-10">
                
                {/* LINKED PIECES */}
                {post.linkedProducts?.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <Award className="h-5 w-5 text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Featured Pieces</h3>
                    </div>
                    <div className="space-y-6">
                      {post.linkedProducts.map((p: any) => (
                        <Link key={p.productId} href={`/products/${p.productSlug}`} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-all">
                          <div className="relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md border-2 border-white bg-muted">
                            <Image src={p.productImage} alt={p.productName} fill className="object-cover transition-transform group-hover:scale-110" sizes="80px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{p.productName}</p>
                            <p className="text-xs font-black text-primary mt-1 tracking-tight">₹{p.productPrice.toLocaleString()}</p>
                            <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                              View Piece <ChevronRight className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Button asChild className="w-full h-12 mt-8 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                      <Link href="/products">Shop All Creations</Link>
                    </Button>
                  </div>
                )}

                {/* NEWSLETTER */}
                <div className="bg-foreground rounded-[2.5rem] p-10 text-center space-y-6 relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
                  <div className="relative z-10">
                    <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold text-white leading-tight">Stay in the Loop</h3>
                    <p className="text-white/60 text-xs font-medium leading-relaxed">Join 2,000+ collectors. Get new stories and first-access to limited pieces.</p>
                    <div className="pt-6 space-y-3">
                      <input type="email" placeholder="Your email address" className="w-full h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-white text-xs focus:outline-none focus:border-primary transition-all placeholder:text-white/30" />
                      <Button className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">Subscribe</Button>
                    </div>
                  </div>
                </div>

                {/* BACK TO BLOG */}
                <Button asChild variant="ghost" className="w-full h-14 rounded-[1.5rem] border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-all font-black uppercase tracking-widest text-[10px]">
                  <Link href="/blog"><ChevronLeft className="h-4 w-4 mr-2" /> Back to Journal</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>

        {/* SUGGESTED POSTS */}
        {suggested.length > 0 && (
          <section className="bg-primary/5 py-24 border-y border-primary/5">
            <div className="container mx-auto px-6 max-w-7xl">
              <div className="flex items-center justify-between mb-16">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Continue Reading</span>
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">More from the Studio</h2>
                </div>
                <Button asChild variant="ghost" className="text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 px-6 rounded-full border border-primary/10 hidden md:flex">
                  <Link href="/blog" className="flex items-center gap-2">The Full Journal <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {suggested.map((s: any) => (
                  <Link key={s._id} href={`/blog/${s.slug}`} className="group space-y-6">
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-lg border-2 border-white bg-muted">
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
                      <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 pt-2 border-t border-primary/5"><Clock className="h-3 w-3" /> {s.readTime} MIN READ</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}