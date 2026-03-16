'use server';

import crypto from 'crypto';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';

const BASE_URL = CASHFREE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

/**
 * Signature verification for v2025-01-01.
 * signedPayload = timestamp + rawBody
 */
export async function verifyCashfreeSignature(payload: string, signature: string, timestamp: string): Promise<boolean> {
  if (!CASHFREE_SECRET_KEY) {
    if (CASHFREE_ENV === 'production') throw new Error('Missing production secret key');
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
      paymentSessionId: `mock_${crypto.randomBytes(8).toString('hex')}`,
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
        'x-api-version': '2023-08-01',
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
    if (!response.ok) throw new Error(result.message || 'Gateway connection failed');

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

export async function getCashfreeOrderStatus(orderId: string) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    if (CASHFREE_ENV === 'production') throw new Error('Security keys missing');
    return { order_status: 'PAID', cf_order_id: 'mock_pay_' + Date.now() };
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

    if (!response.ok) throw new Error('Status fetch failed');
    return await response.json();
  } catch (error: any) {
    console.error('[CASHFREE_STATUS_ERROR]', error.message);
    throw error;
  }
}
