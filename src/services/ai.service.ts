/**
 * AI Service
 * Handles NLP using Groq for intent detection and entity extraction
 */

import { groqClient, groqConfig, SYSTEM_PROMPTS } from '../config/index.js'
import {
  Intent,
  type AIResponse,
  type ParsedAIResponse,
  type GroqMessage,
} from '../types/index.js'
import { sanitizeInput, isValidJson } from '../utils/index.js'

export class AIService {
  /**
   * Analyze user message and extract intent
   */
  async analyzeMessage(
    userMessage: string,
    context?: {
      userName?: string
      previousIntent?: string
      conversationHistory?: GroqMessage[]
    }
  ): Promise<ParsedAIResponse> {
    // Sanitize input
    const cleanMessage = sanitizeInput(userMessage)

    if (!cleanMessage) {
      return this.createUnknownIntent('Empty message')
    }

    try {
      // Build messages array
      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.main,
        },
      ]

      // Add conversation history if available
      if (context?.conversationHistory) {
        messages.push(...context.conversationHistory)
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: cleanMessage,
      })

      // Call Groq API
      const completion = await groqClient.chat.completions.create({
        model: groqConfig.model,
        messages,
        temperature: groqConfig.temperature,
        max_tokens: groqConfig.maxTokens,
        top_p: groqConfig.topP,
      })

      const responseContent = completion.choices[0]?.message?.content

      if (!responseContent) {
        return this.createUnknownIntent('No response from AI')
      }

      // Parse JSON response
      const parsed = this.parseAIResponse(responseContent)

      return parsed
    } catch (error) {
      console.error('❌ AI Service error:', error)
      return this.createUnknownIntent('AI processing failed')
    }
  }

  /**
   * Parse AI response (expects JSON format)
   */
  private parseAIResponse(content: string): ParsedAIResponse {
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonContent = content

      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (codeBlockMatch?.[1]) {
        jsonContent = codeBlockMatch[1]
      }

      if (!isValidJson(jsonContent)) {
        // Try to find JSON object in text
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
        if (jsonMatch?.[0]) {
          jsonContent = jsonMatch[0]
        } else {
          throw new Error('No valid JSON found')
        }
      }

      const parsed = JSON.parse(jsonContent) as AIResponse

      return {
        intent: this.normalizeIntent(parsed.intent),
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5,
        response: parsed.response || '',
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      
      // Return a generic response
      return {
        intent: Intent.UNKNOWN,
        entities: {},
        confidence: 0,
        response: content, // Use the raw content as response
      }
    }
  }

  /**
   * Normalize intent string to Intent enum
   */
  private normalizeIntent(intentStr: string | Intent): Intent {
    if (typeof intentStr !== 'string') {
      return intentStr
    }

    const normalized = intentStr.toLowerCase().replace(/[_-]/g, '_')

    // Map to Intent enum
    const intentMap: Record<string, Intent> = {
      create_wallet: Intent.CREATE_WALLET,
      check_balance: Intent.CHECK_BALANCE,
      send_crypto: Intent.SEND_CRYPTO,
      receive_crypto: Intent.RECEIVE_CRYPTO,
      swap_tokens: Intent.SWAP_TOKENS,
      transaction_history: Intent.TRANSACTION_HISTORY,
      view_address: Intent.VIEW_ADDRESS,
      settings: Intent.SETTINGS,
      change_pin: Intent.CHANGE_PIN,
      toggle_pin: Intent.TOGGLE_PIN,
      help: Intent.HELP,
      confirm: Intent.CONFIRM,
      cancel: Intent.CANCEL,
    }

    return intentMap[normalized] || Intent.UNKNOWN
  }

  /**
   * Create unknown intent response
   */
  private createUnknownIntent(reason: string): ParsedAIResponse {
    return {
      intent: Intent.UNKNOWN,
      entities: {},
      confidence: 0,
      response: "I didn't quite understand that. Type 'help' to see what I can do!",
    }
  }

  /**
   * Detect simple confirmation/cancellation without AI
   */
  detectSimpleIntent(message: string): Intent | null {
    const lower = message.toLowerCase().trim()

    // Confirmation keywords
    const confirmKeywords = ['yes', 'y', 'confirm', 'ok', 'okay', 'sure', 'proceed', 'continue', 'saved']
    if (confirmKeywords.includes(lower)) {
      return Intent.CONFIRM
    }

    // Cancellation keywords
    const cancelKeywords = ['no', 'n', 'cancel', 'stop', 'abort', 'nevermind', 'back']
    if (cancelKeywords.includes(lower)) {
      return Intent.CANCEL
    }

    // Help keywords
    const helpKeywords = ['help', 'menu', 'commands', 'options']
    if (helpKeywords.includes(lower)) {
      return Intent.HELP
    }

    return null
  }

  /**
   * Generate contextual response based on error
   */
  generateErrorResponse(error: Error): string {
    const errorMessages: Record<string, string> = {
      INSUFFICIENT_BALANCE: "Oops! You don't have enough balance for this transaction.",
      INVALID_ADDRESS: 'That address looks invalid. Please double-check and try again.',
      INVALID_PIN: 'Incorrect PIN. Please try again.',
      PIN_LOCKED: 'Too many failed attempts. Your account is temporarily locked.',
      TRANSACTION_FAILED: 'Transaction failed. Please try again later.',
      RPC_ERROR: 'Network error. Please try again in a moment.',
    }

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return message
      }
    }

    return 'Something went wrong. Please try again or type "help" for assistance.'
  }

  /**
   * Extract amount from message
   */
  extractAmount(message: string): number | null {
    // Match patterns like: "send 0.5", "0.5 SOL", "transfer 100"
    const patterns = [
      /(\d+\.?\d*)\s*(?:sol|eth|bnb|0g)/i,
      /(?:send|transfer|swap)\s+(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s+(?:to|for)/i,
    ]

    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match?.[1]) {
        const amount = parseFloat(match[1])
        if (!isNaN(amount) && amount > 0) {
          return amount
        }
      }
    }

    return null
  }

  /**
   * Extract address from message
   */
  extractAddress(message: string): string | null {
    // Match Solana addresses (base58, 32-44 chars)
    const solanaMatch = message.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/)
    if (solanaMatch?.[0]) {
      return solanaMatch[0]
    }

    // Match EVM addresses (0x + 40 hex chars)
    const evmMatch = message.match(/\b0x[a-fA-F0-9]{40}\b/)
    if (evmMatch?.[0]) {
      return evmMatch[0]
    }

    return null
  }
}

// Export singleton instance
export const aiService = new AIService()