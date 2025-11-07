/**
 * Session and Conversation State Type Definitions
 */
export declare enum OnboardingStep {
    AWAITING_NAME = "AWAITING_NAME",
    AWAITING_PIN = "AWAITING_PIN",
    CONFIRMING_PIN = "CONFIRMING_PIN",
    DISPLAYING_SEED = "DISPLAYING_SEED",
    CONFIRMING_SEED_SAVED = "CONFIRMING_SEED_SAVED",
    COMPLETED = "COMPLETED",
    AWAITING_PIN_CHOICE = "AWAITING_PIN_CHOICE"
}
export declare enum MainStep {
    IDLE = "IDLE",
    MENU = "MENU",
    CHECK_BALANCE = "CHECK_BALANCE",
    CHECK_BALANCE_CHAIN = "CHECK_BALANCE_CHAIN",
    SEND_CRYPTO_CHAIN = "SEND_CRYPTO_CHAIN",
    SEND_CRYPTO_AMOUNT = "SEND_CRYPTO_AMOUNT",
    SEND_CRYPTO_ADDRESS = "SEND_CRYPTO_ADDRESS",
    SEND_CRYPTO_CONFIRM = "SEND_CRYPTO_CONFIRM",
    SEND_CRYPTO_PIN = "SEND_CRYPTO_PIN",
    RECEIVE_CRYPTO = "RECEIVE_CRYPTO",
    RECEIVE_CRYPTO_CHAIN = "RECEIVE_CRYPTO_CHAIN",
    _TOKENS_CHAIN = "SWAP_TOKENS_CHAIN",
    SWAP_FROM_TOKEN = "SWAP_FROM_TOKEN",
    SWAP_TO_TOKEN = "SWAP_TO_TOKEN",
    SWAP_AMOUNT = "SWAP_AMOUNT",
    SWAP_CONFIRM = "SWAP_CONFIRM",
    SWAP_PIN = "SWAP_PIN",
    TRANSACTION_HISTORY = "TRANSACTION_HISTORY",
    TRANSACTION_HISTORY_CHAIN = "TRANSACTION_HISTORY_CHAIN",
    SETTINGS_MENU = "SETTINGS_MENU",
    SETTINGS_PIN_TOGGLE = "SETTINGS_PIN_TOGGLE",
    SETTINGS_PIN_AMOUNT = "SETTINGS_PIN_AMOUNT",
    SETTINGS_CHANGE_PIN = "SETTINGS_CHANGE_PIN",
    SETTINGS_CHANGE_PIN_OLD = "SETTINGS_CHANGE_PIN_OLD",
    SETTINGS_CHANGE_PIN_NEW = "SETTINGS_CHANGE_PIN_NEW",
    SETTINGS_CHANGE_PIN_CONFIRM = "SETTINGS_CHANGE_PIN_CONFIRM",
    VIEW_ADDRESS = "VIEW_ADDRESS",
    VIEW_ADDRESS_CHAIN = "VIEW_ADDRESS_CHAIN",
    HELP = "HELP",
    SWAP_TOKENS_CHAIN = "SWAP_TOKENS_CHAIN",
    SWAP_TOKENS_FROM = "SWAP_TOKENS_FROM",
    SWAP_TOKENS_TO = "SWAP_TOKENS_TO",
    SWAP_TOKENS_AMOUNT = "SWAP_TOKENS_AMOUNT",
    SWAP_TOKENS_CONFIRM = "SWAP_TOKENS_CONFIRM",
    SWAP_TOKENS_PIN = "SWAP_TOKENS_PIN"
}
export type ConversationStep = OnboardingStep | MainStep;
export interface SessionContext {
    intent?: string;
    chain?: 'SVM' | 'EVM';
    chainKey?: 'solana' | 'ethereum' | 'base' | 'bsc' | '0g';
    amount?: number;
    recipientAddress?: string;
    tokenAddress?: string;
    tokenSymbol?: string;
    fromToken?: {
        address: string;
        symbol: string;
        decimals: number;
    };
    toToken?: {
        address: string;
        symbol: string;
        decimals: number;
    };
    slippage?: number;
    tempName?: string;
    tempPin?: string;
    mnemonic?: string;
    pinVerified?: boolean;
    pinAttempts?: number;
    settingToChange?: string;
    oldPin?: string;
    newPin?: string;
    lastMessage?: string;
    errorCount?: number;
    [key: string]: unknown;
}
export interface SessionData {
    id: string;
    phone: string;
    userId: string | null;
    currentStep: ConversationStep;
    context: SessionContext;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateSessionParams {
    phone: string;
    userId?: string | null | undefined;
    currentStep: ConversationStep;
    context?: SessionContext;
    expiryMinutes?: number;
}
export interface UpdateSessionParams {
    currentStep?: ConversationStep;
    context?: Partial<SessionContext>;
    expiryMinutes?: number;
}
//# sourceMappingURL=session.types.d.ts.map