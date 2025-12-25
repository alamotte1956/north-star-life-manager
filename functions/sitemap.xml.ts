Deno.serve(async (req) => {
    const baseUrl = 'https://northstarlifemanager.com';
    
    const pages = [
        { path: '', priority: '1.0', changefreq: 'daily' },
        { path: '/Pricing', priority: '0.9', changefreq: 'weekly' },
        { path: '/Dashboard', priority: '0.8', changefreq: 'daily' },
        { path: '/FAQ', priority: '0.7', changefreq: 'monthly' },
        { path: '/Privacy', priority: '0.6', changefreq: 'monthly' },
        { path: '/Terms', priority: '0.6', changefreq: 'monthly' },
        { path: '/VideoTutorials', priority: '0.7', changefreq: 'weekly' },
        { path: '/Vault', priority: '0.8', changefreq: 'daily' },
        { path: '/FinancialDashboard', priority: '0.8', changefreq: 'daily' },
        { path: '/Properties', priority: '0.7', changefreq: 'weekly' },
        { path: '/Investments', priority: '0.7', changefreq: 'weekly' },
        { path: '/Health', priority: '0.7', changefreq: 'weekly' },
        { path: '/Legal', priority: '0.7', changefreq: 'weekly' },
        { path: '/WealthLegacyPlanning', priority: '0.8', changefreq: 'weekly' }
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
});