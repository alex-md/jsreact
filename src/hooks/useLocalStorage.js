import { useState, useEffect } from 'react';
import { storage } from '@utils/core';

export function useLocalStorage(key, initialValue) {
    // Get stored value or initialize
    const [storedValue, setStoredValue] = useState(() => {
        return storage.get(key, initialValue);
    });

    // Update stored value
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            storage.set(key, valueToStore);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    // Keep multiple tabs in sync
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key) {
                setStoredValue(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue];
}
