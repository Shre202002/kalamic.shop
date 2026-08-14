import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';

/**
 * @fileOverview Lightweight endpoint to fetch logistics flags for a specific product.
 * Used as a fallback for cart items added before flags were stored in Firestore.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  
  try {
    const { id } = await params;
    const product = await KalamicProduct
      .findById(id)
      .select('requiresHandling requiresPremiumProtection requiresCustomerImage customerImageWidth customerImageHeight customerImageMinWidth customerImageMinHeight customerImageInstructions customerImagePreset')
      .lean();
    
    if (!product) {
      return NextResponse.json({ 
        requiresHandling: true,
        requiresPremiumProtection: true
      });
    }
    
    return NextResponse.json({
      requiresHandling: (product as any).requiresHandling ?? true,
      requiresPremiumProtection: (product as any).requiresPremiumProtection ?? true
      ,requiresCustomerImage: (product as any).requiresCustomerImage === true,
      customerImageWidth: (product as any).customerImageWidth || 0,
      customerImageHeight: (product as any).customerImageHeight || 0,
      customerImageMinWidth: (product as any).customerImageMinWidth || 0,
      customerImageMinHeight: (product as any).customerImageMinHeight || 0,
      customerImageInstructions: (product as any).customerImageInstructions || ''
      ,customerImagePreset: (product as any).customerImagePreset || 'custom'
    });
  } catch (error) {
    console.error('[FLAGS_API_ERROR]', error);
    return NextResponse.json({ 
      requiresHandling: true,
      requiresPremiumProtection: true
    });
  }
}
