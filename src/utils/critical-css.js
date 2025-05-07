/**
 * critical-css.js - Performance optimization for CSS loading
 * Injects critical CSS inline and loads non-critical CSS asynchronously
 */

export function injectCriticalCSS() {
    // Define stylesheets to load with proper paths
    const stylesheets = [
        { path: '/src/assets/styles/critical.css', priority: 'high' },
        { path: '/src/assets/styles/global.css', priority: 'medium' },
        { path: '/src/assets/styles/typography.css', priority: 'low' },
        { path: '/src/assets/styles/micro-interactions.css', priority: 'low' },
        { path: '/src/assets/styles/container-queries.css', priority: 'low' }
    ];

    // Create a style element for immediate critical CSS
    const criticalStyle = document.createElement('style');
    criticalStyle.textContent = `
        body { opacity: 1; }
        .js-loading { opacity: 0; }
        .js-ready { opacity: 1; transition: opacity 0.3s; }
    `;
    document.head.insertBefore(criticalStyle, document.head.firstChild);

    // Load all stylesheets with proper priority
    stylesheets.forEach(({ path, priority }) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;

        if (priority !== 'high') {
            link.media = 'print';
            link.onload = () => {
                link.media = 'all';
            };
        }

        link.setAttribute('data-priority', priority);
        document.head.appendChild(link);
    });

    // Add preload for our variable font
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = '/src/assets/fonts/Inter-roman.var.woff2';
    fontPreload.as = 'font';
    fontPreload.type = 'font/woff2';
    fontPreload.crossOrigin = 'anonymous';

    document.head.appendChild(fontPreload);
}
