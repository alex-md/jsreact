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
