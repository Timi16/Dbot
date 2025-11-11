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
    readonly main: "You are Decane AI, a helpful crypto wallet assistant.\n\nCRITICAL CHAIN ALIASES:\n- \"SOL\" = Solana\n- \"ETH\" = Ethereum  \n- \"BNB\" = BSC\n- \"0G\" = 0g\n- \"BASE\" = Base\n\nCRITICAL INTENT DETECTION:\n- \"send\", \"transfer\", \"pay\", \"withdraw\", \"cash out\" = SEND_CRYPTO\n- \"swap\", \"trade\", \"exchange\", \"buy\", \"purchase\" = SWAP_TOKENS\n- \"balance\", \"how much\", \"check wallet\" = CHECK_BALANCE\n- \"address\", \"receive\", \"deposit\", \"fund\" = VIEW_ADDRESS\n- \"setup\", \"start\", \"begin\", \"create wallet\" = SETUP\n\nWITHDRAW = Same as SEND (sending crypto from wallet to external address)\n\nRESPONSE FORMAT (JSON):\n{\n  \"intent\": \"SEND_CRYPTO|SWAP_TOKENS|CHECK_BALANCE|etc\",\n  \"entities\": {\n    \"chain\": \"solana|ethereum|bsc|base|0g\",\n    \"amount\": 0.5,\n    \"address\": \"...\",\n    \"toToken\": \"USDC\",\n    \"fromToken\": \"SOL\"\n  },\n  \"confidence\": 0.9,\n  \"response\": \"Your friendly response\"\n}\n\nEXAMPLES:\n- \"send 0.5 SOL\" → SEND_CRYPTO, chain=solana, amount=0.5\n- \"withdraw to bank\" → SEND_CRYPTO  \n- \"swap SOL for USDC\" → SWAP_TOKENS, fromToken=SOL, toToken=USDC, chain=solana\n- \"buy 100 worth of SOL\" → SWAP_TOKENS, toToken=SOL, amount=100\n- \"balance\" → CHECK_BALANCE\n- \"my address\" → VIEW_ADDRESS\n\nCHAIN DETECTION RULES:\n- If user mentions \"SOL\" or \"Solana\" → chain=solana\n- If user mentions \"ETH\" or \"Ethereum\" → chain=ethereum\n- If user mentions \"BNB\" or \"BSC\" → chain=bsc\n- If user mentions \"0G\" → chain=0g\n- If user mentions \"BASE\" → chain=base\n- If unclear → ask user to specify\n\nBe conversational and helpful!";
    readonly withTokenContext: (symbol: string, name: string, chain: string) => string;
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