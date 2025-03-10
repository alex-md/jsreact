import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event) => {
            setMatches(event.matches);
        };

        // Add event listener with modern API
        mediaQuery.addEventListener('change', handler);

        // Clean up
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// Common breakpoint exports
export const breakpoints = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)',
    dark: '(prefers-color-scheme: dark)',
    light: '(prefers-color-scheme: light)',
    reduced: '(prefers-reduced-motion: reduce)'
};
