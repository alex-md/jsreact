// Import styles
import '@styles/global.css';

const redirectMap = Object.freeze({
    '/osrs-flip-finder': '/osrs/',
    '/osrs-flip-finder/': '/osrs/',
    '/osrs-flipping-tool': '/osrs/',
    '/osrs-flipping-tool/': '/osrs/',
    '/osrs-flipping-tools': '/osrs/',
    '/osrs-flipping-tools/': '/osrs/'
});

const hasFileExtension = (pathname) => /\.[a-zA-Z0-9]{2,}$/.test(pathname);

const ensureLeadingSlash = (path) => {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
};

const ensureTrailingSlash = (pathname) => {
    if (!pathname || pathname === '/') return '/';
    if (pathname.endsWith('/') || hasFileExtension(pathname)) {
        return pathname;
    }
    return `${pathname}/`;
};

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

    const head = document.head;
    if (!head) {
        console.error('Head element not found');
        return null;
    }

    const currentUrl = new URL(window.location.href);

    const {
        gaTrackingId = 'G-ZEFG04PXR7',
        baseUrl: providedBaseUrl,
        publishDate = new Date().toISOString().split('T')[0],
        canonicalPath,
        canonicalUrl: canonicalUrlOverride,
        redirectToCanonical = true,
        manualRedirects = true,
        keywords,
        additionalMeta = [],
        structuredData: structuredDataOverride
    } = options;

    const defaultBaseUrl = providedBaseUrl ||
        (['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? 'https://jsreact.com'
            : window.location.origin);

    const getFullUrl = (path) => {
        try {
            return new URL(path, defaultBaseUrl).toString();
        } catch (e) {
            console.error(`Invalid URL construction: ${path}`, e);
            return `${defaultBaseUrl}${path}`;
        }
    };

    const normalizedCurrentPath = ensureTrailingSlash(currentUrl.pathname);

    if (manualRedirects) {
        const redirectTarget = redirectMap[currentUrl.pathname] || redirectMap[normalizedCurrentPath];
        if (redirectTarget) {
            const targetUrl = redirectTarget.startsWith('http')
                ? redirectTarget
                : getFullUrl(redirectTarget);

            if (targetUrl !== currentUrl.toString()) {
                window.location.replace(targetUrl);
                return null;
            }
        }
    }

    const ensureCriticalStyles = () => {
        if (head.querySelector('style[data-jsreact-critical="true"]')) {
            return;
        }

        const criticalStyles = document.createElement('style');
        criticalStyles.dataset.jsreactCritical = 'true';
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
    };

    const appendExternalResource = (resource) => {
        const { type, rel, href, src } = resource;
        const selector = type === 'link'
            ? `link[rel="${rel}"][href="${href}"]`
            : type === 'script'
                ? `script[src="${src}"]`
                : '';

        if (selector && head.querySelector(selector)) {
            return;
        }

        const el = document.createElement(type);
        Object.entries(resource).forEach(([key, value]) => {
            if (key !== 'type' && value !== undefined) {
                el.setAttribute(key, value);
            }
        });
        head.appendChild(el);
    };

    const setMetaTag = (attributes) => {
        const { name, property, charset, httpEquiv, content } = attributes;
        let selector = '';

        if (charset) {
            selector = 'meta[charset]';
        } else if (name) {
            selector = `meta[name="${name}"]`;
        } else if (property) {
            selector = `meta[property="${property}"]`;
        } else if (httpEquiv) {
            selector = `meta[http-equiv="${httpEquiv}"]`;
        }

        let tag = selector ? head.querySelector(selector) : null;

        if (!tag) {
            tag = document.createElement('meta');
            if (charset && head.firstChild) {
                head.insertBefore(tag, head.firstChild);
            } else {
                head.appendChild(tag);
            }
        }

        if (charset) {
            tag.setAttribute('charset', charset);
            return;
        }

        if (name) {
            tag.setAttribute('name', name);
        }
        if (property) {
            tag.setAttribute('property', property);
        }
        if (httpEquiv) {
            tag.setAttribute('http-equiv', httpEquiv);
        }
        if (content !== undefined) {
            tag.setAttribute('content', content);
        }
    };

    // Set document title
    document.title = `${title} | JSreact`;

    ensureCriticalStyles();

    [
        { type: 'link', rel: 'manifest', href: '/manifest.json' },
        { type: 'link', rel: 'manifest', href: '/site.webmanifest' },
        {
            type: 'link',
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
            crossorigin: 'anonymous',
            referrerpolicy: 'no-referrer'
        },
        { type: 'link', rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { type: 'link', rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
    ].forEach(appendExternalResource);

    const resolveCanonicalUrl = () => {
        if (canonicalUrlOverride) {
            try {
                return new URL(canonicalUrlOverride, defaultBaseUrl).toString();
            } catch (e) {
                console.error('Invalid canonicalUrl override provided', e);
            }
        }

        let canonicalTarget = canonicalPath ? ensureLeadingSlash(canonicalPath) : currentUrl.pathname;
        canonicalTarget = ensureTrailingSlash(canonicalTarget);
        return getFullUrl(canonicalTarget);
    };

    const canonicalUrl = resolveCanonicalUrl();

    head.querySelectorAll('link[rel="canonical"]').forEach(link => link.remove());
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    head.appendChild(canonicalLink);

    if (redirectToCanonical) {
        try {
            const canonical = new URL(canonicalUrl);
            if (canonical.origin === currentUrl.origin) {
                const canonicalPathname = ensureTrailingSlash(canonical.pathname);
                if (normalizedCurrentPath !== canonicalPathname) {
                    const nextUrl = `${canonicalPathname}${currentUrl.search}${currentUrl.hash}`;
                    if (window.history && window.history.replaceState) {
                        window.history.replaceState(null, '', nextUrl);
                    } else if (nextUrl !== currentUrl.pathname) {
                        window.location.replace(nextUrl);
                        return { title, description, canonicalUrl };
                    }
                }
            }
        } catch (error) {
            console.error('Failed to normalize canonical URL', error);
        }
    }

    const metaTags = [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: description },
        { name: 'theme-color', content: '#f7f5f2' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'author', content: 'JSreact' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `${title} | JSreact` },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:site_name', content: 'JSreact' },
        { property: 'og:image', content: getFullUrl('/assets/images/og-image.png') },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${title} | JSreact` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: getFullUrl('/assets/images/og-image.png') }
    ];

    if (keywords) {
        const keywordContent = Array.isArray(keywords) ? keywords.join(', ') : keywords;
        if (keywordContent) {
            metaTags.push({ name: 'keywords', content: keywordContent });
        }
    }

    if (Array.isArray(additionalMeta)) {
        additionalMeta.filter(Boolean).forEach(meta => metaTags.push(meta));
    }

    metaTags.forEach(setMetaTag);

    if (gaTrackingId && !head.querySelector(`script[src*="gtag/js?id=${gaTrackingId}"]`)) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
        head.appendChild(gaScript);

        const gaInit = document.createElement('script');
        gaInit.dataset.jsreactGtag = 'true';
        gaInit.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', '${gaTrackingId}');
        `;
        head.appendChild(gaInit);
    }

    const baseStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'JSreact',
        headline: title,
        description: description,
        url: canonicalUrl,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        author: {
            '@type': 'Organization',
            name: 'JSreact',
            url: defaultBaseUrl,
            logo: {
                '@type': 'ImageObject',
                url: getFullUrl('/assets/images/icon.png')
            }
        },
        datePublished: publishDate,
        dateModified: new Date().toISOString()
    };

    const structuredData = structuredDataOverride === null
        ? null
        : structuredDataOverride
            ? { ...baseStructuredData, ...structuredDataOverride }
            : baseStructuredData;

    head.querySelectorAll('script[type="application/ld+json"][data-jsreact-structured]')
        .forEach(script => script.remove());

    if (structuredData) {
        const scriptLD = document.createElement('script');
        scriptLD.type = 'application/ld+json';
        scriptLD.dataset.jsreactStructured = 'true';
        scriptLD.textContent = JSON.stringify(structuredData);
        head.appendChild(scriptLD);
    }

    const markBodyReady = () => {
        if (document.body) {
            document.body.classList.add('js-ready');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markBodyReady, { once: true });
    } else {
        markBodyReady();
    }

    return { title, description, canonicalUrl };
}

if (typeof window !== 'undefined') {
    window.createHead = createHead;
    window.createHeader = createHeader;
}
