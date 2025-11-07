/**
 * Onboarding Service - FIXED AND SIMPLIFIED
 * No more asking for name - we get it from WhatsApp
 * Clear PIN choice handling
 */
import { OnboardingStep } from '../types/index.js';
export declare class OnboardingService {
    /**
     * Start onboarding - DIRECTLY to PIN choice, no name asking
     */
    startOnboarding(phone: string, profileName?: string): Promise<string>;
    /**
     * Handle PIN choice (yes/no) - THIS IS THE CRITICAL PART
     */
    handlePinChoice(phone: string, choice: string): Promise<string>;
    /**
     * Process PIN input
     */
    processPin(phone: string, pin: string): Promise<string>;
    /**
     * Confirm PIN
     */
    confirmPin(phone: string, confirmPin: string): Promise<string>;
    /**
     * Create wallets WITHOUT PIN
     */
    createWalletsWithoutPin(phone: string): Promise<string>;
    /**
     * Format wallet creation message
     */
    private formatWalletCreationMessage;
    /**
     * Confirm seed saved
     */
    confirmSeedSaved(phone: string): Promise<string>;
    /**
     * Get onboarding progress
     */
    getProgress(phone: string): Promise<{
        step: OnboardingStep;
        completed: boolean;
    }>;
}
export declare const onboardingService: OnboardingService;
//# sourceMappingURL=onboarding.service.d.ts.map