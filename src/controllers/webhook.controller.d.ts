/**
 * Webhook Controller - Complete with Transaction Features
 * Handles incoming WhatsApp messages and routes to appropriate handlers
 */
import type { Request, Response } from 'express';
export declare function isCasualMessage(message: string): boolean;
/**
 * Main webhook handler - receives all incoming messages
 */
/**
 * 🔥 FIXED: Main webhook handler - properly handles new vs returning users
 */
export declare function handleIncomingMessage(req: Request, res: Response): Promise<void>;
/**
 * Get help message
 */
/**
 * Handle message status updates (optional)
 */
export declare function handleMessageStatus(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=webhook.controller.d.ts.map