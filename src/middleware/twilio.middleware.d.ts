/**
 * Twilio Middleware
 * Validates Twilio webhook signatures for security
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Validate Twilio webhook signature
 * Ensures requests actually come from Twilio
 */
export declare function validateTwilioWebhook(req: Request, res: Response, next: NextFunction): void;
/**
 * Parse Twilio webhook body
 * Ensures body is available for signature validation
 */
export declare function parseTwilioWebhook(req: Request, res: Response, next: NextFunction): void;
export declare function rateLimitWebhook(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Clean up old rate limit entries (run periodically)
 */
export declare function cleanupRateLimitCache(): void;
//# sourceMappingURL=twilio.middleware.d.ts.map