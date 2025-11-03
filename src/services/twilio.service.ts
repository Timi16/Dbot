/**
 * Twilio Service
 * Handles WhatsApp messaging via Twilio
 */

import {
  twilioClient,
  twilioConfig,
  formatWhatsAppNumber,
  splitLongMessage,
} from '../config/twilio.config.js'
import type { SendMessageParams, SendMessageResult } from '../types/index.js'
import { ValidationError } from '../utils/index.js'

export class TwilioService {
  /**
   * Send WhatsApp message
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { to, message, mediaUrl } = params

    try {
      // Format phone number
      const formattedTo = formatWhatsAppNumber(to)
      const formattedFrom = twilioConfig.whatsappNumber

      // Split long messages
      const messageParts = splitLongMessage(message)

      let lastSid = ''

      // Send all parts
      for (const part of messageParts) {
        const twilioMessage = await twilioClient.messages.create({
          from: formattedFrom,
          to: formattedTo,
          body: part,
          ...(mediaUrl && messageParts.indexOf(part) === 0 && { mediaUrl }),
        })

        lastSid = twilioMessage.sid
      }

      return {
        success: true,
        messageSid: lastSid,
      }
    } catch (error: any) {
      console.error('❌ Twilio send error:', error)

      return {
        success: false,
        error: error?.message || 'Failed to send message',
      }
    }
  }

  /**
   * Send multiple messages in sequence
   */
  async sendMessages(to: string, messages: string[]): Promise<SendMessageResult> {
    let lastResult: SendMessageResult = { success: false }

    for (const message of messages) {
      lastResult = await this.sendMessage({ to, message })

      if (!lastResult.success) {
        break
      }

      // Small delay between messages
      await this.delay(500)
    }

    return lastResult
  }

  /**
   * Send message with media (image, QR code, etc.)
   */
  async sendMessageWithMedia(
    to: string,
    message: string,
    mediaUrl: string
  ): Promise<SendMessageResult> {
    return this.sendMessage({
      to,
      message,
      mediaUrl: [mediaUrl],
    })
  }

  /**
   * Send typing indicator (optional - simulates "bot is typing")
   */
  async sendTypingIndicator(to: string): Promise<void> {
    // Twilio doesn't have native typing indicator for WhatsApp
    // But we can add a small delay to simulate natural response time
    await this.delay(800)
  }

  /**
   * Validate message before sending
   */
  validateMessage(message: string): boolean {
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Message cannot be empty')
    }

    if (message.length > twilioConfig.maxMessageLength * 10) {
      throw new ValidationError('Message too long')
    }

    return true
  }

  /**
   * Format success message
   */
  formatSuccessMessage(action: string, details?: string): string {
    let message = `✅ ${action} successful!`
    
    if (details) {
      message += `\n\n${details}`
    }

    return message
  }

  /**
   * Format error message
   */
  formatErrorMessage(error: string): string {
    return `❌ ${error}\n\nType "help" if you need assistance.`
  }

  /**
   * Helper: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get message status (for tracking delivery)
   */
  async getMessageStatus(messageSid: string): Promise<string | null> {
    try {
      const message = await twilioClient.messages(messageSid).fetch()
      return message.status
    } catch (error) {
      console.error('Failed to fetch message status:', error)
      return null
    }
  }
}

// Export singleton instance
export const twilioService = new TwilioService()