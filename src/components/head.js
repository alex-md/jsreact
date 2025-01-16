function createHead(title, description) {
    const head = document.head;

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

    // JSON-LD Structured Data
    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'JSreact',
        'headline': title,
        'description': description,
        'url': window.location.href.split('?')[0],
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Any',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
        },
        'author': {
            '@type': 'Organization',
            'name': 'JSreact',
            'url': 'https://jsreact.com'
        }
    });
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
        // Open Graph tags
        { property: 'og:title', content: `${title} | JSreact` },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'JSreact' },
        { property: 'og:image', content: './images/og-image.png' },
        // Twitter Card tags
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${title} | JSreact` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: './images/og-image.png' }
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
        { rel: 'icon', type: 'image/png', href: './images/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: './images/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: './images/favicon-16x16.png' },
        { rel: 'shortcut icon', href: './images/favicon.ico' }
    ];

    favicons.forEach(favicon => {
        const link = document.createElement('link');
        Object.entries(favicon).forEach(([key, value]) => {
            link.setAttribute(key, value);
        });
        head.appendChild(link);
    });

    // Tailwind CSS
    const tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    head.appendChild(tailwindScript);

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

    // Add base styles
    const baseStyles = document.createElement('style');
    baseStyles.textContent = `
        .bg-primary {
            background-color: #0ea5e9 !important;
        }
        .hover\\:bg-primary\\/90:hover {
            background-color: rgba(14, 165, 233, 0.9) !important;
        }
        .bg-gray-100 {
            background-color: #f3f4f6 !important;
        }
        .hover\\:bg-gray-200:hover {
            background-color: #e5e7eb !important;
        }
        .text-primary {
            color: #0ea5e9 !important;
        }
        .text-white {
            color: #ffffff !important;
        }
        .text-gray-700 {
            color: #374151 !important;
        }
        .focus\\:ring-primary:focus {
            --tw-ring-color: #0ea5e9 !important;
        }
    `;
    head.appendChild(baseStyles);

    // Font Awesome
    const fontAwesome = document.createElement('link');
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    fontAwesome.rel = 'stylesheet';
    head.appendChild(fontAwesome);

    // Custom styles
    const customStyles = document.createElement('link');
    customStyles.href = './styles/global.css';
    customStyles.rel = 'stylesheet';
    head.appendChild(customStyles);
}

window.createHead = createHead;
