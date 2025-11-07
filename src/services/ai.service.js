/**
 * AI Service - FIXED with proper context management
 */
import { groqClient, groqConfig, SYSTEM_PROMPTS } from '../config/index.js';
import { isCasualMessage } from '../controllers/index.js';
import { Intent, } from '../types/index.js';
import { sanitizeInput, isValidJson } from '../utils/index.js';
export class AIService {
    /**
     * ⭐ FIXED: Analyze message WITH full context
     */
    async analyzeMessage(userMessage, context) {
        const cleanMessage = sanitizeInput(userMessage);
        if (!cleanMessage) {
            return this.createUnknownIntent('Empty message');
        }
        try {
            // ⭐ Build enhanced system prompt with session context
            let systemPrompt = SYSTEM_PROMPTS.main;
            // ⭐ Add session context if user is in middle of a flow
            if (context?.sessionContext) {
                systemPrompt += this.buildSessionContextPrompt(context.sessionContext);
            }
            // Add token context if user just viewed a token
            if (context?.lastViewedToken) {
                systemPrompt += '\n\n' + SYSTEM_PROMPTS.withTokenContext(context.lastViewedToken.symbol, context.lastViewedToken.name, context.lastViewedToken.chain);
            }
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ];
            // Add conversation history if available
            if (context?.conversationHistory) {
                messages.push(...context.conversationHistory);
            }
            // Add current user message
            messages.push({
                role: 'user',
                content: cleanMessage,
            });
            console.log('🤖 Sending to AI:', {
                message: cleanMessage.substring(0, 50),
                hasTokenContext: !!context?.lastViewedToken,
                hasSessionContext: !!context?.sessionContext,
                currentStep: context?.sessionContext?.currentStep,
            });
            // Call Groq API with JSON mode
            const completion = await groqClient.chat.completions.create({
                model: groqConfig.model,
                messages,
                temperature: groqConfig.temperature,
                max_tokens: groqConfig.maxTokens,
                top_p: groqConfig.topP,
                response_format: { type: 'json_object' },
            });
            const responseContent = completion.choices[0]?.message?.content;
            if (!responseContent) {
                console.error('❌ No response content from Groq');
                return this.createUnknownIntent('No response from AI');
            }
            console.log('🤖 Raw AI Response:', responseContent.substring(0, 200));
            // Parse JSON response
            const parsed = this.parseAIResponse(responseContent);
            // Log what we detected
            console.log('✅ Detected:', {
                intent: parsed.intent,
                chain: parsed.entities.chain,
                hasAddress: !!parsed.entities.address,
                hasTokenAddress: !!parsed.entities.toTokenAddress,
            });
            return parsed;
        }
        catch (error) {
            console.error('❌ AI Service error:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
            }
            return this.createUnknownIntent('AI processing failed');
        }
    }
    /**
     * ⭐ NEW: Build session context prompt to give AI memory
     */
    buildSessionContextPrompt(sessionContext) {
        let contextPrompt = '\n\n=== CURRENT SESSION CONTEXT ===\n';
        // ⭐ Tell AI what step user is on
        if (sessionContext.currentStep) {
            contextPrompt += `User is currently in: ${sessionContext.currentStep}\n`;
            // ⭐ Provide specific guidance based on step
            const stepGuidance = {
                'SWAP_TOKENS_FROM': 'User is selecting which token to swap FROM. They may provide a token symbol or an amount (which means native token).',
                'SWAP_TOKENS_AMOUNT': `User is entering amount to swap. They have already selected: ${sessionContext.fromToken || 'token'}`,
                'SWAP_TOKENS_CONFIRM': 'User needs to confirm or cancel the swap. Look for "confirm", "yes", "cancel", "no".',
                'SEND_CRYPTO_ADDRESS': 'User is providing a recipient address for sending crypto.',
                'SEND_CRYPTO_AMOUNT': 'User is entering amount to send.',
                'SEND_CRYPTO_CONFIRM': 'User needs to confirm or cancel the send.',
            };
            if (stepGuidance[sessionContext.currentStep]) {
                contextPrompt += `Context: ${stepGuidance[sessionContext.currentStep]}\n`;
            }
        }
        // ⭐ Tell AI what data we already have
        if (sessionContext.chain) {
            contextPrompt += `Chain: ${sessionContext.chain}\n`;
        }
        if (sessionContext.fromToken) {
            contextPrompt += `From Token: ${sessionContext.fromToken}\n`;
        }
        if (sessionContext.toToken) {
            contextPrompt += `To Token: ${sessionContext.toToken}\n`;
        }
        if (sessionContext.amount) {
            contextPrompt += `Amount: ${sessionContext.amount}\n`;
        }
        if (sessionContext.address) {
            contextPrompt += `Address: ${sessionContext.address}\n`;
        }
        if (sessionContext.lastViewedToken) {
            contextPrompt += `Last Viewed Token: ${sessionContext.lastViewedToken.symbol} on ${sessionContext.lastViewedToken.chain}\n`;
        }
        contextPrompt += '=== END CONTEXT ===\n';
        contextPrompt += '\nIMPORTANT: Use this context to understand what the user is responding to. If they say "no" or "cancel", they want to abort the current action.\n';
        return contextPrompt;
    }
    /**
     * Parse AI response (expects JSON format)
     */
    parseAIResponse(content) {
        try {
            // Clean up the content
            let jsonContent = content.trim();
            // Remove markdown code blocks if present
            const codeBlockMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch?.[1]) {
                jsonContent = codeBlockMatch[1].trim();
            }
            // Remove any leading/trailing text and extract JSON object
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
            if (jsonMatch?.[0]) {
                jsonContent = jsonMatch[0];
            }
            // Validate it's proper JSON
            if (!isValidJson(jsonContent)) {
                console.error('❌ Invalid JSON:', jsonContent.substring(0, 100));
                throw new Error('Invalid JSON structure');
            }
            const parsed = JSON.parse(jsonContent);
            // Validate required fields
            if (!parsed.intent) {
                console.error('❌ Missing intent field in response');
                throw new Error('Missing intent field');
            }
            return {
                intent: this.normalizeIntent(parsed.intent),
                entities: parsed.entities || {},
                confidence: parsed.confidence || 0.5,
                response: parsed.response || '',
            };
        }
        catch (error) {
            console.error('❌ Failed to parse AI response:', error);
            console.error('Raw content:', content.substring(0, 200));
            // Fallback: try to detect intent from raw message
            const fallbackIntent = this.detectIntentFromText(content);
            return {
                intent: fallbackIntent,
                entities: {},
                confidence: 0.3,
                response: "I'm here to help! Type 'help' to see what I can do.",
            };
        }
    }
    detectIntentFromText(text) {
        const lower = text.toLowerCase();
        if (lower.includes('balance') || lower.includes('how much')) {
            return Intent.CHECK_BALANCE;
        }
        if (lower.includes('send') || lower.includes('transfer')) {
            return Intent.SEND_CRYPTO;
        }
        if (lower.includes('receive') || lower.includes('address')) {
            return Intent.VIEW_ADDRESS;
        }
        if (lower.includes('swap') || lower.includes('exchange')) {
            return Intent.SWAP_TOKENS;
        }
        if (lower.includes('history') || lower.includes('transaction')) {
            return Intent.TRANSACTION_HISTORY;
        }
        if (lower.includes('help') || lower.includes('menu')) {
            return Intent.HELP;
        }
        if (lower.includes('settings') || lower.includes('pin')) {
            return Intent.SETTINGS;
        }
        return Intent.UNKNOWN;
    }
    /**
     * Normalize intent string to Intent enum
     */
    normalizeIntent(intentStr) {
        if (typeof intentStr !== 'string') {
            return intentStr;
        }
        const normalized = intentStr.toLowerCase().replace(/[_-]/g, '_');
        // Map to Intent enum
        const intentMap = {
            create_wallet: Intent.CREATE_WALLET,
            check_balance: Intent.CHECK_BALANCE,
            send_crypto: Intent.SEND_CRYPTO,
            receive_crypto: Intent.RECEIVE_CRYPTO,
            swap_tokens: Intent.SWAP_TOKENS,
            transaction_history: Intent.TRANSACTION_HISTORY,
            view_address: Intent.VIEW_ADDRESS,
            settings: Intent.SETTINGS,
            change_pin: Intent.CHANGE_PIN,
            toggle_pin: Intent.TOGGLE_PIN,
            help: Intent.HELP,
            confirm: Intent.CONFIRM,
            cancel: Intent.CANCEL,
            unknown: Intent.UNKNOWN,
        };
        return intentMap[normalized] || Intent.UNKNOWN;
    }
    /**
     * Create unknown intent response
     */
    createUnknownIntent(reason) {
        console.log(`⚠️  Unknown intent: ${reason}`);
        return {
            intent: Intent.UNKNOWN,
            entities: {},
            confidence: 0,
            response: "I didn't quite understand that. Type 'help' to see what I can do!",
        };
    }
    /**
     * ⭐ ENHANCED: Detect simple intent with session awareness
     */
    detectSimpleIntent(message, sessionContext) {
        const lower = message.toLowerCase().trim();
        // Don't detect intents if it's a casual greeting
        if (isCasualMessage(message)) {
            return null;
        }
        // ⭐ Context-aware cancel detection
        if (sessionContext?.currentStep && sessionContext.currentStep !== 'IDLE') {
            const cancelKeywords = ['no', 'n', 'cancel', 'stop', 'abort', 'nevermind', 'back', "i'm not", "not interested"];
            if (cancelKeywords.some(kw => lower.includes(kw))) {
                return Intent.CANCEL;
            }
        }
        // ⭐ Context-aware confirm detection
        if (sessionContext?.currentStep && sessionContext.currentStep.includes('CONFIRM')) {
            const confirmKeywords = ['yes', 'y', 'confirm', 'ok', 'okay', 'sure', 'proceed', 'continue'];
            if (confirmKeywords.includes(lower)) {
                return Intent.CONFIRM;
            }
        }
        // Check for contract addresses with buy intent
        const hasBuyKeyword = /\b(buy|purchase|get|swap|trade)\b/.test(lower);
        const hasContractAddress = /\b(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})\b/.test(message);
        if (hasBuyKeyword && hasContractAddress) {
            return Intent.SWAP_TOKENS;
        }
        // Confirmation keywords (only if NOT in a flow)
        if (!sessionContext?.currentStep || sessionContext.currentStep === 'IDLE') {
            const confirmKeywords = ['yes', 'y', 'confirm', 'ok', 'okay', 'sure', 'proceed', 'continue', 'saved'];
            if (confirmKeywords.includes(lower)) {
                return Intent.CONFIRM;
            }
        }
        // Help keywords
        const helpKeywords = ['help', 'menu', 'commands', 'options'];
        if (helpKeywords.includes(lower)) {
            return Intent.HELP;
        }
        // Trading keywords (without addresses - just simple words)
        const buyKeywords = ['buy', 'purchase', 'get'];
        if (buyKeywords.includes(lower)) {
            return Intent.SWAP_TOKENS;
        }
        const swapKeywords = ['swap', 'trade', 'exchange'];
        if (swapKeywords.includes(lower)) {
            return Intent.SWAP_TOKENS;
        }
        return null;
    }
    /**
     * Generate contextual response based on error
     */
    generateErrorResponse(error) {
        const errorMessages = {
            INSUFFICIENT_BALANCE: "Oops! You don't have enough balance for this transaction.",
            INVALID_ADDRESS: 'That address looks invalid. Please double-check and try again.',
            INVALID_PIN: 'Incorrect PIN. Please try again.',
            PIN_LOCKED: 'Too many failed attempts. Your account is temporarily locked.',
            TRANSACTION_FAILED: 'Transaction failed. Please try again later.',
            RPC_ERROR: 'Network error. Please try again in a moment.',
        };
        for (const [key, message] of Object.entries(errorMessages)) {
            if (error.message.includes(key)) {
                return message;
            }
        }
        return 'Something went wrong. Please try again or type "help" for assistance.';
    }
    /**
     * Extract amount from message
     */
    extractAmount(message) {
        // Match patterns like: "send 0.5", "0.5 SOL", "transfer 100"
        const patterns = [
            /(\d+\.?\d*)\s*(?:sol|eth|bnb|0g)/i,
            /(?:send|transfer|swap)\s+(\d+\.?\d*)/i,
            /(\d+\.?\d*)\s+(?:to|for)/i,
        ];
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match?.[1]) {
                const amount = parseFloat(match[1]);
                if (!isNaN(amount) && amount > 0) {
                    return amount;
                }
            }
        }
        return null;
    }
    /**
     * Extract address from message
     */
    extractAddress(message) {
        // Match Solana addresses (base58, 32-44 chars)
        const solanaMatch = message.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/);
        if (solanaMatch?.[0]) {
            return solanaMatch[0];
        }
        // Match EVM addresses (0x + 40 hex chars)
        const evmMatch = message.match(/\b0x[a-fA-F0-9]{40}\b/);
        if (evmMatch?.[0]) {
            return evmMatch[0];
        }
        return null;
    }
}
// Export singleton instance
export const aiService = new AIService();
//# sourceMappingURL=ai.service.js.map