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
  Mail,
  MessageSquare,
  Scale
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kalamic',
  description: 'Read Kalamic\'s Privacy Policy. Learn how we collect, use and protect your personal data in compliance with India\'s DPDP Act 2023.',
  alternates: {
    canonical: 'https://kalamic.shop/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Header Section */}
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
            
            {/* 1. Introduction */}
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <Scale className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">1. Introduction</h2>
              </div>
              <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed font-medium">
                <p>
                  Kalamic ("we", "our", "us") is an e-commerce platform selling handcrafted ceramic art products. This Privacy Policy explains how we collect, use, store, and protect your personal data when you visit <strong>kalamic.shop</strong> or make a purchase from us.
                </p>
                <p>
                  By using our platform, you agree to the terms of this Privacy Policy in accordance with the <strong>Information Technology Act, 2000</strong> and the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>.
                </p>
              </div>
            </section>

            {/* 2. Data We Collect */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-primary">
                <Database className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">2. Data We Collect</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 p-6 rounded-2xl bg-primary/[0.02] border border-primary/5">
                  <h3 className="text-sm font-black uppercase text-primary tracking-widest">2.1 Information You Provide</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4 font-medium">
                    <li>Full name and contact number</li>
                    <li>Email address</li>
                    <li>Delivery address including city, state, pincode, and landmark</li>
                    <li>Product reviews and feedback including photos</li>
                    <li>Messages sent via contact form or WhatsApp</li>
                  </ul>
                </div>
                <div className="space-y-3 p-6 rounded-2xl bg-primary/[0.02] border border-primary/5">
                  <h3 className="text-sm font-black uppercase text-primary tracking-widest">2.2 Information Collected Automatically</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4 font-medium">
                    <li>Device type, browser, and operating system</li>
                    <li>IP address and approximate location</li>
                    <li>Pages visited and time spent on site</li>
                    <li>Cart activity and wishlist items</li>
                    <li>Product views and interaction analytics</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4 items-start">
                <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest">2.3 Payment Information</h3>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Payment is processed entirely by <strong>Cashfree Payments</strong>. We do NOT store any card numbers, UPI IDs, or banking credentials on our servers. Only the transaction ID and payment status are stored for order verification.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. How We Use Your Data */}
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <Eye className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">3. How We Use Your Data</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
                {[
                  "Processing and delivering your orders",
                  "Sending order confirmation and tracking updates",
                  "Verifying payment and preventing fraud",
                  "Improving our product offerings",
                  "Responding to support queries",
                  "Complying with legal obligations"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-primary font-bold pt-4">We do NOT sell, rent, or trade your personal data to any third party for marketing purposes.</p>
            </section>

            {/* 4. Third Party Services */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-primary">
                <Globe className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">4. Third Party Services We Use</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-primary/[0.03]">
                      <th className="p-4 font-black uppercase tracking-widest text-muted-foreground border-b">Service</th>
                      <th className="p-4 font-black uppercase tracking-widest text-muted-foreground border-b">Purpose</th>
                      <th className="p-4 font-black uppercase tracking-widest text-muted-foreground border-b">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-muted-foreground">
                    {[
                      { s: "Firebase (Google)", p: "Authentication, cart & wishlist", link: "firebase.google.com/support/privacy" },
                      { s: "Cashfree Payments", p: "Payment processing", link: "cashfree.com/privacy-policy" },
                      { s: "ImageKit", p: "Product & review image storage", link: "imagekit.io/privacy-policy" },
                      { s: "Vercel / Google Cloud", p: "Hosting & infrastructure", link: "vercel.com/legal/privacy-policy" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-primary/[0.01]">
                        <td className="p-4 border-b font-bold text-foreground">{row.s}</td>
                        <td className="p-4 border-b">{row.p}</td>
                        <td className="p-4 border-b text-primary underline truncate max-w-[150px] md:max-w-none">{row.link}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <Server className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">5. Cookies & Local Storage</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                We use cookies to maintain your login session (Firebase Auth), remember your bag contents, and track page performance. You can disable cookies in your browser settings, though some functionality may be limited.
              </p>
            </section>

            {/* 6. Retention */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-primary">
                <Clock className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">6. Data Storage & Retention</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-primary/[0.03]">
                      <th className="p-4 font-black uppercase tracking-widest text-muted-foreground border-b">Data Type</th>
                      <th className="p-4 font-black uppercase tracking-widest text-muted-foreground border-b">Storage</th>
                      <th className="p-4 font-black uppercase tracking-widest text-muted-foreground border-b">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-muted-foreground">
                    {[
                      { t: "Account & Auth", s: "Firebase (Google Cloud)", r: "Until account deletion" },
                      { t: "Order Records", s: "MongoDB Atlas", r: "7 years (Legal requirement)" },
                      { t: "Payment Records", s: "Cashfree + our DB", r: "7 years (RBI requirement)" },
                      { t: "Product Images", s: "ImageKit CDN", r: "Until product removal" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-primary/[0.01]">
                        <td className="p-4 border-b font-bold text-foreground">{row.t}</td>
                        <td className="p-4 border-b">{row.s}</td>
                        <td className="p-4 border-b">{row.r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Your Rights */}
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <UserCheck className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">7. Your Rights Under DPDP Act 2023</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-muted-foreground font-medium">
                {[
                  { title: "Access", desc: "Request a copy of data we hold about you" },
                  { title: "Correction", desc: "Request correction of inaccurate data" },
                  { title: "Erasure", desc: "Request deletion of your personal data" },
                  { title: "Grievance", desc: "File a complaint with our Grievance Officer" },
                  { title: "Nomination", desc: "Nominate a person to exercise rights on your behalf" }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-primary/[0.02] border border-primary/5">
                    <h4 className="font-black uppercase text-[10px] text-primary mb-1">{item.title}</h4>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground pt-4">To exercise any of these rights, email us at <span className="font-bold text-primary">support@kalamic.shop</span> with subject line <span className="italic">DATA REQUEST - [Your Name]</span>.</p>
            </section>

            {/* 8. Data Security */}
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <Lock className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">8. Data Security</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                We implement SSL/TLS encryption on all pages (HTTPS), use Firebase Authentication for secure logins, and restrict access to customer data to authorized personnel only. Regular security audits are conducted on our infrastructure.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <AlertCircle className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">9. Children's Privacy</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Our platform is not directed at children under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately.
              </p>
            </section>

            {/* 11. Grievance Officer */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-primary">
                <Scale className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-tight">11. Grievance Officer</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <tbody className="font-medium text-muted-foreground">
                    <tr>
                      <td className="p-4 border-b font-black uppercase tracking-widest text-muted-foreground bg-primary/[0.03] w-1/3">Name</td>
                      <td className="p-4 border-b font-bold text-foreground">Sriyansh Gupta</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-b font-black uppercase tracking-widest text-muted-foreground bg-primary/[0.03]">Designation</td>
                      <td className="p-4 border-b">Grievance Officer</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-b font-black uppercase tracking-widest text-muted-foreground bg-primary/[0.03]">Email</td>
                      <td className="p-4 border-b text-primary font-bold">support@kalamic.shop</td>
                    </tr>
                    <tr>
                      <td className="p-4 border-b font-black uppercase tracking-widest text-muted-foreground bg-primary/[0.03]">Response Time</td>
                      <td className="p-4 border-b">Within 30 days of receiving complaint</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 12. Contact Us */}
            <div className="mt-24 p-10 md:p-16 rounded-[3rem] bg-primary text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <MessageCircle className="h-12 w-12 mx-auto opacity-50 mb-4" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Privacy Queries?</h2>
                <p className="text-white/80 font-medium text-lg max-w-lg mx-auto">Our Data Governance team is here to help you understand your rights.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <a href="mailto:support@kalamic.shop" className="h-14 rounded-2xl border border-white text-white flex items-center justify-center bg-transparent hover:bg-white hover:text-primary font-black px-10 transition-all">
                    Email Support
                  </a>
                  <a href="https://wa.me/916387562920" target="_blank" className="h-14 rounded-2xl bg-black text-white flex items-center justify-center hover:bg-black/80 font-black px-10 border-none shadow-xl transition-all">
                    WhatsApp Officer
                  </a>
                </div>
              </div>
              <div className="absolute inset-0 pattern-paisley opacity-5 pointer-events-none scale-150" />
            </div>

          </div>
          
          <div className="text-center mt-12">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
              © 2026 Kalamic Ceramic Studio. All rights reserved.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
