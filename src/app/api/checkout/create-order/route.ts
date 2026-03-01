import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import { createCashfreeOrder } from '@/lib/actions/cashfree';
import crypto from 'crypto';

/**
 * @fileOverview Secure order creation API.
 * Validates prices from the DB and generates a dynamic return URL.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { userId, items, shippingDetails, customerName, customerPhone, customerEmail } = await req.json();

    if (!userId || !items?.length) {
      return NextResponse.json({ message: 'Missing required order details' }, { status: 400 });
    }

    // 1. Calculate and Verify Totals Server-Side
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await KalamicProduct.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} no longer exists.`);
      
      subtotal += product.price * item.quantity;
      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.images?.[0]?.url
      });
    }

    const shippingCost = 150;
    const totalAmount = subtotal + shippingCost;

    // 2. Generate Unique Order Number
    const orderNumber = `KAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 3. Create Pending Order in DB
    const newOrder = await OrderedItem.create({
      user_id: userId,
      user_name: customerName,
      user_phone: customerPhone,
      order_number: orderNumber,
      total_amount: totalAmount,
      shipping_address: {
        full_name: shippingDetails.fullName,
        phone: shippingDetails.phone,
        address_line1: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        pincode: shippingDetails.zip,
      },
      status: 'Placed',
      payment_method: 'online',
      payment_gateway: 'cashfree',
      payment_status: 'pending',
      expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // 4. Determine Dynamic Return URL
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://kalamic.shop';
    const returnUrl = `${origin}/orders/${orderNumber}?cf_id={order_id}`;

    // 5. Initialize Cashfree Order
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
      returnUrl
    });

    // 6. Store Gateway ID in DB for reconciliation
    if (!cashfreeResult.isMock) {
      await OrderedItem.findByIdAndUpdate(newOrder._id, { 
        gateway_order_id: cashfreeResult.orderId 
      });
    }

    return NextResponse.json({
      paymentSessionId: cashfreeResult.paymentSessionId,
      orderId: orderNumber,
      isMock: cashfreeResult.isMock
    });

  } catch (error: any) {
    console.error('[ORDER_CREATION_FAILED]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
