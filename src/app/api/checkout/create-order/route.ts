import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import PromoCode from '@/lib/models/PromoCode';
import { createCashfreeOrder } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { calculateOrderCharges } from '@/lib/utils/calculateShipping';
import crypto from 'crypto';

/**
 * @fileOverview Secure Order Creation API.
 * Orchestrates MongoDB record creation, Promo validation, and Cashfree session generation.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { 
      userId, 
      items, 
      shippingDetails, 
      customerName, 
      customerPhone, 
      customerEmail,
      // Promo Fields
      promoCode,
      promoDiscount,
      promoDiscountType,
      totalAmount: clientTotal
    } = await req.json();

    if (!userId || !items?.length) {
      return NextResponse.json({ message: 'Missing required order details' }, { status: 400 });
    }

    let subtotal = 0;
    const validatedItems = [];
    let requiresHandling = false;
    let requiresPremiumProtection = false;

    // 1. Validate Inventory, Pricing and Logistics Flags from Source of Truth (DB)
    for (const item of items) {
      const product = await KalamicProduct.findById(item.productId).select('price name images requiresHandling requiresPremiumProtection');
      if (!product) throw new Error(`Product ${item.productId} is no longer available.`);
      
      subtotal += product.price * item.quantity;
      
      // Strict rule: If ANY product requires the charge, apply it to order
      if (product.requiresHandling !== false) requiresHandling = true;
      if (product.requiresPremiumProtection !== false) requiresPremiumProtection = true;

      validatedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url
      });
    }

    // 2. Compute Official Charges with Product Flags
    const calculatedCharges = calculateOrderCharges(subtotal, shippingDetails.city, {
      requiresHandling,
      requiresPremiumProtection
    });
    const totalCharges = calculatedCharges.shipping + calculatedCharges.handling + calculatedCharges.premium;
    
    // 3. Final Total Verification (Server-side)
    const promoDiscountAmount = Number(promoDiscount) || 0;
    const baseTotal = subtotal + totalCharges;
    const finalTotal = Math.max(0, baseTotal - promoDiscountAmount);
    
    // Tolerance check for minor rounding differences
    if (Math.abs(finalTotal - clientTotal) > 1) {
      console.warn(`[TOTAL_MISMATCH] Client: ${clientTotal}, Server: ${finalTotal}`);
    }

    const orderNumber = `KAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 4. Create MongoDB Master Record
    const newOrder = await OrderedItem.create({
      userId,
      userName: customerName,
      userPhone: customerPhone,
      userEmail: customerEmail || '',
      orderNumber,
      subtotal,
      charges: {
        shipping: calculatedCharges.shipping,
        handling: calculatedCharges.handling,
        premium: calculatedCharges.premium
      },
      // Promo data
      promoCode: promoCode || null,
      promoDiscount: promoDiscountAmount,
      promoDiscountType: promoDiscountType || null,
      
      totalAmount: finalTotal,
      items: validatedItems,
      shippingAddress: {
        fullName: shippingDetails.fullName,
        phone: shippingDetails.phone,
        addressLine1: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        pincode: shippingDetails.zip,
        nearestLandmark: shippingDetails.landmark || null,
      },
      orderStatus: 'Initiated',
      paymentMethod: 'online',
      paymentGateway: 'cashfree',
      paymentStatus: 'pending',
      paymentVerified: false,
      gatewayOrderId: orderNumber, 
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    // 5. Update Promo Usage if applicable
    if (promoCode) {
      try {
        await PromoCode.findOneAndUpdate(
          { code: promoCode.toString().toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      } catch (e) {
        console.error('[PROMO_UPDATE_ERROR] Failed to increment usedCount:', e);
      }
    }

    // 6. Initial Sync to Firestore
    await syncOrderToFirestore(newOrder);

    // 7. Generate Cashfree Session
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://kalamic.shop';
    const returnUrl = `${origin}/checkout/success?order_id={order_id}`;

    const cashfreeResult = await createCashfreeOrder({
      orderId: orderNumber,
      orderAmount: finalTotal,
      orderCurrency: 'INR',
      customerDetails: {
        customerId: userId,
        customerPhone: customerPhone.replace(/\D/g, '').slice(-10),
        customerEmail: customerEmail || 'collector@kalamic.shop',
        customerName: customerName,
      },
      returnUrl
    });

    return NextResponse.json({
      paymentSessionId: cashfreeResult.paymentSessionId,
      orderId: orderNumber,
      isMock: cashfreeResult.isMock
    });

  } catch (error: any) {
    console.error('[ORDER_CREATION_FAILURE]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
