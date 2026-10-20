export const trackAnalyticsEvent = (eventName, parameters = {}) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    const {
        jsreact_key_event: jsreactKeyEvent,
        ...eventParameters
    } = parameters;

    window.gtag('event', eventName, {
        content_group: window.location.pathname.split('/').filter(Boolean)[0] || 'home',
        page_type: /^\/connect4\/.+/.test(window.location.pathname) ? 'guide' : 'tool',
        ...eventParameters,
        ...(jsreactKeyEvent ? {
            jsreact_key_event: 1,
            value: eventParameters.value ?? 1,
            engagement_time_msec: eventParameters.engagement_time_msec ?? 1000
        } : {}),
        page_path: window.location.pathname,
        transport_type: 'beacon'
    });
};

// Load measurement code after the page's critical work. Never send user input.
if (typeof window !== 'undefined') {
    const measure = () => import('./performance.js').then(({ startPerformanceTracking }) => startPerformanceTracking()).catch(() => {});
    if ('requestIdleCallback' in window) window.requestIdleCallback(measure, { timeout: 3000 });
    else window.setTimeout(measure, 1500);
}
