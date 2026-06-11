// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(rootDir, 'src');
const siteUrl = 'https://jsreact.com';
const googleTagId = 'G-ZEFG04PXR7';

// Define directories that should not be treated as pages
const nonPageDirs = ['components', 'utils', 'assets'];

const pageSeo = {
    '/': {
        title: 'Free Online Tools for Developers and Everyday Tasks',
        description: 'Use free online tools for coding, text cleanup, calculations, games, SEO, and everyday tasks. Fast, practical utilities with no account required.',
        keywords: 'web development tools, online tools, developer utilities, code tools, programming utilities, web tools hub'
    },
    '/analytics/': {
        title: 'ViewTrack Analytics Dashboard',
        description: 'Track and analyze website traffic with real-time analytics and insights.',
        keywords: 'analytics dashboard, website traffic, real-time analytics, traffic tracking, web analytics',
        publishDate: '2025-05-08'
    },
    '/clean/': {
        title: 'Online Text Cleaner & Formatter',
        description: 'Clean and format text with our advanced text processing tool',
        keywords: 'text cleaner, text formatter, whitespace cleanup, string normalizer, content cleaner, text processing tool, remove extra spaces, clean text online, format text tool, text editor'
    },
    '/connect4/': {
        title: 'Connect 4 Solver - Find the Best Move Free',
        description: 'Analyze any Connect 4 position and get the best move instantly. Free online solver with automatic hints, undo and redo, and support for Red or Yellow.',
        keywords: 'connect 4 solver, connect four solver, best connect 4 move, connect 4 strategy, four in a row solver',
        imageAlt: 'JSreact free Connect 4 solver',
        structuredDataGraph: [
            {
                '@type': 'WebApplication',
                '@id': `${siteUrl}/connect4/#app`,
                name: 'JSreact Connect 4 Solver',
                url: `${siteUrl}/connect4/`,
                description: 'Free online Connect 4 solver for analyzing positions and finding the best move for Red, Yellow, or the current player.',
                applicationCategory: 'GameApplication',
                operatingSystem: 'Any',
                browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
                isAccessibleForFree: true,
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD'
                },
                featureList: [
                    'Automatic best-move hints',
                    'Whole-column move recommendations',
                    'Undo and redo move analysis',
                    'Keyboard controls',
                    'Solver targeting for Red, Yellow, or the current player'
                ],
                publisher: {
                    '@type': 'Organization',
                    name: 'JSreact',
                    url: `${siteUrl}/`
                }
            },
            {
                '@type': 'FAQPage',
                '@id': `${siteUrl}/connect4/#faq`,
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: 'How do I use the Connect 4 solver?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Recreate your position by selecting columns in move order. The recommended column is highlighted automatically, and you can use Undo and Redo to explore alternative lines.'
                        }
                    },
                    {
                        '@type': 'Question',
                        name: 'Can the solver analyze a move for either player?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. Choose Current, Red, or Yellow in Solver Options to control which player receives the recommendation.'
                        }
                    },
                    {
                        '@type': 'Question',
                        name: 'Is the Connect 4 solver free?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. The solver is free to use online and does not require an account.'
                        }
                    }
                ]
            }
        ]
    },
    '/diff/': {
        title: 'Online Diff Checker',
        description: 'Compare text differences between two versions'
    },
    '/domain/': {
        title: 'Domain Appraisal',
        description: 'Get instant AI-powered domain name valuations for up to 20 domains.',
        keywords: 'domain appraisal, domain valuation, domain worth, domain price, domain name value, AI domain appraisal, instant domain value, domain tool',
        publishDate: '2025-04-22'
    },
    '/elevation/': {
        title: 'Elevation Finder - Find Elevation Data for Any Location',
        description: 'Find elevation data for any location using address search or map clicking. Free online elevation finder tool with interactive maps.',
        keywords: 'elevation finder, elevation data, topographic data, altitude finder, elevation lookup, geographic elevation, map elevation, terrain elevation'
    },
    '/expression/': {
        title: 'Expression Evaluator',
        description: 'Evaluate mathematical expressions to reach a target number.'
    },
    '/generator/': {
        title: 'AI Name Generator',
        description: 'Generate creative names for your projects using startup name generator'
    },
    '/insert/': {
        title: 'Insert Tool - Text Insertion and Manipulation',
        description: 'Insert and manipulate text with powerful tools. Format, process, and modify text content easily.'
    },
    '/keyword/': {
        title: 'Keyword Density Analyzer & SEO Content Optimization Tool',
        description: 'Free online keyword density analyzer and content optimization tool. Analyze keyword frequency, find keyword clusters, and optimize your content for search engines. Perfect for SEO writers and content marketers.'
    },
    '/minify/': {
        title: 'JavaScript, CSS & HTML Minifier - Free Online Code Compression Tool',
        description: 'Free online tool to minify and optimize JavaScript, CSS, and HTML code. Reduce file size up to 80%, improve load times, and enhance website performance with advanced Terser compression. Best free code minifier with source map support.'
    },
    '/numigma/': {
        title: 'Numigma Puzzle Generator',
        description: 'Create and share deterministic reverse-number logic puzzles with customizable clue packs.'
    },
    '/oeis/': {
        title: 'Sequence Extrapolator',
        description: 'Analyze and forecast numeric sequences with ensemble models and confidence ranges.',
        keywords: 'oeis, sequence extrapolator, forecasting, time series, predictive analytics'
    },
    '/osrs/': {
        title: 'OSRS Flip Finder & Profit Calculator',
        description: 'Discover high-confidence Old School RuneScape flips with real-time Grand Exchange analytics, profit velocity scoring, and risk controls.',
        keywords: 'osrs flip finder, osrs flipping tool, grand exchange flips, osrs profit calculator, osrs merchanting',
        structuredData: {
            headline: 'OSRS Flip Finder & Profit Calculator',
            applicationCategory: 'GameApplication',
            featureList: [
                'Live Grand Exchange price tracking',
                'Flip scoring that blends profit, volatility, and confidence',
                'Searchable buy and sell price database',
                'Risk controls tailored to your gold budget'
            ]
        }
    },
    '/playground/': {
        title: 'JavaScript Playground',
        description: 'Interactive JavaScript coding environment with HTML, CSS and real-time preview.',
        keywords: 'javascript playground, code editor, html editor, css editor, online IDE, react playground, coding environment',
        publishDate: '2025-05-07'
    },
    '/policy/': {
        title: 'Privacy Policy',
        description: 'JSreact Privacy Policy - Our commitment to protecting your data and privacy. Learn about our data collection, usage, and security practices.'
    },
    '/qr/': {
        title: 'Free QR Code Generator - Create QR Codes from Images',
        description: 'Generate QR codes instantly from uploaded or pasted images. Free online tool for creating QR codes from your images. Easy to use, no registration required.',
        keywords: 'qr code generator, image to qr code, free qr code maker, online qr code generator, qr code from image',
        structuredData: {
            name: 'JSreact QR Code Generator',
            applicationCategory: 'UtilityApplication',
            description: 'Free online tool for generating QR codes from uploaded or pasted images. Easy to use with instant QR code generation.',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
            },
            featureList: [
                'Image to QR code conversion',
                'Drag and drop support',
                'Clipboard paste support',
                'Instant QR code generation',
                'Download QR codes',
                'Multiple image format support'
            ]
        }
    },
    '/speech/': {
        title: 'Speech Tools - Text to Speech & Speech to Text',
        description: 'Free online tool to convert between speech and text using OpenAI APIs. Features high-quality text-to-speech synthesis and accurate speech recognition.'
    }
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getRouteFromHtml = (filename) => {
    const relativePath = path.relative(srcDir, filename).split(path.sep).join('/');
    if (relativePath === 'index.html') {
        return '/';
    }
    return `/${relativePath.replace(/\/index\.html$/, '/')}`;
};

const createStructuredData = (route, metadata) => {
    if (metadata.structuredDataGraph) {
        return {
            '@context': 'https://schema.org',
            '@graph': metadata.structuredDataGraph
        };
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'JSreact',
        headline: metadata.title,
        description: metadata.description,
        url: `${siteUrl}${route}`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        author: {
            '@type': 'Organization',
            name: 'JSreact',
            url: siteUrl,
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/assets/images/icon.png`
            }
        },
        ...(metadata.publishDate ? { datePublished: metadata.publishDate } : {}),
        ...metadata.structuredData
    };
};

const createSeoPlugin = () => ({
    name: 'jsreact-static-seo',
    transformIndexHtml: {
        order: 'pre',
        handler(html, context) {
            const route = getRouteFromHtml(context.filename);
            const metadata = pageSeo[route];
            if (!metadata) {
                return html;
            }

            const fullTitle = `${metadata.title} | JSreact`;
            const canonicalUrl = `${siteUrl}${route}`;
            const structuredData = JSON.stringify(createStructuredData(route, metadata));
            const keywords = metadata.keywords
                ? `\n        <meta name="keywords" content="${escapeHtml(metadata.keywords)}">`
                : '';

            const seoTags = `
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${googleTagId}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', '${googleTagId}');
            window.__jsreactGtagConfigured = true;
        </script>
        <title>${escapeHtml(fullTitle)}</title>
        <meta name="description" content="${escapeHtml(metadata.description)}">${keywords}
        <meta name="author" content="JSreact">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
        <link rel="canonical" href="${canonicalUrl}">
        <meta property="og:type" content="website">
        <meta property="og:title" content="${escapeHtml(fullTitle)}">
        <meta property="og:description" content="${escapeHtml(metadata.description)}">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:site_name" content="JSreact">
        <meta property="og:locale" content="en_US">
        <meta property="og:image" content="${siteUrl}/assets/images/og-image.png">
        <meta property="og:image:width" content="589">
        <meta property="og:image:height" content="303">
        <meta property="og:image:alt" content="${escapeHtml(metadata.imageAlt || `${metadata.title} on JSreact`)}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
        <meta name="twitter:description" content="${escapeHtml(metadata.description)}">
        <meta name="twitter:image" content="${siteUrl}/assets/images/og-image.png">
        <meta name="twitter:image:alt" content="${escapeHtml(metadata.imageAlt || `${metadata.title} on JSreact`)}">
        <script type="application/ld+json">${structuredData.replace(/</g, '\\u003c')}</script>
`;

            return html
                .replace(/\s*<title>[\s\S]*?<\/title>/gi, '')
                .replace(/\s*<meta\s+(?:name|property)=["'](?:description|keywords|author|robots|googlebot|twitter:card|twitter:title|twitter:description|twitter:image|twitter:image:alt|og:type|og:title|og:description|og:url|og:site_name|og:locale|og:image|og:image:width|og:image:height|og:image:alt|article:tag)["'][^>]*>/gi, '')
                .replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
                .replace(/\s*<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '')
                .replace(/<\/head>/i, `${seoTags}    </head>`);
        }
    }
});

const getPageInputs = () => {
    const entries = {};

    // Add the main entry point
    const mainHtmlPath = path.resolve(srcDir, 'index.html');
    if (fs.existsSync(mainHtmlPath)) {
        entries.index = mainHtmlPath;
    }

    // Add other pages
    if (fs.existsSync(srcDir)) {
        fs.readdirSync(srcDir, { withFileTypes: true })
            .filter(d => d.isDirectory() && !nonPageDirs.includes(d.name))
            .forEach(d => {
                const pagePath = path.resolve(srcDir, d.name);
                const htmlPath = path.resolve(pagePath, 'index.html');

                if (fs.existsSync(htmlPath)) {
                    const entryPoints = ['main.tsx', 'main.jsx', 'main.ts', 'main.js', 'index.tsx', 'index.jsx', 'index.ts', 'index.js']
                        .map(file => path.resolve(pagePath, file))
                        .find(file => fs.existsSync(file));

                    if (entryPoints) {
                        entries[d.name] = entryPoints;
                    } else {
                        entries[d.name] = htmlPath;
                    }
                }
            });
    }

    return entries;
};

export default defineConfig({
    root: srcDir,
    base: '/',
    publicDir: path.resolve(rootDir, 'public'),
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'],
    resolve: {
        alias: {
            '@': srcDir,
            '@components': path.resolve(srcDir, 'components'),
            '@utils': path.resolve(srcDir, 'utils'),
            '@styles': path.resolve(rootDir, 'public/assets/styles')
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    build: {
        outDir: path.resolve(rootDir, 'dist'),
        emptyOutDir: true,
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                main: path.resolve(srcDir, 'index.html'),
                analytics: path.resolve(srcDir, 'analytics/index.html'),
                minify: path.resolve(srcDir, 'minify/index.html'),
                clean: path.resolve(srcDir, 'clean/index.html'),
                insert: path.resolve(srcDir, 'insert/index.html'),
                keyword: path.resolve(srcDir, 'keyword/index.html'),
                generator: path.resolve(srcDir, 'generator/index.html'),
                diff: path.resolve(srcDir, 'diff/index.html'),
                expression: path.resolve(srcDir, 'expression/index.html'),
                playground: path.resolve(srcDir, 'playground/index.html'),
                qr: path.resolve(srcDir, 'qr/index.html'),
                speech: path.resolve(srcDir, 'speech/index.html'),
                domain: path.resolve(srcDir, 'domain/index.html'),
                policy: path.resolve(srcDir, 'policy/index.html'),
                osrs: path.resolve(srcDir, 'osrs/index.html'),
                elevation: path.resolve(srcDir, 'elevation/index.html'),
                oeis: path.resolve(srcDir, 'oeis/index.html'),
                numigma: path.resolve(srcDir, 'numigma/index.html'),
                connect4: path.resolve(srcDir, 'connect4/index.html')
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('monaco-editor')) {
                            return 'monaco';
                        }
                        if (id.includes('@mui') || id.includes('@emotion')) {
                            return 'mui';
                        }
                        if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                            return 'react';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    },
    css: {
        modules: {
            scopeBehaviour: 'local',
            localsConvention: 'camelCase',
        },
        devSourcemap: true,
    },
    plugins: [createSeoPlugin(), react()]
});
