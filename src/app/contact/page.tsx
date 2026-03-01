"use client"

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast({
        title: "Message Delivered",
        description: "Our artisan support team has received your inquiry and will reach out shortly.",
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delivery Failed",
        description: error.message || "We encountered an issue sending your message. Please try again or call us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                  <MessageSquare className="h-3 w-3" /> Get In Touch
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">Speak with <br />Our Studio</h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  Have a question about a custom order? Or just want to talk ceramics? We're here to help you bring handcrafted beauty to your space.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Email Us</h3>
                    <p className="text-xl font-bold text-primary">contact@kalamic.shop</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Call Our Artisans</h3>
                    <p className="text-xl font-bold text-primary">+91 63875 62920</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Visit Our Studio</h3>
                    <p className="text-xl font-bold text-primary leading-tight">Kanpur, Uttar Pradesh,<br />India</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="p-8 md:p-12 pb-4 bg-primary/[0.02]">
                <CardTitle className="text-3xl font-black text-primary">Send a Message</CardTitle>
                <p className="text-muted-foreground text-sm font-medium mt-2">Expect a response within one business day.</p>
              </CardHeader>
              <CardContent className="p-8 md:p-12 pt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Aarav" 
                        className="h-12 rounded-xl border-border bg-background px-4" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Sharma" 
                        className="h-12 rounded-xl border-border bg-background px-4" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="aarav@example.com" 
                      className="h-12 rounded-xl border-border bg-background px-4" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">How can we help?</Label>
                    <Textarea 
                      id="message" 
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your requirement..." 
                      className="min-h-[150px] rounded-xl border-border bg-background p-4 resize-none" 
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                    ) : (
                      <>Send Message <Send className="ml-3 h-5 w-5" /></>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
