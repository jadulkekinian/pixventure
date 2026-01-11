/**
 * Logging utility with structured logging support
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogMeta {
    [key: string]: unknown;
}

class Logger {
    private log(level: LogLevel, message: string, meta?: LogMeta) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta,
        };

        // Console output with colors
        const consoleMethod = level === 'error' ? console.error :
            level === 'warn' ? console.warn :
                console.log;

        consoleMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`, meta || '');

        // In production, send to monitoring service (Sentry, etc.)
        if (process.env.NODE_ENV === 'production' && level === 'error') {
            // TODO: Send to error tracking service
            // Sentry.captureException(new Error(message), { extra: meta });
        }

        return logEntry;
    }

    error(message: string, meta?: LogMeta) {
        return this.log('error', message, meta);
    }

    warn(message: string, meta?: LogMeta) {
        return this.log('warn', message, meta);
    }

    info(message: string, meta?: LogMeta) {
        return this.log('info', message, meta);
    }

    debug(message: string, meta?: LogMeta) {
        if (process.env.NODE_ENV !== 'production') {
            return this.log('debug', message, meta);
        }
    }
}

export const logger = new Logger();
