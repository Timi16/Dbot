/**
 * Formatting Utilities
 * Format balances, addresses, dates, etc. for display
 */
import type { Balance } from '@demetacode/multi-vm-wallet';
import type { ChainKey } from '../config/index.js';
/**
 * Format balance for display
 * @param balance - Balance object
 * @param maxDecimals - Max decimal places
 * @returns Formatted balance string
 */
export declare function formatBalance(balance: Balance, maxDecimals?: number): string;
/**
 * Format balance with symbol
 * @param balance - Balance object
 * @param symbol - Token symbol (e.g., "SOL", "ETH")
 * @param maxDecimals - Max decimal places
 * @returns Formatted string (e.g., "0.5 SOL")
 */
export declare function formatBalanceWithSymbol(balance: Balance, symbol: string, maxDecimals?: number): string;
/**
 * Format USD value
 * @param value - Value in USD
 * @returns Formatted string (e.g., "$123.45")
 */
export declare function formatUSD(value: number): string;
/**
 * Shorten address for display
 * @param address - Full address
 * @param startChars - Characters to show at start
 * @param endChars - Characters to show at end
 * @returns Shortened address (e.g., "0x123...abc")
 */
export declare function shortenAddress(address: string, startChars?: number, endChars?: number): string;
/**
 * Format transaction hash for display
 * @param hash - Transaction hash
 * @returns Shortened hash
 */
export declare function formatTxHash(hash: string): string;
/**
 * Format date/time for display
 * @param date - Date object or ISO string
 * @param includeTime - Include time in output
 * @returns Formatted date string
 */
export declare function formatDate(date: Date | string, includeTime?: boolean): string;
/**
 * Format relative time (e.g., "2 minutes ago")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export declare function formatRelativeTime(date: Date | string): string;
/**
 * Format chain name with emoji
 * @param chainKey - Chain key
 * @returns Formatted chain name (e.g., "🟣 Solana")
 */
export declare function formatChainName(chainKey: ChainKey): string;
/**
 * Format phone number for display
 * @param phone - Phone number (with or without "whatsapp:" prefix)
 * @returns Formatted phone (e.g., "+234 801 234 5678")
 */
export declare function formatPhoneNumber(phone: string): string;
/**
 * Format percentage
 * @param value - Percentage value (e.g., 1.5 for 1.5%)
 * @param decimals - Decimal places
 * @returns Formatted percentage (e.g., "1.50%")
 */
export declare function formatPercentage(value: number, decimals?: number): string;
/**
 * Format large numbers with K, M, B suffixes
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export declare function formatLargeNumber(num: number): string;
/**
 * Format gas fee for display
 * @param gasFee - Gas fee in native token
 * @param symbol - Native token symbol
 * @param valueUSD - Value in USD (optional)
 * @returns Formatted gas fee
 */
export declare function formatGasFee(gasFee: string, symbol: string, valueUSD?: number): string;
/**
 * Format slippage in basis points to percentage
 * @param slippageBps - Slippage in basis points
 * @returns Formatted percentage (e.g., "0.5%")
 */
export declare function formatSlippage(slippageBps: number): string;
/**
 * Pluralize word based on count
 * @param count - Number
 * @param singular - Singular form
 * @param plural - Plural form (optional, adds 's' by default)
 * @returns Pluralized string
 */
export declare function pluralize(count: number, singular: string, plural?: string): string;
/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Max length
 * @returns Truncated text
 */
export declare function truncate(text: string, maxLength: number): string;
//# sourceMappingURL=formatter.util.d.ts.map