type ProductLike = {
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  tags?: string[];
  category_id?: { name?: string } | string;
  seo?: { meta_title?: string; meta_description?: string; meta_keywords?: string[] };
};

const clean = (value: unknown) => String(value || '').replace(/\s+/g, ' ').trim();

const highIntentOverrides: Record<string, { title: string; description: string }> = {
  'customized-ceramic-photo-frame': {
    title: 'Customized Ceramic Photo Frame Online',
    description: 'Order a handcrafted customized ceramic photo frame for 4x6 photos. Floral and owl detailing, secure delivery and a thoughtful personalised gift.',
  },
  'handmade-ceramic-peacock-floral-wall-mirror': {
    title: 'Handmade Peacock Ceramic Wall Mirror',
    description: 'Shop a handmade ceramic wall mirror with peacock and floral motifs in an antique gold finish. Statement decor for living rooms, bedrooms and gifting.',
  },
  'handcrafted-antique-gold-floral-wall-mirror-23x18': {
    title: 'Antique Gold Oval Wall Mirror 23 x 18 Inches',
    description: 'Buy a 23 x 18 inch handcrafted antique gold floral wall mirror. A decorative oval ceramic frame for entryways, bedrooms and elegant Indian interiors.',
  },
  'handcrafted-peacock-mor-stambh-decorative-pillar-set': {
    title: 'Peacock Mor Stambh Set of 2 for Home Decor',
    description: 'Shop a handcrafted pair of ceramic Peacock Mor Stambh pillars for home temples, entryways and festive decor, securely packed by Kalamic in Kanpur.',
  },
};

const clip = (value: string, max: number) => {
  if (value.length <= max) return value;
  const clipped = value.slice(0, max - 1).replace(/\s+\S*$/, '').trim();
  return `${clipped}…`;
};

function productIntent(product: ProductLike) {
  const text = `${product.name || ''} ${(product.tags || []).join(' ')} ${typeof product.category_id === 'object' ? product.category_id?.name || '' : product.category_id || ''}`.toLowerCase();
  if (text.includes('mirror')) return 'ceramic wall decor for Indian homes';
  if (text.includes('photo') || text.includes('frame')) return 'personalised Indian home decor and gifting';
  if (text.includes('stambh') || text.includes('pillar')) return 'heritage temple and home decor';
  if (text.includes('mandala')) return 'handcrafted spiritual wall decor';
  return 'handcrafted Indian home decor';
}

export function getProductSeo(product: ProductLike) {
  const name = clean(product.name) || 'Handcrafted Ceramic Decor';
  const intent = productIntent(product);
  const override = product.slug ? highIntentOverrides[product.slug] : undefined;
  const configuredTitle = clean(product.seo?.meta_title);
  const configuredDescription = clean(product.seo?.meta_description);
  const sourceDescription = clean(product.short_description || product.description);

  // Keep titles concise; Next's metadata template appends “| Kalamic”.
  const usableConfiguredTitle = override?.title || (configuredTitle.length >= 35 ? configuredTitle : '');
  const title = clip(usableConfiguredTitle || name, 56);
  const description = clip(
    override?.description || (
      configuredDescription.length >= 110
        ? configuredDescription
        : `${sourceDescription || `Discover ${name}, crafted by Kalamic artisans in Kanpur, India.`}${sourceDescription && !/[.!?]$/.test(sourceDescription) ? '.' : ''} Shop this ${intent} with secure delivery and thoughtful artisan packaging.`
    ),
    158,
  );
  const configuredKeywords = Array.isArray(product.seo?.meta_keywords) ? product.seo?.meta_keywords : [];
  const keywords = Array.from(new Set([
    ...configuredKeywords.map(clean),
    ...(product.tags || []).map(clean),
    name.toLowerCase(),
    intent,
    'Kalamic handcrafted decor',
  ].filter(Boolean))).slice(0, 12);

  return { title, description, keywords };
}
