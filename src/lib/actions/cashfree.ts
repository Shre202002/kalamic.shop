'use server';

/**
 * @fileOverview Production-grade Cashfree Payment Gateway utilities.
 * Supports API & Webhook version 2025-01-01.
 */

import crypto from 'crypto';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';

const BASE_URL = CASHFREE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

/**
 * Utility to verify Cashfree Webhook Signature (v2025-01-01).
 * Requires the timestamp from 'x-webhook-timestamp' header.
 */
export async function verifyCashfreeSignature(payload: string, signature: string, timestamp: string): Promise<boolean> {
  if (!CASHFREE_SECRET_KEY || !CASHFREE_APP_ID) {
    console.warn('[CASHFREE] No keys found. Mock verification returning true.');
    return true; 
  }
  
  try {
    const data = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_SECRET_KEY)
      .update(data)
      .digest('base64');
      
    return expectedSignature === signature;
  } catch (error) {
    console.error('[CASHFREE_SIGNATURE_ERROR]', error);
    return false;
  }
}

/**
 * Creates a Cashfree order.
 */
export async function createCashfreeOrder(data: {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerDetails: {
    customerId: string;
    customerPhone: string;
    customerEmail: string;
    customerName: string;
  };
  returnUrl: string;
}) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    return {
      paymentSessionId: `mock_session_${crypto.randomBytes(8).toString('hex')}`,
      orderId: data.orderId,
      isMock: true
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01', // Keep 2023-08-01 for creation as it is stable
      },
      body: JSON.stringify({
        order_id: data.orderId,
        order_amount: data.orderAmount,
        order_currency: data.orderCurrency,
        customer_details: {
          customer_id: data.customerDetails.customerId,
          customer_phone: data.customerDetails.customerPhone,
          customer_email: data.customerDetails.customerEmail,
          customer_name: data.customerDetails.customerName,
        },
        order_meta: {
          return_url: data.returnUrl,
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create Cashfree order');

    return {
      paymentSessionId: result.payment_session_id,
      orderId: result.order_id,
      isMock: false
    };
  } catch (error: any) {
    console.error('[CASHFREE_CREATE_ERROR]', error.message);
    throw error;
  }
}

/**
 * Fetches order status directly from Cashfree (Server-to-Server).
 * Uses version 2023-08-01 for status fetching.
 */
export async function getCashfreeOrderStatus(orderId: string) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    if (CASHFREE_ENV === 'production') throw new Error('Missing production credentials');
    return { order_status: 'PAID', cf_order_id: 'mock_payment_id', order_id: orderId };
  }

  try {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch order from Cashfree');
    const result = await response.json();
    console.log(`[CASHFREE_FETCH] Raw Status for ${orderId}:`, JSON.stringify(result));
    return result;
  } catch (error: any) {
    console.error('[CASHFREE_FETCH_ERROR]', error.message);
    throw error;
  }
}
