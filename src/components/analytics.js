export const trackAnalyticsEvent = (eventName, parameters = {}) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag('event', eventName, {
        ...parameters,
        page_path: window.location.pathname,
        transport_type: 'beacon'
    });
};
