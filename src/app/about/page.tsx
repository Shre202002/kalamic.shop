
'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Heart, 
  Sparkles, 
  Users, 
  Quote, 
  ArrowRight,
  Gem,
  Palette,
  Eye,
  History
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE9]">
      <Navbar />
      <main className="flex-1">
        
        {/* 1. HERO SECTION */}
        <section className="relative py-20 lg:py-32 overflow-hidden border-b border-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                  <Sparkles className="h-3 w-3" /> Crafting Culture
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-semibold text-primary leading-[1.1] tracking-tight">
                  Preserving Culture. <br />
                  <span className="italic">Designing for</span> <br />
                  Modern Homes.
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl font-body">
                  Handcrafted décor inspired by Indian heritage, refined for contemporary living. Every piece carries the warmth of skilled hands and the weight of cultural memory.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white h-14 px-8 rounded-xl font-bold">
                    <Link href="/products">Explore Collection</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 h-14 px-8 rounded-xl font-bold">
                    <Link href="#craftsmanship">Our Craftsmanship</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
                <Image 
                  src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" 
                  alt="Artisan at work" 
                  fill 
                  className="object-cover"
                  priority
                  data-ai-hint="pottery artisan"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. BRAND STORY SECTION */}
        <section className="py-24 bg-white/50">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-10">
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary/60">Our Beginning</h2>
              <h3 className="text-4xl md:text-5xl font-display font-semibold text-primary tracking-tight">Reviving the Soul of Decor</h3>
            </div>
            <div className="prose prose-stone max-w-none space-y-6 text-lg text-muted-foreground leading-relaxed font-medium italic">
              <p>
                Kalamic was born from a simple realization — modern homes were becoming stylish, but cultural identity was slowly disappearing from their walls.
              </p>
              <p>
                We grew up surrounded by carved pillars, temple motifs, handcrafted décor, and sacred symbolism. Today, mass production dominates interiors, replacing character with convenience.
              </p>
              <p className="text-primary font-bold not-italic text-2xl border-y border-primary/10 py-8">
                Kalamic was created to bring back meaning.
              </p>
              <p>
                We reimagine traditional Indian craftsmanship and present it in a way that fits seamlessly into modern spaces — without losing its soul.
              </p>
            </div>
          </div>
        </section>

        {/* 3. PHILOSOPHY SECTION */}
        <section className="py-24 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <div className="pattern-paisley w-full h-full" />
          </div>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Our Philosophy</h2>
                <h3 className="text-4xl md:text-6xl font-display font-semibold leading-tight">
                  Décor is not just decoration. <br />
                  <span className="text-accent italic">It is identity.</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { icon: Sparkles, title: "Cultural Symbolism", desc: "Every motif tells a story of heritage." },
                    { icon: Gem, title: "Artisan Precision", desc: "Meticulous detail in every hand-carved curve." },
                    { icon: Eye, title: "Balanced Proportions", desc: "Harmony between traditional form and modern space." },
                    { icon: History, title: "Timeless Aesthetics", desc: "Designed for permanence, not for trends." }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <item.icon className="h-6 w-6 text-accent" />
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-white/70 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative aspect-square lg:aspect-[4/3] bg-white/10 rounded-[3rem] backdrop-blur-sm border border-white/20 p-8 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <Quote className="h-12 w-12 text-accent mx-auto opacity-50" />
                  <p className="text-2xl md:text-3xl font-display font-medium leading-relaxed italic">
                    "When you bring a Kalamic piece into your home, you’re not adding an object — you’re anchoring a story."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CRAFTSMANSHIP SECTION */}
        <section id="craftsmanship" className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl mt-12">
                  <Image src="https://images.unsplash.com/photo-1590502160462-0941847e090b?q=80&w=600" alt="Detailing" fill className="object-cover" data-ai-hint="pottery detail" />
                </div>
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
                  <Image src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=600" alt="Texture" fill className="object-cover" data-ai-hint="ceramic texture" />
                </div>
              </div>
              <div className="w-full lg:w-1/2 space-y-8">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary/60">The Craft</h2>
                <h3 className="text-4xl md:text-5xl font-display font-semibold text-primary tracking-tight">Quality Over Scale</h3>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  Each product is thoughtfully designed and finished with traditional methods. From Mor Stambh pillars to handcrafted décor accents, every piece undergoes careful inspection before reaching you.
                </p>
                <ul className="space-y-4">
                  {[
                    "Detailing & texture refinement",
                    "Structural durability for generations",
                    "Proportional balance for modern interiors",
                    "Premium finishing standards",
                    "Functional placement consideration"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 font-bold text-primary">
                      <CheckCircle2 className="h-5 w-5 text-[#C97A40]" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHY KALAMIC SECTION */}
        <section className="py-24 bg-[#E8DFC9]/30">
          <div className="container mx-auto px-4 text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary/60">Why Kalamic?</h2>
              <h3 className="text-4xl font-display font-semibold text-primary">Tradition, Refined for Today</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Palette, title: "Premium Standards", desc: "Fine detailing and textured finishes that evoke warmth." },
                { icon: ShieldCheck, title: "Quality Control", desc: "Each piece is hand-inspected before its journey to you." },
                { icon: Gem, title: "Transparent Pricing", desc: "Honest value for genuine artisanal craftsmanship." },
                { icon: ShieldCheck, title: "Secure Systems", desc: "SSL-encrypted transactions and trusted payment partners." },
                { icon: Users, title: "Verified Reviews", desc: "An authentic community of 2,000+ collectors." },
                { icon: Truck, title: "FragileCare™ Shipping", desc: "Expert packaging designed for handcrafted ceramics." }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-[2rem] bg-white shadow-sm border border-primary/5 space-y-4 hover:shadow-xl transition-all group">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-black text-primary uppercase tracking-wider text-xs">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. LIFESTYLE SECTION */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden p-8 md:p-20 border border-primary/5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h3 className="text-4xl md:text-5xl font-display font-semibold text-primary leading-tight">Designed for <br />Meaningful Spaces</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      "Mandir décor", "Festive setups", "Wedding styling", 
                      "Entryway accents", "Cultural gifting", "Statement interiors"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                        <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-primary font-bold italic border-l-4 border-accent pl-6 text-lg">
                    Rooted in heritage. Designed for today.
                  </p>
                </div>
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-inner bg-muted">
                  <Image src="https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=1000" alt="Lifestyle" fill className="object-cover" data-ai-hint="mandala wall decor" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. MISSION & VISION */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="p-12 rounded-[3rem] bg-[#F5EFE9] space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Our Mission</h4>
                <p className="text-2xl font-display font-medium text-primary leading-relaxed">
                  To preserve Indian artisanal craftsmanship while elevating it to contemporary design standards.
                </p>
              </div>
              <div className="p-12 rounded-[3rem] bg-primary text-white space-y-6 shadow-2xl">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Our Vision</h4>
                <p className="text-2xl font-display font-medium leading-relaxed">
                  To build a globally recognized brand where tradition, design, and digital innovation coexist seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FOUNDER SECTION */}
        <section className="py-24 bg-[#F5EFE9]">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-white shadow-xl shrink-0">
                <Image src="https://picsum.photos/seed/founder/200/200" alt="Founder" fill className="object-cover" />
              </div>
              <div className="space-y-6 text-center md:text-left">
                <h3 className="text-2xl font-display font-semibold text-primary">A Note from the Founder</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed italic">
                  <p>"Kalamic began as more than a business idea. It was a response to the fading presence of cultural artistry in modern homes."</p>
                  <p>"Our goal is not to scale rapidly. Our goal is to scale responsibly. Every decision we make reflects long-term vision, not short-term sales."</p>
                </div>
                <p className="font-bold text-primary uppercase tracking-widest text-xs">— Founder, Kalamic</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. CTA SECTION */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center space-y-10 relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-semibold text-primary tracking-tight">
              Bring Meaning Back <br className="hidden md:block" /> Into Your Space.
            </h2>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white h-16 px-12 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-primary/20 transition-all active:scale-95 group">
              <Link href="/products" className="flex items-center gap-3">
                Explore Our Collection <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none" />
        </section>

      </main>
      <Footer />
    </div>
  );
}
