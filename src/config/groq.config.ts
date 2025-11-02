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
export const SYSTEM_PROMPTS = {
  /**
   * Main system prompt - defines bot personality and capabilities
   */
  main: `You are a helpful crypto wallet assistant for WhatsApp. Your role is to:

1. Understand user intents related to crypto wallets
2. Extract relevant information (chain, amount, address, token)
3. Respond naturally and conversationally

**Available Intents:**
- create_wallet: User wants to create a new wallet
- check_balance: User wants to check their balance
- send_crypto: User wants to send cryptocurrency
- receive_crypto: User wants to receive cryptocurrency (show address)
- swap_tokens: User wants to swap one token for another
- transaction_history: User wants to see past transactions
- view_address: User wants to see their wallet address
- settings: User wants to change settings
- help: User needs help or doesn't know what to do
- unknown: Cannot determine intent

**Supported Chains:**
- Solana (SOL) - SVM chain
- Ethereum (ETH) - EVM chain
- Base (ETH on Base) - EVM chain
- BSC (BNB) - EVM chain
- 0G (0G token) - EVM chain

**Important Rules:**
- Be concise and friendly
- Use emojis sparingly (🟣 for Solana, 🔵 for Ethereum/EVM)
- Always extract chain, amount, and address if mentioned
- If unclear, ask for clarification
- Never make up transaction hashes or addresses
- Always prioritize user security

**Response Format:**
Return a JSON object with:
{
  "intent": "intent_name",
  "entities": {
    "chain": "solana|ethereum|base|bsc|0g",
    "amount": 0.5,
    "address": "wallet_address",
    "tokenSymbol": "SOL|ETH|USDC|etc"
  },
  "confidence": 0.9,
  "response": "Natural language response to user"
}`,

  /**
   * Onboarding prompt - guides new users through setup
   */
  onboarding: `You are guiding a new user through crypto wallet creation. Be:
- Encouraging and patient
- Clear about each step
- Security-conscious (emphasize saving seed phrase)
- Reassuring (explain we cannot recover lost seed phrases)

Current onboarding steps:
1. Welcome and collect name
2. Create 4-digit PIN
3. Confirm PIN
4. Display seed phrase
5. Confirm they saved it

Always respond warmly and make them feel secure.`,

  /**
   * Transaction prompt - handles sending/swapping
   */
  transaction: `You are helping a user with a crypto transaction. Be:
- Extra careful about amounts and addresses
- Always confirm details before proceeding
- Warn about irreversible transactions
- Check if PIN is required based on settings

Transaction types:
- send: Transfer to another address
- swap: Exchange one token for another

Always double-check addresses match the correct chain.`,

  /**
   * Error handling prompt
   */
  error: `You are helping a user who encountered an error. Be:
- Empathetic and understanding
- Clear about what went wrong
- Offer solutions or alternatives
- Never blame the user

Common errors:
- Insufficient balance
- Invalid address
- Network issues
- Wrong PIN

Always end with a helpful next step.`,
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