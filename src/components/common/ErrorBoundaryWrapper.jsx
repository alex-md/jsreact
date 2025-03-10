import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '@services/logger';
import { analytics } from '@services/analytics';

export function ErrorBoundaryWrapper({ children }) {
    const handleError = (error, errorInfo) => {
        // Log error to our logging service
        logger.error('Caught in boundary:', error, errorInfo);

        // Track in analytics
        analytics.trackError(error, {
            componentStack: errorInfo?.componentStack,
            context: 'ErrorBoundary'
        });
    };

    return (
        <ErrorBoundary
            fallback={({ error }) => (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full space-y-4">
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                                <i className="fas fa-exclamation-circle text-xl"></i>
                                <h2 className="text-lg font-semibold">Something went wrong</h2>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                {error?.message || 'An unexpected error occurred'}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
            onError={handleError}
        >
            {children}
        </ErrorBoundary>
    );
}
