/**
 * Logger Middleware
 * Logs all incoming requests
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Request logger
 * Logs incoming requests with timing
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Webhook logger
 * Special logging for webhook requests
 */
export declare function webhookLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Response logger
 * Logs outgoing responses
 */
export declare function responseLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Performance logger
 * Logs slow requests
 */
export declare function performanceLogger(slowThresholdMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Error logger
 * Logs errors in a structured format
 */
export declare function errorLogger(error: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * Development logger
 * Extra verbose logging for development
 */
export declare function developmentLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Morgan-style combined logger
 */
export declare function combinedLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=logger.middleware.d.ts.map