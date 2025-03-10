class Store {
    constructor() {
        this.state = new Map();
        this.listeners = new Map();
    }

    get(key, defaultValue = null) {
        return this.state.get(key) ?? defaultValue;
    }

    set(key, value) {
        this.state.set(key, value);
        this.notify(key, value);
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            const keyListeners = this.listeners.get(key);
            if (keyListeners) {
                keyListeners.delete(callback);
                if (keyListeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }

    notify(key, value) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            keyListeners.forEach(callback => callback(value));
        }
    }

    clear() {
        this.state.clear();
        this.listeners.clear();
    }
}

// Export singleton instance
export const store = new Store();

// React hook for using store values
export function useStore(key, defaultValue = null) {
    const [value, setValue] = useState(() => store.get(key, defaultValue));

    useEffect(() => {
        setValue(store.get(key, defaultValue));
        return store.subscribe(key, setValue);
    }, [key, defaultValue]);

    return value;
}
