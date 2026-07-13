import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import PromoCode from '@/lib/models/PromoCode';
import { createRazorpayOrder, getRazorpayKeyId } from '@/lib/actions/razorpay';
import { syncOrderToFirestore, verifySession } from '@/lib/firebase-admin';
import { calculateOrderCharges } from '@/lib/utils/calculateShipping';
import crypto from 'crypto';

/**
 * @fileOverview Secure Order Creation API.
 * Orchestrates authenticated order creation, server-side price validation, and Razorpay order generation.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { 
      userId, 
      items, 
      shippingDetails, 
      customerEmail,
      promoCode,
      totalAmount: clientTotal
    } = await req.json();

    if (!userId || !items?.length) {
      return NextResponse.json({ message: 'Missing required order details' }, { status: 400 });
    }

    const sessionToken = req.cookies.get('__session')?.value;
    const sessionUser = sessionToken ? await verifySession(sessionToken) : null;
    if (!sessionUser) {
      return NextResponse.json({ message: 'Please sign in again to continue' }, { status: 401 });
    }
    if (sessionUser.uid !== userId) {
      return NextResponse.json({ message: 'Order identity does not match the signed-in user' }, { status: 403 });
    }

    if (!shippingDetails?.fullName || !shippingDetails?.phone || !shippingDetails?.address
      || !shippingDetails?.city || !shippingDetails?.state || !shippingDetails?.zip) {
      return NextResponse.json({ message: 'Complete shipping details are required' }, { status: 400 });
    }

    const normalizedEmail = String(customerEmail || sessionUser.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ message: 'A valid customer email is required' }, { status: 400 });
    }

    let subtotal = 0;
    const validatedItems = [];
    let requiresHandling = false;
    let requiresPremiumProtection = false;

    // 1. Validate Inventory, Pricing and Logistics Flags from Source of Truth (DB)
    for (const item of items) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return NextResponse.json({ message: 'Invalid product quantity' }, { status: 400 });
      }
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
    
    // 3. Validate the promo again from the database. Never trust client-supplied discount values.
    let validatedPromoCode: string | null = null;
    let validatedPromoType: 'flat' | 'percent' | null = null;
    let promoDiscountAmount = 0;

    if (promoCode) {
      const cleanCode = String(promoCode).trim().toUpperCase();
      const promo = await PromoCode.findOne({ code: cleanCode });
      const promoUsable = promo
        && promo.isActive
        && (!promo.expiresAt || new Date(promo.expiresAt) >= new Date())
        && (promo.maxUses <= 0 || promo.usedCount < promo.maxUses)
        && subtotal >= promo.minOrderValue;

      if (!promoUsable) {
        return NextResponse.json({ message: 'The selected promo code is no longer valid' }, { status: 400 });
      }

      promoDiscountAmount = promo.discountType === 'percent'
        ? Math.floor((subtotal * promo.discountValue) / 100)
        : promo.discountValue;
      promoDiscountAmount = Math.min(subtotal, promoDiscountAmount);
      validatedPromoCode = promo.code;
      validatedPromoType = promo.discountType;
    }

    // 4. Calculate the authoritative amount on the server.
    const baseTotal = subtotal + totalCharges;
    const finalTotal = Math.max(0, baseTotal - promoDiscountAmount);
    
    // Reject stale or manipulated checkout totals instead of silently charging a different amount.
    if (!Number.isFinite(clientTotal) || Math.abs(finalTotal - clientTotal) > 1) {
      console.warn(`[TOTAL_MISMATCH] Client: ${clientTotal}, Server: ${finalTotal}`);
      return NextResponse.json(
        { message: 'Your order total changed. Refresh checkout and try again.' },
        { status: 409 }
      );
    }

    const orderNumber = `KAL-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // 5. Create MongoDB master record.
    const newOrder = await OrderedItem.create({
      userId,
      userName: shippingDetails.fullName,
      userPhone: shippingDetails.phone,
      userEmail: normalizedEmail,
      orderNumber,
      subtotal,
      charges: {
        shipping: calculatedCharges.shipping,
        handling: calculatedCharges.handling,
        premium: calculatedCharges.premium
      },
      // Promo data
      promoCode: validatedPromoCode,
      promoDiscount: promoDiscountAmount,
      promoDiscountType: validatedPromoType,
      
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
      paymentGateway: 'razorpay',
      paymentStatus: 'pending',
      paymentVerified: false,
      gatewayOrderId: null,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    // 6. Create a real Razorpay order. There is intentionally no mock-payment fallback.
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        receipt: orderNumber,
        amountInPaise: Math.round(finalTotal * 100),
        userId,
      });
      newOrder.gatewayOrderId = razorpayOrder.id;
      await newOrder.save();
      await syncOrderToFirestore(newOrder);
    } catch (gatewayError) {
      await OrderedItem.updateOne(
        { _id: newOrder._id },
        { $set: { paymentStatus: 'failed', orderStatus: 'Canceled', updatedAt: new Date() } }
      );
      throw gatewayError;
    }

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      razorpayOrderId: razorpayOrder.id,
      orderId: orderNumber,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency,
    });

  } catch (error: any) {
    console.error('[ORDER_CREATION_FAILURE]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
