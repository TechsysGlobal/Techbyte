/**
 * Centralized error handling middleware.
 * Classifies errors and returns structured JSON responses for API routes.
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    const statusCode = err.statusCode || 500;
    const code = err.code || 'SERVER_ERROR';
    const message = err.isOperational ? err.message : 'An unexpected error occurred';

    // Log the error (non-operational errors get full stack)
    if (!err.isOperational) {
        console.error('Unhandled Error:', err);
    } else if (statusCode >= 500) {
        console.error(`[${code}] ${err.message}`);
    }

    // API routes get JSON
    if (req.path.startsWith('/api')) {
        return res.status(statusCode).json({
            error: {
                message,
                code,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            },
        });
    }

    // Admin/EJS routes get rendered error page
    res.status(statusCode).render('admin/error', { error: message });
};

export default errorHandler;
