import { env } from './env.config.js';
import twilio from 'twilio';
/**
 * Twilio Client Configuration
 * Handles WhatsApp messaging through Twilio API
 */
// Initialize Twilio client
export const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
// Twilio configuration constants
export const twilioConfig = {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
    maxMessageLength: 1600,
    maxMediaSize: (5 * 1024 * 1024),
    maxMessagesPerMinute: 60,
    validateWebhook: env.NODE_ENV === 'production',
};
/**
 * Validate Twilio webhook signature
 * Security: Ensures requests actually come from Twilio
 */
export function validateTwilioSignature(authToken, twilioSignature, url, params) {
    return twilio.validateRequest(authToken, twilioSignature, url, params);
}
/**
 * Format phone number for Twilio WhatsApp
 * @param phone - Phone number (e.g., "+2348012345678" or "2348012345678")
 * @returns Formatted WhatsApp number (e.g., "whatsapp:+2348012345678")
 */
export function formatWhatsAppNumber(phone) {
    // Remove any existing "whatsapp:" prefix
    let cleanPhone = phone.replace('whatsapp:', '').trim();
    // Add "+" if not present
    if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }
    return `whatsapp:${cleanPhone}`;
}
/**
 * Extract clean phone number from WhatsApp format
 * @param whatsappNumber - WhatsApp number (e.g., "whatsapp:+2348012345678")
 * @returns Clean phone number (e.g., "+2348012345678")
 */
export function extractPhoneNumber(whatsappNumber) {
    return whatsappNumber.replace('whatsapp:', '').trim();
}
/**
 * Check if message exceeds WhatsApp character limit
 */
export function isMessageTooLong(message) {
    return message.length > twilioConfig.maxMessageLength;
}
/**
 * Split long message into multiple parts
 */
export function splitLongMessage(message) {
    if (!isMessageTooLong(message)) {
        return [message];
    }
    const parts = [];
    let remaining = message;
    while (remaining.length > 0) {
        if (remaining.length <= twilioConfig.maxMessageLength) {
            parts.push(remaining);
            break;
        }
        // Find a good break point (newline or space)
        let breakPoint = twilioConfig.maxMessageLength;
        const lastNewline = remaining.lastIndexOf('\n', breakPoint);
        const lastSpace = remaining.lastIndexOf(' ', breakPoint);
        if (lastNewline > breakPoint - 200) {
            breakPoint = lastNewline;
        }
        else if (lastSpace > breakPoint - 200) {
            breakPoint = lastSpace;
        }
        parts.push(remaining.substring(0, breakPoint).trim());
        remaining = remaining.substring(breakPoint).trim();
    }
    return parts;
}
//# sourceMappingURL=twilio.config.js.map