import { useState, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

export function useInfiniteScroll({
    loadMore,
    hasMore = true,
    threshold = 0.5,
    rootMargin = '100px',
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadMoreItems = useCallback(async () => {
        if (!loading && hasMore) {
            try {
                setLoading(true);
                setError(null);
                await loadMore();
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
    }, [loading, hasMore, loadMore]);

    const [setTarget, isVisible] = useIntersectionObserver({
        threshold,
        rootMargin
    });

    useEffect(() => {
        if (isVisible) {
            loadMoreItems();
        }
    }, [isVisible, loadMoreItems]);

    return {
        loading,
        error,
        setTarget,
        retry: loadMoreItems
    };
}
