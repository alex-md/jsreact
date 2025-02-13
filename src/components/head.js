// Import styles
import '@/assets/styles/global.css';

export function createHead(title, description) {
    const head = document.head;

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

    // Google Analytics
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-ZEFG04PXR7';
    head.appendChild(gaScript);

    const gaInitScript = document.createElement('script');
    gaInitScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-ZEFG04PXR7');
    `;
    head.appendChild(gaInitScript);

    // Enhanced JSON-LD
    const enhancedStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "JSreact",
        "headline": title,
        "description": description,
        "url": window.location.href.split('?')[0],
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript. Modern browsers recommended.",
        "softwareVersion": "1.0",
        "datePublished": "2024-01-01",
        "dateModified": new Date().toISOString(),
        "image": {
            "@type": "ImageObject",
            "url": new URL('/assets/images/og-image.png', window.location.origin).href,
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
                "url": new URL('/assets/images/icon.png', window.location.origin).href
            }
        },
        "potentialAction": {
            "@type": "UseAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": window.location.href.split('?')[0]
            }
        }
    };

    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.textContent = JSON.stringify(enhancedStructuredData);
    head.appendChild(structuredData);

    // Meta tags
    document.title = `${title} | JSreact`;
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
        { property: 'og:url', content: window.location.href.split('?')[0] },
        { property: 'og:site_name', content: 'JSreact' },
        { property: 'og:image', content: new URL('/assets/images/og-image.png', window.location.origin).href },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${title} | JSreact` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: new URL('/assets/images/og-image.png', window.location.origin).href },
        { name: 'format-detection', content: 'telephone=no' }
    ];

    // Update meta tags
    document.querySelectorAll('meta').forEach(meta => meta.remove());
    metaTags.forEach(meta => {
        const metaElement = document.createElement('meta');
        Object.entries(meta).forEach(([key, value]) => {
            metaElement.setAttribute(key, value);
        });
        head.appendChild(metaElement);
    });

    // Canonical URL
    document.querySelectorAll('link[rel="canonical"]').forEach(link => link.remove());
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.origin + window.location.pathname.replace(/\/$/, '');
    head.appendChild(canonical);

    // Favicons (using URLs that Vite will handle)
    const favicons = [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/assets/images/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/assets/images/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/assets/images/favicon-16x16.png' },
        { rel: 'shortcut icon', href: '/assets/images/favicon.ico' },
        { rel: 'manifest', href: '/site.webmanifest' }
    ];

    favicons.forEach(favicon => {
        const link = document.createElement('link');
        Object.entries(favicon).forEach(([key, value]) => {
            link.setAttribute(key, value);
        });
        head.appendChild(link);
    });

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

    preconnects.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.crossOrigin = 'anonymous';
        head.appendChild(link);
    });
}
