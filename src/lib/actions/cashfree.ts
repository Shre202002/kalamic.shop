'use server';

import crypto from 'crypto';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

/**
 * Standardized environment detection.
 * Checks both NEXT_PUBLIC and standard variants to handle Vercel deployment quirks.
 */
const cashfreeEnv = 
  process.env.NEXT_PUBLIC_CASHFREE_ENV ||
  process.env.CASHFREE_ENV ||
  'sandbox';

const isProduction = cashfreeEnv === 'production';

/**
 * Base URL detection.
 * Standardizes endpoints for both environments.
 */
const BASE_URL = isProduction
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const API_VERSION = '2023-08-01';

/**
 * Signature verification for v2025-01-01 protocol.
 * signedPayload = timestamp + rawBody
 */
export async function verifyCashfreeSignature(payload: string, signature: string, timestamp: string): Promise<boolean> {
  if (!CASHFREE_SECRET_KEY) {
    if (isProduction) throw new Error('Security keys missing in production');
    return true; // Pass in dev mock mode
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
  console.log('[CASHFREE CONFIG]', {
    env: cashfreeEnv,
    isProduction,
    baseUrl: BASE_URL,
    appIdExists: !!process.env.CASHFREE_APP_ID,
    secretExists: !!process.env.CASHFREE_SECRET_KEY
  });

  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    console.warn('[CASHFREE_MOCK] Missing credentials, initiating simulated session.');
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
        'x-api-version': API_VERSION,
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
    if (isProduction) throw new Error('Production security credentials missing');
    return { order_status: 'PAID', cf_order_id: 'mock_pay_' + Date.now() };
  }

  try {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': API_VERSION,
      },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Status fetch failed');
    
    return result;
  } catch (error: any) {
    console.error('[CASHFREE_STATUS_ERROR]', error.message);
    throw error;
  }
}
