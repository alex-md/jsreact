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

    // Common utilities
    const commonScript = document.createElement('script');
    commonScript.src = './scripts/common.js';
    head.appendChild(commonScript);

    // Meta tags
    document.title = title;
    const metaTags = [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: description },
        { name: 'theme-color', content: '#09090b' }
    ];

    metaTags.forEach(meta => {
        const metaElement = document.createElement('meta');
        Object.entries(meta).forEach(([key, value]) => {
            metaElement.setAttribute(key, value);
        });
        head.appendChild(metaElement);
    });

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
                        primary: '#0ea5e9',
                        secondary: '#27272a',
                    }
                }
            }
        }
    `;
    head.appendChild(tailwindConfig);

    // Dark mode initialization
    const darkModeScript = document.createElement('script');
    darkModeScript.textContent = `
        if (!('theme' in localStorage)) {
            localStorage.theme = 'dark';
        }
    `;
    head.appendChild(darkModeScript);

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