
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import { createCashfreeOrder } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { calculateOrderCharges } from '@/lib/utils/calculateShipping';
import crypto from 'crypto';

/**
 * @fileOverview Secure Order Creation API.
 * Orchestrates MongoDB record creation and Cashfree session generation.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { userId, items, shippingDetails, customerName, customerPhone, customerEmail } = await req.json();

    if (!userId || !items?.length) {
      return NextResponse.json({ message: 'Missing required order details' }, { status: 400 });
    }

    let subtotal = 0;
    const validatedItems = [];

    // 1. Validate Inventory and Pricing from Source of Truth (DB)
    for (const item of items) {
      const product = await KalamicProduct.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} is no longer available.`);
      
      subtotal += product.price * item.quantity;
      validatedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url
      });
    }

    // 2. Compute Official Charges
    const calculatedCharges = calculateOrderCharges(subtotal, shippingDetails.city);
    const orderNumber = `KAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 3. Create MongoDB Master Record
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
      totalAmount: calculatedCharges.total,
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
      gatewayOrderId: orderNumber, // Direct mapping
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    // 4. Initial Sync to Firestore
    await syncOrderToFirestore(newOrder);

    // 5. Construct Return URL pointing to dedicated Success Landing Page
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://kalamic.shop';
    const returnUrl = `${origin}/checkout/success?order_id={order_id}`;

    // 6. Generate Cashfree Session
    const cashfreeResult = await createCashfreeOrder({
      orderId: orderNumber,
      orderAmount: calculatedCharges.total,
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
