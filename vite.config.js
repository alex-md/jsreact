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
        title: 'Free Online Tools for Developers, SEO, Games, and Everyday Tasks',
        description: 'Use fast free online tools for coding, SEO content checks, text cleanup, calculators, games, QR codes, and everyday browser utilities. No account required.',
        keywords: 'free online tools, web development tools, developer utilities, SEO tools, text tools, online calculators, browser tools, code tools, web tools hub, free browser tools',
        structuredDataGraph: [
            {
                '@type': 'WebSite',
                '@id': `${siteUrl}/#website`,
                name: 'JSreact',
                url: `${siteUrl}/`,
                description: 'A collection of free browser-based tools for developers, SEO workflows, text cleanup, games, QR codes, and everyday utilities.',
                inLanguage: 'en-US',
                publisher: {
                    '@type': 'Organization',
                    name: 'JSreact',
                    url: `${siteUrl}/`,
                    logo: {
                        '@type': 'ImageObject',
                        url: `${siteUrl}/assets/images/icon.png`
                    }
                }
            },
            {
                '@type': 'ItemList',
                '@id': `${siteUrl}/#tools`,
                name: 'Free Online Tools on JSreact',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Connect 4 Solver', url: `${siteUrl}/connect4/` },
                    { '@type': 'ListItem', position: 2, name: 'OSRS Flip Finder', url: `${siteUrl}/osrs/` },
                    { '@type': 'ListItem', position: 3, name: 'Code Minifier', url: `${siteUrl}/minify/` },
                    { '@type': 'ListItem', position: 4, name: 'Text Cleaner', url: `${siteUrl}/clean/` },
                    { '@type': 'ListItem', position: 5, name: 'Diff Checker', url: `${siteUrl}/diff/` },
                    { '@type': 'ListItem', position: 6, name: 'Keyword Density Analyzer', url: `${siteUrl}/keyword/` },
                    { '@type': 'ListItem', position: 7, name: 'QR Code Generator', url: `${siteUrl}/qr/` },
                    { '@type': 'ListItem', position: 8, name: 'Domain Appraisal', url: `${siteUrl}/domain/` }
                ]
            }
        ]
    },
    '/analytics/': {
        title: 'Website Analytics Dashboard - Live Traffic and Page Views',
        description: 'View website traffic, live page views, popular pages, daily trends, and engagement snapshots in a lightweight analytics dashboard.',
        keywords: 'analytics dashboard, website traffic dashboard, page view tracker, real-time analytics, traffic tracking, web analytics, website metrics',
        publishDate: '2025-05-08',
        structuredData: {
            alternateName: ['ViewTrack Analytics Dashboard', 'Website Traffic Dashboard', 'Page View Tracker'],
            applicationCategory: 'AnalyticsApplication',
            featureList: [
                'Live traffic overview',
                'Popular page tracking',
                'Daily and weekly trend charts',
                'Website engagement metrics'
            ]
        }
    },
    '/clean/': {
        title: 'Online Text Cleaner & Formatter - Free Text Cleanup Tool',
        description: 'Clean, normalize, and format text online. Remove extra spaces, blank lines, punctuation, smart quotes, and messy whitespace with a free browser text cleaner.',
        keywords: 'text cleaner, text formatter, whitespace cleanup, string normalizer, content cleaner, text processing tool, remove extra spaces, clean text online, format text tool, text editor',
        structuredData: {
            alternateName: ['Text Cleanup Tool', 'Whitespace Cleaner', 'Online Text Formatter'],
            applicationCategory: 'UtilitiesApplication',
            featureList: [
                'Remove extra spaces and blank lines',
                'Normalize smart quotes and punctuation',
                'Find and replace text',
                'Format pasted content in the browser'
            ]
        }
    },
    '/connect4/': {
        title: 'Connect 4 Solver & Best Move Calculator - Free',
        description: 'Find the best Connect 4 move for any board. Recreate a position, get instant hints, compare strategy lines, and analyze Red, Yellow, or the current player for free.',
        keywords: 'connect 4 solver, connect 4 best move calculator, connect four solver, four in a row solver, connect 4 calculator, connect 4 strategy, how to win connect 4, best first move connect 4, connect 4 cheat bot, connect4 solver, connect 4 game solver, 4 in a row solver, adjustable connect 4 AI, connect 4 AI difficulty, human-like connect 4 AI',
        imageAlt: 'Connect 4 board with recommended move highlighted',
        structuredDataGraph: [
            {
                '@type': 'WebApplication',
                '@id': `${siteUrl}/connect4/#app`,
                name: 'JSreact Connect 4 Solver',
                url: `${siteUrl}/connect4/`,
                alternateName: [
                    'Connect 4 Best Move Calculator',
                    'Connect Four Solver',
                    'Four in a Row Solver',
                    '4 in a Row Solver',
                    'Connect 4 Calculator',
                    'Connect4 Solver',
                    'Connect 4 Game Solver',
                    'Connect 4 Strategy Tool',
                    'Connect 4 Move Analyzer'
                ],
                description: 'Analyze any Connect 4 position, highlight the strongest column, compare strategy lines, and explore alternate moves with free browser-based hints.',
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
                    'Best-move recommendations for any board position',
                    'Board analysis for standard game positions',
                    'Whole-column move recommendations',
                    'Undo and redo move analysis',
                    'Keyboard controls',
                    'Solver targeting for Red, Yellow, or the current player',
                    'Five adjustable AI strength levels',
                    'Random, casual, human-like, expert, and master analysis',
                    'Complete late-game position analysis in Master mode',
                    'Strategy links for opening moves, threats, and solver interpretation'
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
                        name: 'Does it work with standard Connect Four rules?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. Enter the moves in column order and the solver analyzes the standard seven-column, six-row game board directly in your browser.'
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
                        name: 'Can I adjust the Connect 4 AI difficulty?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. Use the AI strength slider to choose Random, Casual, Human, Expert, or Master analysis. Lower levels add natural variation, while Expert and Master search deeper and choose deterministic moves.'
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
                    ,
                    {
                        '@type': 'Question',
                        name: 'What is the best first move in Connect 4?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'The center column is usually the strongest first move because it creates the most horizontal, vertical, and diagonal connection paths. The solver can still evaluate the exact position after each move.'
                        }
                    },
                    {
                        '@type': 'Question',
                        name: 'How can I get better at Connect 4?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Use the solver to test real board positions, then study center control, immediate threats, double threats, and forced blocks so the same patterns become easier to spot without help.'
                        }
                    }
                ]
            }
        ]
    },
    '/connect4/strategy/': {
        title: 'Connect 4 Strategy Guide - How to Win',
        description: 'Learn practical Connect 4 strategy: center control, forced blocks, double threats, traps, and how to use the free solver to study winning positions.',
        keywords: 'connect 4 strategy, how to win connect 4, connect four strategy, connect 4 tips, connect 4 tricks, connect 4 double threat, connect 4 traps, connect 4 solver strategy',
        imageAlt: 'Connect 4 strategy board showing center control and threats',
        structuredData: {
            '@type': 'Article',
            headline: 'Connect 4 Strategy Guide',
            alternateName: ['How to Win Connect 4', 'Connect Four Strategy Guide', 'Connect 4 Tips'],
            articleSection: 'Games',
            about: ['Connect 4 strategy', 'Connect 4 solver', 'board game tactics'],
            mainEntityOfPage: `${siteUrl}/connect4/strategy/`
        }
    },
    '/connect4/best-first-move/': {
        title: 'Best First Move in Connect 4',
        description: 'The best first move in Connect 4 is usually the center column. Learn why it matters, when to adapt, and how to test openings in the solver.',
        keywords: 'best first move connect 4, connect 4 opening move, connect four best first move, connect 4 center column, how to start connect 4, connect 4 opening strategy',
        imageAlt: 'Connect 4 opening board with the center column highlighted',
        structuredData: {
            '@type': 'Article',
            headline: 'Best First Move in Connect 4',
            alternateName: ['Connect 4 Opening Move', 'Connect Four Best First Move', 'Connect 4 Center Column Strategy'],
            articleSection: 'Games',
            about: ['Connect 4 openings', 'center column strategy', 'Connect 4 solver'],
            mainEntityOfPage: `${siteUrl}/connect4/best-first-move/`
        }
    },
    '/connect4/solver-guide/': {
        title: 'How to Use a Connect 4 Solver',
        description: 'Use the Connect 4 solver to recreate board positions, compare recommended columns, study threats, and improve move selection with free browser analysis.',
        keywords: 'how to use connect 4 solver, connect 4 solver guide, connect 4 best move calculator guide, connect four solver help, analyze connect 4 board, connect 4 move analyzer',
        imageAlt: 'Connect 4 solver interface with a recommended move',
        structuredData: {
            '@type': 'Article',
            headline: 'How to Use a Connect 4 Solver',
            alternateName: ['Connect 4 Solver Guide', 'Connect 4 Best Move Calculator Guide', 'Connect 4 Move Analyzer Help'],
            articleSection: 'Games',
            about: ['Connect 4 solver', 'Connect 4 board analysis', 'best move calculator'],
            mainEntityOfPage: `${siteUrl}/connect4/solver-guide/`
        }
    },
    '/diff/': {
        title: 'Online Diff Checker - Compare Text Differences',
        description: 'Compare two blocks of text online and quickly find additions, deletions, and changed lines with a free browser diff checker.',
        keywords: 'diff checker, online diff, text compare, compare text, file diff, code diff, text difference checker, compare two texts online',
        structuredData: {
            alternateName: ['Text Compare Tool', 'Online Text Diff', 'Difference Checker'],
            applicationCategory: 'DeveloperApplication',
            featureList: [
                'Compare two text blocks',
                'Highlight additions and deletions',
                'Swap original and modified inputs',
                'Browser-based diff checking'
            ]
        }
    },
    '/domain/': {
        title: 'Domain Appraisal Tool - Estimate Domain Name Value',
        description: 'Estimate domain name value for up to 20 domains at once with instant appraisal results and market-value signals.',
        keywords: 'domain appraisal, domain valuation, domain worth, domain price, domain name value, domain appraisal tool, instant domain value, domain value estimator',
        publishDate: '2025-04-22',
        structuredData: {
            alternateName: ['Domain Valuation Tool', 'Domain Value Estimator', 'Domain Worth Checker'],
            applicationCategory: 'BusinessApplication',
            featureList: [
                'Bulk domain appraisal for up to 20 domains',
                'Instant domain value estimates',
                'Market-value signals for domain names',
                'Simple browser-based valuation workflow'
            ]
        }
    },
    '/elevation/': {
        title: 'Elevation Finder - Find Elevation Data for Any Location',
        description: 'Find elevation data for any location using address search or map clicking. Free online elevation finder tool with interactive maps.',
        keywords: 'elevation finder, elevation data, topographic data, altitude finder, elevation lookup, geographic elevation, map elevation, terrain elevation, find elevation by address',
        structuredData: {
            alternateName: ['Altitude Finder', 'Map Elevation Lookup', 'Elevation Lookup Tool'],
            applicationCategory: 'UtilitiesApplication',
            featureList: [
                'Find elevation by address',
                'Click a map to get altitude',
                'View coordinates and elevation data',
                'Interactive map-based lookup'
            ]
        }
    },
    '/expression/': {
        title: 'Expression Solver - Arithmetic Expression Finder',
        description: 'Find arithmetic expressions that reach a target number using operators, parentheses, and search constraints in a free browser math solver.',
        keywords: 'expression solver, expression evaluator, arithmetic expression finder, target number calculator, math expression solver, parentheses calculator, make 24 solver',
        structuredData: {
            alternateName: ['Arithmetic Expression Finder', 'Target Number Calculator', 'Math Expression Solver'],
            applicationCategory: 'EducationApplication',
            featureList: [
                'Find formulas that reach a target number',
                'Use addition, subtraction, multiplication, and division',
                'Generate math challenges',
                'Show expression results in the browser'
            ]
        }
    },
    '/generator/': {
        title: 'Fake Word Username Generator - Short Fictional Username Ideas',
        description: 'Generate short fictional usernames from invented words with cached, rate-limited word fetching and local fallback names.',
        keywords: 'username generator, fake word username generator, fantasy username generator, short username ideas, fictional usernames, random username generator, invented word generator',
        structuredData: {
            alternateName: ['Fake Word Generator', 'Fantasy Username Generator', 'Random Username Generator'],
            applicationCategory: 'UtilitiesApplication',
            featureList: [
                'Generate short fictional usernames',
                'Blend custom seed words',
                'Limit username length',
                'Copy generated handles'
            ]
        }
    },
    '/insert/': {
        title: 'Keyword Inserter - Natural Text Insertion Tool',
        description: 'Insert keywords and phrases into text naturally while preserving readability. Use the free text insertion tool for SEO drafts and content editing.',
        keywords: 'keyword inserter, text insertion tool, natural keyword insertion, SEO keyword tool, content editing tool, insert keywords into text',
        structuredData: {
            alternateName: ['Natural Keyword Insertion Tool', 'SEO Text Inserter', 'Content Keyword Tool'],
            applicationCategory: 'BusinessApplication',
            featureList: [
                'Insert keywords into existing copy',
                'Preserve readable sentence flow',
                'Support SEO content drafts',
                'Edit content in the browser'
            ]
        }
    },
    '/keyword/': {
        title: 'Keyword Density Analyzer & SEO Content Optimization Tool',
        description: 'Analyze keyword density, frequency, repeated phrases, and important terms in your text with a free browser SEO content analyzer.',
        keywords: 'keyword density analyzer, keyword analyzer, SEO content optimization, keyword frequency checker, content analyzer, term frequency tool, SEO writing tool',
        structuredData: {
            alternateName: ['Keyword Frequency Checker', 'SEO Content Analyzer', 'Term Frequency Tool'],
            applicationCategory: 'BusinessApplication',
            featureList: [
                'Analyze keyword density',
                'Find repeated phrases and important terms',
                'Review word and character counts',
                'Optimize SEO drafts without uploading files'
            ]
        }
    },
    '/minify/': {
        title: 'JavaScript, CSS & HTML Minifier - Free Online Code Compression Tool',
        description: 'Minify JavaScript, CSS, and HTML online. Compress code, reduce file size, improve load times, and use Terser options in a free browser minifier.',
        keywords: 'javascript minifier, css minifier, html minifier, code minifier, online minifier, terser minifier, compress javascript, minify css, minify html',
        structuredData: {
            alternateName: ['Code Minifier', 'JavaScript Minifier', 'CSS Minifier', 'HTML Minifier'],
            applicationCategory: 'DeveloperApplication',
            featureList: [
                'Minify JavaScript with Terser options',
                'Compress CSS and HTML',
                'Reduce code file size',
                'Optional source map support'
            ]
        }
    },
    '/numigma/': {
        title: 'Numigma Puzzle Generator - Reverse Number Logic Puzzles',
        description: 'Create deterministic reverse-number logic puzzles with configurable clue packs, shareable puzzle states, and browser-based solving.',
        keywords: 'numigma, number puzzle generator, logic puzzle generator, reverse number puzzle, puzzle maker, math puzzle generator, deduction puzzle',
        structuredData: {
            alternateName: ['Reverse Number Puzzle Generator', 'Math Logic Puzzle Maker', 'Deduction Puzzle Generator'],
            applicationCategory: 'GameApplication',
            featureList: [
                'Generate deterministic number puzzles',
                'Choose configurable clue packs',
                'Share puzzle states',
                'Create unique-solution logic challenges'
            ]
        }
    },
    '/oeis/': {
        title: 'Sequence Extrapolator - Number Sequence Predictor',
        description: 'Analyze numeric sequences and forecast likely next values with ensemble models, confidence ranges, and OEIS-inspired sequence exploration.',
        keywords: 'oeis, sequence extrapolator, number sequence predictor, sequence calculator, next number in sequence, forecasting, time series, predictive analytics',
        structuredData: {
            alternateName: ['Number Sequence Predictor', 'Next Number Calculator', 'Sequence Calculator'],
            applicationCategory: 'EducationApplication',
            featureList: [
                'Predict next values in a number sequence',
                'Compare multiple statistical models',
                'Show confidence ranges',
                'Explore OEIS-inspired sequence patterns'
            ]
        }
    },
    '/osrs/': {
        title: 'OSRS Flip Finder & Profit Calculator',
        description: 'Discover high-confidence Old School RuneScape flips with real-time Grand Exchange analytics, profit velocity scoring, and risk controls.',
        keywords: 'osrs flip finder, osrs flipping tool, grand exchange flips, osrs profit calculator, osrs merchanting',
        structuredData: {
            headline: 'OSRS Flip Finder & Profit Calculator',
            alternateName: ['OSRS Flipping Tool', 'Grand Exchange Flip Finder', 'OSRS Profit Calculator'],
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
        title: 'JavaScript Playground - HTML CSS JS Online Editor',
        description: 'Write HTML, CSS, and JavaScript in a browser playground with live preview, package controls, and an online code editor workflow.',
        keywords: 'javascript playground, code editor, html editor, css editor, online IDE, react playground, coding environment, html css js editor',
        publishDate: '2025-05-07',
        structuredData: {
            alternateName: ['HTML CSS JS Editor', 'Online JavaScript Editor', 'Code Playground'],
            applicationCategory: 'DeveloperApplication',
            featureList: [
                'Live HTML, CSS, and JavaScript preview',
                'In-browser code editor',
                'Package manager controls',
                'Fast prototyping workspace'
            ]
        }
    },
    '/policy/': {
        title: 'Privacy Policy',
        description: 'JSreact Privacy Policy - Our commitment to protecting your data and privacy. Learn about our data collection, usage, and security practices.'
    },
    '/qr/': {
        title: 'Free QR Code Generator - Create QR Codes from Images',
        description: 'Generate QR codes instantly from uploaded or pasted images. Free online tool for creating QR codes from your images. Easy to use, no registration required.',
        keywords: 'qr code generator, image to qr code, free qr code maker, online qr code generator, qr code from image, create qr code from image',
        structuredData: {
            name: 'JSreact QR Code Generator',
            alternateName: ['Image to QR Code Generator', 'Free QR Code Maker', 'Online QR Code Generator'],
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
        description: 'Convert text to speech and speech to text with high-quality synthesis and accurate browser-based transcription tools.',
        keywords: 'text to speech, speech to text, audio transcription, voice generator, speech tools, browser speech recognition, text reader',
        structuredData: {
            alternateName: ['Text to Speech Tool', 'Speech to Text Tool', 'Audio Transcription Tool'],
            applicationCategory: 'UtilitiesApplication',
            featureList: [
                'Convert text to spoken audio',
                'Transcribe speech to text',
                'Use browser-based voice tools',
                'Work without account signup'
            ]
        }
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

    if (metadata.structuredData?.['@type'] === 'Article') {
        return {
            '@context': 'https://schema.org',
            headline: metadata.title,
            description: metadata.description,
            url: `${siteUrl}${route}`,
            author: {
                '@type': 'Organization',
                name: 'JSreact',
                url: siteUrl,
                logo: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/assets/images/icon.png`
                }
            },
            publisher: {
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
            window.gtag('config', '${googleTagId}', {
                page_title: ${JSON.stringify(fullTitle)},
                page_location: ${JSON.stringify(canonicalUrl)}
            });
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
                connect4: path.resolve(srcDir, 'connect4/index.html'),
                connect4Strategy: path.resolve(srcDir, 'connect4/strategy/index.html'),
                connect4BestFirstMove: path.resolve(srcDir, 'connect4/best-first-move/index.html'),
                connect4SolverGuide: path.resolve(srcDir, 'connect4/solver-guide/index.html')
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
