/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://kalamic.shop',
  generateRobotsTxt: true,
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
    // ✅ REMOVED: additionalSitemaps that was referencing itself (caused 404)
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