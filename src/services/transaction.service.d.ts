/**
 * Transaction Service
 * Handles crypto transfers and swaps
 */
import { type ChainKey } from '../config/index.js';
import type { TransferParams, SwapParams, TransactionDetails } from '../types/index.js';
export declare class TransactionService {
    /**
     * Send native tokens (SOL, ETH, BNB, etc.)
     */
    sendNative(params: TransferParams): Promise<TransactionDetails>;
    /**
     * Send tokens (SPL tokens on Solana, ERC20 on EVM)
     */
    sendToken(params: TransferParams & {
        tokenAddress: string;
    }): Promise<TransactionDetails>;
    /**
     * Swap tokens
     */
    swap(params: SwapParams): Promise<TransactionDetails>;
    /**
     * Get transaction by hash
     */
    getTransaction(hash: string): Promise<TransactionDetails | null>;
    /**
     * Get user's transaction history
     */
    getTransactionHistory(userId: string, options?: {
        chainKey?: ChainKey;
        limit?: number;
        offset?: number;
    }): Promise<TransactionDetails[]>;
    /**
     * Update transaction status (for monitoring)
     */
    updateTransactionStatus(hash: string, status: 'PENDING' | 'CONFIRMED' | 'FAILED', details?: {
        blockNumber?: string;
        gasUsed?: string;
        gasFee?: string;
        errorMessage?: string;
    }): Promise<TransactionDetails>;
}
export declare const transactionService: TransactionService;
//# sourceMappingURL=transaction.service.d.ts.map