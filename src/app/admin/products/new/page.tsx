"use client"

import React, { useState } from 'react';
// import { adminGenerateSeoContent, AdminGenerateSeoContentOutput } from '@/ai/flows/admin-generate-seo-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewProductPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subCategory: '',
    price: '',
    features: '',
    imageUrls: '',
  });

  const [seoResult, setSeoResult] = useState<AdminGenerateSeoContentOutput | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateSEO = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the product name, description, category, and price first.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await adminGenerateSeoContent({
        productName: formData.name,
        productDescription: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        price: parseFloat(formData.price),
        features: formData.features.split('\n').filter(f => f.trim()),
        imageUrls: formData.imageUrls.split('\n').filter(i => i.trim()),
      });
      setSeoResult(result);
      toast({
        title: "SEO Content Generated",
        description: "AI has successfully optimized your ceramic product listing.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating SEO content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
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
              <p className="text-muted-foreground">Add a new handcrafted piece to the Kalamic catalog.</p>
            </div>
          </div>
          <Button className="bg-primary text-white h-11 px-8">
            <Save className="mr-2 h-5 w-5" /> Publish Piece
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Artisan Details</CardTitle>
                <CardDescription>The core details of your ceramic work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Blue Pottery Flower Vase" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Describe the clay type, firing method, and patterns..." 
                    className="min-h-[150px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input 
                      id="category" 
                      name="category" 
                      value={formData.category} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Home Decor" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      value={formData.price} 
                      onChange={handleInputChange} 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images & Features */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Media & Craft Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrls">Product Image URLs (One per line)</Label>
                  <Textarea 
                    id="imageUrls" 
                    name="imageUrls" 
                    value={formData.imageUrls} 
                    onChange={handleInputChange} 
                    placeholder="https://example.com/artisan-photo.jpg" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Key Features (One per line)</Label>
                  <Textarea 
                    id="features" 
                    name="features" 
                    value={formData.features} 
                    onChange={handleInputChange} 
                    placeholder="Hand-molded Terracotta&#10;Kiln-fired at 1200°C&#10;Traditional Indigo Patterns" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI SEO Tool Button */}
            <div className="flex justify-center">
              <Button 
                onClick={handleGenerateSEO} 
                disabled={isGenerating}
                className="bg-accent text-accent-foreground hover:bg-accent/90 w-full lg:w-auto px-12 h-14 rounded-2xl shadow-xl shadow-accent/20 text-lg font-bold"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Analyzing Craftsmanship...</>
                ) : (
                  <><Sparkles className="mr-3 h-6 w-6" /> Optimize Listing with AI</>
                )}
              </Button>
            </div>

            {/* SEO Results Display */}
            {seoResult && (
              <Card className="border-accent/30 bg-accent/5 shadow-inner border animate-in zoom-in-95 duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 text-accent" /> AI Generated Artisan Copy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest font-bold">Optimized Description</Label>
                    <div className="p-4 bg-white rounded-lg border text-sm text-primary leading-relaxed">
                      {seoResult.seoDescription}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest font-bold">Search Title</Label>
                      <div className="p-3 bg-white rounded-lg border text-sm font-semibold">{seoResult.metaTitle}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest font-bold">Social Sharing Title</Label>
                      <div className="p-3 bg-white rounded-lg border text-sm font-semibold">{seoResult.ogTitle}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest font-bold">SEO Keywords</Label>
                    <div className="flex flex-wrap gap-2">
                      {seoResult.metaKeywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-none">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            {/* Status & Options */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Catalog Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Listing Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="font-semibold text-sm">Active in Shop</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Artisan SKU</Label>
                  <Input placeholder="KAL-CER-001" />
                </div>
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input type="number" placeholder="10" />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-muted/20">
              <div className="p-4 border-b bg-white">
                <Label className="text-xs font-bold uppercase tracking-wider">Storefront Preview</Label>
              </div>
              <div className="p-4">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-square bg-muted relative flex items-center justify-center">
                    {formData.imageUrls ? (
                      <img src={formData.imageUrls.split('\n')[0]} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-5 w-3/4 bg-primary/20 rounded"></div>
                    <div className="h-6 w-1/4 bg-accent/20 rounded"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}