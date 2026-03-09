import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { TopLoader } from '@/components/layout/TopLoader';
import { SurveyPopup } from '@/components/survey/SurveyPopup';

export const metadata: Metadata = {
  metadataBase: new URL('https://kalamic.shop'),
  title: {
    default: 'Kalamic | Handcrafted Ceramic Artistry',
    template: '%s | Kalamic',
  },
  description: 'Discover Kalamic - your home for premium handmade ceramics, from spiritual pillars to modern home decor. Handcrafted with love in India.',
  keywords: ['handmade ceramics', 'Indian handicraft', 'ceramic art', 'Kalamic shop', 'Mor Stambh', 'Mandala wheels'],
  openGraph: {
    title: 'Kalamic | Handcrafted Ceramic Artistry',
    description: 'Modern ceramic art for the next generation.',
    siteName: 'Kalamic',
    locale: 'en_IN',
    type: 'website',
  }
};

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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;500;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-accent/30 min-h-screen flex flex-col" suppressHydrationWarning>
        <FirebaseClientProvider>
          <TopLoader />
          {children}
          <SurveyPopup />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
