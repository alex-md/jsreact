import { useState, useEffect } from 'react';
import { analytics } from '@services/analytics';

export function useActiveUsers() {
    const [activeUsers, setActiveUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActiveUsers = async () => {
            try {
                const response = await fetch('https://activeusers.vs.workers.dev/', {
                    headers: {
                        'Cache-Control': 'no-cache',
                    },
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch active users');
                }

                const data = await response.json();
                setActiveUsers(data.activeUsers);
                setError(null);

                // Track active users count for analytics
                analytics.trackEvent('active_users_update', {
                    count: data.activeUsers
                });
            } catch (error) {
                console.error('Error fetching active users:', error);
                setError(error.message);
                analytics.trackError(error, { context: 'useActiveUsers' });
            } finally {
                setLoading(false);
            }
        };

        fetchActiveUsers();
        const interval = setInterval(fetchActiveUsers, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    return { activeUsers, loading, error };
}
