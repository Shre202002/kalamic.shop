import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, MessageCircle, PackageCheck } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { getProducts } from '@/lib/actions/products';

const PAGE_URL = 'https://www.kalamic.shop/ceramic-gift-shop-kanpur';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Ceramic Gift Shop in Kidwai Nagar, Kanpur',
  description:
    'Shop handcrafted ceramic gifts from Kalamic in Kidwai Nagar, Kanpur: customized photo frames, decorative mirrors, Mor Stambh and wall art with delivery support.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Ceramic Gift Shop in Kidwai Nagar, Kanpur',
    description: 'Handcrafted ceramic gifts and Indian home decor from Kalamic, based in Kidwai Nagar, Kanpur.',
    url: PAGE_URL,
    type: 'website',
  },
};

const localFaqs = [
  {
    question: 'Where is Kalamic based?',
    answer: 'Kalamic is based in Kidwai Nagar, Kanpur, Uttar Pradesh. Orders are accepted online through kalamic.shop.',
  },
  {
    question: 'What ceramic gifts can I order in Kanpur?',
    answer: 'The current collection includes customized photo frames, decorative wall mirrors, Mor Stambh sets and Ganesha mandala wall art, subject to stock availability.',
  },
  {
    question: 'Can I discuss a customized gift before ordering?',
    answer: 'Yes. Contact Kalamic on the business phone or WhatsApp before ordering to confirm personalization, availability and production time.',
  },
];

export default async function CeramicGiftShopKanpurPage() {
  const products = await getProducts({ limit: 6 });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: localFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.kalamic.shop/' },
      { '@type': 'ListItem', position: 2, name: 'Ceramic Gift Shop in Kanpur', item: PAGE_URL },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main>
        <section className="border-b border-primary/10 bg-gradient-to-b from-primary/10 to-background px-6 pb-20 pt-32 text-center md:pb-28 md:pt-40">
          <div className="mx-auto max-w-4xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <MapPin className="h-4 w-4" /> Kidwai Nagar, Kanpur
            </p>
            <h1 className="text-4xl font-display font-bold leading-tight text-foreground md:text-7xl">
              Handcrafted Ceramic Gifts in Kanpur
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              Kalamic is an online ceramic gift and home-decor shop based in Kidwai Nagar, Kanpur. Explore personalized photo frames, decorative mirrors, Mor Stambh sets and spiritual wall art made for memorable gifting.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/products" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-black text-white shadow-lg shadow-primary/20">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="https://wa.me/917376761679" target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-primary/20 bg-white px-8 py-4 text-sm font-black text-primary">
                Discuss a custom gift <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Available online</p>
            <h2 className="mt-3 text-3xl font-display font-bold text-foreground md:text-5xl">Ceramic gifts for homes and celebrations</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Prices and stock shown below come directly from the current Kalamic catalog. Delivery charges and timelines are confirmed during checkout.</p>
          </div>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: any) => {
              const image = product.images?.find((item: any) => item.is_primary) || product.images?.[0];
              return (
                <article key={product._id} className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
                  <Link href={`/products/${product.slug || product._id}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {image?.url && (
                        <Image src={image.url} alt={image.alt || product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-display font-bold leading-snug text-foreground">{product.name}</h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.short_description || product.description}</p>
                      <p className="mt-5 text-lg font-black text-primary">₹{Number(product.price).toLocaleString('en-IN')}</p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[#1a1208] px-6 py-20 text-white md:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
            <div>
              <PackageCheck className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-2xl font-display font-bold">Order with clear support</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">Order through the website and contact the studio for customization, availability or delivery questions.</p>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Based in Kidwai Nagar</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">Kalamic serves Kanpur and other destinations through online ordering. Please contact us before planning any in-person discussion.</p>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Damage replacement policy</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">Eligible damaged, defective or incorrect deliveries are reviewed for replacement under our published policy.</p>
              <Link href="/returns" className="mt-4 inline-block text-sm font-bold text-primary">Read the replacement policy →</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
          <h2 className="text-3xl font-display font-bold text-foreground md:text-5xl">Questions about ordering in Kanpur</h2>
          <div className="mt-10 divide-y divide-border">
            {localFaqs.map((faq) => (
              <div key={faq.question} className="py-7 first:pt-0">
                <h3 className="text-lg font-bold text-foreground">{faq.question}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
