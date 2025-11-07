/**
 * Transaction Service
 * Handles crypto transfers and swaps
 */
import { PublicKey } from '@solana/web3.js';
import { prisma } from '../models/prisma.client.js';
import { walletService } from './wallet.service.js';
import { normalizeChainKey, getChainConfig } from '../config/index.js';
import { isValidAddress, isValidAmount, InsufficientBalanceError, ValidationError, TransactionError, InvalidPinError, } from '../utils/index.js';
export class TransactionService {
    /**
     * Send native tokens (SOL, ETH, BNB, etc.)
     */
    async sendNative(params) {
        const { userId, chainKey, toAddress, amount, pin, note } = params;
        // Normalize chain
        const normalized = normalizeChainKey(chainKey);
        // Validate address
        if (!isValidAddress(toAddress, normalized)) {
            throw new ValidationError(`Invalid ${normalized} address`);
        }
        // Validate amount
        if (!isValidAmount(amount)) {
            throw new ValidationError('Invalid amount. Must be greater than 0');
        }
        // Verify PIN
        const isPinValid = await walletService.verifyWalletPin(userId, pin);
        if (!isPinValid) {
            throw new InvalidPinError();
        }
        // Get wallet balance
        const walletBalance = await walletService.getWalletBalance(userId, normalized);
        // Check sufficient balance
        if (walletBalance.nativeBalance.formatted < amount) {
            throw new InsufficientBalanceError(`${amount} ${walletBalance.nativeSymbol}`, `${walletBalance.nativeBalance.formatted} ${walletBalance.nativeSymbol}`);
        }
        // Get wallet instance
        const walletInstance = await walletService.getWalletInstance(userId, normalized, pin);
        try {
            // Execute transfer
            let result;
            if (walletBalance.chain === 'SVM') {
                // Solana transfer - cast to SVMChainWallet
                const svmWallet = walletInstance;
                result = await svmWallet.transferNative(new PublicKey(toAddress), amount);
            }
            else {
                // EVM transfer - cast to EVMChainWallet
                const evmWallet = walletInstance;
                result = await evmWallet.transferNative(toAddress, amount);
            }
            if (!result.success || !result.hash) {
                throw new TransactionError('Transaction failed', { error: result.error });
            }
            // Record transaction in database
            const transaction = await prisma.createTransaction({
                userId,
                chain: walletBalance.chain,
                chainKey: normalized,
                type: 'SEND',
                fromAddress: walletBalance.address,
                toAddress,
                amount: amount.toString(),
                tokenSymbol: walletBalance.nativeSymbol,
                hash: result.hash,
                note: note ?? null,
            });
            return transaction;
        }
        catch (error) {
            console.error('Transfer failed:', error);
            if (error instanceof ValidationError || error instanceof InsufficientBalanceError) {
                throw error;
            }
            throw new TransactionError(error instanceof Error ? error.message : 'Transaction failed');
        }
    }
    /**
     * Send tokens (SPL tokens on Solana, ERC20 on EVM)
     */
    async sendToken(params) {
        const { userId, chainKey, toAddress, amount, tokenAddress, pin, note } = params;
        // Normalize chain
        const normalized = normalizeChainKey(chainKey);
        // Validate addresses
        if (!isValidAddress(toAddress, normalized)) {
            throw new ValidationError(`Invalid recipient address`);
        }
        if (!isValidAddress(tokenAddress, normalized)) {
            throw new ValidationError(`Invalid token address`);
        }
        // Validate amount
        if (!isValidAmount(amount)) {
            throw new ValidationError('Invalid amount');
        }
        // Verify PIN
        const isPinValid = await walletService.verifyWalletPin(userId, pin);
        if (!isPinValid) {
            throw new InvalidPinError();
        }
        // Get wallet instance
        const walletInstance = await walletService.getWalletInstance(userId, normalized, pin);
        const wallet = await walletService.getUserWallet(userId, normalized);
        try {
            // Get token info and balance based on chain type
            let tokenInfo;
            let tokenBalance;
            if (wallet.chain === 'SVM') {
                const svmWallet = walletInstance;
                const connection = svmWallet.connection;
                const tokenPubkey = new PublicKey(tokenAddress);
                // ✅ get the VM and call VM.getTokenInfo
                const svmVM = svmWallet.vm;
                tokenInfo = await svmVM.getTokenInfo(tokenPubkey, connection);
                // Get token balance
                tokenBalance = await svmWallet.getTokenBalance(tokenPubkey);
            }
            else {
                const evmWallet = walletInstance;
                const provider = evmWallet.connection;
                // ✅ get the VM and call VM.getTokenInfo
                const evmVM = evmWallet.vm;
                tokenInfo = await evmVM.getTokenInfo(tokenAddress, provider);
                // Get token balance
                tokenBalance = await evmWallet.getTokenBalance(tokenAddress);
            }
            // Check sufficient balance
            if (tokenBalance.formatted < amount) {
                throw new InsufficientBalanceError(`${amount} ${tokenInfo.symbol}`, `${tokenBalance.formatted} ${tokenInfo.symbol}`);
            }
            // Execute transfer
            let result;
            if (wallet.chain === 'SVM') {
                const svmWallet = walletInstance;
                result = await svmWallet.transferToken(tokenInfo, new PublicKey(toAddress), amount);
            }
            else {
                const evmWallet = walletInstance;
                result = await evmWallet.transferToken(tokenInfo, toAddress, amount);
            }
            if (!result.success || !result.hash) {
                throw new TransactionError('Token transfer failed');
            }
            // Record transaction
            const transaction = await prisma.createTransaction({
                userId,
                chain: wallet.chain,
                chainKey: normalized,
                type: 'SEND',
                fromAddress: wallet.address,
                toAddress,
                amount: amount.toString(),
                tokenAddress,
                tokenSymbol: tokenInfo.symbol,
                tokenDecimals: tokenInfo.decimals,
                hash: result.hash,
                note: note ?? null,
            });
            return transaction;
        }
        catch (error) {
            console.error('Token transfer failed:', error);
            if (error instanceof ValidationError || error instanceof InsufficientBalanceError) {
                throw error;
            }
            throw new TransactionError(error instanceof Error ? error.message : 'Token transfer failed');
        }
    }
    /**
     * Swap tokens
     */
    async swap(params) {
        const { userId, chainKey, fromToken, toToken, amount, slippage = 150, pin } = params;
        // Normalize chain
        const normalized = normalizeChainKey(chainKey);
        // Validate amount
        if (!isValidAmount(amount)) {
            throw new ValidationError('Invalid amount');
        }
        // Verify PIN
        const isPinValid = await walletService.verifyWalletPin(userId, pin);
        if (!isPinValid) {
            throw new InvalidPinError();
        }
        // Get wallet instance
        const walletInstance = await walletService.getWalletInstance(userId, normalized, pin);
        const wallet = await walletService.getUserWallet(userId, normalized);
        try {
            // Check balance based on chain type
            let balance;
            if (wallet.chain === 'SVM') {
                const svmWallet = walletInstance;
                if (fromToken.address === 'native') {
                    balance = await svmWallet.getNativeBalance();
                }
                else {
                    balance = await svmWallet.getTokenBalance(new PublicKey(fromToken.address));
                }
            }
            else {
                const evmWallet = walletInstance;
                if (fromToken.address === 'native' || fromToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
                    balance = await evmWallet.getNativeBalance();
                }
                else {
                    balance = await evmWallet.getTokenBalance(fromToken.address);
                }
            }
            if (balance.formatted < amount) {
                throw new InsufficientBalanceError(`${amount} ${fromToken.symbol}`, `${balance.formatted} ${fromToken.symbol}`);
            }
            // Execute swap
            let result;
            if (wallet.chain === 'SVM') {
                const svmWallet = walletInstance;
                result = await svmWallet.swap(fromToken, new PublicKey(toToken.address), amount, slippage);
            }
            else {
                const evmWallet = walletInstance;
                result = await evmWallet.swap(fromToken, toToken.address, amount, slippage);
            }
            if (!result.success || !result.hash) {
                throw new TransactionError('Swap failed');
            }
            // Record transaction
            const transaction = await prisma.createTransaction({
                userId,
                chain: wallet.chain,
                chainKey: normalized,
                type: 'SWAP',
                fromAddress: wallet.address,
                toAddress: null,
                amount: amount.toString(),
                tokenAddress: fromToken.address,
                tokenSymbol: `${fromToken.symbol} → ${toToken.symbol}`,
                tokenDecimals: fromToken.decimals,
                hash: result.hash,
                note: `Swapped ${amount} ${fromToken.symbol} for ${toToken.symbol}`,
            });
            return transaction;
        }
        catch (error) {
            console.error('Swap failed:', error);
            if (error instanceof ValidationError || error instanceof InsufficientBalanceError) {
                throw error;
            }
            throw new TransactionError(error instanceof Error ? error.message : 'Swap failed');
        }
    }
    /**
     * Get transaction by hash
     */
    async getTransaction(hash) {
        const transaction = await prisma.transaction.findUnique({
            where: { hash },
        });
        return transaction;
    }
    /**
     * Get user's transaction history
     */
    async getTransactionHistory(userId, options) {
        const { chainKey, limit = 20, offset = 0 } = options || {};
        const where = { userId };
        if (chainKey) {
            const normalized = normalizeChainKey(chainKey);
            where.chainKey = normalized;
        }
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
        return transactions;
    }
    /**
     * Update transaction status (for monitoring)
     */
    async updateTransactionStatus(hash, status, details) {
        const transaction = await prisma.updateTransactionStatus(hash, status, details?.blockNumber ?? null, details?.gasUsed ?? null, details?.gasFee ?? null, details?.errorMessage ?? null);
        return transaction;
    }
}
// Export singleton instance
export const transactionService = new TransactionService();
//# sourceMappingURL=transaction.service.js.map