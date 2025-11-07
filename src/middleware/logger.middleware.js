/**
 * Logger Middleware
 * Logs all incoming requests
 */
import { env } from '../config/index.js';
/**
 * Request logger
 * Logs incoming requests with timing
 */
export function requestLogger(req, res, next) {
    const startTime = Date.now();
    // Log request
    console.log(`📥 ${req.method} ${req.url}`, {
        body: sanitizeBody(req.body),
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusColor = getStatusColor(res.statusCode);
        console.log(`📤 ${req.method} ${req.url} ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms`);
    });
    next();
}
/**
 * Webhook logger
 * Special logging for webhook requests
 */
export function webhookLogger(req, res, next) {
    const startTime = Date.now();
    // Extract webhook data
    const phone = req.body.From || 'unknown';
    const message = req.body.Body || '';
    const messageSid = req.body.MessageSid || '';
    console.log('🔔 Webhook received:', {
        phone,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messageSid,
    });
    // Store for later use
    res.locals.webhookStartTime = startTime;
    res.locals.webhookData = {
        phone,
        message,
        messageSid,
    };
    next();
}
/**
 * Response logger
 * Logs outgoing responses
 */
export function responseLogger(req, res, next) {
    // Capture original json method
    const originalJson = res.json.bind(res);
    // Override json method to log response
    res.json = function (body) {
        // Log response body (sanitized)
        if (env.NODE_ENV === 'development') {
            console.log('📤 Response:', {
                status: res.statusCode,
                body: sanitizeBody(body),
            });
        }
        return originalJson(body);
    };
    next();
}
/**
 * Performance logger
 * Logs slow requests
 */
export function performanceLogger(slowThresholdMs = 1000) {
    return (req, res, next) => {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            if (duration > slowThresholdMs) {
                console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.url} - ${duration}ms`, {
                    body: sanitizeBody(req.body),
                    status: res.statusCode,
                });
            }
        });
        next();
    };
}
/**
 * Error logger
 * Logs errors in a structured format
 */
export function errorLogger(error, req, res, next) {
    console.error('❌ Error:', {
        message: error.message,
        stack: env.NODE_ENV === 'development' ? error.stack : undefined,
        method: req.method,
        url: req.url,
        body: sanitizeBody(req.body),
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });
    next(error);
}
/**
 * Sanitize request/response body
 * Removes sensitive data from logs
 */
function sanitizeBody(body) {
    if (!body)
        return body;
    const sanitized = { ...body };
    // Remove sensitive fields
    const sensitiveFields = [
        'pin',
        'password',
        'token',
        'secret',
        'apiKey',
        'privateKey',
        'mnemonic',
        'seedPhrase',
    ];
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    }
    return sanitized;
}
/**
 * Get color code for status code
 */
function getStatusColor(statusCode) {
    if (statusCode >= 500)
        return '\x1b[31m'; // Red
    if (statusCode >= 400)
        return '\x1b[33m'; // Yellow
    if (statusCode >= 300)
        return '\x1b[36m'; // Cyan
    if (statusCode >= 200)
        return '\x1b[32m'; // Green
    return '\x1b[0m'; // Reset
}
/**
 * Development logger
 * Extra verbose logging for development
 */
export function developmentLogger(req, res, next) {
    if (env.NODE_ENV !== 'development') {
        next();
        return;
    }
    console.log('\n🔍 Development Debug:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        params: req.params,
        body: sanitizeBody(req.body),
    });
    next();
}
/**
 * Morgan-style combined logger
 */
export function combinedLogger(req, res, next) {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const timestamp = new Date().toISOString();
        const logLine = [
            timestamp,
            req.ip,
            req.method,
            req.url,
            res.statusCode,
            `${duration}ms`,
            req.get('user-agent'),
        ].join(' | ');
        console.log(logLine);
    });
    next();
}
//# sourceMappingURL=logger.middleware.js.map