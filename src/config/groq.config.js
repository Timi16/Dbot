import { env } from './env.config.js';
import Groq from 'groq-sdk';
/**
 * Groq AI Configuration
 * Handles conversational NLP for understanding user intents
 */
// Initialize Groq client
export const groqClient = new Groq({
    apiKey: env.GROQ_API_KEY,
});
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
};
/**
 * System prompts for different conversation contexts
 */
// Add this to your config/index.ts or wherever SYSTEM_PROMPTS is defined
export const SYSTEM_PROMPTS = {
    main: `You are Decane AI, a helpful crypto wallet assistant.

CRITICAL CHAIN ALIASES:
- "SOL" = Solana
- "ETH" = Ethereum  
- "BNB" = BSC
- "0G" = 0g
- "BASE" = Base

CRITICAL INTENT DETECTION:
- "send", "transfer", "pay", "withdraw", "cash out" = SEND_CRYPTO
- "swap", "trade", "exchange", "buy", "purchase" = SWAP_TOKENS
- "balance", "how much", "check wallet" = CHECK_BALANCE
- "address", "receive", "deposit", "fund" = VIEW_ADDRESS
- "setup", "start", "begin", "create wallet" = SETUP

WITHDRAW = Same as SEND (sending crypto from wallet to external address)

RESPONSE FORMAT (JSON):
{
  "intent": "SEND_CRYPTO|SWAP_TOKENS|CHECK_BALANCE|etc",
  "entities": {
    "chain": "solana|ethereum|bsc|base|0g",
    "amount": 0.5,
    "address": "...",
    "toToken": "USDC",
    "fromToken": "SOL"
  },
  "confidence": 0.9,
  "response": "Your friendly response"
}

EXAMPLES:
- "send 0.5 SOL" → SEND_CRYPTO, chain=solana, amount=0.5
- "withdraw to bank" → SEND_CRYPTO  
- "swap SOL for USDC" → SWAP_TOKENS, fromToken=SOL, toToken=USDC, chain=solana
- "buy 100 worth of SOL" → SWAP_TOKENS, toToken=SOL, amount=100
- "balance" → CHECK_BALANCE
- "my address" → VIEW_ADDRESS

CHAIN DETECTION RULES:
- If user mentions "SOL" or "Solana" → chain=solana
- If user mentions "ETH" or "Ethereum" → chain=ethereum
- If user mentions "BNB" or "BSC" → chain=bsc
- If user mentions "0G" → chain=0g
- If user mentions "BASE" → chain=base
- If unclear → ask user to specify

Be conversational and helpful!`,
    // ⭐ FIXED: Proper function signature
    withTokenContext: (symbol, name, chain) => `
USER JUST VIEWED TOKEN:
- Symbol: ${symbol}
- Name: ${name}
- Chain: ${chain}

If user says "buy", "swap", "get it", "yes", or similar → They want to buy THIS token.
Set intent=SWAP_TOKENS, toToken=${symbol}, chain=${chain}`,
};
/**
 * Intent types the AI can detect
 */
export var Intent;
(function (Intent) {
    Intent["CREATE_WALLET"] = "create_wallet";
    Intent["CHECK_BALANCE"] = "check_balance";
    Intent["SEND_CRYPTO"] = "send_crypto";
    Intent["RECEIVE_CRYPTO"] = "receive_crypto";
    Intent["SWAP_TOKENS"] = "swap_tokens";
    Intent["TRANSACTION_HISTORY"] = "transaction_history";
    Intent["VIEW_ADDRESS"] = "view_address";
    Intent["SETTINGS"] = "settings";
    Intent["HELP"] = "help";
    Intent["UNKNOWN"] = "unknown";
})(Intent || (Intent = {}));
/**
 * Default Groq request parameters
 */
export const defaultGroqParams = {
    model: groqConfig.model,
    temperature: groqConfig.temperature,
    max_tokens: groqConfig.maxTokens,
    top_p: groqConfig.topP,
    stream: false,
};
//# sourceMappingURL=groq.config.js.map