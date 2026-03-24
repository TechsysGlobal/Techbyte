import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
let logger;

try {
    logger = pino({
        // In production, only log warnings/errors to stdout/stderr.
        level: isProd ? 'warn' : (process.env.LOG_LEVEL || 'info'),
        transport: !isProd
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    });
} catch {
    // Fallback if pino is not installed
    logger = {
        info: (...args) => { if (!isProd) console.log('[INFO]', ...args) },
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        debug: (...args) => { if (!isProd) console.debug('[DEBUG]', ...args) },
        child: () => logger,
    };
}

export default logger;
