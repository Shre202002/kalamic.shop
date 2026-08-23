'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';

const CONSENT_KEY = 'kalamic:analytics-consent';

type ConsentChoice = 'accepted' | 'rejected' | null;

export function AnalyticsConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    setChoice(stored === 'accepted' || stored === 'rejected' ? stored : null);
    setReady(true);
  }, []);

  const choose = (nextChoice: Exclude<ConsentChoice, null>) => {
    window.localStorage.setItem(CONSENT_KEY, nextChoice);
    setChoice(nextChoice);
  };

  return (
    <>
      {choice === 'accepted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true,
                allow_google_signals: false
              });
            `}
          </Script>
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            data-key="rQSQWyZyJZov3LquVI1C5w"
            async
            strategy="lazyOnload"
          />
        </>
      )}

      {ready && choice === null && (
        <aside
          aria-label="Analytics cookie preferences"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#1a1208] p-5 text-white shadow-2xl md:flex md:items-center md:justify-between md:gap-6"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-white">Help us make Kalamic better for you</p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              Allow optional analytics so we can see which creations are loved, improve mobile browsing,
              and make the shop easier to use. Analytics is optional and never required to browse or checkout.{' '}
              <Link href="/privacy" className="font-semibold text-primary underline">
                Learn more in our Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="mt-4 flex shrink-0 flex-wrap gap-3 md:mt-0 md:justify-end">
            <button
              type="button"
              onClick={() => choose('rejected')}
              className="rounded-xl border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
            >
              Keep browsing privately
            </button>
            <button
              type="button"
              onClick={() => choose('accepted')}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/90"
            >
              Allow analytics
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
