/**
 * Formatting Utilities
 * Format balances, addresses, dates, etc. for display
 */

import type { Balance } from '@demetacode/multi-vm-wallet'
import type { ChainKey } from '../config/index.js'
import { getChainDisplayName, getNativeSymbol } from '../config/index.js'

/**
 * Format balance for display
 * @param balance - Balance object
 * @param maxDecimals - Max decimal places
 * @returns Formatted balance string
 */
export function formatBalance(balance: Balance, maxDecimals: number = 6): string {
  if (!balance || balance.formatted === undefined) {
    return '0'
  }
  
  const num = balance.formatted
  
  // If very small, use scientific notation
  if (num > 0 && num < 0.000001) {
    return num.toExponential(2)
  }
  
  // Format with appropriate decimals
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

/**
 * Format balance with symbol
 * @param balance - Balance object
 * @param symbol - Token symbol (e.g., "SOL", "ETH")
 * @param maxDecimals - Max decimal places
 * @returns Formatted string (e.g., "0.5 SOL")
 */
export function formatBalanceWithSymbol(
  balance: Balance,
  symbol: string,
  maxDecimals: number = 6
): string {
  return `${formatBalance(balance, maxDecimals)} ${symbol}`
}

/**
 * Format USD value
 * @param value - Value in USD
 * @returns Formatted string (e.g., "$123.45")
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Shorten address for display
 * @param address - Full address
 * @param startChars - Characters to show at start
 * @param endChars - Characters to show at end
 * @returns Shortened address (e.g., "0x123...abc")
 */
export function shortenAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return ''
  
  if (address.length <= startChars + endChars) {
    return address
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

/**
 * Format transaction hash for display
 * @param hash - Transaction hash
 * @returns Shortened hash
 */
export function formatTxHash(hash: string): string {
  return shortenAddress(hash, 8, 6)
}

/**
 * Format date/time for display
 * @param date - Date object or ISO string
 * @param includeTime - Include time in output
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, includeTime: boolean = true): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) {
    return 'Invalid date'
  }
  
  if (includeTime) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  
  return formatDate(d, false)
}

/**
 * Format chain name with emoji
 * @param chainKey - Chain key
 * @returns Formatted chain name (e.g., "🟣 Solana")
 */
export function formatChainName(chainKey: ChainKey): string {
  const emojis: Record<ChainKey, string> = {
    solana: '🟣',
    ethereum: '🔵',
    base: '🔵',
    bsc: '🟡',
    '0g': '⚫',
  }
  
  const emoji = emojis[chainKey] || '🔗'
  const name = getChainDisplayName(chainKey)
  
  return `${emoji} ${name}`
}

/**
 * Format phone number for display
 * @param phone - Phone number (with or without "whatsapp:" prefix)
 * @returns Formatted phone (e.g., "+234 801 234 5678")
 */
export function formatPhoneNumber(phone: string): string {
  const clean = phone.replace('whatsapp:', '').trim()
  
  // Basic formatting (add spaces)
  if (clean.startsWith('+234')) {
    // Nigerian number: +234 801 234 5678
    return `${clean.substring(0, 4)} ${clean.substring(4, 7)} ${clean.substring(7, 10)} ${clean.substring(10)}`
  }
  
  return clean
}

/**
 * Format percentage
 * @param value - Percentage value (e.g., 1.5 for 1.5%)
 * @param decimals - Decimal places
 * @returns Formatted percentage (e.g., "1.50%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with K, M, B suffixes
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toFixed(0)
}

/**
 * Format gas fee for display
 * @param gasFee - Gas fee in native token
 * @param symbol - Native token symbol
 * @param valueUSD - Value in USD (optional)
 * @returns Formatted gas fee
 */
export function formatGasFee(gasFee: string, symbol: string, valueUSD?: number): string {
  const fee = parseFloat(gasFee)
  
  if (isNaN(fee)) {
    return 'Unknown'
  }
  
  const feeStr = `${fee.toFixed(6)} ${symbol}`
  
  if (valueUSD) {
    return `${feeStr} (${formatUSD(valueUSD)})`
  }
  
  return feeStr
}

/**
 * Format slippage in basis points to percentage
 * @param slippageBps - Slippage in basis points
 * @returns Formatted percentage (e.g., "0.5%")
 */
export function formatSlippage(slippageBps: number): string {
  return formatPercentage(slippageBps / 100)
}

/**
 * Pluralize word based on count
 * @param count - Number
 * @param singular - Singular form
 * @param plural - Plural form (optional, adds 's' by default)
 * @returns Pluralized string
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`
  }
  return `${count} ${plural || singular + 's'}`
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Max length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - 3) + '...'
}