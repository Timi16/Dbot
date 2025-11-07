/**
 * Twilio Client Configuration
 * Handles WhatsApp messaging through Twilio API
 */
export declare const twilioClient: import("twilio/lib/rest/Twilio.js");
export declare const twilioConfig: {
    readonly accountSid: string;
    readonly authToken: string;
    readonly whatsappNumber: string;
    readonly maxMessageLength: number;
    readonly maxMediaSize: number;
    readonly maxMessagesPerMinute: number;
    readonly validateWebhook: boolean;
};
/**
 * Validate Twilio webhook signature
 * Security: Ensures requests actually come from Twilio
 */
export declare function validateTwilioSignature(authToken: string, twilioSignature: string, url: string, params: Record<string, string>): boolean;
/**
 * Format phone number for Twilio WhatsApp
 * @param phone - Phone number (e.g., "+2348012345678" or "2348012345678")
 * @returns Formatted WhatsApp number (e.g., "whatsapp:+2348012345678")
 */
export declare function formatWhatsAppNumber(phone: string): string;
/**
 * Extract clean phone number from WhatsApp format
 * @param whatsappNumber - WhatsApp number (e.g., "whatsapp:+2348012345678")
 * @returns Clean phone number (e.g., "+2348012345678")
 */
export declare function extractPhoneNumber(whatsappNumber: string): string;
/**
 * Check if message exceeds WhatsApp character limit
 */
export declare function isMessageTooLong(message: string): boolean;
/**
 * Split long message into multiple parts
 */
export declare function splitLongMessage(message: string): string[];
/**
 * Type definitions for Twilio
 */
export interface TwilioMessageOptions {
    to: string;
    from: string;
    body: string;
    mediaUrl?: string[];
}
export interface TwilioWebhookPayload {
    MessageSid: string;
    AccountSid: string;
    From: string;
    To: string;
    Body: string;
    NumMedia: string;
    ProfileName?: string;
    WaId?: string;
    MediaUrl0?: string;
    MediaContentType0?: string;
}
export type TwilioMessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed' | 'read';
//# sourceMappingURL=twilio.config.d.ts.map