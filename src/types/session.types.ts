/**
 * Session and Conversation State Type Definitions
 */

export enum OnboardingStep {
  AWAITING_NAME = 'AWAITING_NAME',
  AWAITING_PIN = 'AWAITING_PIN',
  CONFIRMING_PIN = 'CONFIRMING_PIN',
  DISPLAYING_SEED = 'DISPLAYING_SEED',
  CONFIRMING_SEED_SAVED = 'CONFIRMING_SEED_SAVED',
  COMPLETED = 'COMPLETED',
}

export enum MainStep {
  IDLE = 'IDLE',
  MENU = 'MENU',
  
  // Balance flow
  CHECK_BALANCE = 'CHECK_BALANCE',
  CHECK_BALANCE_CHAIN = 'CHECK_BALANCE_CHAIN',
  
  // Send flow
  SEND_CRYPTO_CHAIN = 'SEND_CRYPTO_CHAIN',
  SEND_CRYPTO_AMOUNT = 'SEND_CRYPTO_AMOUNT',
  SEND_CRYPTO_ADDRESS = 'SEND_CRYPTO_ADDRESS',
  SEND_CRYPTO_CONFIRM = 'SEND_CRYPTO_CONFIRM',
  SEND_CRYPTO_PIN = 'SEND_CRYPTO_PIN',
  
  // Receive flow
  RECEIVE_CRYPTO = 'RECEIVE_CRYPTO',
  RECEIVE_CRYPTO_CHAIN = 'RECEIVE_CRYPTO_CHAIN',
  
  // Swap flow
  _TOKENS_CHAIN = 'SWAP_TOKENS_CHAIN',
  SWAP_FROM_TOKEN = 'SWAP_FROM_TOKEN',
  SWAP_TO_TOKEN = 'SWAP_TO_TOKEN',
  SWAP_AMOUNT = 'SWAP_AMOUNT',
  SWAP_CONFIRM = 'SWAP_CONFIRM',
  SWAP_PIN = 'SWAP_PIN',
  
  // Transaction history
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  TRANSACTION_HISTORY_CHAIN = 'TRANSACTION_HISTORY_CHAIN',
  
  // Settings
  SETTINGS_MENU = 'SETTINGS_MENU',
  SETTINGS_PIN_TOGGLE = 'SETTINGS_PIN_TOGGLE',
  SETTINGS_PIN_AMOUNT = 'SETTINGS_PIN_AMOUNT',
  SETTINGS_CHANGE_PIN = 'SETTINGS_CHANGE_PIN',
  SETTINGS_CHANGE_PIN_OLD = 'SETTINGS_CHANGE_PIN_OLD',
  SETTINGS_CHANGE_PIN_NEW = 'SETTINGS_CHANGE_PIN_NEW',
  SETTINGS_CHANGE_PIN_CONFIRM = 'SETTINGS_CHANGE_PIN_CONFIRM',
  
  // View address
  VIEW_ADDRESS = 'VIEW_ADDRESS',
  VIEW_ADDRESS_CHAIN = 'VIEW_ADDRESS_CHAIN',
  
  // Help
  HELP = 'HELP',
  SWAP_TOKENS_CHAIN = "SWAP_TOKENS_CHAIN",
  SWAP_TOKENS_FROM = "SWAP_TOKENS_FROM",
  SWAP_TOKENS_TO = "SWAP_TOKENS_TO",
  SWAP_TOKENS_AMOUNT = "SWAP_TOKENS_AMOUNT",
  SWAP_TOKENS_CONFIRM = "SWAP_TOKENS_CONFIRM",
  SWAP_TOKENS_PIN = "SWAP_TOKENS_PIN",
}

export type ConversationStep = OnboardingStep | MainStep

export interface SessionContext {
  // Intent from AI
  intent?: string
  
  // Chain selection
  chain?: 'SVM' | 'EVM'
  chainKey?: 'solana' | 'ethereum' | 'base' | 'bsc' | '0g'
  
  // Transaction context
  amount?: number
  recipientAddress?: string
  tokenAddress?: string
  tokenSymbol?: string
  
  // Swap context
  fromToken?: {
    address: string
    symbol: string
    decimals: number
  }
  toToken?: {
    address: string
    symbol: string
    decimals: number
  }
  slippage?: number
  
  // Onboarding context
  tempName?: string
  tempPin?: string
  mnemonic?: string
  
  // PIN verification
  pinVerified?: boolean
  pinAttempts?: number
  
  // Settings context
  settingToChange?: string
  oldPin?: string
  newPin?: string
  
  // Misc
  lastMessage?: string
  errorCount?: number
  
  // Flexible for future additions
  [key: string]: unknown
}

export interface SessionData {
  id: string
  phone: string
  userId: string | null
  currentStep: ConversationStep
  context: SessionContext
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateSessionParams {
  phone: string
  userId?: string | null | undefined
  currentStep: ConversationStep
  context?: SessionContext
  expiryMinutes?: number
}

export interface UpdateSessionParams {
  currentStep?: ConversationStep
  context?: Partial<SessionContext>
  expiryMinutes?: number
}