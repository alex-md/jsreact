import { useState, useCallback } from 'react';
import { analytics } from '@services/analytics';

export function useErrorHandler() {
    const [error, setError] = useState(null);

    const handleError = useCallback((error, context = {}) => {
        setError(error);

        // Log to analytics
        analytics.trackError(error, context);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error:', error);
            if (context) console.error('Context:', context);
        }

        // Return error message for UI display
        return error.message || 'An unexpected error occurred';
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        error,
        handleError,
        clearError
    };
}
