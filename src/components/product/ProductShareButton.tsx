'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { trackProductAction } from '@/lib/actions/products';

export function ProductShareButton({ productId, productName, productDescription, productUrl }: {
  productId: string;
  productName: string;
  productDescription?: string;
  productUrl: string;
}) {
  const { toast } = useToast();

  const shareProduct = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: productName, text: productDescription || `Discover ${productName} at Kalamic.`, url: productUrl });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = productUrl;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      await trackProductAction(productId, 'share_count');
      toast({ title: 'Product link ready', description: 'Share this Kalamic creation with someone you love.' });
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      toast({ variant: 'destructive', title: 'Unable to share', description: 'Please copy the product link from your browser and try again.' });
    }
  };

  return (
    <Button type="button" variant="outline" onClick={shareProduct} aria-label={`Share ${productName}`} className="h-14 rounded-2xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">
      <Share2 className="mr-2 h-4 w-4" /> Share Product
    </Button>
  );
}
