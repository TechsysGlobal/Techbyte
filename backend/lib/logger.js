/**
 * Structured logger using pino.
 * Falls back to console-based logging if pino is not installed.
 */
let logger;

const isProd = process.env.NODE_ENV === 'production';

try {
    const pino = require('pino');
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

module.exports = logger;
