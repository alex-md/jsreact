import React from 'react';
import { useTheme } from '@hooks/useTheme';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { analytics } from '@services/analytics';
import { logger } from '@services/logger';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { createNavbar } from '@components/common/navbar';
import { createFooter } from '@components/common/footer';
import { Head } from '@components/common/ui';

export function DefaultLayout({
    children,
    title,
    description,
    className = ''
}) {
    const [theme] = useTheme();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Track page view
    React.useEffect(() => {
        analytics.trackPageView(title);
        logger.info(`Page viewed: ${title}`);
    }, [title]);

    return (
        <div className={`min-h-screen bg-white dark:bg-gray-900 ${className}`}>
            <Head title={title} description={description} />
            <ErrorBoundary>
                {createNavbar({ isMobile })}
                <main className="flex-grow">
                    {children}
                </main>
                {createFooter()}
            </ErrorBoundary>
        </div>
    );
}
