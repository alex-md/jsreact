// Import styles
import '../assets/styles/global.css';

// Export header creation function
export function createHeader(title, subtitle) {
    const header = document.createElement('header');
    header.className = 'relative bg-background border-b border-border';

    const bgDecorator = document.createElement('div');
    bgDecorator.className = 'absolute inset-0 pointer-events-none';
    bgDecorator.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
        <div class="absolute inset-0 bg-grid-primary/[0.02] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
    `;

    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 py-12 relative z-10 max-w-7xl';

    const content = document.createElement('div');
    content.className = 'max-w-3xl mx-auto text-center space-y-4';

    const titleElement = document.createElement('h1');
    titleElement.className = 'text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70';
    titleElement.textContent = title;

    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'text-xl text-muted-foreground';
    subtitleElement.textContent = subtitle;

    content.appendChild(titleElement);
    content.appendChild(subtitleElement);
    container.appendChild(content);
    header.appendChild(bgDecorator);
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
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    const head = document.getElementsByTagName('head')[0];
    if (!head) {
        console.error('Head element not found');
        return;
    }

    const path = window.location.pathname;

    // Set defaults for options
    const {
        gaTrackingId = 'G-ZEFG04PXR7',
        baseUrl = window.location.origin,
        publishDate = '2024-01-01'
    } = options;

    // Critical styles
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
    `;
    head.insertBefore(criticalStyles, head.firstChild);

    // Load external styles (these will be imported via Vite during build)
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    head.appendChild(fontAwesome);

    // Show content when styles are loaded
    Promise.all([
        new Promise(resolve => fontAwesome.onload = resolve)
    ]).then(() => {
        document.body.classList.add('js-ready');
    }).catch(err => {
        console.error('Error loading styles:', err);
        setTimeout(() => document.body.classList.add('js-ready'), 1000);
    });

    // Only add Google Analytics if a tracking ID is provided
    if (gaTrackingId) {
        try {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
            head.appendChild(gaScript);

            const gaInitScript = document.createElement('script');
            gaInitScript.textContent = `
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', '${gaTrackingId}');
            `;
            head.appendChild(gaInitScript);
        } catch (error) {
            console.error('Error adding Google Analytics:', error);
        }
    }

    // Generate canonical URL safely
    const canonicalUrl = new URL(
        window.location.pathname.replace(/\/$/, ''),
        baseUrl
    ).toString();

    // Construct image URLs safely
    const getFullUrl = (path) => {
        try {
            return new URL(path, baseUrl).toString();
        } catch (e) {
            console.error(`Invalid URL construction: ${path}`, e);
            return `${baseUrl}${path}`;
        }
    };

    const ogImageUrl = getFullUrl('/assets/images/og-image.png');
    const iconUrl = getFullUrl('/assets/images/icon.png');

    // Enhanced JSON-LD
    const enhancedStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "JSreact",
        "headline": title,
        "description": description,
        "url": canonicalUrl,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript. Modern browsers recommended.",
        "softwareVersion": "1.0",
        "datePublished": publishDate,
        "dateModified": new Date().toISOString(),
        "image": {
            "@type": "ImageObject",
            "url": ogImageUrl,
            "width": "1200",
            "height": "630"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "author": {
            "@type": "Organization",
            "name": "JSreact",
            "url": "https://jsreact.com",
            "logo": {
                "@type": "ImageObject",
                "url": iconUrl
            }
        },
        "potentialAction": {
            "@type": "UseAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": canonicalUrl
            }
        }
    };

    // Safely add structured data
    try {
        const structuredData = document.createElement('script');
        structuredData.type = 'application/ld+json';
        structuredData.textContent = JSON.stringify(enhancedStructuredData);
        head.appendChild(structuredData);
    } catch (error) {
        console.error('Error adding structured data:', error);
    }

    // Set document title
    try {
        document.title = `${title} | JSreact`;
    } catch (error) {
        console.error('Error setting document title:', error);
    }

    // Meta tags with safe creation
    const metaTags = [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: description },
        { name: 'theme-color', content: '#09090b' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'author', content: 'JSreact' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `${title} | JSreact` },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:site_name', content: 'JSreact' },
        { property: 'og:image', content: ogImageUrl },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${title} | JSreact` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImageUrl },
        { name: 'format-detection', content: 'telephone=no' }
    ];

    // Update meta tags safely
    try {
        // Find existing meta tags and remove them
        const existingMetaTags = head.querySelectorAll('meta');
        existingMetaTags.forEach(meta => {
            try {
                meta.parentNode.removeChild(meta);
            } catch (e) {
                console.warn('Error removing meta tag:', e);
            }
        });

        // Add new meta tags
        metaTags.forEach(meta => {
            try {
                const metaElement = document.createElement('meta');
                Object.entries(meta).forEach(([key, value]) => {
                    metaElement.setAttribute(key, value);
                });
                head.appendChild(metaElement);
            } catch (e) {
                console.warn('Error adding meta tag:', e);
            }
        });
    } catch (error) {
        console.error('Error updating meta tags:', error);
    }

    // Canonical URL
    try {
        const existingCanonical = head.querySelectorAll('link[rel="canonical"]');
        existingCanonical.forEach(link => {
            try {
                link.parentNode.removeChild(link);
            } catch (e) {
                console.warn('Error removing canonical link:', e);
            }
        });

        const canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = canonicalUrl;
        head.appendChild(canonical);
    } catch (error) {
        console.error('Error setting canonical URL:', error);
    }

    // Favicons with safe URL handling
    const favicons = [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/images/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/assets/images/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/assets/images/favicon-16x16.png' },
        { rel: 'shortcut icon', href: '/assets/images/favicon.ico' },
        { rel: 'manifest', href: '/site.webmanifest' }
    ];

    try {
        favicons.forEach(favicon => {
            const link = document.createElement('link');
            Object.entries(favicon).forEach(([key, value]) => {
                link.setAttribute(key, key === 'href' ? getFullUrl(value) : value);
            });
            head.appendChild(link);
        });
    } catch (error) {
        console.error('Error adding favicons:', error);
    }

    // Base styles with important tags
    const baseStyles = document.createElement('style');
    baseStyles.textContent = `
        .site-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .site-description {
            font-size: 1.125rem;
            color: #4b5563;
        }
        
        .bg-primary { background-color: #0ea5e9 !important; }
        .text-primary { color: #0ea5e9 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-white { color: #ffffff !important; }
    `;
    head.appendChild(baseStyles);

    // Preconnect for external resources
    const preconnects = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com'
    ];

    try {
        preconnects.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            link.crossOrigin = 'anonymous';
            head.appendChild(link);
        });
    } catch (error) {
        console.error('Error adding preconnects:', error);
    }

    // Additional meta tags for specific pages
    if (path.includes('/pages/speech')) {
        try {
            // Speech/TTS specific meta tags
            const speechMeta = [
                { name: 'keywords', content: 'text to speech, speech to text, AI voice generator, OpenAI TTS, voice synthesis, speech recognition, audio transcription, voice conversion, AI voice changer, speech tools' },
                { name: 'robots', content: 'index, follow' },
                { property: 'article:tag', content: 'Text to Speech' },
                { property: 'article:tag', content: 'Speech to Text' },
                { property: 'article:tag', content: 'AI Voice Generator' },
                { name: 'twitter:label1', content: 'Features' },
                { name: 'twitter:data1', content: 'Text to Speech, Speech to Text, Multiple Voices, Speed Control, HD Quality' }
            ];

            speechMeta.forEach(meta => {
                const metaTag = document.createElement('meta');
                Object.keys(meta).forEach(key => {
                    metaTag.setAttribute(key, meta[key]);
                });
                head.appendChild(metaTag);
            });

            // Add structured data for the speech tools
            const structuredData = {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                'name': 'JSReact Speech Tools',
                'applicationCategory': 'WebApplication',
                'operatingSystem': 'Web Browser',
                'description': 'Free online tool to convert between speech and text using OpenAI APIs. Features high-quality text-to-speech synthesis and accurate speech recognition.',
                'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD'
                },
                'featureList': [
                    'Multiple AI voices',
                    'Speech to text conversion',
                    'Text to speech synthesis',
                    'Speed control',
                    'HD voice quality option',
                    'Waveform visualization',
                    'Audio file support'
                ]
            };

            const scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.textContent = JSON.stringify(structuredData);
            head.appendChild(scriptTag);
        } catch (error) {
            console.error('Error adding speech-specific metadata:', error);
        }
    }

    return {
        title,
        description,
        canonicalUrl,
        ogImageUrl
    };
}
