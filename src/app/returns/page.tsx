
"use client"

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  RefreshCcw, 
  Truck, 
  AlertCircle, 
  Camera, 
  MessageCircle, 
  Clock, 
  ShieldCheck,
  Ban,
  HelpCircle,
  Package,
  FileText,
  Eye,
  CreditCard,
  PenTool,
  XCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <RefreshCcw className="h-3 w-3" /> Piece Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight uppercase">Return and Replacement Policy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Last updated: 12 July 2026. <br className="hidden sm:block" />
              At Kalamic, each ceramic product is carefully inspected and securely packaged before dispatch. 
            </p>
          </div>

          <div className="space-y-12">
            {/* Introduction Card */}
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-8 md:p-12 space-y-6">
                <div className="flex items-center gap-4 text-primary">
                  <ShieldCheck className="h-8 w-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">Handcrafted Excellence</h2>
                </div>
                <div className="prose prose-stone max-w-none text-muted-foreground leading-relaxed font-medium">
                  <p>
                    Because our products are handcrafted and fragile, we currently accept return requests only for products that arrive damaged, defective, incorrect, or materially different from the product ordered.
                  </p>
                  <p className="bg-destructive/5 text-destructive p-4 rounded-2xl border border-destructive/10 text-sm">
                    <strong>Note:</strong> We do not accept returns or exchanges for change of mind, personal preference, minor colour or texture variations inherent in handcrafted products, or incorrect measurements selected by the customer.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Policy Sections */}
            <div className="grid grid-cols-1 gap-8">
              
              {/* 1. Eligibility */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-primary px-4">
                  <Sparkles className="h-6 w-6" />
                  <h2 className="text-xl font-black uppercase tracking-widest">1. Eligibility for replacement</h2>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4 text-muted-foreground font-medium">
                  <p>A replacement request may be accepted if:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The product arrived broken, cracked, chipped or otherwise damaged.</li>
                    <li>The product has a manufacturing defect that materially affects its appearance or intended use.</li>
                    <li>The customer received a product different from the item confirmed in the order.</li>
                    <li>A component or item included in the confirmed order is missing.</li>
                    <li>The product is materially different from its description on Kalamic.shop.</li>
                  </ul>
                  <p className="italic text-sm pt-2 border-t">
                    Natural variations in colour, glaze, texture, pattern, dimensions and handcrafted detailing are characteristics of handmade ceramic products and are not normally considered defects.
                  </p>
                </div>
              </section>

              {/* 2. Reporting Period */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-primary px-4">
                  <Clock className="h-6 w-6" />
                  <h2 className="text-xl font-black uppercase tracking-widest">2. Reporting period</h2>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium">
                  <p>Customers must contact Kalamic within <strong>7 calendar days</strong> of delivery.</p>
                  <p className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    For transit-damage claims, customers should preferably contact us within <strong>48 hours</strong> of delivery so that we can promptly raise the matter with the courier.
                  </p>
                </div>
              </section>

              {/* 3. Evidence Required */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-primary px-4">
                  <Camera className="h-6 w-6" />
                  <h2 className="text-xl font-black uppercase tracking-widest">3. Evidence required</h2>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium space-y-4">
                  <p>To help us review the request, please provide:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
                      <FileText className="h-5 w-5 text-primary mt-1 shrink-0" />
                      <p className="text-sm">Order number & Registered contact details</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
                      <Camera className="h-5 w-5 text-primary mt-1 shrink-0" />
                      <p className="text-sm">Clear photos of damaged product & external shipping box</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
                      <Package className="h-5 w-5 text-primary mt-1 shrink-0" />
                      <p className="text-sm">Photos of internal protective packaging & shipping label</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
                      <MessageCircle className="h-5 w-5 text-primary mt-1 shrink-0" />
                      <p className="text-sm">An unedited parcel-opening video (where available)</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. & 5. Review and Process */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary px-4">
                    <Eye className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">4. Claim review</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium text-sm leading-relaxed">
                    We aim to acknowledge requests within two business days and communicate the result within five business days after receiving all required information. Damage caused after delivery is not covered.
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary px-4">
                    <RefreshCcw className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">5. Replacement process</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium text-sm leading-relaxed">
                    Kalamic’s primary remedy will be a replacement of the same product. If unavailable, we may offer a comparable item or store credit. Replacements are dispatched after approval and pickup.
                  </div>
                </div>
              </div>

              {/* 6. & 7. Costs and Refunds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary px-4">
                    <Truck className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">6. Return collection</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium text-sm leading-relaxed">
                    Kalamic will arrange reverse collection where available and bear the shipping costs for approved claims. Do not independently ship the product without receiving instructions.
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary px-4">
                    <CreditCard className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">7. Refunds</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium text-sm leading-relaxed">
                    We primarily provide replacement. Where replacement is impossible, we will provide the legally appropriate remedy to the original payment method.
                  </div>
                </div>
              </div>

              {/* 8. Non-returnable */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-primary px-4">
                  <Ban className="h-6 w-6" />
                  <h2 className="text-xl font-black uppercase tracking-widest">8. Non-returnable situations</h2>
                </div>
                <div className="bg-destructive/5 p-8 rounded-[2.5rem] border border-destructive/10 text-muted-foreground font-medium text-sm">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-disc pl-6">
                    <li>Change of mind or personal preference</li>
                    <li>Minor handmade variations in colour/glaze</li>
                    <li>Products damaged after delivery</li>
                    <li>Misuse or improper installation</li>
                    <li>Alterations or repairs by third parties</li>
                    <li>Claims without sufficient documentation</li>
                  </ul>
                </div>
              </section>

              {/* 9. & 10. Custom and Cancellation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary px-4">
                    <PenTool className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">9. Customized products</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium text-sm leading-relaxed">
                    Customized pieces cannot be returned for change of mind. They remain eligible for review only if delivered damaged or materially inconsistent with approval.
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary px-4">
                    <XCircle className="h-6 w-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-sm">10. Cancellations</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm text-muted-foreground font-medium text-sm leading-relaxed">
                    Orders may be cancelled only before dispatch. Refusing delivery without an approved reason does not qualify for automatic replacement.
                  </div>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-24 p-10 md:p-16 rounded-[3rem] bg-primary text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <MessageCircle className="h-12 w-12 mx-auto opacity-50 mb-4" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Submit a Claim</h2>
                <p className="text-white/80 font-medium text-lg max-w-lg mx-auto">Our artisan support team is ready to assist you with your order.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 text-left">
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Phone / WhatsApp</p>
                    <a href="tel:+917376761679" className="text-sm font-bold hover:underline">+91 73767 61679</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Email Studio</p>
                    <a href="mailto:kalamicshop@gmail.com" className="text-sm font-bold hover:underline">kalamicshop@gmail.com</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Our Location</p>
                    <p className="text-sm font-bold">130/262 D2, Kidwai Nagar,<br />Kanpur, UP, India</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12">
                  <Button asChild variant="outline" className="h-14 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-primary font-black px-10 transition-all">
                    <a href="/contact">Contact Support</a>
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
