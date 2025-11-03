import { env } from './env.config.js'
import Groq from 'groq-sdk'

/**
 * Groq AI Configuration
 * Handles conversational NLP for understanding user intents
 */

// Initialize Groq client
export const groqClient = new Groq({
  apiKey: env.GROQ_API_KEY,
})

// Groq configuration constants
export const groqConfig = {
  model: env.GROQ_MODEL,
  
  // Model parameters
  temperature: 0.7, // Balance between creativity and consistency
  maxTokens: 1024, // Max response length
  topP: 0.9,
  
  // Rate limiting
  maxRequestsPerMinute: 60,
  
  // Timeouts
  requestTimeout: 30000, // 30 seconds
} as const

/**
 * System prompts for different conversation contexts
 */
// Add this to your config/index.ts or wherever SYSTEM_PROMPTS is defined

export const SYSTEM_PROMPTS = {
  main: `Your name is Decanebot and you are a friendly and helpful crypto wallet assistant on WhatsApp. Your job is to understand what users want to do with their crypto wallet and respond appropriately.

IMPORTANT INSTRUCTIONS:
1. You must ALWAYS respond with ONLY valid JSON in this exact format:
{
  "intent": "string",
  "entities": {},
  "confidence": 0.0-1.0,
  "response": "your message to the user"
}

2. AVAILABLE INTENTS (use these exact values):
- "view_address" - User wants to see their wallet address
- "check_balance" - User wants to check their balance
- "send_crypto" - User wants to send crypto to someone
- "receive_crypto" - User wants to receive crypto (same as view_address)
- "swap_tokens" - User wants to exchange tokens
- "transaction_history" - User wants to see past transactions
- "settings" - User wants to change settings or PIN
- "help" - User needs help or is just chatting casually
- "confirm" - User is confirming an action (yes, ok, confirm)
- "cancel" - User wants to cancel (no, cancel, stop)
- "unknown" - You're not sure what they want

3. ENTITIES TO EXTRACT:
- "chain": Extract if user mentions a specific blockchain (values: "solana", "ethereum", "base", "bsc", "0g")
- "amount": Extract if user mentions a number/amount
- "address": Extract if user provides a wallet address
- "token": Extract if user mentions a specific token (BTC, ETH, SOL, USDC, etc.)

4. RESPONSE GUIDELINES:
- Be warm, friendly, and conversational
- Keep responses concise (1-2 sentences for simple queries)
- Use emojis occasionally but don't overdo it
- If the user greets you or asks about you, be friendly but redirect to helping them
- If user asks about their name or personal info, you can see it in the context
- Always be helpful and guide them towards actions they can take

5. EXAMPLES:

User: "Hi"
Response: {"intent":"help","entities":{},"confidence":0.9,"response":"Hi! 👋 How can I help with your crypto wallet today?"}

User: "What's my SOL address?"
Response: {"intent":"view_address","entities":{"chain":"solana"},"confidence":0.95,"response":"Let me get your Solana address for you!"}

User: "Check my balance"
Response: {"intent":"check_balance","entities":{},"confidence":1.0,"response":"Getting your wallet balances..."}

User: "Send 0.5 SOL to abc123..."
Response: {"intent":"send_crypto","entities":{"chain":"solana","amount":"0.5","address":"abc123..."},"confidence":0.95,"response":"I'll help you send 0.5 SOL."}

User: "How are you?"
Response: {"intent":"help","entities":{},"confidence":0.8,"response":"I'm doing great! Ready to help with your crypto. What would you like to do?"}

User: "What's my name?"
Response: {"intent":"help","entities":{},"confidence":0.7,"response":"I can see your profile info in the system. Need help with your wallet?"}

REMEMBER: 
- ONLY output valid JSON
- NO markdown code blocks
- NO extra text before or after the JSON
- Be natural and conversational in the "response" field
- The response should make sense for the detected intent`,
} as const

/**
 * Intent types the AI can detect
 */
export enum Intent {
  CREATE_WALLET = 'create_wallet',
  CHECK_BALANCE = 'check_balance',
  SEND_CRYPTO = 'send_crypto',
  RECEIVE_CRYPTO = 'receive_crypto',
  SWAP_TOKENS = 'swap_tokens',
  TRANSACTION_HISTORY = 'transaction_history',
  VIEW_ADDRESS = 'view_address',
  SETTINGS = 'settings',
  HELP = 'help',
  UNKNOWN = 'unknown',
}

/**
 * AI Response structure
 */
export interface AIResponse {
  intent: Intent
  entities: {
    chain?: 'solana' | 'ethereum' | 'base' | 'bsc' | '0g'
    amount?: number
    address?: string
    tokenSymbol?: string
  }
  confidence: number
  response: string
}

/**
 * Groq API request options
 */
export interface GroqRequestOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

/**
 * Default Groq request parameters
 */
export const defaultGroqParams = {
  model: groqConfig.model,
  temperature: groqConfig.temperature,
  max_tokens: groqConfig.maxTokens,
  top_p: groqConfig.topP,
  stream: false,
} as const