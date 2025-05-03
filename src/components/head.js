// Import styles
import '../assets/styles/global.css';

// Export header creation function
export function createHeader(title, description) {
    const header = document.createElement('header');

    /* --- Aurora background effect --- */
    const aurora = document.createElement('div');
    header.appendChild(aurora);

    /* --- Grid overlay --- */
    const grid = document.createElement('div');
    header.appendChild(grid);

    /* --- Content container --- */
    const container = document.createElement('div');

    /* --- Badge --- */
    const badge = document.createElement('span');
    badge.innerHTML = '<i class="fas fa-sparkles"></i> Developer Tools';

    /* --- Title --- */
    const h1 = document.createElement('h1');
    h1.textContent = title;

    /* --- Description --- */
    const p = document.createElement('p');
    p.textContent = description;

    container.append(badge, h1, p);
    header.appendChild(container);
    return header;
}

/**
 * Creates and configures the document head with metadata, styles, and tracking
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {Object} options - Optional configuration
 * @param {string} options.gaTrackingId - Google Analytics tracking ID (default: G-ZEFG04PXR7)
 * @param {string} options.baseUrl - Base URL for canonical links and images
 * @param {string} options.publishDate - Publication date for JSON-LD
 */
export function createHead(title, description, options = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.error('createHead must be run in browser environment');
        return null;
    }

    const head = document.getElementsByTagName('head')[0];
    if (!head) {
        console.error('Head element not found');
        return null;
    }

    const {
        gaTrackingId = 'G-ZEFG04PXR7',
        baseUrl = window.location.origin,
        publishDate = new Date().toISOString().split('T')[0]
    } = options;

    // Utility for safe URL construction
    const getFullUrl = (path) => {
        try {
            return new URL(path, baseUrl).toString();
        } catch (e) {
            console.error(`Invalid URL construction: ${path}`, e);
            return `${baseUrl}${path}`;
        }
    };

    // Set document title
    document.title = `${title} | JSreact`;

    // Critical styles for performance
    const criticalStyles = document.createElement('style');
    criticalStyles.textContent = `
        .js-loading { opacity: 0; }
        .js-ready { opacity: 1; transition: opacity 0.3s; }
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            opacity: 0;
            transition: opacity 0.3s;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
    `;
    head.insertBefore(criticalStyles, head.firstChild);

    // Load external resources
    const externalResources = [
        {
            type: 'link',
            rel: 'manifest',
            href: '/manifest.json'
        },
        {
            type: 'link',
            rel: 'manifest',
            href: '/site.webmanifest'
        },
        {
            type: 'link',
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
            crossOrigin: 'anonymous',
            referrerPolicy: 'no-referrer'
        },
        {
            type: 'link',
            rel: 'preconnect',
            href: 'https://fonts.googleapis.com'
        },
        {
            type: 'link',
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossOrigin: 'anonymous'
        }
    ];

    externalResources.forEach(resource => {
        const el = document.createElement(resource.type);
        Object.entries(resource).forEach(([key, value]) => {
            if (key !== 'type') el.setAttribute(key, value);
        });
        head.appendChild(el);
    });

    // Meta tags
    const metaTags = [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: description },
        { name: 'theme-color', content: '#09090b' },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'author', content: 'JSreact' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `${title} | JSreact` },
        { property: 'og:description', content: description },
        { property: 'og:url', content: window.location.href },
        { property: 'og:site_name', content: 'JSreact' },
        { property: 'og:image', content: getFullUrl('/assets/images/og-image.png') },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${title} | JSreact` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: getFullUrl('/assets/images/og-image.png') }
    ];

    // Clear existing meta tags
    head.querySelectorAll('meta').forEach(meta => meta.remove());

    // Add meta tags
    metaTags.forEach(meta => {
        const tag = document.createElement('meta');
        Object.entries(meta).forEach(([key, value]) => tag.setAttribute(key, value));
        head.appendChild(tag);
    });

    // Set canonical URL
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href;
    head.appendChild(canonical);

    // Add Google Analytics if enabled
    if (gaTrackingId) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
        head.appendChild(gaScript);

        const gaInit = document.createElement('script');
        gaInit.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', '${gaTrackingId}');
        `;
        head.appendChild(gaInit);
    }

    // Structured data
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'JSreact',
        headline: title,
        description: description,
        url: window.location.href,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        author: {
            '@type': 'Organization',
            name: 'JSreact',
            url: baseUrl,
            logo: {
                '@type': 'ImageObject',
                url: getFullUrl('/assets/images/icon.png')
            }
        },
        datePublished: publishDate,
        dateModified: new Date().toISOString()
    };

    const scriptLD = document.createElement('script');
    scriptLD.type = 'application/ld+json';
    scriptLD.textContent = JSON.stringify(structuredData);
    head.appendChild(scriptLD);

    // Show content when styles are loaded
    document.body.classList.add('js-ready');

    return { title, description };
}
