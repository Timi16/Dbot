/**
 * Error Handling Utilities
 * Custom error classes and error handling helpers
 */
import { ApiErrorCode } from '../types/index.js';
/**
 * Base custom error class
 */
export declare class AppError extends Error {
    readonly code: ApiErrorCode;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details: Record<string, unknown> | undefined;
    constructor(message: string, code: ApiErrorCode, statusCode?: number, isOperational?: boolean, details?: Record<string, unknown>);
}
/**
 * Validation error (400)
 */
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Authentication error (401)
 */
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
/**
 * Insufficient balance error (400)
 */
export declare class InsufficientBalanceError extends AppError {
    constructor(required: string, available: string);
}
/**
 * Invalid PIN error (401)
 */
export declare class InvalidPinError extends AppError {
    constructor(attemptsRemaining?: number);
}
/**
 * PIN locked error (403)
 */
export declare class PinLockedError extends AppError {
    constructor(unlockTime: Date);
}
/**
 * Transaction failed error (400)
 */
export declare class TransactionError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * RPC error (503)
 */
export declare class RpcError extends AppError {
    constructor(chain: string, message?: string);
}
/**
 * Rate limit error (429)
 */
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
}
/**
 * Check if error is operational (expected) or programming error
 */
export declare function isOperationalError(error: Error): boolean;
/**
 * Format error for API response
 */
export declare function formatErrorResponse(error: Error | AppError): {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
};
/**
 * Log error with context
 */
export declare function logError(error: Error, context?: Record<string, unknown>): void;
/**
 * Safe error message for user display
 * Sanitizes technical errors into user-friendly messages
 */
export declare function getUserFriendlyErrorMessage(error: Error): string;
//# sourceMappingURL=error.util.d.ts.map