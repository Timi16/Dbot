/**
 * Onboarding Service - FIXED AND SIMPLIFIED
 * No more asking for name - we get it from WhatsApp
 * Clear PIN choice handling
 */

import { prisma } from '../models/prisma.client.js'
import { walletService } from './wallet.service.js'
import { sessionService } from './session.service.js'
import {
    hashPin,
    isValidPin,
    ValidationError,
} from '../utils/index.js'
import { OnboardingStep } from '../types/index.js'
import type { WalletCreationResult } from '../types/index.js'
import { twilioService } from './twilio.service.js'

export class OnboardingService {
    /**
     * Start onboarding - DIRECTLY to PIN choice, no name asking
     */
    async startOnboarding(phone: string, profileName?: string): Promise<string> {
        // Don't check for existing user - that's handled in webhook now

        // Use WhatsApp profile name directly
        const userName = profileName || 'there'

        let greeting = `Hey ${userName}! 👋\n\n`
        greeting += `Welcome to your crypto wallet bot! 🚀\n\n`
        greeting += `Let me set up your wallet real quick.\n\n`
        greeting += `*Want to add a PIN for extra security?*\n\n`
        greeting += `📌 A PIN protects your transactions\n`
        greeting += `⚡ But it's totally optional\n\n`
        greeting += `Reply:\n`
        greeting += `• *"yes"* - Set up PIN (recommended)\n`
        greeting += `• *"no"* - Skip and continue\n\n`
        greeting += `What's it gonna be?`

        const user = await prisma.user.upsert({
            where: { phone },
            update: {
                onboardingStatus: 'IN_PROGRESS',
                onboardingStep: OnboardingStep.AWAITING_PIN_CHOICE,
                name: profileName || undefined,
                profileName: profileName || undefined,
            },
            create: {
                phone,
                name: profileName || null,
                profileName: profileName || null,
                onboardingStatus: 'IN_PROGRESS',
                onboardingStep: OnboardingStep.AWAITING_PIN_CHOICE,
            }
        })

        await sessionService.createSession({
            phone,
            userId: user.id,
            currentStep: OnboardingStep.AWAITING_PIN_CHOICE,
            context: {},
        })

        return greeting
    }
    /**
     * Handle PIN choice (yes/no) - THIS IS THE CRITICAL PART
     */
    async handlePinChoice(phone: string, choice: string): Promise<string> {
        const normalizedChoice = choice.toLowerCase().trim()

        // YES - wants PIN
        if (normalizedChoice === 'yes' || normalizedChoice === 'y') {
            await sessionService.updateSession(phone, {
                currentStep: OnboardingStep.AWAITING_PIN,
                context: { wantsPin: true },
            })

            await prisma.user.upsert({
                where: { phone },
                update: { onboardingStep: OnboardingStep.AWAITING_PIN },
                create: {
                    phone,
                    onboardingStatus: 'IN_PROGRESS',
                    onboardingStep: OnboardingStep.AWAITING_PIN,
                }
            })

            return `Great! 💪\n\n` +
                `*Create a 4-digit PIN*\n\n` +
                `⚠️ Avoid: 1234, 0000, 1111, etc.\n` +
                `✅ Make it memorable but secure\n\n` +
                `*Enter your 4-digit PIN:*`
        }
        // NO - skip PIN
        else if (normalizedChoice === 'no' || normalizedChoice === 'n' || normalizedChoice === 'skip') {
            return await this.createWalletsWithoutPin(phone)
        }
        // Invalid response
        else {
            return `Didn't catch that! 🤔\n\n` +
                `Reply with:\n` +
                `• *"yes"* - Set up PIN\n` +
                `• *"no"* - Skip PIN`
        }
    }

    /**
     * Process PIN input
     */
    async processPin(phone: string, pin: string): Promise<string> {
        if (!isValidPin(pin)) {
            return `❌ That PIN won't work!\n\n` +
                `Must be:\n` +
                `✅ Exactly 4 digits\n` +
                `✅ Not 0000, 1111, 2222, etc.\n` +
                `✅ Not 1234 or sequential\n\n` +
                `*Try again:*`
        }

        await sessionService.updateSession(phone, {
            currentStep: OnboardingStep.CONFIRMING_PIN,
            context: { tempPin: pin, wantsPin: true },
        })

        await prisma.user.upsert({
            where: { phone },
            update: { onboardingStep: OnboardingStep.CONFIRMING_PIN },
            create: {
                phone,
                onboardingStatus: 'IN_PROGRESS',
                onboardingStep: OnboardingStep.CONFIRMING_PIN,
            }
        })

        return `✅ Good PIN! 💪\n\n*Confirm it - enter again:*`
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
            return `❌ PINs don't match! 🙈\n\n*Enter your PIN again to confirm:*`
        }

        const pinHash = await hashPin(confirmPin)

        const user = await prisma.user.upsert({
            where: { phone },
            update: {
                pinHash,
                pinEnabled: true,
                onboardingStep: OnboardingStep.DISPLAYING_SEED,
            },
            create: {
                phone,
                pinHash,
                pinEnabled: true,
                onboardingStatus: 'IN_PROGRESS',
                onboardingStep: OnboardingStep.DISPLAYING_SEED,
            }
        })

        await twilioService.sendMessage({
            to: phone,
            message: `✅ PIN set!\n\n⏳ Creating wallets...`
        })

        const walletResult = await walletService.createUserWallets(user.id, confirmPin)

        await sessionService.updateSession(phone, {
            currentStep: OnboardingStep.DISPLAYING_SEED,
            context: { mnemonic: walletResult.mnemonic },
        })

        return this.formatWalletCreationMessage(walletResult)
    }

    /**
     * Create wallets WITHOUT PIN
     */
    async createWalletsWithoutPin(phone: string): Promise<string> {
        const user = await prisma.user.upsert({
            where: { phone },
            update: {
                pinEnabled: false,
                onboardingStep: OnboardingStep.DISPLAYING_SEED,
            },
            create: {
                phone,
                pinEnabled: false,
                onboardingStatus: 'IN_PROGRESS',
                onboardingStep: OnboardingStep.DISPLAYING_SEED,
            }
        })

        await twilioService.sendMessage({
            to: phone,
            message: `⏳ Creating your wallets...`
        })

        const walletResult = await walletService.createUserWallets(user.id)

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
        return `🎉 *Wallets Ready!*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🟣 *SOLANA*\n` +
            `${result.svmWallet.address}\n\n` +
            `🔵 *ETHEREUM*\n` +
            `(Works on Base, BSC, 0G too)\n` +
            `${result.evmWallet.address}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🔑 *RECOVERY PHRASE*\n` +
            `⚠️ *SAVE THIS NOW!* ⚠️\n\n` +
            `${result.mnemonic}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🚨 *IMPORTANT* 🚨\n\n` +
            `1️⃣ Write these words on PAPER\n` +
            `2️⃣ Store somewhere SAFE\n` +
            `3️⃣ NEVER share with ANYONE\n` +
            `4️⃣ We can't recover it if lost\n` +
            `5️⃣ Anyone with these can steal your funds\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*Type "SAVED" when you've written it down*`
    }

    /**
     * Confirm seed saved
     */
    async confirmSeedSaved(phone: string): Promise<string> {
        const user = await prisma.user.upsert({
            where: { phone },
            update: {
                onboardingStatus: 'COMPLETED',
                onboardingStep: OnboardingStep.COMPLETED,
            },
            create: {
                phone,
                onboardingStatus: 'COMPLETED',
                onboardingStep: OnboardingStep.COMPLETED,
            }
        })

        const existingSettings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        })

        if (!existingSettings) {
            await prisma.userSettings.create({
                data: {
                    userId: user.id,
                    requirePinForSend: user.pinEnabled,
                    requirePinForSwap: user.pinEnabled,
                    notifyOnReceive: true,
                    notifyOnSend: true,
                    notifyOnConfirmation: true,
                    preferredCurrency: 'USD',
                    hideSmallBalances: false,
                    language: 'en',
                },
            })
        }

        await sessionService.resetSession(phone, user.id)

        return `🎉 *You're All Set!* 🚀\n\n` +
            `Your wallet is LIVE!\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*Quick Commands:*\n\n` +
            `💰 "balance" - Check balances\n` +
            `📤 "send 0.5 SOL to [address]"\n` +
            `📥 "my address" - Get deposit address\n` +
            `📜 "transactions" - View history\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `💡 Just chat naturally - I understand!\n\n` +
            `Type *"help"* for all commands.\n\n` +
            `Let's go! 💪`
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
                step: OnboardingStep.AWAITING_PIN_CHOICE,
                completed: false,
            }
        }

        return {
            step: (user.onboardingStep as OnboardingStep) || OnboardingStep.AWAITING_PIN_CHOICE,
            completed: user.onboardingStatus === 'COMPLETED',
        }
    }
}

export const onboardingService = new OnboardingService()