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
 * Notifies admins via DB and Email upon successful placement.
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

    // 3. Create the MongoDB Record
    const newOrder = await OrderedItem.create({
      userId,
      userName: customerName,
      userPhone: customerPhone,
      userEmail: customerEmail || '',
      orderNumber,
      order_number: orderNumber, // Bridge for legacy unique index
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
      orderStatus: 'Placed',
      paymentMethod: 'online',
      paymentGateway: 'cashfree',
      paymentStatus: 'pending',
      paymentVerified: false,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    // 4. Create Admin Notification
    await AdminNotification.create({
      type: 'order_placed',
      title: 'New Acquisition Received',
      message: `${customerName} placed order ${orderNumber} for ₹${totalAmount.toLocaleString()}`,
      link: `/admin/orders`
    });

    // 5. Initial Sync to Firestore
    await syncOrderToFirestore(newOrder);

    // 6. Notify Admins via Email
    const admins = await User.find({ role: { $in: ['super_admin', 'admin'] } });
    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

    if (adminEmails.length > 0) {
      try {
        await sendEmail({
          to: adminEmails.join(','),
          subject: `Alert: New Order ${orderNumber} Placed`,
          text: `A new order has been placed by ${customerName}. Order Total: ₹${totalAmount}. Ref: ${orderNumber}`,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #FAF4EB; border-radius: 24px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #C97A40; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px;">Kalamic</h1>
                <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Studio Alert</p>
              </div>
              <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h2 style="color: #271E1B; font-size: 20px; margin-top: 0; font-weight: 800;">Incoming Acquisition</h2>
                <p style="color: #444; line-height: 1.6; font-size: 15px;">Collector <strong>${customerName}</strong> has just finalized a new order.</p>
                <div style="background: #FAF4EB; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px solid rgba(201, 122, 64, 0.1);">
                  <div style="margin-bottom: 12px;">
                    <span style="font-size: 10px; font-weight: 800; color: #999; text-transform: uppercase;">Reference</span>
                    <p style="margin: 4px 0 0 0; color: #C97A40; font-weight: 900; font-size: 18px;">${orderNumber}</p>
                  </div>
                  <div>
                    <span style="font-size: 10px; font-weight: 800; color: #999; text-transform: uppercase;">Total Value</span>
                    <p style="margin: 4px 0 0 0; color: #271E1B; font-weight: 900; font-size: 18px;">₹${totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" style="display: inline-block; background-color: #C97A40; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px;">Review in Hub</a>
                </div>
              </div>
            </div>
          `
        });
      } catch (e) {
        console.error('[NOTIFY_ADMIN_ERROR] Email failed:', e);
      }
    }

    // 7. Initiate Gateway Transaction
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
