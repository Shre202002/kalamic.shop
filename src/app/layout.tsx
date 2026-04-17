import React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { TopLoader } from '@/components/layout/TopLoader';
import { SurveyPopup } from '@/components/survey/SurveyPopup';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from 'next/script';
import { metadata, LocalBusinessJsonLd } from './layout.metadata';

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* Ahrefs Analytics */}
        <Script 
          src="https://analytics.ahrefs.com/analytics.js" 
          data-key="rQSQWyZyJZov3LquVI1C5w" 
          async 
          strategy="afterInteractive"
        />

        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4XCEPMWYT0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-4XCEPMWYT0');
          `}
        </Script>
      </head>
      <body className="font-body antialiased selection:bg-accent/30 min-h-screen flex flex-col" suppressHydrationWarning>
        <LocalBusinessJsonLd />
        <FirebaseClientProvider>
          <TopLoader />
          {children}
          <SurveyPopup />
          <Toaster />
          <SpeedInsights/>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
