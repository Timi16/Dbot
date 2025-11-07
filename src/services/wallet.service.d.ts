/**
 * Wallet Service
 * Handles wallet creation, balance checking, and management
 */
import { SVMChainWallet, EVMChainWallet } from '@demetacode/multi-vm-wallet';
import { type ChainKey } from '../config/index.js';
import type { WalletCreationResult, WalletInfo, WalletBalance } from '../types/index.js';
export declare class WalletService {
    /**
     * Create wallets for a new user (both SVM and EVM)
     * @param userId - User ID
     * @param pin - Optional PIN for encryption. If not provided, uses a default encryption
     */
    createUserWallets(userId: string, pin?: string): Promise<WalletCreationResult>;
    /**
     * Get user's wallet for specific chain (including encrypted seed)
     */
    private getUserWalletWithSeed;
    /**
     * Get user's wallet for specific chain (public info only)
     */
    getUserWallet(userId: string, chainKey: ChainKey): Promise<Omit<WalletInfo, 'encryptedSeed' | 'salt'>>;
    /**
     * Get all user wallets
     */
    getUserWallets(userId: string): Promise<Omit<WalletInfo, 'encryptedSeed' | 'salt'>[]>;
    /**
     * Get wallet balance
     */
    getWalletBalance(userId: string, chainKey: ChainKey): Promise<WalletBalance>;
    /**
     * Get all wallet balances
     */
    getAllBalances(userId: string): Promise<WalletBalance[]>;
    /**
     * Get wallet instance (for transactions)
     * @param pin - Optional. If user has no PIN, pass userId or leave empty
     */
    getWalletInstance(userId: string, chainKey: ChainKey, pin?: string): Promise<SVMChainWallet | EVMChainWallet>;
    /**
     * Verify user's wallet PIN (or userId for users without PIN)
     */
    verifyWalletPin(userId: string, pin?: string): Promise<boolean>;
    /**
     * Get seed phrase (for backup/export)
     * @param pin - Optional. If user has no PIN, it will use userId
     */
    getSeedPhrase(userId: string, pin?: string): Promise<string>;
}
export declare const walletService: WalletService;
//# sourceMappingURL=wallet.service.d.ts.map