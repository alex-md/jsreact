/**
 * critical-css.js - Performance optimization for CSS loading
 * Injects critical CSS inline and loads non-critical CSS asynchronously
 */

export function injectCriticalCSS() {
    // For production builds, this would be replaced with actual critical CSS content
    // Generated using a tool like critical or critters during the build process

    // Load critical.css first - contains minimal styles needed for above-the-fold content
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'stylesheet';
    criticalCSS.href = '/assets/styles/critical.css';
    document.head.appendChild(criticalCSS);

    // Load main global.css with print media strategy for non-blocking
    const globalCSS = document.createElement('link');
    globalCSS.rel = 'stylesheet';
    globalCSS.href = '/assets/styles/global.css';
    globalCSS.media = 'print';
    globalCSS.onload = () => {
        globalCSS.media = 'all';
    };
    document.head.appendChild(globalCSS);

    // Load additional CSS files with low priority
    const additionalCSS = [
        '/assets/styles/typography.css',
        '/assets/styles/micro-interactions.css',
        '/assets/styles/container-queries.css'
    ];

    additionalCSS.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';
        link.onload = () => {
            link.media = 'all';
        };
        document.head.appendChild(link);
    });

    // Add preload for our variable font
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.href = '/assets/fonts/Inter-roman.var.woff2';
    fontPreload.as = 'font';
    fontPreload.type = 'font/woff2';
    fontPreload.crossOrigin = 'anonymous';

    document.head.appendChild(fontPreload);
}
