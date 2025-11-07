/**
 * Twilio Service
 * Handles WhatsApp messaging via Twilio
 */
import type { SendMessageParams, SendMessageResult } from '../types/index.js';
export declare class TwilioService {
    /**
     * Send WhatsApp message
     */
    sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
    /**
     * Send multiple messages in sequence
     */
    sendMessages(to: string, messages: string[]): Promise<SendMessageResult>;
    /**
     * Send message with media (image, QR code, etc.)
     */
    sendMessageWithMedia(to: string, message: string, mediaUrl: string): Promise<SendMessageResult>;
    /**
     * Send typing indicator (optional - simulates "bot is typing")
     */
    sendTypingIndicator(to: string): Promise<void>;
    /**
     * Validate message before sending
     */
    validateMessage(message: string): boolean;
    /**
     * Format success message
     */
    formatSuccessMessage(action: string, details?: string): string;
    /**
     * Format error message
     */
    formatErrorMessage(error: string): string;
    /**
     * Helper: delay
     */
    private delay;
    /**
     * Get message status (for tracking delivery)
     */
    getMessageStatus(messageSid: string): Promise<string | null>;
}
export declare const twilioService: TwilioService;
//# sourceMappingURL=twilio.service.d.ts.map