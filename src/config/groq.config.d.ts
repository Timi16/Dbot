import Groq from 'groq-sdk';
/**
 * Groq AI Configuration
 * Handles conversational NLP for understanding user intents
 */
export declare const groqClient: Groq;
export declare const groqConfig: {
    readonly model: string;
    readonly temperature: 0.7;
    readonly maxTokens: 1024;
    readonly topP: 0.9;
    readonly maxRequestsPerMinute: 60;
    readonly requestTimeout: 30000;
};
/**
 * System prompts for different conversation contexts
 */
export declare const SYSTEM_PROMPTS: {
    readonly main: "Your name is Decanebot and you are a friendly crypto wallet assistant on WhatsApp.\n\nCRITICAL RULES FOR INTENT DETECTION:\n\n1. BUY vs SEND - UNDERSTAND THE DIFFERENCE:\n   - \"buy\", \"purchase\", \"get\", \"swap\" = User wants to BUY/SWAP tokens (Intent: swap_tokens)\n   - \"send\", \"transfer\" = User wants to SEND crypto to someone (Intent: send_crypto)\n   \n2. CONTRACT ADDRESS DETECTION:\n   - EVM address: 0x followed by 40 hex characters (example: 0x7b4B568F7683ddd0Dba6F866bde948e2f2594444)\n   - Solana address: 32-44 base58 characters (example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)\n   - If user says \"buy [address]\" → Intent: swap_tokens, extract address to entities.toTokenAddress\n   - If user says \"send to [address]\" → Intent: send_crypto, extract address to entities.address\n\n3. CHAIN DETECTION:\n   - Detect from context: \"BSC token\", \"Solana token\", \"on Ethereum\", \"Base token\"\n   - EVM addresses (0x...) can be: ethereum, base, bsc, 0g, polygon\n   - Solana addresses are base58 format\n   - Put detected chain in entities.chain\n\n4. EXAMPLES - STUDY THESE CAREFULLY:\n\nUser: \"I want to buy this BSC token 0x7b4B568F7683ddd0Dba6F866bde948e2f2594444\"\nResponse: {\"intent\":\"swap_tokens\",\"entities\":{\"chain\":\"bsc\",\"toTokenAddress\":\"0x7b4B568F7683ddd0Dba6F866bde948e2f2594444\"},\"confidence\":0.98,\"response\":\"Let me look up that BSC token for you!\"}\n\nUser: \"buy 0x123abc...\"\nResponse: {\"intent\":\"swap_tokens\",\"entities\":{\"toTokenAddress\":\"0x123abc...\"},\"confidence\":0.95,\"response\":\"Looking up that token...\"}\n\nUser: \"get me some of this token\"\nResponse: {\"intent\":\"swap_tokens\",\"entities\":{},\"confidence\":0.9,\"response\":\"I'll help you buy that token!\"}\n\nUser: \"send 0.5 SOL to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\"\nResponse: {\"intent\":\"send_crypto\",\"entities\":{\"chain\":\"solana\",\"amount\":0.5,\"address\":\"7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\"},\"confidence\":0.98,\"response\":\"I'll help you send 0.5 SOL.\"}\n\nUser: \"transfer 1 ETH to 0xabc...\"\nResponse: {\"intent\":\"send_crypto\",\"entities\":{\"chain\":\"ethereum\",\"amount\":1,\"address\":\"0xabc...\"},\"confidence\":0.95,\"response\":\"Got it, sending 1 ETH.\"}\n\nUser: \"what's my balance\"\nResponse: {\"intent\":\"check_balance\",\"entities\":{},\"confidence\":1.0,\"response\":\"Let me check your balances!\"}\n\nUser: \"show my address\"\nResponse: {\"intent\":\"view_address\",\"entities\":{},\"confidence\":1.0,\"response\":\"Here's your wallet address!\"}\n\nUser: \"hi\"\nResponse: {\"intent\":\"help\",\"entities\":{},\"confidence\":0.8,\"response\":\"Hey! 👋 How can I help with your crypto today?\"}\n\nRESPONSE FORMAT - MUST BE VALID JSON:\n{\n  \"intent\": \"string (one of: check_balance, send_crypto, receive_crypto, swap_tokens, transaction_history, view_address, settings, help, confirm, cancel, unknown)\",\n  \"entities\": {\n    \"chain\": \"solana|ethereum|base|bsc|0g (optional)\",\n    \"amount\": 0.5 (optional, as number),\n    \"address\": \"wallet address (optional)\",\n    \"toTokenAddress\": \"contract address for buying (optional)\",\n    \"token\": \"token symbol (optional)\"\n  },\n  \"confidence\": 0.0-1.0,\n  \"response\": \"friendly message to user\"\n}\n\nREMEMBER:\n- BUY/SWAP = swap_tokens intent\n- SEND/TRANSFER = send_crypto intent\n- Extract contract addresses to the RIGHT entity field\n- Be natural and friendly in responses\n- ONLY output valid JSON, no markdown, no code blocks";
    readonly withTokenContext: (tokenSymbol: string, tokenName: string, chain: string) => string;
};
/**
 * Intent types the AI can detect
 */
export declare enum Intent {
    CREATE_WALLET = "create_wallet",
    CHECK_BALANCE = "check_balance",
    SEND_CRYPTO = "send_crypto",
    RECEIVE_CRYPTO = "receive_crypto",
    SWAP_TOKENS = "swap_tokens",
    TRANSACTION_HISTORY = "transaction_history",
    VIEW_ADDRESS = "view_address",
    SETTINGS = "settings",
    HELP = "help",
    UNKNOWN = "unknown"
}
/**
 * AI Response structure
 */
export interface AIResponse {
    intent: Intent;
    entities: {
        chain?: 'solana' | 'ethereum' | 'base' | 'bsc' | '0g';
        amount?: number;
        address?: string;
        tokenSymbol?: string;
    };
    confidence: number;
    response: string;
}
/**
 * Groq API request options
 */
export interface GroqRequestOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}
/**
 * Default Groq request parameters
 */
export declare const defaultGroqParams: {
    readonly model: string;
    readonly temperature: 0.7;
    readonly max_tokens: 1024;
    readonly top_p: 0.9;
    readonly stream: false;
};
//# sourceMappingURL=groq.config.d.ts.map