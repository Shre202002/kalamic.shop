/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.kalamic.shop',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  // Keep private, transactional and utility routes out of Google's index.
  // Include both the route root and descendants because glob matching does
  // not consistently treat `/checkout/*` as matching `/checkout` itself.
  exclude: [
    '/robots.txt',
    '/auth', '/auth/*',
    '/checkout', '/checkout/*',
    '/account', '/account/*',
    '/admin', '/admin/*',
    '/api', '/api/*',
    '/cart', '/cart/*',
    '/orders', '/orders/*',
    '/profile', '/profile/*',
    '/wishlist', '/wishlist/*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: ['/api/feed/'],
        disallow: ['/auth/', '/checkout/', '/account/', '/admin/', '/api/', '/cart/', '/orders/', '/profile/', '/wishlist/'],
      },
    ],
  },
  transform: async (config, path) => {
    if (path.startsWith('/products/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
