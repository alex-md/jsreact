// Import styles
import '@styles/global.css';
import { createHeader } from './header.js';
import { trackAnalyticsEvent } from './analytics.js';

export { createHeader };
export { trackAnalyticsEvent };

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

const getClickLabel = (element) => {
    const explicitLabel = element.getAttribute('data-analytics-label') ||
        element.getAttribute('aria-label') ||
        element.getAttribute('title');

    if (explicitLabel) {
        return explicitLabel.trim();
    }

    const text = element.textContent?.replace(/\s+/g, ' ').trim();
    if (text) {
        return text.slice(0, 100);
    }

    return element.id || element.tagName.toLowerCase();
};

const ensureGoogleTagManager = (head, gtmContainerId) => {
    if (!gtmContainerId) {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    const hasGtmScript = Boolean(head.querySelector(`script[src*="gtm.js?id=${gtmContainerId}"]`));
    const hasGtmStartEvent = window.dataLayer.some((entry) => entry && entry.event === 'gtm.js');

    if (!window.__jsreactGtmConfigured && !hasGtmStartEvent && !hasGtmScript) {
        window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
        });
    }

    window.__jsreactGtmConfigured = true;

    if (!hasGtmScript) {
        const gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}`;
        head.appendChild(gtmScript);
    }

    if (document.body && !document.body.querySelector(`noscript[data-jsreact-gtm="${gtmContainerId}"]`)) {
        const fallback = document.createElement('noscript');
        fallback.dataset.jsreactGtm = gtmContainerId;
        fallback.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertBefore(fallback, document.body.firstChild);
    }

    if (window.__jsreactClickTrackingConfigured) {
        return;
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element) || typeof window.gtag !== 'function') {
            return;
        }

        const clickable = target.closest(
            'a, button, input, select, textarea, label, [role="button"], [role="switch"], [role="radio"], [data-analytics-click], .cursor-pointer'
        );

        if (!clickable) {
            return;
        }

        const link = clickable.closest('a[href]');
        const clickText = getClickLabel(clickable);
        const clickUrl = link ? link.href : undefined;

        trackAnalyticsEvent('click', {
            event_category: 'engagement',
            event_label: clickText,
            click_text: clickText,
            click_url: clickUrl
        });
    }, true);

    window.__jsreactClickTrackingConfigured = true;
};

const ensureGoogleAnalytics = (head, gaTrackingId, pageTitle, pageLocation) => {
    if (!gaTrackingId) {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    if (!head.querySelector(`script[src*="gtag/js?id=${gaTrackingId}"]`)) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
        head.appendChild(gaScript);
    }

    if (!window.__jsreactGtagConfigured) {
        window.gtag('js', new Date());
        window.gtag('config', gaTrackingId, {
            page_title: pageTitle,
            page_location: pageLocation
        });
        window.__jsreactGtagConfigured = true;
    }
};

/**
 * Creates and configures the document head with metadata, styles, and tracking
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {Object} options - Optional configuration
 * @param {string} options.gtmContainerId - Google Tag Manager container ID (default: GTM-NF9TL7G)
 * @param {string} options.gaTrackingId - Google Analytics tracking ID (default: G-ZEFG04PXR7)
 * @param {string} options.baseUrl - Base URL for canonical links and images
 * @param {string} options.publishDate - Publication date for JSON-LD
 * @param {string} options.modifiedDate - Last modified date for JSON-LD
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
        gtmContainerId = 'GTM-NF9TL7G',
        gaTrackingId = 'G-ZEFG04PXR7',
        baseUrl: providedBaseUrl,
        publishDate,
        modifiedDate,
        canonicalPath,
        canonicalUrl: canonicalUrlOverride,
        redirectToCanonical = true,
        manualRedirects = true,
        keywords,
        ogImage = '/assets/images/og-image.png',
        ogImageAlt = `${title} on JSreact`,
        ogImageWidth = '909',
        ogImageHeight = '303',
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
        const { tag, type, rel, href, src } = resource;
        const tagName = tag || type;
        const selector = tagName === 'link'
            ? `link[rel="${rel}"][href="${href}"]`
            : tagName === 'script'
                ? `script[src="${src}"]`
                : '';

        if (selector && head.querySelector(selector)) {
            return;
        }

        const el = document.createElement(tagName);
        Object.entries(resource).forEach(([key, value]) => {
            if (key !== 'tag' && value !== undefined) {
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
        { tag: 'link', rel: 'icon', type: 'image/png', sizes: '48x48', href: '/assets/images/favicon-48x48.png' },
        { tag: 'link', rel: 'icon', type: 'image/png', sizes: '32x32', href: '/assets/images/favicon-32x32.png' },
        { tag: 'link', rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/images/apple-touch-icon.png' },
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
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: getFullUrl(ogImage) },
        { property: 'og:image:width', content: ogImageWidth },
        { property: 'og:image:height', content: ogImageHeight },
        { property: 'og:image:alt', content: ogImageAlt },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${title} | JSreact` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: getFullUrl(ogImage) },
        { name: 'twitter:image:alt', content: ogImageAlt }
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

    ensureGoogleTagManager(head, gtmContainerId);
    ensureGoogleAnalytics(head, gaTrackingId, `${title} | JSreact`, canonicalUrl);

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
                url: getFullUrl('/assets/images/logo.png')
            }
        },
        ...(publishDate ? { datePublished: publishDate } : {}),
        ...(modifiedDate ? { dateModified: modifiedDate } : {})
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
