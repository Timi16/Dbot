/**
 * Groq AI / NLP Type Definitions
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
    CHANGE_PIN = "change_pin",
    TOGGLE_PIN = "toggle_pin",
    HELP = "help",
    UNKNOWN = "unknown",
    CONFIRM = "confirm",
    CANCEL = "cancel",
    SETUP = "SETUP",
    WITHDRAW = "WITHDRAW"
}
export interface AIEntities {
    chain?: 'solana' | 'ethereum' | 'base' | 'bsc' | '0g';
    amount?: number;
    address?: string;
    tokenSymbol?: string;
    tokenAddress?: string;
    confirmation?: boolean;
}
export interface AIResponse {
    intent: Intent;
    entities: AIEntities;
    confidence: number;
    response: string;
    requiresAction?: boolean;
    suggestedNextStep?: string;
}
export interface GroqRequestOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}
export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface GroqChatRequest {
    model: string;
    messages: GroqMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
}
export interface GroqChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: 'assistant';
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface ParsedAIResponse {
    intent: Intent;
    entities: AIEntities;
    confidence: number;
    response: string;
}
//# sourceMappingURL=groq.types.d.ts.map