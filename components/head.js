function createHead(title, description) {
    const head = document.head;

    // Load critical styles first
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

    // Load Tailwind CSS before other resources
    const tailwindCSS = document.createElement('link');
    tailwindCSS.rel = 'stylesheet';
    tailwindCSS.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@latest/dist/tailwind.min.css';
    head.insertBefore(tailwindCSS, head.firstChild);

    // Load Font Awesome
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    head.appendChild(fontAwesome);

    // Custom styles
    const customStyles = document.createElement('link');
    customStyles.rel = 'stylesheet';
    customStyles.href = './styles/global.css';
    head.appendChild(customStyles);

    // Check when all stylesheets are loaded
    Promise.all([
        new Promise(resolve => tailwindCSS.onload = resolve),
        new Promise(resolve => fontAwesome.onload = resolve),
        new Promise(resolve => customStyles.onload = resolve)
    ]).then(() => {
        document.body.classList.add('js-ready');
    }).catch(err => {
        console.error('Error loading styles:', err);
        // Show content anyway after timeout
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

    // Enhanced JSON-LD with more detailed structured data
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
                "url": "./images/icon-512.png"
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

    // Common utilities
    const commonScript = document.createElement('script');
    commonScript.src = './scripts/common.js';
    head.appendChild(commonScript);

    // Meta tags
    document.title = `${title} | JSreact`;
    const metaTags = [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: description },
        { name: 'theme-color', content: '#09090b' },
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'JSreact' },
        { name: 'keywords', content: 'web developer tools, code minifier, text cleaner, diff checker, expression finder, keyword analyzer, javascript tools' },
        // Enhanced Meta Tags for SEO
        { name: 'revisit-after', content: '7 days' },
        { name: 'googlebot', content: 'index, follow, max-snippet:-1, max-image-preview:large' },
        { name: 'bingbot', content: 'index, follow, max-snippet:-1, max-image-preview:large' },
        { name: 'language', content: 'English' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:updated_time', content: new Date().toISOString() },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'application-name', content: 'JSreact' },
        { name: 'apple-mobile-web-app-title', content: 'JSreact' }
    ];

    metaTags.forEach(meta => {
        const metaElement = document.createElement('meta');
        Object.entries(meta).forEach(([key, value]) => {
            metaElement.setAttribute(key, value);
        });
        head.appendChild(metaElement);
    });

    // Canonical URL
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href.split('?')[0];
    head.appendChild(canonical);

    // Favicons
    const favicons = [
        { rel: 'apple-touch-icon', sizes: '180x180', href: './images/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: './images/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: './images/favicon-16x16.png' },
        { rel: 'shortcut icon', href: './images/favicon.ico' },
        { rel: 'manifest', href: './site.webmanifest' }
    ];

    favicons.forEach(favicon => {
        const link = document.createElement('link');
        Object.entries(favicon).forEach(([key, value]) => {
            link.setAttribute(key, value);
        });
        head.appendChild(link);
    });

    // Tailwind CSS
    const tailwindConfig = document.createElement('script');
    tailwindConfig.textContent = `
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            200: '#bae6fd',
                            300: '#7dd3fc',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            700: '#0369a1',
                            800: '#075985',
                            900: '#0c4a6e',
                            950: '#082f49'
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif']
                    }
                }
            }
        }
    `;
    head.appendChild(tailwindConfig);

    // Base styles with important tags
    const baseStyles = document.createElement('style');
    baseStyles.textContent = `
        .bg-primary { background-color: #0ea5e9 !important; }
        .text-primary { color: #0ea5e9 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-white { color: #ffffff !important; }
    `;
    head.appendChild(baseStyles);
}

window.createHead = createHead;
