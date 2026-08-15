import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indian Ceramic Decor Journal | Kalamic Stories and Guides',
  description: 'Read Kalamic stories about Indian ceramic heritage, Mor Stambh meaning, wall mirrors, handmade decor, gifting and caring for artisan pieces.',
  keywords: ['Indian ceramic decor blog', 'Mor Stambh meaning', 'handmade home decor ideas', 'ceramic care guide', 'Indian craft stories'],
  alternates: { canonical: 'https://www.kalamic.shop/blog' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Kalamic Journal | Indian Ceramic Decor Stories',
    description: 'Heritage stories, practical decor guides and care advice from the Kalamic artisan studio in Kanpur.',
    url: 'https://www.kalamic.shop/blog',
    type: 'website',
  },
};

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
