/**
 * Custom application error class for consistent error handling.
 * Supports error classification (validation, auth, notFound, server).
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Distinguish from programming errors
    }

    static badRequest(message) {
        return new AppError(message, 400, 'BAD_REQUEST');
    }

    static unauthorized(message = 'Not authenticated') {
        return new AppError(message, 401, 'UNAUTHORIZED');
    }

    static forbidden(message = 'Access denied') {
        return new AppError(message, 403, 'FORBIDDEN');
    }

    static notFound(message = 'Resource not found') {
        return new AppError(message, 404, 'NOT_FOUND');
    }

    static conflict(message) {
        return new AppError(message, 409, 'CONFLICT');
    }

    static tooMany(message = 'Too many requests') {
        return new AppError(message, 429, 'RATE_LIMIT');
    }
}

module.exports = AppError;
