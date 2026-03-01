import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import User from '@/lib/models/User';
import AdminNotification from '@/lib/models/AdminNotification';
import { createCashfreeOrder } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

/**
 * @fileOverview Production-safe Order Creation API.
 * Sets initial state to 'Initiated' waiting for payment confirmation.
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

    // 1. Server-side Price Validation
    for (const item of items) {
      const product = await KalamicProduct.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} no longer exists.`);
      
      subtotal += product.price * item.quantity;
      validatedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url
      });
    }

    // 2. Define Charges Breakdown
    const charges = {
      shipping: 20,
      handling: 80,
      premium: 50
    };
    const totalAmount = subtotal + charges.shipping + charges.handling + charges.premium;
    const orderNumber = `KAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 3. Create the MongoDB Record (State: Initiated)
    const newOrder = await OrderedItem.create({
      userId,
      userName: customerName,
      userPhone: customerPhone,
      userEmail: customerEmail || '',
      orderNumber,
      subtotal,
      charges,
      totalAmount,
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
      transactionId: null,
      paymentId: null,
      paymentTimestamp: null,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    // 4. Initial Sync to Firestore
    await syncOrderToFirestore(newOrder);

    // 5. Initiate Gateway Transaction
    const cashfreeResult = await createCashfreeOrder({
      orderId: orderNumber,
      orderAmount: totalAmount,
      orderCurrency: 'INR',
      customerDetails: {
        customerId: userId,
        customerPhone: customerPhone.replace(/\D/g, '').slice(-10),
        customerEmail: customerEmail || 'collector@kalamic.shop',
        customerName: customerName,
      },
      returnUrl: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}`
    });

    if (!cashfreeResult.isMock) {
      await OrderedItem.findByIdAndUpdate(newOrder._id, { 
        gatewayOrderId: cashfreeResult.orderId 
      });
    }

    return NextResponse.json({
      paymentSessionId: cashfreeResult.paymentSessionId,
      orderId: orderNumber,
      isMock: cashfreeResult.isMock
    });

  } catch (error: any) {
    console.error('[ORDER_CREATION_ERROR]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
