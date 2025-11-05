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
import { twilioService } from './twilio.service.js'

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
            // ⭐ FRIENDLY WELCOME BACK
            return `Hey there! 👋\n\nWelcome back! Your wallet is all set up.\n\nType *"help"* to see what you can do!`
        }

        // ⭐ CHANGED: Better welcome message with personality
        let greeting = `Hey! 👋\n\n`

        if (profileName) {
            greeting += `Nice to meet you, ${profileName}! `
        }

        greeting += `Welcome to your personal crypto wallet bot! 🚀\n\n`
        greeting += `I'll help you set up a secure wallet in just *3 easy steps*:\n\n`
        greeting += `1️⃣ Tell me your name\n`
        greeting += `2️⃣ Create a secure PIN\n`
        greeting += `3️⃣ Get your wallet addresses\n\n`
        greeting += `It'll take less than 2 minutes. Ready? Let's go! 💪\n\n`
        greeting += `*What should I call you?* (Your first name is fine)`

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

        return greeting
    }


    /**
     * Process name input
     */
    async processName(phone: string, name: string): Promise<string> {
        const cleanName = name.trim()

        // ⭐ BETTER VALIDATION
        if (!cleanName || cleanName.length < 2) {
            return `Hmm, that name seems a bit short! 🤔\n\nPlease enter at least 2 characters.\n\nWhat should I call you?`
        }

        if (cleanName.length > 30) {
            return `That's quite a long name! 😅\n\nPlease keep it under 30 characters.\n\nWhat should I call you?`
        }

        // Check for invalid characters
        if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
            return `Please use only letters and spaces in your name.\n\nWhat should I call you?`
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

        // ⭐ BETTER PIN INSTRUCTION WITH PERSONALITY
        return `Awesome, ${cleanName}! 👋 Nice to meet you!\n\n` +
            `Now let's lock down your wallet with a secure PIN 🔐\n\n` +
            `*Create a 4-digit PIN*\n\n` +
            `⚠️ *Important Security Tips:*\n` +
            `• Avoid obvious PINs (1234, 0000, 1111)\n` +
            `• Don't use your birthday or phone number\n` +
            `• You'll need this PIN for every transaction\n` +
            `• Keep it private - never share it!\n\n` +
            `*Enter your 4-digit PIN:*`
    }

    /**
     * Process PIN input
     */
    async processPin(phone: string, pin: string): Promise<string> {
        // Validate PIN
        if (!isValidPin(pin)) {
            return `❌ *That PIN won't work!*\n\n` +
                `Your PIN must:\n` +
                `✅ Be exactly 4 digits\n` +
                `✅ Not be 0000, 1111, 2222, etc.\n` +
                `✅ Not be 1234 or sequential numbers\n\n` +
                `*Try a different PIN:*`
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

        // ⭐ ENCOURAGING FEEDBACK
        return `✅ *Strong PIN!* Nice choice! 💪\n\n` +
            `Just to make sure you've got it...\n\n` +
            `*Enter your PIN again to confirm:*`
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
            // ⭐ FRIENDLY ERROR MESSAGE
            return `❌ *Oops! PINs don't match!* 🙈\n\n` +
                `No worries, it happens!\n\n` +
                `*Enter your PIN again to confirm:*`
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

        // ⭐ SHOW PROGRESS
        await twilioService.sendMessage({
            to: phone,
            message: `✅ *PIN Confirmed!*\n\n⏳ Creating your wallets...\n\nThis will take just a moment...`
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
        return `🎉 *Success! Your Wallets Are Ready!*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🟣 *SOLANA WALLET*\n` +
            `${result.svmWallet.address}\n\n` +
            `🔵 *ETHEREUM WALLET*\n` +
            `(Also works on Base, BSC, 0G)\n` +
            `${result.evmWallet.address}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🔑 *YOUR RECOVERY PHRASE*\n` +
            `⚠️ *SAVE THIS IMMEDIATELY!* ⚠️\n\n` +
            `${result.mnemonic}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🚨 *CRITICAL - READ THIS!* 🚨\n\n` +
            `1️⃣ Write these 12 words on PAPER\n` +
            `2️⃣ Store it somewhere SAFE (not on your phone!)\n` +
            `3️⃣ NEVER share it with ANYONE (not even me!)\n` +
            `4️⃣ We CANNOT recover it if you lose it\n` +
            `5️⃣ Anyone with these words can STEAL YOUR FUNDS\n\n` +
            `Think of it like a master key to your bank vault. Guard it with your life! 🔐\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*Type "SAVED" when you've safely written it down*`
    }

    /**
     * Confirm seed saved - BETTER FINAL MESSAGE
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

        // ⭐ CELEBRATORY FINAL MESSAGE
        return `🎉 *BOOM! You're All Set!* 🚀\n\n` +
            `Your crypto wallet is now LIVE and ready to use!\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*What You Can Do Now:*\n\n` +
            `💰 Check Balance - "balance" or "how much SOL?"\n` +
            `📤 Send Crypto - "send 0.5 SOL to [address]"\n` +
            `📥 Receive - "show my address"\n` +
            `🔄 Swap Tokens - "swap ETH for USDC"\n` +
            `🪙 Check Tokens - Just paste any contract address!\n` +
            `📜 View History - "show transactions"\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `💡 *Pro Tip:* Just chat naturally! I understand regular language.\n\n` +
            `Type *"help"* anytime to see all commands.\n\n` +
            `Let's make some moves! 💪`
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