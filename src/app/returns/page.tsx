"use client"

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  RefreshCcw, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Camera, 
  MessageCircle, 
  Mail, 
  Clock, 
  ShieldCheck,
  Ban,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReturnsPage() {
  const eligibility = [
    { cond: "Item received damaged", eligible: true, time: "Within 48 hours" },
    { cond: "Item received broken", eligible: true, time: "Within 48 hours" },
    { cond: "Wrong item delivered", eligible: true, time: "Within 48 hours" },
    { cond: "Significantly different from listing", eligible: true, time: "Within 7 days" },
    { cond: "Change of mind", eligible: false, time: "Not applicable" },
    { cond: "Minor natural variations", eligible: false, time: "Not applicable" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <RefreshCcw className="h-3 w-3" /> Piece Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Returns & Refunds</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Effective Date: March 11, 2026. <br className="hidden sm:block" />
              Our commitment to ensuring your handcrafted treasures arrive safely.
            </p>
          </div>

          <div className="space-y-12">
            
            {/* Commitment Section */}
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-8 md:p-12 space-y-6">
                <div className="flex items-center gap-4 text-primary">
                  <ShieldCheck className="h-8 w-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">1. Our Commitment</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                  At Kalamic, every piece is handcrafted with care and shipped with our <span className="text-primary font-bold italic">FragileCare™</span> packaging system. We stand behind the quality of our artisan ceramics and want you to be completely satisfied with your purchase.
                </p>
              </CardContent>
            </Card>

            {/* Eligibility Table */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-primary px-4">
                <Clock className="h-6 w-6" />
                <h2 className="text-xl font-black uppercase tracking-widest">2. Eligibility Window</h2>
              </div>
              <div className="overflow-x-auto rounded-[2.5rem] border shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary/[0.03]">
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground border-b">Condition</th>
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground border-b text-center">Eligible</th>
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground border-b">Timeframe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibility.map((row, i) => (
                      <tr key={i} className="hover:bg-primary/[0.01] transition-colors">
                        <td className="p-6 border-b font-bold text-foreground text-sm">{row.cond}</td>
                        <td className="p-6 border-b text-center">
                          {row.eligible ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase px-3 py-1">Yes</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] font-black uppercase px-3 py-1">No</Badge>
                          )}
                        </td>
                        <td className="p-6 border-b text-muted-foreground font-medium text-sm">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4 items-start mx-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Important:</strong> Since all products are handcrafted, minor variations in texture, color shade, and pattern are natural and not considered defects.
                </p>
              </div>
            </div>

            {/* Non-returnable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-[#1E1E1E] text-white">
                <CardContent className="p-8 md:p-10 space-y-6">
                  <div className="flex items-center gap-4 text-primary">
                    <Ban className="h-8 w-8" />
                    <h2 className="text-xl font-black uppercase tracking-widest">3. Non-Returnable</h2>
                  </div>
                  <ul className="space-y-4 text-sm opacity-80 font-medium list-disc pl-5">
                    <li>Items damaged due to mishandling after delivery</li>
                    <li>Items without original packaging</li>
                    <li>Customized or personalized orders (Custom Mor Stambh, etc.)</li>
                    <li>Items reported after 48 hours of delivery (for damage claims)</li>
                    <li>Items where damage proof is not provided</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="space-y-6 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-primary">
                  <HelpCircle className="h-8 w-8" />
                  <h2 className="text-xl font-black uppercase tracking-widest">4. How to Request</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Camera, text: "Step 1: Document damage with photos/videos of product, packaging, and label." },
                    { icon: Mail, text: "Step 2: Email support@kalamic.shop or WhatsApp us within 48 hours." },
                    { icon: Clock, text: "Step 3: Await confirmation from our team (24-48 business hours)." },
                    { icon: Truck, text: "Step 4: If approved, ship the item back in original packaging." }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Refund Timeline */}
            <Card className="rounded-[3rem] border-2 border-primary/10 shadow-none bg-white">
              <CardContent className="p-8 md:p-12 space-y-8">
                <div className="flex items-center gap-4 text-primary">
                  <RefreshCcw className="h-8 w-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">5. Refund Policy</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { method: "UPI / Net Banking", time: "5–7 Business Days" },
                    { method: "Credit / Debit Card", time: "7–10 Business Days" },
                    { method: "Wallet", time: "3–5 Business Days" }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-primary/[0.03] border text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{item.method}</p>
                      <p className="text-lg font-black text-primary">{item.time}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-medium text-center italic">
                  *Refunds are always processed to the original payment source.
                </p>
              </CardContent>
            </Card>

            {/* Final Contact CTA */}
            <div className="mt-24 p-10 md:p-16 rounded-[3rem] bg-primary text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <MessageCircle className="h-12 w-12 mx-auto opacity-50 mb-4" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Still have questions?</h2>
                <p className="text-white/80 font-medium text-lg max-w-lg mx-auto">Our artisans are happy to help. Support hours: Mon–Sat, 10 AM – 6 PM IST.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                  <Button asChild variant="outline" className="h-14 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-primary font-black px-10">
                    <a href="mailto:support@kalamic.shop">Email Support</a>
                  </Button>
                  <Button asChild className="h-14 rounded-2xl bg-black text-white hover:bg-black/80 font-black px-10 border-none shadow-xl">
                    <a href="https://wa.me/916387562920" target="_blank">Chat on WhatsApp</a>
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
