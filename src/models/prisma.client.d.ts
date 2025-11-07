import { PrismaClient } from '@prisma/client';
/**
 * Prisma Client Singleton
 *
 * Best practices:
 * - Single instance across the application
 * - Proper connection pooling
 * - Graceful shutdown handling
 * - Development query logging
 * - Production error logging
 */
declare class ExtendedPrismaClient extends PrismaClient {
    constructor();
    /**
     * Custom method: Clean up expired sessions
     * Run this periodically (e.g., via cron job)
     */
    cleanExpiredSessions(): Promise<number>;
    /**
     * Custom method: Get user with all relations
     */
    getUserComplete(phone: string): Promise<({
        wallets: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            chain: import("@prisma/client").$Enums.ChainType;
            chainKey: string;
            address: string;
            encryptedSeed: string;
            salt: string;
            derivationIndex: number;
            derivationPath: string;
            isDefault: boolean;
            label: string | null;
        }[];
        sessions: {
            id: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            currentStep: string;
            context: import("@prisma/client/runtime/library").JsonValue;
            expiresAt: Date;
        }[];
        transactions: {
            type: import("@prisma/client").$Enums.TransactionType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            chain: import("@prisma/client").$Enums.ChainType;
            chainKey: string;
            fromAddress: string;
            toAddress: string | null;
            amount: string;
            tokenAddress: string | null;
            tokenSymbol: string | null;
            tokenDecimals: number | null;
            hash: string;
            blockNumber: string | null;
            gasUsed: string | null;
            gasFee: string | null;
            status: import("@prisma/client").$Enums.TransactionStatus;
            errorMessage: string | null;
            note: string | null;
            confirmedAt: Date | null;
        }[];
        settings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            requirePinForSend: boolean;
            requirePinForSwap: boolean;
            requirePinAmount: string | null;
            notifyOnReceive: boolean;
            notifyOnSend: boolean;
            notifyOnConfirmation: boolean;
            preferredCurrency: string;
            hideSmallBalances: boolean;
            language: string;
        } | null;
    } & {
        id: string;
        phone: string;
        name: string | null;
        profileName: string | null;
        onboardingStatus: import("@prisma/client").$Enums.OnboardingStatus;
        onboardingStep: string | null;
        pinHash: string | null;
        pinEnabled: boolean;
        failedPinAttempts: number;
        pinLockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
        lastActive: Date;
    }) | null>;
    /**
     * Custom method: Check if user exists and is onboarded
     */
    isUserOnboarded(phone: string): Promise<boolean>;
    /**
     * 🔥 FIXED: Update user's last active timestamp
     * Now uses UPSERT to handle new users automatically
     */
    touchUser(phone: string, profileName?: string | null): Promise<void>;
    /**
     * Custom method: Increment failed PIN attempts
     */
    incrementFailedPinAttempts(userId: string): Promise<number>;
    /**
     * Custom method: Reset failed PIN attempts
     */
    resetFailedPinAttempts(userId: string): Promise<void>;
    /**
     * Custom method: Check if user's PIN is locked
     */
    isPinLocked(userId: string): Promise<boolean>;
    /**
     * Custom method: Log webhook for debugging
     */
    logWebhook(data: {
        phone: string;
        message: string;
        profileName?: string | null;
        messageSid: string;
        responseStatus?: string | null;
        responseMessage?: string | null;
        errorDetails?: string | null;
        processingTime?: number | null;
    }): Promise<void>;
    /**
     * Custom method: Get user's wallet for specific chain
     */
    getUserWallet(userId: string, chain: 'SVM' | 'EVM'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        chain: import("@prisma/client").$Enums.ChainType;
        chainKey: string;
        address: string;
        encryptedSeed: string;
        salt: string;
        derivationIndex: number;
        derivationPath: string;
        isDefault: boolean;
        label: string | null;
    } | null>;
    /**
     * Custom method: Create transaction record
     */
    createTransaction(data: {
        userId: string;
        chain: 'SVM' | 'EVM';
        chainKey: string;
        type: 'SEND' | 'RECEIVE' | 'SWAP';
        fromAddress: string;
        toAddress?: string | null;
        amount: string;
        tokenAddress?: string | null;
        tokenSymbol?: string | null;
        tokenDecimals?: number | null;
        hash: string;
        note?: string | null;
    }): Promise<{
        type: import("@prisma/client").$Enums.TransactionType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        chain: import("@prisma/client").$Enums.ChainType;
        chainKey: string;
        fromAddress: string;
        toAddress: string | null;
        amount: string;
        tokenAddress: string | null;
        tokenSymbol: string | null;
        tokenDecimals: number | null;
        hash: string;
        blockNumber: string | null;
        gasUsed: string | null;
        gasFee: string | null;
        status: import("@prisma/client").$Enums.TransactionStatus;
        errorMessage: string | null;
        note: string | null;
        confirmedAt: Date | null;
    }>;
    /**
     * Custom method: Update transaction status
     */
    updateTransactionStatus(hash: string, status: 'PENDING' | 'CONFIRMED' | 'FAILED', blockNumber?: string | null, gasUsed?: string | null, gasFee?: string | null, errorMessage?: string | null): Promise<{
        type: import("@prisma/client").$Enums.TransactionType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        chain: import("@prisma/client").$Enums.ChainType;
        chainKey: string;
        fromAddress: string;
        toAddress: string | null;
        amount: string;
        tokenAddress: string | null;
        tokenSymbol: string | null;
        tokenDecimals: number | null;
        hash: string;
        blockNumber: string | null;
        gasUsed: string | null;
        gasFee: string | null;
        status: import("@prisma/client").$Enums.TransactionStatus;
        errorMessage: string | null;
        note: string | null;
        confirmedAt: Date | null;
    }>;
}
declare global {
    var prisma: ExtendedPrismaClient | undefined;
}
export declare const prisma: ExtendedPrismaClient;
/**
 * Graceful shutdown handler
 * Call this when your app is shutting down
 */
export declare function disconnectPrisma(): Promise<void>;
/**
 * Connect to database and run health check
 */
export declare function connectPrisma(): Promise<void>;
/**
 * Database health check
 * Use this for API health endpoints
 */
export declare function checkDatabaseHealth(): Promise<boolean>;
/**
 * Clean up old data (maintenance task)
 * Run this periodically via cron
 */
export declare function performDatabaseMaintenance(): Promise<{
    expiredSessions: number;
    oldWebhookLogs: number;
}>;
/**
 * Transaction helper - ensures atomic operations
 * Use this for operations that need to be all-or-nothing
 */
export declare function executeTransaction<T>(callback: (tx: ExtendedPrismaClient) => Promise<T>): Promise<T>;
export type { User, Wallet, Session, Transaction, UserSettings, Contact, WebhookLog, OnboardingStatus, ChainType, TransactionType, TransactionStatus, } from '@prisma/client';
//# sourceMappingURL=prisma.client.d.ts.map