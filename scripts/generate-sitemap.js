import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');
const distDir = path.resolve(rootDir, 'dist');

// Configuration
const siteUrl = 'https://jsreact.com';

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
    const homeLastMod = getDirectoryLastMod(srcDir);
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

            urls.push({
                url: `/${pageName}/`,
                priority: '0.8',
                changefreq: 'weekly',
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
