
import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
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
  Scale,
  Fingerprint,
  CreditCard,
  BarChart3,
  Cookie,
  UserPlus
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read Kalamic\'s Privacy Policy. Learn how we collect, use and protect your personal data in compliance with India\'s DPDP Act 2023.',
  alternates: { canonical: 'https://www.kalamic.shop/privacy' },
  robots: { index: true, follow: true },
};

const BUSINESS_LOCATION = "Kidwai Nagar, Kanpur, Uttar Pradesh, India";
const SUPPORT_EMAIL = "kalamicshop@gmail.com";
const SUPPORT_PHONE = "+91 73767 61679";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" /> Digital Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight uppercase">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Effective Date: July 12, 2026 <br />
              Last Updated: July 13, 2026
            </p>
          </div>

          <div className="space-y-12">
            
            {/* 1. Introduction & Business Info */}
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border shadow-sm space-y-6">
              <div className="flex items-center gap-4 text-primary">
                <Scale className="h-8 w-8" />
                <h2 className="text-2xl font-black uppercase tracking-tight">1. Business Information</h2>
              </div>
              <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed font-medium">
                <p>Kalamic respects your privacy and is committed to handling personal data transparently, securely and responsibly.</p>
                <p>This website is operated by <strong>Kalamic</strong>, based in {BUSINESS_LOCATION}. For any privacy-related inquiries or grievances, please reach us at {SUPPORT_EMAIL}.</p>
              </div>
            </section>

            {/* 2. Scope & Data Collection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Database className="h-6 w-6" />
                  <h3 className="text-lg font-black uppercase">Data We Collect</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-3 font-medium list-disc pl-4">
                  <li><strong>Identity:</strong> Name, email, and contact number.</li>
                  <li><strong>Delivery:</strong> Addresses and location data for fulfilment.</li>
                  <li><strong>Technical:</strong> IP address, browser type, and device info.</li>
                  <li><strong>Interaction:</strong> Product views and cart activity.</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <CreditCard className="h-6 w-6" />
                  <h3 className="text-lg font-black uppercase">Payment Safety</h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Payments are processed via <strong>Razorpay</strong>. Kalamic does not store complete card numbers, CVVs, or UPI PINs.
                </p>
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-[10px] uppercase font-bold text-primary tracking-wider">
                  ⚠️ Never share your banking passwords or OTPs with us.
                </div>
              </div>
            </div>

            {/* 3. Google Analytics */}
            <section className="bg-foreground text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4 text-primary">
                  <BarChart3 className="h-8 w-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">2. Google Analytics</h2>
                </div>
                <div className="space-y-4 text-white/80 font-medium leading-relaxed">
                  <p>We use Google Analytics 4 (ID: G-LB5YT7T165) to understand website usage and improve your experience. This tool processes pseudonymous data like referral sources and product interactions.</p>
                  <p>Google Analytics is configured not to receive personally identifiable information (PII) such as your name or email. You may opt out using Google’s Analytics opt-out browser add-on.</p>
                </div>
              </div>
            </section>

            {/* 4. Cookies */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-primary px-4">
                <Cookie className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-widest">3. Cookies & Technologies</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h4 className="font-bold text-primary text-sm mb-2">Essential</h4>
                  <p className="text-xs text-muted-foreground">Required for shopping cart, checkout, and authentication. These cannot be disabled.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h4 className="font-bold text-primary text-sm mb-2">Analytics</h4>
                  <p className="text-xs text-muted-foreground">Helps us count visitors and identify popular artisanal pieces.</p>
                </div>
              </div>
            </section>

            {/* 5. Sharing & Retention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Globe className="h-6 w-6" />
                  <h3 className="text-lg font-black uppercase">International</h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Kalamic serves collectors worldwide. Order info is shared with customs and logistics providers as necessary to deliver international orders.
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Clock className="h-6 w-6" />
                  <h3 className="text-lg font-black uppercase">Retention</h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Financial records are retained for 7 years as per Indian law. Account data is kept until requested for deletion or 3 years of inactivity.
                </p>
              </div>
            </div>

            {/* 6. Rights */}
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border shadow-sm space-y-8">
              <div className="flex items-center gap-4 text-primary">
                <UserCheck className="h-8 w-8" />
                <h2 className="text-2xl font-black uppercase tracking-tight">4. Your Privacy Rights</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  "Request access to your personal data",
                  "Correction of inaccurate information",
                  "Erasure of data no longer required",
                  "Withdrawal of processing consent",
                  "Nomination of a representative",
                  "Grievance redressal"
                ].map((right, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{right}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact & Grievance */}
            <div className="mt-24 p-10 md:p-16 rounded-[3rem] bg-primary text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <Fingerprint className="h-12 w-12 mx-auto opacity-50 mb-4" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Privacy & Grievance</h2>
                <p className="text-white/80 font-medium text-lg max-w-lg mx-auto">Our Data Governance team is here to help you.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 text-left">
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Email Rights</p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-bold hover:underline">{SUPPORT_EMAIL}</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Telephone</p>
                    <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="text-sm font-bold hover:underline">{SUPPORT_PHONE}</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Registered Base</p>
                    <p className="text-sm font-bold">Kanpur, UP, India</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12">
                  <Button asChild variant="outline" className="h-14 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-primary font-black px-10 transition-all">
                    <a href="/contact">Message Data Desk</a>
                  </Button>
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
