/**
 * Error Handling Middleware
 * Global error handler for Express
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/index.js';
/**
 * Global error handler
 * Catches all errors and formats response
 */
export declare function errorHandler(error: Error | AppError, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 Not Found handler
 */
export declare function notFoundHandler(req: Request, res: Response, next: NextFunction): void;
/**
 * Async handler wrapper
 * Catches async errors and passes to error middleware
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validation error handler
 * Handles request validation errors
 */
export declare function validationErrorHandler(req: Request, res: Response, next: NextFunction): void;
/**
 * Timeout handler
 * Prevents long-running requests
 */
export declare function timeoutHandler(timeoutMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * CORS handler (if needed)
 */
export declare function corsHandler(req: Request, res: Response, next: NextFunction): void;
/**
 * Security headers
 */
export declare function securityHeaders(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map