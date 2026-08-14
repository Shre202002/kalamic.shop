import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import OrderedItem from '@/lib/models/OrderedItem';
import PromoCode from '@/lib/models/PromoCode';
import { createRazorpayOrder, getRazorpayKeyId } from '@/lib/actions/razorpay';
import { syncOrderToFirestore, verifySession } from '@/lib/firebase-admin';
import { calculateOrderCharges } from '@/lib/utils/calculateShipping';
import crypto from 'crypto';
import mongoose from 'mongoose';
import CustomerUpload from '@/lib/models/CustomerUpload';
import ImageKit from 'imagekit';
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

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

    const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) {
      return NextResponse.json({ message: 'A valid Idempotency-Key is required' }, { status: 400 });
    }

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
    const customerAssets: any[] = [];
    const seenProductIds = new Set<string>();
    let requiresHandling = false;
    let requiresPremiumProtection = false;

    // 1. Validate Inventory, Pricing and Logistics Flags from Source of Truth (DB)
    for (const item of items) {
      const productId = String(item.productId || '');
      if (!mongoose.isValidObjectId(productId)
        || seenProductIds.has(productId)
        || !Number.isInteger(item.quantity)
        || item.quantity < 1
        || item.quantity > 20) {
        return NextResponse.json({ message: 'Invalid or duplicate cart item' }, { status: 400 });
      }
      seenProductIds.add(productId);

      const product = await KalamicProduct.findOne({
        _id: productId,
        is_active: true,
        is_deleted: { $ne: true },
      }).select('price name images stock track_inventory requiresHandling requiresPremiumProtection requiresCustomerImage customerImageWidth customerImageHeight customerImageMinWidth customerImageMinHeight');

      if (!product) {
        return NextResponse.json(
          { message: 'One of the products in your cart is no longer available.' },
          { status: 409 }
        );
      }

      // Older product documents may not have track_inventory populated.
      // Treat missing values as inventory-tracked; only an explicit false opts out.
      const tracksInventory = product.track_inventory !== false;
      if (tracksInventory && product.stock < item.quantity) {
        return NextResponse.json(
          { message: `${product.name} has only ${Math.max(0, product.stock)} item(s) available.` },
          { status: 409 }
        );
      }
      
      subtotal += product.price * item.quantity;
      
      // Strict rule: If ANY product requires the charge, apply it to order
      if (product.requiresHandling !== false) requiresHandling = true;
      if (product.requiresPremiumProtection !== false) requiresPremiumProtection = true;

      let customerImage: any = undefined;
      if ((product as any).requiresCustomerImage === true) {
        const assetId = String(item.customerImage?.assetId || '');
        const asset: any = await CustomerUpload.findOne({ assetId, userId: sessionUser.uid, productId, status: 'pending', expiresAt: { $gt: new Date() } }).lean();
        if (!asset) return NextResponse.json({ message: 'This product requires a photo-frame image before you can place the order.' }, { status: 400 });
        if (asset.width < ((product as any).customerImageMinWidth || 0) || asset.height < ((product as any).customerImageMinHeight || 0)) return NextResponse.json({ message: 'The uploaded image no longer meets this product’s requirements.' }, { status: 400 });
        customerImage = { assetId: asset.assetId, mediaType: 'image', fileId: asset.fileId, filePath: asset.filePath, width: asset.width, height: asset.height, originalName: asset.originalName, uploadedAt: asset.createdAt || new Date() };
        customerAssets.push(asset);
      }

      validatedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.images?.find((img: any) => img.is_primary)?.url || product.images?.[0]?.url,
        ...(customerImage ? { customerImage } : {})
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

    if (!Number.isFinite(finalTotal) || finalTotal < 1) {
      return NextResponse.json(
        { message: 'The payable order amount must be at least INR 1.' },
        { status: 400 }
      );
    }
    if (!await consumeRateLimit(`checkout:${sessionUser.uid}:${requestIp(req)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
    }

    const existingOrder: any = await OrderedItem.findOne({ userId, checkoutIdempotencyKey: idempotencyKey }).lean();
    if (existingOrder?.gatewayOrderId && existingOrder.paymentStatus === 'pending') {
      return NextResponse.json({
        keyId: getRazorpayKeyId(),
        razorpayOrderId: existingOrder.gatewayOrderId,
        orderId: existingOrder.orderNumber,
        amount: Math.round(existingOrder.totalAmount * 100),
        currency: 'INR',
      });
    }
    
    // Reject stale or manipulated checkout totals instead of silently charging a different amount.
    if (!Number.isFinite(clientTotal) || Math.abs(finalTotal - clientTotal) > 1) {
      console.warn(`[TOTAL_MISMATCH] Client: ${clientTotal}, Server: ${finalTotal}`);
      return NextResponse.json(
        { message: 'Your order total changed. Refresh checkout and try again.' },
        { status: 409 }
      );
    }

    const orderNumber = `KAL-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const reservedInventory: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const item of validatedItems) {
        const sourceProduct: any = await KalamicProduct.findById(item.productId).select('track_inventory name');
        if (sourceProduct?.track_inventory === false) continue;
        const reserved = await KalamicProduct.findOneAndUpdate(
          { _id: item.productId, is_active: true, is_deleted: { $ne: true }, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!reserved) throw new Error(`${item.name} is no longer available in the requested quantity.`);
        reservedInventory.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (reservationError) {
      await Promise.all(reservedInventory.map((item) => KalamicProduct.updateOne(
        { _id: item.productId }, { $inc: { stock: item.quantity } }
      )));
      return NextResponse.json({ message: (reservationError as Error).message }, { status: 409 });
    }

    // 5. Create MongoDB master record.
    let newOrder: any;
    try {
      newOrder = await OrderedItem.create({
      userId,
      userName: shippingDetails.fullName,
      userPhone: shippingDetails.phone,
      userEmail: normalizedEmail,
      orderNumber,
      checkoutIdempotencyKey: idempotencyKey,
      inventoryReserved: reservedInventory.length > 0,
      inventoryReleased: false,
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
      if (customerAssets.length) {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
        if (!publicKey || !privateKey || !urlEndpoint) throw new Error('Server media configuration is missing.');
        const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
        const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'item';
        for (const asset of customerAssets) {
          const item = validatedItems.find((entry: any) => entry.customerImage?.assetId === asset.assetId) as any;
          // ImageKit's moveFile destinationPath must be a folder, not a full
          // filename. Keep the generated unique filename after moving; a
          // rename would create a file version, which is disabled on the
          // current ImageKit plan.
          const destinationFolder = `/kalamic/Customer_Uploaded_Image/${clean(item?.name || 'product')}/`;
          await imagekit.moveFile({ sourceFilePath: asset.filePath, destinationPath: destinationFolder });
          const sourceFileName = asset.filePath.split('/').filter(Boolean).pop();
          if (!sourceFileName) throw new Error('Customer image reference is invalid.');
          if (item?.customerImage) item.customerImage.filePath = `${destinationFolder}${sourceFileName}`;
        }
        await OrderedItem.updateOne({ _id: newOrder._id }, { $set: { items: validatedItems } });
        await CustomerUpload.updateMany({ assetId: { $in: customerAssets.map((a) => a.assetId) }, userId: sessionUser.uid }, { $set: { status: 'attached', orderId: newOrder._id.toString(), expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) } });
      }
    } catch (orderError) {
      await Promise.all(reservedInventory.map((item) => KalamicProduct.updateOne(
        { _id: item.productId }, { $inc: { stock: item.quantity } }
      )));
      throw orderError;
    }

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
      await Promise.all(reservedInventory.map((item) => KalamicProduct.updateOne(
        { _id: item.productId }, { $inc: { stock: item.quantity } }
      )));
      await OrderedItem.updateOne(
        { _id: newOrder._id },
        { $set: { paymentStatus: 'failed', orderStatus: 'Canceled', updatedAt: new Date() } }
      );
      await OrderedItem.updateOne({ _id: newOrder._id }, { $set: { inventoryReleased: true } });
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
