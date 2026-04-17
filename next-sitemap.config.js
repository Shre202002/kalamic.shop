/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://kalamic.shop',
  generateRobotsTxt: true, // generates /robots.txt automatically
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/auth/*',
    '/checkout/*',
    '/account/*',
    '/admin/*',
    '/api/*',
    '/wishlist',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth/', '/checkout/', '/account/', '/admin/', '/api/', '/wishlist'],
      },
    ],
    additionalSitemaps: [
      'https://kalamic.shop/sitemap.xml',
    ],
  },
  // Boost product pages — they're your money pages
  transform: async (config, path) => {
    // Increase priority for individual product pages
    if (path.startsWith('/products/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }
    // Homepage is the top priority
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }
    // Default transformation for other pages
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
