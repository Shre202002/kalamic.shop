import crypto from 'crypto';
import Razorpay from 'razorpay';

let razorpayClient: Razorpay | null = null;

function requireEnv(name: 'RAZORPAY_KEY_ID' | 'RAZORPAY_KEY_SECRET') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getRazorpayClient() {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: requireEnv('RAZORPAY_KEY_ID'),
      key_secret: requireEnv('RAZORPAY_KEY_SECRET'),
    });
  }
  return razorpayClient;
}

export function getRazorpayKeyId() {
  return requireEnv('RAZORPAY_KEY_ID');
}

function safeSignatureMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');
  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyRazorpayPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const expected = crypto
    .createHmac('sha256', requireEnv('RAZORPAY_KEY_SECRET'))
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest('hex');

  return safeSignatureMatch(expected, input.razorpaySignature);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return safeSignatureMatch(expected, signature);
}

export async function createRazorpayOrder(input: {
  receipt: string;
  amountInPaise: number;
  userId: string;
}) {
  if (!Number.isSafeInteger(input.amountInPaise) || input.amountInPaise < 100) {
    throw new Error('The payable amount must be at least INR 1');
  }

  return getRazorpayClient().orders.create({
    amount: input.amountInPaise,
    currency: 'INR',
    receipt: input.receipt,
    payment: { capture: 'automatic' },
    notes: {
      kalamic_order_number: input.receipt,
      kalamic_user_id: input.userId,
    },
  });
}

export async function getCapturedPaymentForOrder(gatewayOrderId: string) {
  const payments = await getRazorpayClient().orders.fetchPayments(gatewayOrderId);
  return payments.items.find((payment) => payment.status === 'captured') || null;
}

export async function fetchRazorpayPayment(paymentId: string) {
  return getRazorpayClient().payments.fetch(paymentId);
}
