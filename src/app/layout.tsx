import React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { TopLoader } from '@/components/layout/TopLoader';
import { SurveyPopup } from '@/components/survey/SurveyPopup';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { metadata, LocalBusinessJsonLd } from './layout.metadata';
import { AnalyticsConsent } from '@/components/analytics/AnalyticsConsent';
import {
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
  Playfair_Display,
  Poppins,
} from 'next/font/google';

export { metadata };

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-devanagari',
  display: 'swap',
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-devanagari',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} ${notoSansDevanagari.variable} ${notoSerifDevanagari.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="p:domain_verify" content="f0b2fb19d916a3e9c1dc8cb58ceea6f3" />
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        
      </head>
      <body className="font-body antialiased selection:bg-accent/30 min-h-screen flex flex-col" suppressHydrationWarning>
        <LocalBusinessJsonLd />
        <FirebaseClientProvider>
          <TopLoader />
          {children}
          <AnalyticsConsent />
          <SurveyPopup />
          <Toaster />
          <SpeedInsights/>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
