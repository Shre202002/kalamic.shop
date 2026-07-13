import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Kalamic | Handcrafted Ceramics from Kanpur',
  description:
    'Meet the Kanpur artisans behind Kalamic and discover how traditional Indian ceramic motifs become handcrafted decor for contemporary homes.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Kalamic | Handcrafted Ceramics from Kanpur',
    description: 'The people, process and Indian heritage behind every Kalamic ceramic piece.',
    url: '/about',
    type: 'website',
  },
};

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
