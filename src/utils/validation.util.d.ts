/**
 * Validation Utilities
 * Input validation, address validation, etc.
 */
import { type ChainKey } from '../config/index.js';
/**
 * Validate Solana address
 * @param address - Solana address to validate
 * @returns True if valid
 */
export declare function isValidSolanaAddress(address: string): boolean;
/**
 * Validate EVM address (Ethereum, BSC, etc.)
 * @param address - EVM address to validate
 * @returns True if valid
 */
export declare function isValidEvmAddress(address: string): boolean;
/**
 * Validate address for specific chain
 * @param address - Address to validate
 * @param chainKey - Chain key
 * @returns True if valid
 */
export declare function isValidAddress(address: string, chainKey: ChainKey): boolean;
/**
 * Validate amount (must be positive number)
 * @param amount - Amount to validate
 * @returns True if valid
 */
export declare function isValidAmount(amount: number | string): boolean;
/**
 * Validate phone number format
 * @param phone - Phone number (with or without "whatsapp:" prefix)
 * @returns True if valid
 */
export declare function isValidPhoneNumber(phone: string): boolean;
/**
 * Validate mnemonic seed phrase
 * @param mnemonic - Seed phrase to validate
 * @param wordCount - Expected word count (12 or 24)
 * @returns True if valid
 */
export declare function isValidMnemonic(mnemonic: string, wordCount?: number): boolean;
/**
 * Validate slippage percentage
 * @param slippage - Slippage in basis points (e.g., 50 = 0.5%)
 * @returns True if valid (between 10 and 5000 bps = 0.1% to 50%)
 */
export declare function isValidSlippage(slippage: number): boolean;
/**
 * Validate transaction hash
 * @param hash - Transaction hash
 * @param chainKey - Chain key
 * @returns True if valid
 */
export declare function isValidTransactionHash(hash: string, chainKey: ChainKey): boolean;
/**
 * Sanitize user input (remove dangerous characters)
 * @param input - User input string
 * @returns Sanitized string
 */
export declare function sanitizeInput(input: string): string;
/**
 * Validate message length for WhatsApp
 * @param message - Message to validate
 * @param maxLength - Max length (default: 1600)
 * @returns True if valid
 */
export declare function isValidMessageLength(message: string, maxLength?: number): boolean;
/**
 * Extract and validate amount from text
 * @param text - Text containing amount (e.g., "send 0.5 SOL")
 * @returns Parsed amount or null
 */
export declare function extractAmount(text: string): number | null;
/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns True if valid JSON
 */
export declare function isValidJson(jsonString: string): boolean;
/**
 * Check if string contains only digits
 * @param str - String to check
 * @returns True if only digits
 */
export declare function isNumericString(str: string): boolean;
//# sourceMappingURL=validation.util.d.ts.map