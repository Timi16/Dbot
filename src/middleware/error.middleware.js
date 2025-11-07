/**
 * Error Handling Middleware
 * Global error handler for Express
 */
import { AppError, isOperationalError, formatErrorResponse, logError, getUserFriendlyErrorMessage, } from '../utils/index.js';
import { env } from '../config/index.js';
/**
 * Global error handler
 * Catches all errors and formats response
 */
export function errorHandler(error, req, res, next) {
    // Log error with context
    logError(error, {
        method: req.method,
        url: req.url,
        body: req.body,
        ip: req.ip,
    });
    // Check if error is operational (expected)
    const operational = isOperationalError(error);
    // Format error response
    const errorResponse = formatErrorResponse(error);
    // Get status code
    let statusCode = 500;
    if (error instanceof AppError) {
        statusCode = error.statusCode;
    }
    // Send response
    res.status(statusCode).json(errorResponse);
    // If non-operational error in production, alert/log
    if (!operational && env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL: Non-operational error occurred!');
        console.error(error);
        // Here you could send alerts to monitoring service
        // e.g., Sentry, DataDog, etc.
    }
}
/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res, next) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`,
        },
    });
}
/**
 * Async handler wrapper
 * Catches async errors and passes to error middleware
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Validation error handler
 * Handles request validation errors
 */
export function validationErrorHandler(req, res, next) {
    // Check for validation errors (if using express-validator)
    // This is a placeholder - customize based on your validation library
    next();
}
/**
 * Timeout handler
 * Prevents long-running requests
 */
export function timeoutHandler(timeoutMs = 30000) {
    return (req, res, next) => {
        // Set timeout
        req.setTimeout(timeoutMs, () => {
            res.status(408).json({
                success: false,
                error: {
                    code: 'REQUEST_TIMEOUT',
                    message: 'Request timed out',
                },
            });
        });
        next();
    };
}
/**
 * CORS handler (if needed)
 */
export function corsHandler(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
}
/**
 * Security headers
 */
export function securityHeaders(req, res, next) {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
}
//# sourceMappingURL=error.middleware.js.map