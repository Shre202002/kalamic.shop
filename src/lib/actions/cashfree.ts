
'use server';

/**
 * @fileOverview Server actions for Cashfree Payment Gateway integration.
 * Handles secure order creation and payment verification.
 */

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';

const BASE_URL = CASHFREE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

/**
 * Creates a Cashfree order and returns the payment_session_id.
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
}) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error('Cashfree credentials are not configured in environment variables.');
  }

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
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/orders?order_id={order_id}`,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('[CASHFREE] Order Creation Failed:', result);
    throw new Error(result.message || 'Failed to create Cashfree order');
  }

  return {
    paymentSessionId: result.payment_session_id,
    orderId: result.order_id,
  };
}

/**
 * Verifies the status of a Cashfree order.
 */
export async function verifyCashfreePayment(orderId: string) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error('Cashfree credentials are not configured.');
  }

  const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-api-version': '2023-08-01',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('[CASHFREE] Verification Failed:', result);
    throw new Error('Failed to verify payment with Cashfree');
  }

  // Check if the order status is 'PAID'
  const isPaid = result.order_status === 'PAID';
  
  return {
    success: isPaid,
    status: result.order_status,
    paymentId: result.order_id,
  };
}
