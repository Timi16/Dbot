/**
 * Validation Utilities
 * Input validation, address validation, etc.
 */
import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { normalizeChainKey } from '../config/index.js';
/**
 * Validate Solana address
 * @param address - Solana address to validate
 * @returns True if valid
 */
export function isValidSolanaAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    try {
        new PublicKey(address);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate EVM address (Ethereum, BSC, etc.)
 * @param address - EVM address to validate
 * @returns True if valid
 */
export function isValidEvmAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    return ethers.isAddress(address);
}
/**
 * Validate address for specific chain
 * @param address - Address to validate
 * @param chainKey - Chain key
 * @returns True if valid
 */
export function isValidAddress(address, chainKey) {
    try {
        const normalized = normalizeChainKey(chainKey);
        if (normalized === 'solana') {
            return isValidSolanaAddress(address);
        }
        // EVM chains
        return isValidEvmAddress(address);
    }
    catch {
        return false;
    }
}
/**
 * Validate amount (must be positive number)
 * @param amount - Amount to validate
 * @returns True if valid
 */
export function isValidAmount(amount) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num) || !isFinite(num)) {
        return false;
    }
    return num > 0;
}
/**
 * Validate phone number format
 * @param phone - Phone number (with or without "whatsapp:" prefix)
 * @returns True if valid
 */
export function isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    // Remove "whatsapp:" prefix if present
    const cleanPhone = phone.replace('whatsapp:', '').trim();
    // Must start with + and have 10-15 digits
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(cleanPhone);
}
/**
 * Validate mnemonic seed phrase
 * @param mnemonic - Seed phrase to validate
 * @param wordCount - Expected word count (12 or 24)
 * @returns True if valid
 */
export function isValidMnemonic(mnemonic, wordCount = 12) {
    if (!mnemonic || typeof mnemonic !== 'string') {
        return false;
    }
    const words = mnemonic.trim().split(/\s+/);
    // Must have correct word count
    if (words.length !== wordCount) {
        return false;
    }
    // All words must be lowercase alphabetic
    return words.every(word => /^[a-z]+$/.test(word));
}
/**
 * Validate slippage percentage
 * @param slippage - Slippage in basis points (e.g., 50 = 0.5%)
 * @returns True if valid (between 10 and 5000 bps = 0.1% to 50%)
 */
export function isValidSlippage(slippage) {
    return slippage >= 10 && slippage <= 5000;
}
/**
 * Validate transaction hash
 * @param hash - Transaction hash
 * @param chainKey - Chain key
 * @returns True if valid
 */
export function isValidTransactionHash(hash, chainKey) {
    if (!hash || typeof hash !== 'string') {
        return false;
    }
    try {
        const normalized = normalizeChainKey(chainKey);
        if (normalized === 'solana') {
            // Solana tx hash is base58 encoded, 88 chars
            return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(hash);
        }
        // EVM tx hash is 0x + 64 hex chars
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
    }
    catch {
        return false;
    }
}
/**
 * Sanitize user input (remove dangerous characters)
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    // Remove control characters and trim
    return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}
/**
 * Validate message length for WhatsApp
 * @param message - Message to validate
 * @param maxLength - Max length (default: 1600)
 * @returns True if valid
 */
export function isValidMessageLength(message, maxLength = 1600) {
    return Boolean(message && message.length > 0 && message.length <= maxLength);
}
/**
 * Extract and validate amount from text
 * @param text - Text containing amount (e.g., "send 0.5 SOL")
 * @returns Parsed amount or null
 */
export function extractAmount(text) {
    if (!text)
        return null;
    // Match decimal numbers
    const match = text.match(/\b\d+\.?\d*\b/);
    if (!match)
        return null;
    const amount = parseFloat(match[0]);
    return isValidAmount(amount) ? amount : null;
}
/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns True if valid JSON
 */
export function isValidJson(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if string contains only digits
 * @param str - String to check
 * @returns True if only digits
 */
export function isNumericString(str) {
    return /^\d+$/.test(str);
}
//# sourceMappingURL=validation.util.js.map