import config from '@config/project.config';

class CacheService {
    constructor() {
        this.version = config.cache.version;
        this.maxAge = config.cache.maxAge;
    }

    async get(key) {
        try {
            const item = localStorage.getItem(this.getVersionedKey(key));
            if (!item) return null;

            const { value, timestamp } = JSON.parse(item);

            if (this.isExpired(timestamp)) {
                this.remove(key);
                return null;
            }

            return value;
        } catch {
            return null;
        }
    }

    set(key, value) {
        try {
            const item = {
                value,
                timestamp: Date.now()
            };
            localStorage.setItem(this.getVersionedKey(key), JSON.stringify(item));
            return true;
        } catch {
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.getVersionedKey(key));
            return true;
        } catch {
            return false;
        }
    }

    clear() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`cache_${this.version}`)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    isExpired(timestamp) {
        return Date.now() - timestamp > this.maxAge;
    }

    getVersionedKey(key) {
        return `cache_${this.version}_${key}`;
    }
}

// Export singleton instance
export const cache = new CacheService();
