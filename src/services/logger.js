import config from '@config/project.config';
import { analytics } from './analytics';

class Logger {
    constructor() {
        this.enabled = config.isDev;
        this.level = config.isDev ? 'debug' : 'warn';
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    debug(...args) {
        if (this._shouldLog('debug')) {
            console.debug(...this._formatArgs(args));
        }
    }

    info(...args) {
        if (this._shouldLog('info')) {
            console.info(...this._formatArgs(args));
        }
    }

    warn(...args) {
        if (this._shouldLog('warn')) {
            console.warn(...this._formatArgs(args));
            this._trackError('warning', args);
        }
    }

    error(...args) {
        if (this._shouldLog('error')) {
            console.error(...this._formatArgs(args));
            this._trackError('error', args);
        }
    }

    // Using underscore prefix as a convention for "private" methods
    _shouldLog(level) {
        return this.enabled && this.levels[level] >= this.levels[this.level];
    }

    _formatArgs(args) {
        return [
            `[${new Date().toISOString()}]`,
            ...args
        ];
    }

    _trackError(level, args) {
        if (config.isProd) {
            const error = args[0];
            const context = args[1] || {};

            analytics.trackError(error instanceof Error ? error : new Error(error), {
                level,
                ...context
            });
        }
    }
}

// Export singleton instance
export const logger = new Logger();
