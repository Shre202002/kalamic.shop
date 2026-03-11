
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Palette, Hammer, Scale, Clock, Star, Shield, 
  Tag, Lock, Users, Package, CheckCircle2, ArrowRight, Sparkles, Heart, Zap, PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Framer Motion Variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        
        {/* SECTION 1 — HERO */}
        <section className="relative min-h-[85vh] flex items-center justify-center py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 pattern-paisley opacity-5" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto max-w-5xl relative z-10 text-center space-y-8">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-6"
            >
              <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
                <div className="h-px w-8 bg-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Our Story</span>
                <div className="h-px w-8 bg-accent" />
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-4xl md:text-7xl font-serif font-bold text-foreground leading-[1.1] tracking-tight text-balance">
                Every Curve Has a Memory. <br />
                <span className="italic font-normal text-primary">Every Piece Has a Soul.</span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto font-sans leading-relaxed font-medium">
                From a small studio in Lucknow to homes across India — this is the story of Kalamic. Handcrafted décor inspired by Indian heritage, refined for contemporary living.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-10 rounded-full gradient-saffron text-white font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  <Link href="/products">Explore Collection</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full border-primary/20 text-primary font-bold hover:bg-primary/5">
                  <Link href="#craftsmanship">Our Craftsmanship</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2 — STATS BAR */}
        <section className="bg-primary text-white py-12 md:py-20 relative">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-white/10 md:divide-x"
            >
              {[
                { val: "2,000+", lab: "Collectors Worldwide" },
                { val: "50+", lab: "Unique Designs" },
                { val: "4.8★", lab: "Average Rating" },
                { val: "100%", lab: "Handcrafted" },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={fadeUp} className="text-center space-y-2 px-4">
                  <h3 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter">{stat.val}</h3>
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-black opacity-80">{stat.lab}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION 3 — OUR BEGINNING */}
        <section className="py-20 md:py-32 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Our Beginning</span>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">It Started With a Broken Pillar</h2>
                </div>
                <div className="space-y-6 text-muted-foreground font-medium leading-relaxed">
                  <p>It was 2019. Our founder was renovating his family home in Lucknow, Uttar Pradesh — a city where Mughal architecture meets Awadhi craftsmanship at every corner.</p>
                  <p>During the renovation, workers removed an old carved wooden pillar (Stambh) that had stood for decades. It was cracked and discarded. That pillar wasn't just wood; it was a family memory, a symbol that said "this home has roots."</p>
                  <p className="text-foreground font-bold italic border-l-4 border-accent pl-6">"India was losing its decorative soul — one renovation at a time. Kalamic was founded to bring back meaning, reimagining traditional craftsmanship for modern living rooms."</p>
                  <p>The problem was clear: modern homes were becoming stylish, but cultural identity was disappearing. Mass production was replacing character with convenience. Kalamic was founded to fight that.</p>
                </div>
                <div className="h-1 w-20 bg-accent rounded-full" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white"
              >
                <Image 
                  src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" 
                  alt="Artisan studio" 
                  fill 
                  className="object-cover"
                  data-ai-hint="pottery artisan"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — BRAND TIMELINE */}
        <section className="py-20 md:py-32 bg-white/50">
          <div className="container mx-auto px-6 max-w-4xl text-center mb-20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4 block">Our Journey</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">From Studio to Your Space</h2>
          </div>
          
          <div className="container mx-auto px-6 max-w-5xl relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-accent/20 hidden md:block" />
            
            <div className="space-y-12 md:space-y-32">
              {[
                { year: "2019", title: "The Idea", desc: "A vision to revive traditional Indian ceramic art for modern homes after losing a family Stambh." },
                { year: "2021", title: "First Collection", desc: "Launched our first line of handcrafted Mor Stambh pillars and temple décor in Lucknow." },
                { year: "2022", title: "FragileCare™ Born", desc: "Developed our proprietary packaging system for safe ceramic transit across India." },
                { year: "2024", title: "Digital Studio", desc: "Launched kalamic.shop — bringing artisan ceramics directly to collectors worldwide." },
                { year: "2026", title: "Growing Community", desc: "2,000+ collectors across India trust Kalamic for authentic handcrafted art." },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-8 md:gap-20 relative",
                    idx % 2 === 0 ? "md:text-right" : "md:flex-row-reverse md:text-left"
                  )}
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="text-4xl md:text-6xl font-serif font-bold text-primary opacity-20">{item.year}</h3>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                  
                  <div className="h-4 w-4 rounded-full bg-accent border-4 border-background z-10 hidden md:block" />
                  
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5 — PHILOSOPHY (WHY CERAMIC) */}
        <section className="py-20 md:py-32 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Why Ceramic?</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Clay is India's oldest artistic medium.</h2>
              <p className="text-muted-foreground font-medium max-w-2xl mx-auto">From the Indus Valley to your home, ceramic remembers the hands that shaped it.</p>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
            >
              {[
                { icon: Palette, title: "Cultural Symbolism", desc: "Every motif tells a story of heritage and wisdom, rooted in 5,000 years of clay art." },
                { icon: Hammer, title: "Artisan Precision", desc: "Meticulous detail in every hand-carved curve. No two pieces are ever identical." },
                { icon: Scale, title: "Balanced Proportions", desc: "Harmony between traditional form and modern space. Designed for contemporary living." },
                { icon: Clock, title: "Timeless Aesthetics", desc: "Ceramic outlasts wood and fabric. It endures through generations, just like its stories." },
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  variants={fadeUp}
                  className="bg-card p-8 md:p-12 rounded-[2rem] border border-border hover:border-primary/30 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 group"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-3">{item.title}</h4>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION 6 — THE CRAFT */}
        <section id="craftsmanship" className="py-20 md:py-32 px-6 bg-white overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-lg"><Image src="https://images.unsplash.com/photo-1590502160462-0941847e090b?q=80&w=600" alt="Clay" fill className="object-cover" data-ai-hint="clay artisan" /></div>
                  <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-lg"><Image src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=600" alt="Detailing" fill className="object-cover" data-ai-hint="pottery detail" /></div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-lg"><Image src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" alt="Firing" fill className="object-cover" data-ai-hint="pottery firing" /></div>
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-lg"><Image src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" alt="Finishing" fill className="object-cover" data-ai-hint="pottery finishing" /></div>
                </div>
              </div>
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">The Journey From Clay</span>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Slow Craft. Made to Last.</h2>
                  <p className="text-muted-foreground font-medium leading-relaxed">Every product begins as a hand-drawn sketch. We call it slow craft — because speed is the enemy of quality in handmade art.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-1">01</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground">Design & Motif Selection</h4>
                      <p className="text-xs text-muted-foreground">Studying temple architecture and sacred geometry to balance authenticity with modern placement.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-1">04</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground">Carving & Embossing</h4>
                      <p className="text-xs text-muted-foreground">Hand-detailing leather-hard clay using loop tools. A Mor Stambh has thousands of individual carving marks.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-1">07</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground">Antique Glazing</h4>
                      <p className="text-xs text-muted-foreground">Layered application of oxide washes and transparent glazes fired at 1100°C for a durable, glossy finish.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Motif Cultural Meaning</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 pr-4 text-muted-foreground font-black">Motif</th>
                          <th className="py-2 pr-4 text-muted-foreground font-black">Cultural Meaning</th>
                          <th className="py-2 text-muted-foreground font-black">Used In</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr><td className="py-2 pr-4 text-primary font-bold">Mor (Peacock)</td><td className="py-2 pr-4">Grace, Beauty, Protection</td><td className="py-2">Mor Stambh</td></tr>
                        <tr><td className="py-2 pr-4 text-primary font-bold">Stambh (Pillar)</td><td className="py-2 pr-4">Stability, Sacred Threshold</td><td className="py-2">Pillars</td></tr>
                        <tr><td className="py-2 pr-4 text-primary font-bold">Mandala</td><td className="py-2 pr-4">Wholeness, Geometry</td><td className="py-2">Wall Art</td></tr>
                        <tr><td className="py-2 pr-4 text-primary font-bold">Owl</td><td className="py-2 pr-4">Wisdom, Prosperity</td><td className="py-2">Photo Frames</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="border-l-4 border-primary pl-6 italic text-muted-foreground font-medium text-lg">
                  "When you bring a Kalamic piece into your home, you're not adding an object — you're anchoring a story."
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* NEW SECTION — THE PEOPLE */}
        <section className="py-20 md:py-32 px-6 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-primary/5 rounded-[3rem] p-10 md:p-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">The People</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6">Artistry with Dignity</h2>
                <div className="space-y-6 text-muted-foreground font-medium">
                  <p>Kalamic works with a small, dedicated team of artisans based in Lucknow. Our artisans are not factory workers; they are master craftsmen trained in traditional clay-working techniques.</p>
                  <p>We believe the quality of a handcrafted piece is directly connected to the dignity of the person who made it. When you buy Kalamic, you are directly supporting Indian artisan livelihoods.</p>
                </div>
                <div className="flex gap-10 mt-10">
                  <div className="space-y-1">
                    <p className="text-2xl font-serif font-bold text-primary">Fair Pay</p>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Fixed Salaries</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-serif font-bold text-primary">Creative</p>
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Design Autonomy</p>
                  </div>
                </div>
              </motion.div>
              <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl">
                <Image src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1000" alt="Artisan at work" fill className="object-cover" data-ai-hint="pottery wheel" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — WHY KALAMIC (OUR PROMISE) */}
        <section className="py-20 md:py-32 px-6 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Our Promise</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">Authenticity, Handcrafted.</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                { icon: Star, title: "Genuine Authenticity", desc: "No machines. Variations in tone and texture are proof of human touch." },
                { icon: Shield, title: "Quality Above Scale", desc: "We would rather break a piece than let it reach you below our standards." },
                { icon: Clock, title: "Built for Longevity", desc: "Not décor you replace every season. Designed for permanence and heritage." },
                { icon: Lock, title: "Secure Systems", desc: "SSL-encrypted transactions and trusted Indian payment partners." },
                { icon: Users, title: "Verified Community", desc: "An authentic community of 2,000+ collectors across every major city." },
                { icon: Package, title: "FragileCare™ Shipping", desc: "Expert packaging designed for handcrafted ceramics with transit insurance." },
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ scale: 1.05 }}
                  className="bg-card p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <div className="h-12 w-12 rounded-full gradient-saffron text-white flex items-center justify-center mb-6 shadow-lg">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 — MISSION STATEMENT (CTA) */}
        <section className="py-20 md:py-40 px-6 relative overflow-hidden">
          <div className="absolute inset-0 gradient-maroon" />
          <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="container mx-auto max-w-4xl relative z-10 text-center text-white space-y-10"
          >
            <h2 className="text-4xl md:text-7xl font-serif font-bold tracking-tight leading-tight">Bring Meaning Back <br /> Into Your Space.</h2>
            <p className="text-lg md:text-2xl opacity-80 max-w-2xl mx-auto font-medium italic">"Every piece tells a story. Your home deserves one."</p>
            <div className="pt-6">
              <Button asChild size="lg" className="h-16 px-12 rounded-full bg-accent hover:bg-accent/90 text-foreground font-black text-lg shadow-2xl transition-all active:scale-95">
                <Link href="/products" className="flex items-center gap-3">
                  Explore Our Collection <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* SECTION 9 — Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Kalamic',
              url: 'https://kalamic.shop',
              logo: 'https://kalamic.shop/logo.png',
              description: 'Handcrafted ceramic art inspired by Indian heritage.',
              foundingDate: '2019',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Lucknow',
                addressRegion: 'Uttar Pradesh',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+91-6387562920',
                contactType: 'customer service',
                availableLanguage: ['English', 'Hindi'],
              },
              sameAs: [
                'https://www.instagram.com/kala_mic_04/'
              ],
            }),
          }}
        />
      </main>
      
      <Footer />
    </div>
  );
}
