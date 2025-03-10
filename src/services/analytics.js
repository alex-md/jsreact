import config from '@config/project.config';

class Analytics {
    constructor() {
        this.initialized = false;
        this.queue = [];
        this.init();
    }

    init() {
        if (typeof window === 'undefined') return;
        if (this.initialized) return;

        // Load Google Analytics
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${config.analytics.gaTrackingId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', config.analytics.gaTrackingId);

        this.initialized = true;
        this.processQueue();
    }

    processQueue() {
        while (this.queue.length) {
            const [eventName, params] = this.queue.shift();
            this.trackEvent(eventName, params);
        }
    }

    trackEvent(eventName, params = {}) {
        if (!this.initialized) {
            this.queue.push([eventName, params]);
            return;
        }

        if (typeof window === 'undefined' || !window.gtag) return;

        gtag('event', eventName, {
            ...params,
            timestamp: new Date().toISOString()
        });
    }

    trackPageView(page) {
        this.trackEvent('page_view', {
            page_title: page,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    }

    trackError(error, context = {}) {
        this.trackEvent('error', {
            error_message: error.message,
            error_stack: error.stack,
            ...context
        });
    }

    trackFeatureUsage(feature, action, value = null) {
        this.trackEvent('feature_usage', {
            feature,
            action,
            value
        });
    }

    trackTiming(category, variable, value) {
        this.trackEvent('timing_complete', {
            event_category: category,
            event_label: variable,
            value
        });
    }
}

// Export singleton instance
export const analytics = new Analytics();
