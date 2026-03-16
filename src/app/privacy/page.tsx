
import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  Clock, 
  Globe, 
  Server, 
  AlertCircle,
  MessageCircle,
  Scale
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kalamic',
  description: 'Read Kalamic\'s Privacy Policy. Learn how we collect, use and protect your personal data in compliance with India\'s DPDP Act 2023.',
  alternates: { canonical: 'https://kalamic.shop/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" /> Digital Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight uppercase">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Effective Date: March 11, 2026 <br />
              Last Updated: March 11, 2026
            </p>
          </div>

          <div className="space-y-12 bg-white p-8 md:p-16 rounded-[3rem] shadow-xl border border-primary/5">
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <Scale className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">1. Introduction</h2>
              </div>
              <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed font-medium">
                <p>Kalamic ("we", "our", "us") is an e-commerce platform selling handcrafted ceramic art products. This Privacy Policy explains how we collect, use, store, and protect your personal data when you visit <strong>kalamic.shop</strong>.</p>
                <p>By using our platform, you agree to the terms of this Privacy Policy in accordance with the <strong>DPDP Act, 2023</strong>.</p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4 text-primary"><Database className="h-6 w-6" /><h2 className="text-xl font-black uppercase tracking-tight">2. Data We Collect</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 p-6 rounded-2xl bg-primary/[0.02] border border-primary/5">
                  <h3 className="text-sm font-black uppercase text-primary tracking-widest">2.1 Information You Provide</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4 font-medium">
                    <li>Full name and contact number</li>
                    <li>Email address and delivery location</li>
                    <li>Messages sent via contact form</li>
                  </ul>
                </div>
                <div className="space-y-3 p-6 rounded-2xl bg-primary/[0.02] border border-primary/5">
                  <h3 className="text-sm font-black uppercase text-primary tracking-widest">2.2 Automatic Data</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4 font-medium">
                    <li>Device type and browser information</li>
                    <li>Interaction analytics and session data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary"><Clock className="h-6 w-6" /><h2 className="text-xl font-black uppercase tracking-tight">3. Retention</h2></div>
              <p className="text-sm text-muted-foreground font-medium">Order and payment records are retained for 7 years as per Indian regulatory requirements.</p>
            </section>

            <div className="mt-24 p-10 md:p-16 rounded-[3rem] bg-primary text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <MessageCircle className="h-12 w-12 mx-auto opacity-50 mb-4" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Privacy Queries?</h2>
                <p className="text-white/80 font-medium text-lg max-w-lg mx-auto">Our Data Governance team is here to help you understand your rights.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <a href="mailto:support@kalamic.shop" className="h-14 rounded-2xl border border-white text-white flex items-center justify-center bg-transparent hover:bg-white hover:text-primary font-black px-10 transition-all">Email Support</a>
                </div>
              </div>
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
