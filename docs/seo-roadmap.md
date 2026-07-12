# Kalamic SEO Roadmap

Baseline source: Google Search Console export for the last three months, downloaded 12 July 2026.

## Current baseline

- Brand query `kalamic`: 168 impressions, 36 clicks, 21.43% CTR, average position 2.33.
- Mor Stambh guide: 435 impressions, 2 clicks, 0.46% CTR, average position 9.29.
- Customized ceramic photo frame: 152 impressions, 0 clicks, average position 6.47.
- Gallery: 136 impressions, 0 clicks, average position 4.71.
- About page: 116 impressions, 0 clicks, average position 3.57.
- Mobile: 539 impressions and 21 clicks, making it the primary search device.
- India: 318 impressions and 38 clicks; the United States has 218 impressions but only 1 click.

## Phase 1: technical foundation

- Standardize every canonical, sitemap, feed and entity URL on `https://www.kalamic.shop`.
- Install GA4 ecommerce events and verified purchase deduplication.
- Add consent-controlled analytics for international visitors.
- Add Product and Breadcrumb structured data to every product detail page.
- Keep Merchant Center prices, availability, identifiers, shipping and returns aligned with checkout.
- Self-host fonts through `next/font` to remove render-blocking Google Fonts stylesheets.
- Resolve repository-wide TypeScript errors so production builds become a reliable release gate.

## Phase 2: improve pages already ranking

1. Mor Stambh guide
   - Primary cluster: `stambh`, `stambh meaning`, `stambh meaning in English`, `what is stambh`, `mor stambh`.
   - Add a 40-60 word direct definition immediately below the H1.
   - Add sections for pronunciation, English translation, symbolism, placement and buying considerations.
   - Link to the Mor Stambh product with descriptive anchor text.

2. Customized ceramic photo frame
   - Primary cluster: `customized ceramic photo frame`, `unique picture frames online`, `ceramic photo frame gift`.
   - Add customization steps, accepted photo format, dimensions, production time and packaging details.
   - Add original photographs showing scale, rear stand/hanging method and finished customization.

3. Ceramic wall mirrors
   - Primary cluster: `peacock mirror`, `peacock mirror wall decor`, `antique gold oval wall mirror`, `floral gold mirror`.
   - Add room-placement examples, exact dimensions, weight, installation method and care instructions.
   - Build a comparison section linking the oval and peacock mirror products.

4. Local discovery
   - Primary cluster: `gift shop Kidwai Nagar`, `gift store near me`, `pottery shop near me`, `ceramic decor Kanpur`.
   - Create and verify a Google Business Profile only if customers can genuinely visit or receive local service.
   - Keep the business name, public phone, address and hours consistent everywhere.

## Phase 3: content clusters

Publish useful, original guides that support products rather than generic high-volume articles:

- How to choose the right wall mirror size for a living room
- Peacock symbolism in Indian home decor
- Ceramic vs wood photo frames for gifting
- Housewarming ceramic gift ideas in India
- How to safely hang a heavy decorative wall mirror
- How to clean and protect glazed ceramic decor
- Pooja-room decor placement guide for Mor Stambh and mandala art

Each guide should answer the query directly, include original imagery, cite genuine expertise, and link to one primary commercial page.

## Phase 4: authority and AI discovery

- Publish verifiable founder, artisan, material and manufacturing information.
- Replace unsupported ratings or collector counts with evidence-backed values.
- Earn relevant mentions from Indian craft, interior design, gifting and Kanpur publications.
- Maintain structured facts for product dimensions, weight, materials, care, availability, delivery and returns.
- Use consistent brand/entity details across the website, Merchant Center, Search Console, social profiles and Business Profile.

## Measurement cadence

Review Search Console every 28 days:

- Non-brand clicks and impressions
- CTR for pages with average position 1-15
- Product rich-result eligibility
- Indexed versus submitted sitemap URLs
- Mobile Core Web Vitals
- Merchant product approvals and disapprovals
- GA4 product views, add-to-cart rate, checkout rate and purchase conversion rate

Do not judge SEO changes within a few days. Record the publication or deployment date and compare equivalent 28-day periods after Google recrawls the affected pages.
