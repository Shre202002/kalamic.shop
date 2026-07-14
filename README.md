# Kalamic | Handcrafted Ceramic Artistry

Kalamic is an ecommerce platform for handcrafted ceramics, built with Next.js, Firebase, and MongoDB.

## Authentication setup (Firebase)

Enable the required sign-in providers in Firebase Authentication and add these authorized domains:

- `localhost`
- `www.kalamic.shop`
- `kalamic.shop`
- `studio-6917027295-9c66e.firebaseapp.com`

The production Google OAuth redirect handler is:

```text
https://www.kalamic.shop/__/auth/handler
```

## Payment gateway (Razorpay)

Use test keys locally and live keys only after Razorpay activates the account. Add these server-side variables to `.env.local` or the Vercel project environment:

```env
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=server_only_key_secret
RAZORPAY_WEBHOOK_SECRET=a_unique_webhook_secret
```

Configure this webhook in the Razorpay Dashboard:

```text
https://www.kalamic.shop/api/razorpay/webhook
```

Enable at least `payment.captured`, `payment.failed`, and `order.paid`. The application fails closed when credentials are missing and never simulates successful payment.

## Getting started

```bash
npm run dev
```

For the production checks:

```bash
npm run typecheck
npm run build
```

## Project structure

- `src/app`: Next.js App Router pages and route handlers.
- `src/components`: Reusable interface components.
- `src/firebase`: Client-side Firebase configuration and hooks.
- `src/lib/actions`: Server-side provider integrations.
- `src/lib/models`: Mongoose schemas.
