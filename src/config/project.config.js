// Project Configuration
const env = process.env.NODE_ENV || 'development';

const config = {
    // Environment settings
    env,
    isDev: env === 'development',
    isProd: env === 'production',

    // Analytics configuration
    analytics: {
        gaTrackingId: 'G-XXXXXXXXXX', // Replace with actual GA tracking ID
        enabled: env === 'production'
    },

    // API endpoints
    api: {
        activeUsers: 'https://activeusers.vs.workers.dev/',
        baseUrl: env === 'production'
            ? 'https://api.jsreact.com'
            : 'http://localhost:3000'
    },

    // Feature flags
    features: {
        darkMode: true,
        consoleOutput: true,
        fileUpload: true
    },

    // UI configuration
    ui: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        supportedFileTypes: ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx'],
        toastDuration: 3000,
        defaultTheme: 'system',
    },

    // Editor configuration
    editor: {
        fontSize: 14,
        tabSize: 2,
        minimap: false,
        lineNumbers: true,
        wordWrap: 'on',
        autoClosingBrackets: true,
    },

    // Cache configuration
    cache: {
        version: '1.0',
        maxAge: 60 * 60 * 1000, // 1 hour
    }
};

// Freeze configuration to prevent runtime modifications
Object.freeze(config);

export default config;
