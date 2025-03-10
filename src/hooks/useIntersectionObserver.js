import { useState, useEffect, useRef } from 'react';

export function useIntersectionObserver(options = {}) {
    const [isVisible, setIsVisible] = useState(false);
    const [element, setElement] = useState(null);
    const observer = useRef(null);

    useEffect(() => {
        // Clean up previous observer
        if (observer.current) {
            observer.current.disconnect();
        }

        // Create new observer with provided options
        observer.current = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        }, {
            root: options.root || null,
            rootMargin: options.rootMargin || '0px',
            threshold: options.threshold || 0
        });

        // Observe element if we have one
        const currentElement = element;
        if (currentElement) {
            observer.current.observe(currentElement);
        }

        // Cleanup
        return () => {
            if (observer.current && currentElement) {
                observer.current.unobserve(currentElement);
            }
        };
    }, [element, options.root, options.rootMargin, options.threshold]);

    return [setElement, isVisible];
}
