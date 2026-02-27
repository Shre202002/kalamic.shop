# Kalamic | Handcrafted Ceramic Artistry

NexGenShop (Kalamic) is a premium e-commerce platform for handcrafted ceramics, built with Next.js, Firebase, and MongoDB.

## 🛠 Authentication Setup (Firebase)

To ensure **Phone Authentication** works correctly, follow these steps in your [Firebase Console](https://console.firebase.google.com/):

### 1. Enable Phone Provider
- Go to **Authentication** > **Sign-in method**.
- Click **Add new provider** and select **Phone**.
- Enable it and save.

### 2. Configure Authorized Domains
Add the following domains under **Authentication** > **Settings** > **Authorized domains**:
- `localhost`
- `studio-6917027295-9c66e.firebaseapp.com`
- `studio-6917027295-9c66e.web.app`

### 3. Google Cloud Console (Redirect URIs)
If you are managing the OAuth Client ID in the [Google Cloud Console](https://console.cloud.google.com/), add this to your **Authorized redirect URIs**:
- `https://studio-6917027295-9c66e.firebaseapp.com/__/auth/handler`

---

## 🚀 Getting Started

### Development
```bash
npm run dev
```

### AI Tools
To start Genkit for SEO content generation:
```bash
npm run genkit:dev
```

## 📂 Project Structure
- `src/app`: Next.js App Router pages.
- `src/components`: Reusable UI components (ShadCN).
- `src/firebase`: Client-side Firebase configuration and hooks.
- `src/lib/actions`: Server-side logic for MongoDB operations and OTP handling.
- `src/lib/models`: Mongoose schemas for MongoDB.
