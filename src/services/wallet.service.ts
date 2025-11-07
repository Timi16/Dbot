/**
 * Wallet Service
 * Handles wallet creation, balance checking, and management
 */

import {
  SVMVM,
  SVMChainWallet,
  EVMVM,
  EVMChainWallet,
  VM,
} from '@demetacode/multi-vm-wallet'
import { Connection, PublicKey } from '@solana/web3.js'
import { JsonRpcProvider as EthersJsonRpcProvider } from 'ethers'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'

import { prisma } from '../models/prisma.client.js'
import { getChainConfig, normalizeChainKey, type ChainKey } from '../config/index.js'
import type {
  WalletCreationResult,
  WalletInfo,
  WalletBalance,
  Balance,
} from '../types/index.js'
import {
  encryptSeed,
  decryptSeed,
  NotFoundError,
  ValidationError,
} from '../utils/index.js'

export class WalletService {
  /**
   * Create wallets for a new user (both SVM and EVM)
   * @param userId - User ID
   * @param pin - Optional PIN for encryption. If not provided, uses a default encryption
   */
  async createUserWallets(
    userId: string,
    pin?: string
  ): Promise<WalletCreationResult> {
    // Generate mnemonic
    const mnemonic = bip39.generateMnemonic(wordlist)
    const seed = VM.mnemonicToSeed(mnemonic)

    // Use provided PIN or a default value for users without PIN
    const encryptionKey = pin || userId // If no PIN, use userId as encryption key
    
    // Encrypt seed
    const { encrypted, salt } = encryptSeed(mnemonic, encryptionKey)

    // Create SVM wallet (Solana)
    const svmVM = new SVMVM(seed)
    const svmKeyPair = svmVM.generatePrivateKey(0)
    const svmConfig = getChainConfig('solana')
    const svmWallet = new SVMChainWallet(svmConfig, svmKeyPair.privateKey, 0)

    // Create EVM wallet (works on all EVM chains)
    const evmVM = new EVMVM(seed)
    const evmKeyPair = evmVM.generatePrivateKey(0)
    const evmConfig = getChainConfig('ethereum')
    const evmWallet = new EVMChainWallet(evmConfig, evmKeyPair.privateKey, 0)

    // Save to database
    await prisma.wallet.createMany({
      data: [
        {
          userId,
          chain: 'SVM',
          chainKey: 'solana',
          address: svmWallet.getAddress().toString(),
          encryptedSeed: encrypted,
          salt,
          derivationIndex: 0,
          derivationPath: "m/44'/501'/0'/0/0",
          isDefault: true,
        },
        {
          userId,
          chain: 'EVM',
          chainKey: 'ethereum',
          address: evmWallet.getAddress(),
          encryptedSeed: encrypted,
          salt,
          derivationIndex: 0,
          derivationPath: "m/44'/60'/0'/0/0",
          isDefault: true,
        },
      ],
    })

    return {
      userId,
      svmWallet: {
        address: svmWallet.getAddress().toString(),
        chain: 'SVM',
        chainKey: 'solana',
      },
      evmWallet: {
        address: evmWallet.getAddress(),
        chain: 'EVM',
        chainKey: 'ethereum',
      },
      mnemonic,
      encryptedSeed: encrypted,
      salt,
    }
  }

  /**
   * Get user's wallet for specific chain (including encrypted seed)
   */
  private async getUserWalletWithSeed(userId: string, chainKey: ChainKey): Promise<WalletInfo> {
    const normalized = normalizeChainKey(chainKey)
    const chain = normalized === 'solana' ? 'SVM' : 'EVM'

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_chain: {
          userId,
          chain,
        },
      },
    })

    if (!wallet) {
      throw new NotFoundError(`${chain} wallet`)
    }

    return wallet as WalletInfo
  }

  /**
   * Get user's wallet for specific chain (public info only)
   */
  async getUserWallet(userId: string, chainKey: ChainKey): Promise<Omit<WalletInfo, 'encryptedSeed' | 'salt'>> {
    const wallet = await this.getUserWalletWithSeed(userId, chainKey)
    
    // Return without sensitive fields
    const { encryptedSeed, salt, ...publicInfo } = wallet
    return publicInfo
  }

  /**
   * Get all user wallets
   */
  async getUserWallets(userId: string): Promise<Omit<WalletInfo, 'encryptedSeed' | 'salt'>[]> {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { chain: 'asc' },
      select: {
        id: true,
        chain: true,
        chainKey: true,
        address: true,
        derivationIndex: true,
        derivationPath: true,
        isDefault: true,
        label: true,
        createdAt: true,
      },
    })

    return wallets
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(
    userId: string,
    chainKey: ChainKey
  ): Promise<WalletBalance> {
    const normalized = normalizeChainKey(chainKey)
    const wallet = await this.getUserWallet(userId, normalized)
    const config = getChainConfig(normalized)

    let nativeBalance: Balance

    if (wallet.chain === 'SVM') {
      // Solana balance
      const connection = new Connection(config.rpcUrl)
      nativeBalance = await SVMVM.getNativeBalance(
        new PublicKey(wallet.address),
        connection
      )
    } else {
      // EVM balance - Cast to any to avoid type mismatch
      const provider = new EthersJsonRpcProvider(config.rpcUrl)
      nativeBalance = await EVMVM.getNativeBalance(wallet.address, provider as any)
    }

    return {
      chain: wallet.chain,
      chainKey: wallet.chainKey,
      chainName: config.name,
      address: wallet.address,
      nativeBalance,
      nativeSymbol: config.nativeToken.symbol,
    }
  }

  /**
   * Get all wallet balances
   */
  async getAllBalances(userId: string): Promise<WalletBalance[]> {
    const wallets = await this.getUserWallets(userId)
    const balances: WalletBalance[] = []

    for (const wallet of wallets) {
      try {
        const balance = await this.getWalletBalance(
          userId,
          wallet.chainKey as ChainKey
        )
        balances.push(balance)
      } catch (error) {
        console.error(`Failed to get balance for ${wallet.chainKey}:`, error)
        // Continue with other wallets
      }
    }

    return balances
  }

  /**
   * Get wallet instance (for transactions)
   * @param pin - Optional. If user has no PIN, pass userId or leave empty
   */
  async getWalletInstance(
    userId: string,
    chainKey: ChainKey,
    pin?: string
  ): Promise<SVMChainWallet | EVMChainWallet> {
    const normalized = normalizeChainKey(chainKey)
    const wallet = await this.getUserWalletWithSeed(userId, normalized)
    const config = getChainConfig(normalized)

    // Check if user has PIN enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pinEnabled: true }
    })

    // Use PIN if provided, otherwise use userId as decryption key
    const decryptionKey = pin || (user?.pinEnabled ? null : userId)
    
    if (!decryptionKey) {
      throw new ValidationError('PIN required but not provided')
    }

    // Decrypt seed
    const mnemonic = decryptSeed(wallet.encryptedSeed, decryptionKey, wallet.salt)
    
    if (!mnemonic) {
      throw new ValidationError('Invalid PIN or decryption failed')
    }

    const seed = VM.mnemonicToSeed(mnemonic)

    if (wallet.chain === 'SVM') {
      // Create SVM wallet instance
      const svmVM = new SVMVM(seed)
      const keyPair = svmVM.generatePrivateKey(wallet.derivationIndex)
      return new SVMChainWallet(config, keyPair.privateKey, wallet.derivationIndex)
    } else {
      // Create EVM wallet instance
      const evmVM = new EVMVM(seed)
      const keyPair = evmVM.generatePrivateKey(wallet.derivationIndex)
      return new EVMChainWallet(config, keyPair.privateKey, wallet.derivationIndex)
    }
  }

  /**
   * Verify user's wallet PIN (or userId for users without PIN)
   */
  async verifyWalletPin(userId: string, pin?: string): Promise<boolean> {
    // Get any wallet to test decryption
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      take: 1,
    })
    
    if (wallets.length === 0) {
      throw new NotFoundError('No wallets found')
    }

    const wallet = wallets[0]
    
    if (!wallet) {
      throw new NotFoundError('No wallets found')
    }

    // Check if user has PIN enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pinEnabled: true }
    })

    // Use PIN if provided, otherwise use userId
    const decryptionKey = pin || (user?.pinEnabled ? null : userId)
    
    if (!decryptionKey) {
      return false
    }

    const mnemonic = decryptSeed(wallet.encryptedSeed, decryptionKey, wallet.salt)
    
    return mnemonic !== null
  }

  /**
   * Get seed phrase (for backup/export)
   * @param pin - Optional. If user has no PIN, it will use userId
   */
  async getSeedPhrase(userId: string, pin?: string): Promise<string> {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      take: 1,
    })
    
    if (wallets.length === 0) {
      throw new NotFoundError('No wallets found')
    }

    const wallet = wallets[0]
    
    if (!wallet) {
      throw new NotFoundError('No wallets found')
    }

    // Check if user has PIN enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pinEnabled: true }
    })

    // Use PIN if provided, otherwise use userId
    const decryptionKey = pin || (user?.pinEnabled ? null : userId)
    
    if (!decryptionKey) {
      throw new ValidationError('PIN required but not provided')
    }

    const mnemonic = decryptSeed(wallet.encryptedSeed, decryptionKey, wallet.salt)
    
    if (!mnemonic) {
      throw new ValidationError('Invalid PIN or decryption failed')
    }

    return mnemonic
  }
}

// Export singleton instance
export const walletService = new WalletService()