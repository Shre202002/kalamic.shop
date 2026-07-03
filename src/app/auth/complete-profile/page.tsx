'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Loader2, 
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function CompleteProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter your first and last name.' });
      return;
    }

    setIsLoading(true);
    try {
      await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseId: user?.uid,
          ...formData
        }),
      });

      toast({ title: 'Profile Ready', description: 'Welcome to the Kalamic Studio!' });
      router.push('/products');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not sync profile details.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 py-20">
      <div className="w-full max-w-xl space-y-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-16 space-y-10 border border-primary/5">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-black text-primary tracking-tight">Complete Your Profile</h2>
            <p className="text-muted-foreground font-medium text-sm">Tell us more about yourself to personalize your experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">First Name *</Label>
                <input 
                  required
                  type="text" 
                  value={formData.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  placeholder="Aarav" 
                  className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Last Name *</Label>
                <input 
                  required
                  type="text" 
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  placeholder="Sharma" 
                  className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-bold focus:outline-none focus:border-primary transition-all" 
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <MapPin size={14} /> Shipping Info (Optional)
              </h3>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Street Address</Label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="House No, Area..." 
                  className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-medium focus:outline-none focus:border-primary transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">City</Label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    placeholder="Kanpur" 
                    className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-medium focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">ZIP Code</Label>
                  <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={e => setFormData({...formData, pincode: e.target.value})} 
                    placeholder="208001" 
                    className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-background font-medium focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 mt-4"
            >
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Start Shopping →'}
            </button>
            
            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => router.push('/products')}
                className="text-xs text-muted-foreground font-bold hover:text-primary transition-colors underline underline-offset-4"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
