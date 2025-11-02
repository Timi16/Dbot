/**
 * Onboarding Service
 * Handles user onboarding flow
 */

import { prisma } from '../models/prisma.client.js'
import { walletService } from './wallet.service.js'
import { sessionService } from './session.service.js'
import {
  hashPin,
  isValidPin,
  ValidationError,
  formatChainName,
  shortenAddress,
} from '../utils/index.js'
import { OnboardingStep } from '../types/index.js'
import type { WalletCreationResult } from '../types/index.js'

export class OnboardingService {
  /**
   * Start onboarding for a new user
   */
  async startOnboarding(phone: string, profileName?: string): Promise<string> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingUser && existingUser.onboardingStatus === 'COMPLETED') {
      return 'You already have an account! Type "menu" to see options.'
    }

    // Create or update user
    let user
    if (existingUser) {
      user = await prisma.user.update({
        where: { phone },
        data: {
          onboardingStatus: 'IN_PROGRESS',
          onboardingStep: OnboardingStep.AWAITING_NAME,
          profileName: profileName ?? existingUser.profileName,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          phone,
          profileName: profileName ?? null,
          onboardingStatus: 'IN_PROGRESS',
          onboardingStep: OnboardingStep.AWAITING_NAME,
        },
      })
    }

    // Create session
    await sessionService.createSession({
      phone,
      userId: user.id,
      currentStep: OnboardingStep.AWAITING_NAME,
      context: {},
    })

    return `Welcome to Crypto Wallet Bot! 🚀\n\nI'll help you create your crypto wallet in just a few steps.\n\nFirst, what should I call you?`
  }

  /**
   * Process name input
   */
  async processName(phone: string, name: string): Promise<string> {
    const cleanName = name.trim()

    if (!cleanName || cleanName.length < 2) {
      return 'Please enter a valid name (at least 2 characters).'
    }

    // Update user
    await prisma.user.update({
      where: { phone },
      data: {
        name: cleanName,
        onboardingStep: OnboardingStep.AWAITING_PIN,
      },
    })

    // Update session
    await sessionService.updateSession(phone, {
      currentStep: OnboardingStep.AWAITING_PIN,
      context: { tempName: cleanName },
    })

    return `Nice to meet you, ${cleanName}! 👋\n\nNow, let's secure your wallet.\n\nCreate a 4-digit PIN. This PIN will protect your funds.\n\n⚠️ Important:\n• Don't use 0000, 1111, or 1234\n• Don't share it with anyone\n• You'll need it for every transaction\n\nEnter your 4-digit PIN:`
  }

  /**
   * Process PIN input
   */
  async processPin(phone: string, pin: string): Promise<string> {
    // Validate PIN
    if (!isValidPin(pin)) {
      return '❌ Invalid PIN!\n\nYour PIN must:\n• Be exactly 4 digits\n• Not be 0000, 1111, 2222, etc.\n• Not be 1234, 4321, etc.\n\nTry again:'
    }

    // Store temp PIN in session
    await sessionService.updateSession(phone, {
      currentStep: OnboardingStep.CONFIRMING_PIN,
      context: { tempPin: pin },
    })

    await prisma.user.update({
      where: { phone },
      data: { onboardingStep: OnboardingStep.CONFIRMING_PIN },
    })

    return '✅ Good PIN!\n\nPlease confirm by entering it again:'
  }

  /**
   * Confirm PIN
   */
  async confirmPin(phone: string, confirmPin: string): Promise<string> {
    const session = await sessionService.getSession(phone)
    const context = session?.context as any

    if (!context?.tempPin) {
      throw new ValidationError('PIN not found in session')
    }

    if (confirmPin !== context.tempPin) {
      return '❌ PINs do not match!\n\nPlease enter your PIN again to confirm:'
    }

    // Hash PIN
    const pinHash = await hashPin(confirmPin)

    // Update user with hashed PIN
    const user = await prisma.user.update({
      where: { phone },
      data: {
        pinHash,
        pinEnabled: true,
        onboardingStep: OnboardingStep.DISPLAYING_SEED,
      },
    })

    // Create wallets
    const walletResult = await walletService.createUserWallets(user.id, confirmPin)

    // Update session with mnemonic
    await sessionService.updateSession(phone, {
      currentStep: OnboardingStep.DISPLAYING_SEED,
      context: { mnemonic: walletResult.mnemonic },
    })

    return this.formatWalletCreationMessage(walletResult)
  }

  /**
   * Format wallet creation message
   */
  private formatWalletCreationMessage(result: WalletCreationResult): string {
    return `✅ Wallets Created Successfully!\n\n${formatChainName('solana')} SOLANA\nAddress: ${shortenAddress(result.svmWallet.address)}\nFull: ${result.svmWallet.address}\n\n${formatChainName('ethereum')} ETHEREUM (Also works on Base, BSC, 0G)\nAddress: ${shortenAddress(result.evmWallet.address)}\nFull: ${result.evmWallet.address}\n\n🔑 YOUR SEED PHRASE (SAVE THIS!):\n\n${result.mnemonic}\n\n⚠️ CRITICAL:\n• Write this down on paper\n• Store it safely offline\n• NEVER share it with anyone\n• We CANNOT recover it if lost\n• Anyone with this can access your funds\n\nType "SAVED" once you've securely saved your seed phrase.`
  }

  /**
   * Confirm seed phrase saved
   */
  async confirmSeedSaved(phone: string): Promise<string> {
    // Complete onboarding
    await prisma.user.update({
      where: { phone },
      data: {
        onboardingStatus: 'COMPLETED',
        onboardingStep: OnboardingStep.COMPLETED,
      },
    })

    // Create default settings
    const user = await prisma.user.findUnique({ where: { phone } })
    
    if (user) {
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          requirePinForSend: true,
          requirePinForSwap: true,
          notifyOnReceive: true,
          notifyOnSend: true,
          notifyOnConfirmation: true,
          preferredCurrency: 'USD',
          hideSmallBalances: false,
          language: 'en',
        },
      })
    }

    // Reset session
    await sessionService.resetSession(phone, user?.id)

    return `🎉 Your wallet is ready!\n\nYou can now:\n• Check your balance\n• Send crypto\n• Receive crypto\n• Swap tokens\n• View transaction history\n\nType "help" or "menu" to see all options!`
  }

  /**
   * Get onboarding progress
   */
  async getProgress(phone: string): Promise<{
    step: OnboardingStep
    completed: boolean
  }> {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        onboardingStatus: true,
        onboardingStep: true,
      },
    })

    if (!user) {
      return {
        step: OnboardingStep.AWAITING_NAME,
        completed: false,
      }
    }

    return {
      step: (user.onboardingStep as OnboardingStep) || OnboardingStep.AWAITING_NAME,
      completed: user.onboardingStatus === 'COMPLETED',
    }
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService()