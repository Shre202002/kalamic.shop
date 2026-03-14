
"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewProductPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    imageUrls: '',
    sku: '',
    stock: '10'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      toast({ variant: "destructive", title: "Missing Information", description: "Required fields marked with * must be filled." });
      return;
    }
    setIsSaving(true);
    // Logic for saving would go here
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Piece Published", description: "Creation has been added to the catalog." });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-primary">New Ceramic Creation</h1>
              <p className="text-muted-foreground text-sm">Add a new handcrafted piece to the Kalamic catalog.</p>
            </div>
          </div>
          <Button onClick={handlePublish} disabled={isSaving} className="bg-primary text-white h-11 px-8 rounded-xl shadow-lg">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Publish Piece
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardHeader>
                <CardTitle>Artisan Details</CardTitle>
                <CardDescription>Core details of your ceramic work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Blue Pottery Flower Vase" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Detailed Description *</Label>
                  <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the clay type, firing method..." className="min-h-[150px] rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g. Home Decor" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹) *</Label>
                    <Input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="0.00" className="rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardHeader><CardTitle>Media</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Image URLs (One per line)</Label>
                  <Textarea name="imageUrls" value={formData.imageUrls} onChange={handleInputChange} placeholder="https://ik.imagekit.io/..." className="rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-sm rounded-[2rem]">
              <CardHeader><CardTitle>Catalog Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="font-bold text-sm">Active</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input name="sku" value={formData.sku} onChange={handleInputChange} placeholder="KAL-CER-001" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input name="stock" type="number" value={formData.stock} onChange={handleInputChange} className="rounded-xl" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-muted/20">
              <div className="p-4 border-b bg-white">
                <Label className="text-[10px] font-black uppercase">Storefront Preview</Label>
              </div>
              <div className="p-6">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm aspect-square relative flex items-center justify-center">
                  {formData.imageUrls ? (
                    <img src={formData.imageUrls.split('\n')[0]} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 opacity-10" />
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-3/4 bg-primary/10 rounded-lg" />
                  <div className="h-6 w-1/4 bg-primary/20 rounded-lg" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
