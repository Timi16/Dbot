import type { ChainWalletConfig } from '@demetacode/multi-vm-wallet'
import { env } from './env.config.js'

export type VmType = 'EVM' | 'SVM'

export type ChainKey = keyof typeof CHAIN_REGISTRY

interface ChainEntry {
  vm: VmType
  config: ChainWalletConfig
}

export const CHAIN_REGISTRY = {
  ethereum: {
    vm: 'EVM',
    config: {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: env.ETHEREUM_RPC_URL,
      explorerUrl: 'https://etherscan.io',
      nativeToken: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      confirmationNo: 1,
    },
  } satisfies ChainEntry,

  base: {
    vm: 'EVM',
    config: {
      chainId: 8453,
      name: 'Base',
      rpcUrl: env.BASE_RPC_URL,
      explorerUrl: 'https://basescan.org',
      nativeToken: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      confirmationNo: 1,
    },
  } satisfies ChainEntry,

  bsc: {
    vm: 'EVM',
    config: {
      chainId: 56,
      name: 'BSC',
      rpcUrl: env.BSC_RPC_URL,
      explorerUrl: 'https://bscscan.com',
      nativeToken: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      confirmationNo: 1,
    },
  } satisfies ChainEntry,

  '0g': {
    vm: 'EVM',
    config: {
      chainId: 16661,
      name: '0G',
      rpcUrl: env.OG_RPC_URL,
      explorerUrl: 'https://chainscan.0g.ai',
      nativeToken: { name: '0G', symbol: '0G', decimals: 18 },
      confirmationNo: 1,
    },
  } satisfies ChainEntry,

  solana: {
    vm: 'SVM',
    config: {
      chainId: 'solana-mainnet',
      name: 'Solana',
      rpcUrl: env.SOLANA_RPC_URL,
      explorerUrl: 'https://explorer.solana.com',
      nativeToken: { name: 'Solana', symbol: 'SOL', decimals: 9 },
      confirmationNo: 1,
    },
  } satisfies ChainEntry,
} as const

export const SUPPORTED_CHAIN_LIST = Object.keys(CHAIN_REGISTRY) as ChainKey[]

/**
 * Normalize common aliases to ChainKey
 */
export function normalizeChainKey(input: string | null | undefined): ChainKey {
  if (!input || typeof input !== 'string') {
    throw new Error(`Invalid chain key: ${input}`)
  }

  const normalized = input.trim().toLowerCase()

  if (!normalized) {
    throw new Error(`Empty chain key: "${input}"`)
  }

  // Aliases
  const aliasMap: Record<string, ChainKey> = {
    eth: 'ethereum',
    ethereum: 'ethereum',
    mainnet: 'ethereum',
    base: 'base',
    bsc: 'bsc',
    binance: 'bsc',
    bnb: 'bsc',
    '0g': '0g',
    og: '0g',
    zerog: '0g',
    sol: 'solana',
    solana: 'solana',
  }

  const chainKey = aliasMap[normalized]
  if (!chainKey) {
    throw new Error(
      `Unsupported chain: "${input}". Supported: ${SUPPORTED_CHAIN_LIST.join(', ')}`
    )
  }

  return chainKey
}

/**
 * Get VM type for a chain
 */
export function getVmType(chain: ChainKey): VmType {
  const entry = CHAIN_REGISTRY[chain]
  if (!entry) {
    throw new Error(`Chain "${chain}" not found in registry`)
  }
  return entry.vm
}

/**
 * Get chain config
 */
export function getChainConfig(chain: ChainKey): ChainWalletConfig {
  const entry = CHAIN_REGISTRY[chain]
  if (!entry) {
    throw new Error(`Chain "${chain}" not found in registry`)
  }
  return entry.config
}

/**
 * Get user-friendly chain display name
 */
export function getChainDisplayName(chain: ChainKey): string {
  return CHAIN_REGISTRY[chain].config.name
}

/**
 * Get native token symbol
 */
export function getNativeSymbol(chain: ChainKey): string {
  return CHAIN_REGISTRY[chain].config.nativeToken.symbol
}