// Meta configuration for SEO and social sharing
export const defaultMeta = {
    title: 'JSReact - Free Online Developer Tools',
    description: 'A collection of free tools for developers to help with everyday tasks. From code minification to text cleaning, we\'ve got you covered.',
    keywords: 'javascript, react, developer tools, code minifier, text cleaner, keyword analyzer',
    author: 'JSReact',
    themeColor: '#3b94b8',
    twitterHandle: '@jsreact',
    image: '/assets/images/og-image.png',
    url: 'https://jsreact.dev'
};

// Page-specific meta configurations
export const pageMeta = {
    '/': defaultMeta,
    '/minify': {
        title: 'JavaScript, CSS & HTML Minifier',
        description: 'Free online tool to minify and optimize JavaScript, CSS, and HTML code. Reduce file size and improve load times.',
        keywords: 'minifier, javascript minifier, css minifier, html minifier, code optimization'
    },
    '/clean': {
        title: 'Text Cleaner & Formatter',
        description: 'Free online text cleaning tool to remove unwanted characters, format content, and improve readability.',
        keywords: 'text cleaner, text formatter, remove duplicates, clean text, format text'
    },
    '/keyword': {
        title: 'Keyword Density Analyzer',
        description: 'Analyze keyword density and find keyword clusters in your content with our free SEO tool.',
        keywords: 'keyword density, seo tool, keyword analyzer, content analysis'
    }
};

// Generate meta tags from config
export function generateMetaTags(path, customMeta = {}) {
    const meta = {
        ...defaultMeta,
        ...pageMeta[path],
        ...customMeta
    };

    return [
        { name: 'description', content: meta.description },
        { name: 'keywords', content: meta.keywords },
        { name: 'author', content: meta.author },
        { name: 'theme-color', content: meta.themeColor },

        // Open Graph
        { property: 'og:title', content: meta.title },
        { property: 'og:description', content: meta.description },
        { property: 'og:image', content: meta.image },
        { property: 'og:url', content: `${meta.url}${path}` },
        { property: 'og:type', content: 'website' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: meta.twitterHandle },
        { name: 'twitter:title', content: meta.title },
        { name: 'twitter:description', content: meta.description },
        { name: 'twitter:image', content: meta.image }
    ];
}
