/**
 * Token Service - Fetch token details from various sources
 */
import { ethers } from 'ethers';
import type { ChainWalletConfig } from '@demetacode/multi-vm-wallet';
import type { ChainKey } from '../config/index.js';
import type { TokenDetails } from '../types/token.types.js';
export declare function calculatePercentageChange(oldPrice: number, currentPrice: number): number;
export declare function getNativeTokenUsdPrice(chain: ChainKey): Promise<number>;
export interface TokenOnChainData {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
}
/**
 * Fetch ERC-20 token metadata directly from the blockchain.
 */
export declare const getTokenDataFromChain: (tokenAddress: string, provider: ethers.Provider) => Promise<TokenOnChainData>;
export declare const getTokenDetails_DEXSCREENER: (token: string) => Promise<TokenDetails | null>;
export declare const getTokenDetails_DEXTOOLS: (token: string) => Promise<TokenDetails | null>;
export declare const getCustomTokenDataForEvmChainUsingUniSwapV30g: (tokenAddress: string, chain: ChainWalletConfig) => Promise<TokenDetails | null>;
//# sourceMappingURL=token.service.d.ts.map