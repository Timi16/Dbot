import { env } from './env.config.js'
import twilio from 'twilio'

/**
 * Twilio Client Configuration
 * Handles WhatsApp messaging through Twilio API
 */

// Initialize Twilio client
export const twilioClient = twilio(
  env.TWILIO_ACCOUNT_SID,
  env.TWILIO_AUTH_TOKEN
)

// Twilio configuration constants
export const twilioConfig = {
  accountSid: env.TWILIO_ACCOUNT_SID,
  authToken: env.TWILIO_AUTH_TOKEN,
  whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
  maxMessageLength: 1600 as number,
  maxMediaSize: (5 * 1024 * 1024) as number,
  maxMessagesPerMinute: 60 as number,
  validateWebhook: env.NODE_ENV === 'production',
} as const

/**
 * Validate Twilio webhook signature
 * Security: Ensures requests actually come from Twilio
 */
export function validateTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(authToken, twilioSignature, url, params)
}

/**
 * Format phone number for Twilio WhatsApp
 * @param phone - Phone number (e.g., "+2348012345678" or "2348012345678")
 * @returns Formatted WhatsApp number (e.g., "whatsapp:+2348012345678")
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove any existing "whatsapp:" prefix
  let cleanPhone = phone.replace('whatsapp:', '').trim()
  
  // Add "+" if not present
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone
  }
  
  return `whatsapp:${cleanPhone}`
}

/**
 * Extract clean phone number from WhatsApp format
 * @param whatsappNumber - WhatsApp number (e.g., "whatsapp:+2348012345678")
 * @returns Clean phone number (e.g., "+2348012345678")
 */
export function extractPhoneNumber(whatsappNumber: string): string {
  return whatsappNumber.replace('whatsapp:', '').trim()
}

/**
 * Check if message exceeds WhatsApp character limit
 */
export function isMessageTooLong(message: string): boolean {
  return message.length > twilioConfig.maxMessageLength
}

/**
 * Split long message into multiple parts
 */
export function splitLongMessage(message: string): string[] {
  if (!isMessageTooLong(message)) {
    return [message]
  }
  
  const parts: string[] = []
  let remaining = message
  
  while (remaining.length > 0) {
    if (remaining.length <= twilioConfig.maxMessageLength) {
      parts.push(remaining)
      break
    }
    
    // Find a good break point (newline or space)
    let breakPoint = twilioConfig.maxMessageLength
    const lastNewline = remaining.lastIndexOf('\n', breakPoint)
    const lastSpace = remaining.lastIndexOf(' ', breakPoint)
    
    if (lastNewline > breakPoint - 200) {
      breakPoint = lastNewline
    } else if (lastSpace > breakPoint - 200) {
      breakPoint = lastSpace
    }
    
    parts.push(remaining.substring(0, breakPoint).trim())
    remaining = remaining.substring(breakPoint).trim()
  }
  
  return parts
}

/**
 * Type definitions for Twilio
 */
export interface TwilioMessageOptions {
  to: string
  from: string
  body: string
  mediaUrl?: string[]
}

export interface TwilioWebhookPayload {
  MessageSid: string
  AccountSid: string
  From: string
  To: string
  Body: string
  NumMedia: string
  ProfileName?: string
  WaId?: string
  MediaUrl0?: string
  MediaContentType0?: string
}

export type TwilioMessageStatus = 
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed'
  | 'read'