import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ceramic Decor FAQ | Care, Delivery and Custom Orders',
  description:
    'Answers about Kalamic handmade ceramic decor, natural variations, product care, secure packaging, delivery and customized orders.',
  alternates: { canonical: '/faq' },
};

export default function FaqLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
