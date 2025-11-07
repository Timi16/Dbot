/**
 * Webhook Routes
 * Defines API routes for Twilio WhatsApp webhooks
 */
import { Router } from 'express';
import { handleIncomingMessage, handleMessageStatus } from '../controllers/webhook.controller.js';
import { validateTwilioWebhook, parseTwilioWebhook, rateLimitWebhook, } from '../middleware/twilio.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { webhookLogger } from '../middleware/logger.middleware.js';
const router = Router();
/**
 * POST /webhook
 * Main endpoint for incoming WhatsApp messages
 *
 * Flow:
 * 1. Twilio signature validation (security)
 * 2. Rate limiting (prevent spam)
 * 3. Webhook logging
 * 4. Parse request body
 * 5. Handle message
 */
router.post('/webhook', validateTwilioWebhook, // Security: Verify it's from Twilio
rateLimitWebhook(60, 60000), // Rate limit: 60 requests per minute
webhookLogger, // Log incoming webhook
parseTwilioWebhook, // Ensure body is valid
asyncHandler(handleIncomingMessage) // Main handler
);
/**
 * POST /webhook/status
 * Endpoint for message status updates (optional)
 *
 * Twilio sends updates when message status changes:
 * queued -> sending -> sent -> delivered -> read
 */
router.post('/webhook/status', validateTwilioWebhook, asyncHandler(handleMessageStatus));
/**
 * GET /webhook/health
 * Health check endpoint
 */
router.get('/webhook/health', (req, res) => {
    res.json({
        success: true,
        message: 'Webhook service is healthy',
        timestamp: new Date().toISOString(),
    });
});
export default router;
//# sourceMappingURL=webhook.routes.js.map