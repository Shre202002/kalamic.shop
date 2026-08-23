import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Scale, ShoppingBag, UserCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of Kalamic.shop, customer accounts, purchases, payments, delivery and handcrafted products.',
  alternates: { canonical: 'https://www.kalamic.shop/terms' },
  robots: { index: true, follow: true },
};

const SUPPORT_EMAIL = 'kalamicshop@gmail.com';
const SUPPORT_PHONE = '+91 73767 61679';

const sections = [
  {
    title: '1. Acceptance and eligibility',
    text: 'By accessing Kalamic.shop, creating an account, using Google Sign-In, or placing an order, you agree to these Terms. You must be legally capable of entering into a contract or use the website with the involvement of a parent or lawful guardian.',
  },
  {
    title: '2. Accounts and Google Sign-In',
    text: 'You are responsible for maintaining the security of your account and for activity performed through it. When you choose Google Sign-In, we use the basic account information Google provides, such as your name, email address and profile image, to create or access your Kalamic account. Our use of this information is also governed by our Privacy Policy.',
  },
  {
    title: '3. Products and handcrafted variations',
    text: 'We aim to display product descriptions, colours, measurements and photographs accurately. Because Kalamic products are handcrafted, small variations in colour, glaze, texture, pattern or dimensions may occur and are not necessarily defects. Product availability may change without notice.',
  },
  {
    title: '4. Prices, orders and payments',
    text: 'Prices are shown in the currency displayed at checkout and may change before an order is confirmed. Shipping charges, taxes, customs duties or other applicable charges are shown or communicated where relevant. An order is accepted only after payment verification and our confirmation. We may cancel or contact you about an order affected by incorrect pricing, suspected fraud, stock unavailability or an evident technical error. Payments are processed by authorised third-party payment providers such as Razorpay; Kalamic does not store full card details, CVVs or UPI PINs.',
  },
  {
    title: '5. Delivery, international orders and risk',
    text: 'Delivery estimates are indicative and can be affected by destination, courier operations, customs, weather, public holidays or events outside our reasonable control. International customers are responsible for import duties, customs charges and local taxes unless checkout expressly states otherwise. Please provide a complete and accurate delivery address and contact number.',
  },
  {
    title: '6. Damage, replacement and returns',
    text: 'If an item arrives damaged, contact us promptly with the order number and clear photos or video of the packaging and product. Eligibility is assessed after discussion and verification by Kalamic. Approved claims are resolved according to our Returns and Replacement Policy. Unless required by applicable law, an approved damage claim is ordinarily fulfilled through replacement rather than a cash refund.',
  },
  {
    title: '7. Acceptable use and intellectual property',
    text: 'You may not misuse the website, attempt unauthorised access, interfere with its operation, submit fraudulent orders, or copy and commercially exploit our content without permission. Kalamic branding, photographs, designs, text and other website content are owned by or licensed to Kalamic and are protected by applicable intellectual-property laws.',
  },
  {
    title: '8. Disclaimers and limitation of liability',
    text: 'The website is provided on an as-available basis. To the extent permitted by law, Kalamic is not liable for indirect or consequential losses, third-party service interruptions, or delays outside our reasonable control. Nothing in these Terms excludes rights or remedies that cannot lawfully be excluded under applicable consumer law.',
  },
  {
    title: '9. Changes, governing law and disputes',
    text: 'We may update these Terms when our services or legal requirements change. The updated date will appear on this page. These Terms are governed by the laws of India. Subject to mandatory consumer protections, disputes will be handled by courts having jurisdiction in Kanpur, Uttar Pradesh.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="container mx-auto max-w-5xl px-4">
          <header className="mb-14 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <FileText className="h-3.5 w-3.5" /> Customer Agreement
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-primary md:text-6xl">Terms of Service</h1>
            <p className="font-medium text-muted-foreground">Effective and last updated: July 13, 2026</p>
          </header>

          <section className="mb-8 rounded-[2.5rem] border bg-white p-8 shadow-sm md:p-12">
            <div className="mb-5 flex items-center gap-4 text-primary">
              <Scale className="h-8 w-8" />
              <h2 className="text-2xl font-black uppercase tracking-tight">About these terms</h2>
            </div>
            <p className="font-medium leading-relaxed text-muted-foreground">
              These Terms apply to Kalamic.shop, operated by Kalamic from 130/262 D2, Kidwai Nagar, Kanpur, Uttar Pradesh, India. They explain the rules for using our website and purchasing handcrafted ceramic and decorative products.
            </p>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section, index) => (
              <section key={section.title} className={`rounded-[2rem] border bg-white p-7 shadow-sm ${index === sections.length - 1 ? 'md:col-span-2' : ''}`}>
                <h2 className="mb-4 text-lg font-black uppercase tracking-tight text-primary">{section.title}</h2>
                <p className="text-sm font-medium leading-7 text-muted-foreground">{section.text}</p>
                {index === 1 && (
                  <Link href="/privacy" className="mt-4 inline-flex font-bold text-primary underline underline-offset-4">
                    Read our Privacy Policy
                  </Link>
                )}
                {index === 5 && (
                  <Link href="/returns" className="mt-4 inline-flex font-bold text-primary underline underline-offset-4">
                    Read our Returns and Replacement Policy
                  </Link>
                )}
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-[2.5rem] bg-primary p-8 text-white shadow-xl md:p-12">
            <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <UserCheck className="h-8 w-8" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-black uppercase tracking-tight">Questions about these terms?</h2>
                <p className="mb-4 text-white/80">Contact Kalamic before placing an order if any condition needs clarification.</p>
                <div className="flex flex-col gap-2 text-sm font-bold sm:flex-row sm:gap-6">
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">{SUPPORT_EMAIL}</a>
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="hover:underline">{SUPPORT_PHONE}</a>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground">
            <ShoppingBag className="h-4 w-4" /> These Terms form part of every order placed through Kalamic.shop.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
