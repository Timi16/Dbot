/**
 * AI Service - FIXED with proper context management
 */
import { Intent, type ParsedAIResponse, type GroqMessage } from '../types/index.js';
interface SessionContext {
    currentStep?: string;
    lastIntent?: string;
    chain?: string;
    fromToken?: string;
    toToken?: string;
    amount?: number;
    address?: string;
    lastViewedToken?: {
        symbol: string;
        name: string;
        chain: string;
        address: string;
    };
    [key: string]: any;
}
export declare class AIService {
    /**
     * ⭐ FIXED: Analyze message WITH full context
     */
    analyzeMessage(userMessage: string, context?: {
        userName?: string;
        previousIntent?: string;
        sessionContext?: SessionContext;
        conversationHistory?: GroqMessage[];
        lastViewedToken?: {
            symbol: string;
            name: string;
            chain: string;
            address: string;
        };
    }): Promise<ParsedAIResponse>;
    /**
     * ⭐ NEW: Build session context prompt to give AI memory
     */
    private buildSessionContextPrompt;
    /**
     * Parse AI response (expects JSON format)
     */
    private parseAIResponse;
    private detectIntentFromText;
    /**
     * Normalize intent string to Intent enum
     */
    private normalizeIntent;
    /**
     * Create unknown intent response
     */
    private createUnknownIntent;
    /**
     * ⭐ ENHANCED: Detect simple intent with session awareness
     */
    detectSimpleIntent(message: string, sessionContext?: SessionContext): Intent | null;
    /**
     * Generate contextual response based on error
     */
    generateErrorResponse(error: Error): string;
    /**
     * Extract amount from message
     */
    extractAmount(message: string): number | null;
    /**
     * Extract address from message
     */
    extractAddress(message: string): string | null;
}
export declare const aiService: AIService;
export {};
//# sourceMappingURL=ai.service.d.ts.map