// Core utility functions
export * from './core';
export * from './app';
export * from './utils';

// Constants and configuration
export const APP_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FILE_TYPES: ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx'],
    API_ENDPOINTS: {
        ACTIVE_USERS: 'https://activeusers.vs.workers.dev/'
    }
};

// Re-export commonly used utilities
export { dom, formatters, validators, animation, storage } from './core';

// Common utility functions
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

export function isValidFileType(filename) {
    return APP_CONFIG.SUPPORTED_FILE_TYPES.some(ext => filename.toLowerCase().endsWith(ext));
}
