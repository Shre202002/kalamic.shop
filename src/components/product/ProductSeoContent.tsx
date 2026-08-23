import Link from 'next/link';

type ProductFaq = {
  question: string;
  answer: string;
};

const PHOTO_FRAME_SLUG = 'customized-ceramic-photo-frame';
const PEACOCK_MIRROR_SLUG = 'handmade-ceramic-peacock-floral-wall-mirror';
const OVAL_MIRROR_SLUG = 'handcrafted-antique-gold-floral-wall-mirror-23x18';

export function getProductSeoFaqs(slug?: string, productFaqs?: ProductFaq[]): ProductFaq[] {
  const normalizedProductFaqs = Array.isArray(productFaqs)
    ? productFaqs.filter((faq) => faq && typeof faq.question === 'string' && faq.question.trim() && typeof faq.answer === 'string' && faq.answer.trim())
    : [];
  if (normalizedProductFaqs.length > 0) return normalizedProductFaqs;
  if (slug === PHOTO_FRAME_SLUG) {
    return [
      {
        question: 'What photo size fits the customized ceramic photo frame?',
        answer: 'The frame is designed for one standard 4 x 6 inch photograph in vertical orientation.',
      },
      {
        question: 'Can the ceramic photo frame stand on a table or hang on a wall?',
        answer: 'Yes. The product includes a tabletop stand and a wall-hanging hook for flexible display.',
      },
      {
        question: 'How do I send my photograph for customization?',
        answer: 'Contact Kalamic on WhatsApp after placing the order and share a clear, high-resolution JPG or PNG file. The studio confirms the crop and production timeline before customization begins.',
      },
    ];
  }

  if (slug === PEACOCK_MIRROR_SLUG) {
    return [
      {
        question: 'What are the dimensions of the peacock ceramic wall mirror?',
        answer: 'The published product dimensions are 50 x 40 cm and the listed weight is approximately 2 kg.',
      },
      {
        question: 'Where can I place a peacock mirror?',
        answer: 'Its vertical wall-mounted design works well in entryways, dressing areas, bedrooms and living-room feature walls.',
      },
      {
        question: 'How should I clean the ceramic mirror frame?',
        answer: 'Dust the raised ceramic detailing with a soft dry cloth or brush and clean the mirror glass separately with a lightly damp microfiber cloth.',
      },
    ];
  }

  if (slug === OVAL_MIRROR_SLUG) {
    return [
      {
        question: 'What size is the antique gold oval wall mirror?',
        answer: 'This model is sold as a 23 x 18 inch decorative oval wall mirror. Confirm the final physical measurements before drilling permanent mounting points.',
      },
      {
        question: 'Which rooms suit an antique gold floral mirror?',
        answer: 'The floral antique-gold finish suits entryways, bedrooms, dressing areas and living rooms with traditional, vintage or warm contemporary interiors.',
      },
      {
        question: 'How should a decorative wall mirror be installed?',
        answer: 'Use wall hardware rated above the mirror’s listed weight and appropriate for the wall material. Verify the rear fitting and wall condition before installation.',
      },
    ];
  }

  return [
    {
      question: 'What should I know before ordering this handcrafted product?',
      answer: 'Review the product description, specifications, dimensions, care guidance and delivery information before ordering. Each Kalamic piece is handcrafted, so small variations are part of its character.',
    },
    {
      question: 'How should I care for this Kalamic creation?',
      answer: 'Use a soft, dry cloth for regular dusting and follow any product-specific care instructions. Avoid harsh chemicals, excess moisture and sudden impacts.',
    },
    {
      question: 'How is my order packed and delivered?',
      answer: 'Kalamic uses protective packaging designed for handcrafted décor. Delivery timing and charges are shown during checkout based on your destination.',
    },
  ];
}

function FaqList({ faqs }: { faqs: ProductFaq[] }) {
  return (
    <section aria-labelledby="product-faq-heading" className="rounded-[2.5rem] border border-border bg-white p-7 shadow-sm md:p-10">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Buying answers</p>
      <h2 id="product-faq-heading" className="mt-2 text-3xl font-display font-bold text-foreground">
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-border/70">
        {faqs.map((faq) => (
          <div key={faq.question} className="py-6 first:pt-0 last:pb-0">
            <h3 className="text-base font-black text-foreground">{faq.question}</h3>
            <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductSeoContent({ product }: { product: any }) {
  const slug = product.slug as string | undefined;
  const faqs = getProductSeoFaqs(slug, product.faqs);

  return (
    <div className="space-y-10">
      {slug === PHOTO_FRAME_SLUG && (
        <section aria-labelledby="photo-frame-guide-heading" className="rounded-[2.5rem] bg-[#20150d] p-7 text-white md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Personalization guide</p>
          <h2 id="photo-frame-guide-heading" className="mt-2 text-3xl font-display font-bold">
            How to order your customized ceramic photo frame
          </h2>
          <ol className="mt-7 grid gap-5 text-sm leading-7 text-white/75 md:grid-cols-3">
            <li><strong className="block text-white">1. Choose the photograph</strong>Use a clear vertical image that crops well to the 4 x 6 inch opening.</li>
            <li><strong className="block text-white">2. Share the file</strong>After ordering, send a high-resolution JPG or PNG to Kalamic on WhatsApp.</li>
            <li><strong className="block text-white">3. Confirm the details</strong>The studio confirms cropping, personalization and production time before work begins.</li>
          </ol>
          <div className="mt-8 grid gap-4 rounded-2xl bg-white/5 p-5 text-sm md:grid-cols-3">
            <p><strong className="block text-primary">Photo opening</strong>4 x 6 inches</p>
            <p><strong className="block text-primary">Frame measurement</strong>Approximately 21.5 x 16.5 cm</p>
            <p><strong className="block text-primary">Display options</strong>Tabletop stand and wall hook</p>
          </div>
        </section>
      )}

      {(slug === PEACOCK_MIRROR_SLUG || slug === OVAL_MIRROR_SLUG) && (
        <section aria-labelledby="mirror-placement-heading" className="rounded-[2.5rem] border border-primary/15 bg-primary/[0.03] p-7 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Placement and comparison</p>
          <h2 id="mirror-placement-heading" className="mt-2 text-3xl font-display font-bold text-foreground">
            Choose the right decorative wall mirror
          </h2>
          <div className="mt-7 grid gap-5 text-sm leading-7 text-muted-foreground md:grid-cols-3">
            <p><strong className="block text-foreground">Entryway</strong>Place the mirror above a console while keeping enough clearance from doors and busy walkways.</p>
            <p><strong className="block text-foreground">Bedroom or dressing area</strong>Use the vertical orientation near natural light, without positioning the glass directly opposite harsh glare.</p>
            <p><strong className="block text-foreground">Living-room feature wall</strong>Allow visual space around the raised floral frame so the handcrafted details remain the focal point.</p>
          </div>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-muted/50 text-foreground">
                <tr><th className="p-4">Mirror</th><th className="p-4">Published size</th><th className="p-4">Best suited to</th><th className="p-4">Design</th></tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-muted-foreground">
                <tr>
                  <td className="p-4 font-bold text-primary"><Link href={`/products/${PEACOCK_MIRROR_SLUG}`}>Peacock floral mirror</Link></td>
                  <td className="p-4">50 x 40 cm; approximately 2 kg</td>
                  <td className="p-4">Vertical feature walls and dressing areas</td>
                  <td className="p-4">Peacock and floral embossed frame</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-primary"><Link href={`/products/${OVAL_MIRROR_SLUG}`}>Antique gold oval mirror</Link></td>
                  <td className="p-4">23 x 18 inch model</td>
                  <td className="p-4">Entryways, bedrooms and compact accent walls</td>
                  <td className="p-4">Floral antique-gold frame</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Before installation, verify the delivered mirror’s rear fitting and use wall hardware rated above its weight. Handcrafted dimensions can vary slightly.
          </p>
        </section>
      )}

      <FaqList faqs={faqs} />
    </div>
  );
}
