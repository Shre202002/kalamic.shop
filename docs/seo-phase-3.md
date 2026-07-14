# SEO Phase 3: Search Console growth and catalog discovery

Baseline source: Google Search Console Web Performance export for the three months ending 12 July 2026.

## What the data says

- 40 clicks from 819 impressions across devices.
- Branded query `kalamic`: 36 clicks / 168 impressions, 21.43% CTR, average position 2.33.
- Mor Stambh guide: 2 clicks / 435 impressions, 0.46% CTR, average position 9.29.
- Customized ceramic photo frame: 0 clicks / 152 impressions, average position 6.47.
- Peacock wall mirror: 0 clicks / 94 impressions, average position 12.44.
- Peacock Mor Stambh product: 0 clicks / 44 impressions, average position 3.2.
- Local query `gift shop kidwai nagar`: 6 impressions, average position 14.33.
- Mobile supplied 539 of 819 impressions, so mobile rendering remains the priority.

## Phase 3 implementation

1. Replaced build-generated sitemap files with `/sitemap.xml`, populated from active products and published articles in MongoDB.
2. Removed cart, checkout, orders, profile and other private pages from sitemap discovery and added explicit crawl restrictions/noindex metadata.
3. Added a truthful local-intent page at `/ceramic-gift-shop-kanpur`, based on the Kidwai Nagar query already appearing in Search Console.
4. Removed duplicated `| Kalamic | Kalamic` title branding and added page-specific Twitter/Open Graph metadata.
5. Linked the published replacement policy from organization and product structured data.
6. Added matching FAQ structured data and corrected delivery/replacement answers that conflicted with the live policy.
7. Improved the Google Merchant XML feed by escaping XML values, removing the fake permanent sale window and avoiding invented MPN/category values.
8. Added `/llms.txt` as a concise, machine-readable map of Kalamic, its live catalog, policies and key guide.

## Post-deployment Search Console actions

1. Open **Indexing → Sitemaps** and submit `https://www.kalamic.shop/sitemap.xml`.
2. Inspect and request indexing for:
   - `https://www.kalamic.shop/ceramic-gift-shop-kanpur`
   - `https://www.kalamic.shop/blog/what-is-mor-stambh-history-meaning-why-it-belongs-in-your-home`
   - all five live product URLs now present in the sitemap.
3. In **Shopping → Product snippets / Merchant listings**, check for structured-data warnings after Google recrawls.
4. Compare CTR and non-branded clicks after 28 days; do not judge the title changes from the pre-deployment three-month export.

Google references:

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/product
- https://developers.google.com/search/docs/appearance/structured-data/return-policy
