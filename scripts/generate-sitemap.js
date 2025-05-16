import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');
const pagesDir = path.resolve(srcDir, 'pages');
const distDir = path.resolve(rootDir, 'dist');

// Configuration
const siteUrl = 'https://jsreact.com';
const lastMod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Create list of all pages
function generatePageUrls() {
    const urls = [];

    // Add home page
    urls.push({
        url: '/',
        priority: '1.0',
        changefreq: 'weekly'
    });

    // Add all pages from the pages directory
    if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        pages.forEach(pageName => {
            urls.push({
                url: `/${pageName}/`,
                priority: '0.8',
                changefreq: 'weekly'
            });
        });
    }

    return urls;
}

// Generate sitemap XML content
function generateSitemapXml(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${siteUrl}${page.url}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
}

// Main execution
function main() {
    console.log('Generating sitemap.xml...');

    // Make sure dist directory exists
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    // Generate sitemap content
    const urls = generatePageUrls();
    const sitemapContent = generateSitemapXml(urls);

    // Write sitemap to dist directory
    const sitemapPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent);

    console.log(`Sitemap generated at ${sitemapPath}`);
}

main();
