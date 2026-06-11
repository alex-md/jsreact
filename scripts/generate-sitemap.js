import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');
const distDir = path.resolve(rootDir, 'dist');

// Configuration
const siteUrl = 'https://jsreact.com';
const pageOverrides = {
    connect4: {
        priority: '0.9',
        changefreq: 'weekly'
    }
};

// Directories and files to exclude from sitemap
const excludedDirs = [
    'node_modules',
    'dist',
    '.git',
    'scripts',
    'components',
    'assets',
    'utils',
    'workers'
];

// Get the last modification date of a directory by checking all its files
function getDirectoryLastMod(dirPath) {
    let latestMod = 0;

    const walk = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory() && !excludedDirs.includes(file.name)) {
                const dirMod = walk(fullPath);
                latestMod = Math.max(latestMod, dirMod);
            } else if (file.isFile()) {
                const stats = fs.statSync(fullPath);
                latestMod = Math.max(latestMod, stats.mtimeMs);
            }
        }

        return latestMod;
    };

    walk(dirPath);
    return new Date(latestMod).toISOString().split('T')[0];
}

// Create list of all pages
function generatePageUrls() {
    const urls = [];

    // Add home page with its last modification date
    const homeLastMod = new Date(fs.statSync(path.join(srcDir, 'index.html')).mtimeMs)
        .toISOString()
        .split('T')[0];
    urls.push({
        url: '/',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: homeLastMod
    });

    // Add all pages from src directory (excluding utility directories)
    if (fs.existsSync(srcDir)) {
        const pages = fs.readdirSync(srcDir, { withFileTypes: true })
            .filter(dirent =>
                dirent.isDirectory() &&
                !excludedDirs.includes(dirent.name) &&
                fs.existsSync(path.join(srcDir, dirent.name, 'index.html'))
            )
            .map(dirent => dirent.name);

        pages.forEach(pageName => {
            const pageDir = path.join(srcDir, pageName);
            const lastmod = getDirectoryLastMod(pageDir);
            const override = pageOverrides[pageName] || {};

            urls.push({
                url: `/${pageName}/`,
                priority: override.priority || '0.8',
                changefreq: override.changefreq || 'weekly',
                lastmod
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
        xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>\n';
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

    // Sort URLs alphabetically for deterministic output
    urls.sort((a, b) => a.url.localeCompare(b.url));

    const sitemapContent = generateSitemapXml(urls);

    // Write sitemap to dist directory
    const sitemapPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(`Sitemap generated at ${sitemapPath}`);

    // Also write to project root so the canonical sitemap stays in sync
    const rootSitemapPath = path.join(rootDir, 'sitemap.xml');
    fs.writeFileSync(rootSitemapPath, sitemapContent);
    console.log(`Sitemap synced at ${rootSitemapPath}`);
}

main();
