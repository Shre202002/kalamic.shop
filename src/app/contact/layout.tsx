import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Kalamic Ceramic Studio in Kanpur',
  description:
    'Contact Kalamic for handcrafted ceramic decor, custom orders, delivery assistance and damaged-item replacement support in India.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Kalamic Ceramic Studio in Kanpur',
    description: 'Speak with Kalamic about ceramic decor, custom orders and delivery support.',
    url: '/contact',
    type: 'website',
  },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
