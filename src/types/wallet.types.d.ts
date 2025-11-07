/**
 * Wallet-related Type Definitions
 */
import type { Balance, TokenInfo, TransactionResult, ChainWalletConfig } from '@demetacode/multi-vm-wallet';
import type { ChainType } from '@prisma/client';
export type { Balance, TokenInfo, TransactionResult, ChainWalletConfig };
export interface WalletCreationResult {
    userId: string;
    svmWallet: {
        address: string;
        chain: 'SVM';
        chainKey: 'solana';
    };
    evmWallet: {
        address: string;
        chain: 'EVM';
        chainKey: 'ethereum' | 'base' | 'bsc' | '0g';
    };
    mnemonic: string;
    encryptedSeed: string;
    salt: string;
}
export interface WalletInfo {
    id: string;
    chain: ChainType;
    chainKey: string;
    address: string;
    derivationIndex: number;
    derivationPath: string;
    isDefault: boolean;
    label: string | null;
    createdAt: Date;
    encryptedSeed: string;
    salt: string;
}
export interface WalletBalance {
    chain: ChainType;
    chainKey: string;
    chainName: string;
    address: string;
    nativeBalance: Balance;
    nativeSymbol: string;
    nativeValueUSD?: number;
    tokenBalances?: TokenBalance[];
    totalValueUSD?: number;
}
export interface TokenBalance {
    token: TokenInfo;
    balance: Balance;
    valueUSD?: number;
}
export interface TransferParams {
    userId: string;
    chain: ChainType;
    chainKey: string;
    toAddress: string;
    amount: number;
    tokenAddress?: string | null;
    pin: string;
    note?: string | null | undefined;
}
export interface SwapParams {
    userId: string;
    chain: ChainType;
    chainKey: string;
    fromToken: TokenInfo;
    toToken: TokenInfo;
    amount: number;
    slippage?: number;
    pin: string;
}
export interface TransactionDetails {
    id: string;
    chain: ChainType;
    chainKey: string;
    type: 'SEND' | 'RECEIVE' | 'SWAP';
    fromAddress: string;
    toAddress: string | null;
    amount: string;
    tokenSymbol: string | null;
    hash: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    blockNumber: string | null;
    gasUsed: string | null;
    gasFee: string | null;
    errorMessage: string | null;
    note: string | null;
    createdAt: Date;
    confirmedAt: Date | null;
}
export interface WalletSettings {
    requirePinForSend: boolean;
    requirePinForSwap: boolean;
    requirePinAmount: string | null;
    hideSmallBalances: boolean;
    preferredCurrency: string;
}
//# sourceMappingURL=wallet.types.d.ts.map