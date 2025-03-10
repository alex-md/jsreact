import { useState, useEffect } from 'react';
import { storage } from '@utils/core';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        return storage.get('theme', 'system');
    });

    useEffect(() => {
        const handleThemeChange = (e) => {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        if (theme === 'system') {
            handleThemeChange(mediaQuery);
            mediaQuery.addEventListener('change', handleThemeChange);
        } else {
            document.documentElement.classList.toggle('dark', theme === 'dark');
        }

        return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }, [theme]);

    const setThemeWithPersist = (newTheme) => {
        setTheme(newTheme);
        storage.set('theme', newTheme);
    };

    return [theme, setThemeWithPersist];
}
