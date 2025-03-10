// Core utility functions
export const dom = {
    createElement: (tag, className = '', attributes = {}) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },

    appendChildren: (parent, children) => {
        children.forEach(child => {
            if (typeof child === 'string') {
                parent.insertAdjacentHTML('beforeend', child);
            } else if (child instanceof Node) {
                parent.appendChild(child);
            }
        });
        return parent;
    }
};

export const formatters = {
    number: (num) => new Intl.NumberFormat().format(num),
    bytes: (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
    },
    date: (date) => new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date))
};

export const validators = {
    isValidFileType: (filename, allowedTypes) => {
        return allowedTypes.some(ext => filename.toLowerCase().endsWith(ext));
    },
    isValidEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

export const animation = {
    fadeIn: (element, duration = 300) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.transition = `opacity ${duration}ms`;
        requestAnimationFrame(() => element.style.opacity = '1');
    },
    fadeOut: (element, duration = 300) => {
        element.style.opacity = '1';
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '0';
        setTimeout(() => element.style.display = 'none', duration);
    }
};

export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
};
