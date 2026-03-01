"use client"

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      title: "Data We Collect",
      icon: Database,
      content: "We collect information necessary to process your artisan orders, including your name, email address, delivery destination, and contact number. Payment data is processed securely through Cashfree and is never stored on our servers."
    },
    {
      title: "Usage of Information",
      icon: Eye,
      content: "Your information is used solely to curate and deliver your acquisitions, provide order tracking updates, and improve our handcrafted collection offerings based on your preferences."
    },
    {
      title: "Security Protocols",
      icon: Lock,
      content: "We employ industry-standard SSL encryption to protect your digital footprint. Access to collector data is strictly limited to authorized personnel responsible for order fulfillment and support."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" /> Digital Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Last Updated: May 2024. Your trust is as valuable as the art we create.
            </p>
          </div>

          <div className="space-y-12 bg-white p-8 md:p-16 rounded-[3rem] shadow-xl border">
            <div className="prose prose-stone max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                At Kalamic, we respect your privacy and are committed to protecting it. This policy outlines how we handle the personal information you provide when using our storefront.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sections.map((s, i) => (
                <div key={i} className="space-y-4 p-6 rounded-3xl bg-primary/[0.02] border border-primary/5">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{s.content}</p>
                </div>
              ))}
            </div>

            <div className="prose prose-stone max-w-none pt-8 space-y-6">
              <h2 className="text-2xl font-black text-primary">Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies to maintain your session, remember your bag contents, and provide a seamless checkout experience. You can disable cookies in your browser settings, though some functionality may be limited.
              </p>
              
              <h2 className="text-2xl font-black text-primary">Contact Governance</h2>
              <p className="text-muted-foreground">
                For any queries regarding your data or to request data removal, please contact our Governance team at <span className="font-bold text-primary">contact@kalamic.shop</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
