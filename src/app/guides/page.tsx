import Link from 'next/link';
import { Metadata } from 'next';
import { SEO_GUIDES } from '@/data/seo-guides';

export const metadata: Metadata = {
  title: 'Indian Home Decor Guides | Kalamic',
  description: 'Practical guides to ceramic decor, wall mirrors, gifting, heritage motifs and caring for handmade pieces from Kalamic artisans in Kanpur.',
  keywords: ['Indian home decor guide', 'ceramic wall mirror guide', 'handmade decor care', 'Mor Stambh decor', 'ceramic gifting ideas'],
  alternates: { canonical: 'https://www.kalamic.shop/guides' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Indian Home Decor Guides | Kalamic',
    description: 'Practical advice for choosing, styling and caring for handcrafted Indian ceramic decor.',
    url: 'https://www.kalamic.shop/guides',
    type: 'website',
  },
};

export default function GuidesPage() {
  return <main className="min-h-screen bg-[#FDFAF6] px-6 py-24"><div className="mx-auto max-w-6xl"><p className="text-xs font-black uppercase tracking-[.25em] text-primary">Kalamic Journal</p><h1 className="mt-4 text-4xl font-bold md:text-6xl">Indian home decor guides</h1><p className="mt-6 max-w-2xl text-muted-foreground">Original, practical notes for choosing, placing and caring for handmade ceramic decor.</p><div className="mt-12 grid gap-6 md:grid-cols-2">{SEO_GUIDES.map((guide) => <article key={guide.slug} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-primary">{guide.category}</p><h2 className="mt-3 text-2xl font-bold"><Link className="hover:text-primary" href={`/guides/${guide.slug}`}>{guide.title}</Link></h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{guide.description}</p><Link className="mt-5 inline-block text-xs font-black uppercase tracking-widest text-primary" href={`/guides/${guide.slug}`}>Read guide →</Link></article>)}</div></div></main>;
}
