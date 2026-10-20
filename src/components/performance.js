import { onCLS, onINP, onLCP } from 'web-vitals';
import { trackAnalyticsEvent } from './analytics.js';

export function startPerformanceTracking() {
    if (window.__jsreactPerformanceTracking) return;
    window.__jsreactPerformanceTracking = true;
    const report = ({ name, value, rating, id }) => trackAnalyticsEvent('web_vital', {
        metric_name: name,
        metric_value: Math.round(value * (name === 'CLS' ? 1000 : 1)),
        metric_rating: rating,
        metric_id: id,
        non_interaction: true
    });
    onCLS(report);
    onINP(report);
    onLCP(report);
}
