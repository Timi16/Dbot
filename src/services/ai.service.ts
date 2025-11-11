/**
 * AI Service - FIXED with proper context management
 */

import { groqClient, groqConfig, SYSTEM_PROMPTS } from '../config/index.js'
import { isCasualMessage } from '../controllers/index.js'
import {
    Intent,
    type AIResponse,
    type ParsedAIResponse,
    type GroqMessage,
} from '../types/index.js'
import { sanitizeInput, isValidJson } from '../utils/index.js'

interface SessionContext {
    currentStep?: string
    lastIntent?: string
    chain?: string
    fromToken?: string
    toToken?: string
    amount?: number
    address?: string
    lastViewedToken?: {
        symbol: string
        name: string
        chain: string
        address: string
    }
    [key: string]: any
}

export class AIService {
    /**
     * ⭐ FIXED: Analyze message WITH full context
     */
    async analyzeMessage(
        userMessage: string,
        context?: {
            userName?: string
            previousIntent?: string
            sessionContext?: SessionContext  // ⭐ NEW: Full session context
            conversationHistory?: GroqMessage[]
            lastViewedToken?: {
                symbol: string
                name: string
                chain: string
                address: string
            }
        }
    ): Promise<ParsedAIResponse> {
        const cleanMessage = sanitizeInput(userMessage)

        if (!cleanMessage) {
            return this.createUnknownIntent('Empty message')
        }

        try {
            // ⭐ Build enhanced system prompt with session context
            let systemPrompt = SYSTEM_PROMPTS.main

            // ⭐ Add session context if user is in middle of a flow
            if (context?.sessionContext) {
                systemPrompt += this.buildSessionContextPrompt(context.sessionContext)
            }

            // Add token context if user just viewed a token
            if (context?.lastViewedToken) {
                systemPrompt += '\n\n' + SYSTEM_PROMPTS.withTokenContext(
                    context.lastViewedToken.symbol,
                    context.lastViewedToken.name,
                    context.lastViewedToken.chain
                )
            }

            const messages: GroqMessage[] = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ]

            // Add conversation history if available
            if (context?.conversationHistory) {
                messages.push(...context.conversationHistory)
            }

            // Add current user message
            messages.push({
                role: 'user',
                content: cleanMessage,
            })

            console.log('🤖 Sending to AI:', {
                message: cleanMessage.substring(0, 50),
                hasTokenContext: !!context?.lastViewedToken,
                hasSessionContext: !!context?.sessionContext,
                currentStep: context?.sessionContext?.currentStep,
            })

            // Call Groq API with JSON mode
            const completion = await groqClient.chat.completions.create({
                model: groqConfig.model,
                messages,
                temperature: groqConfig.temperature,
                max_tokens: groqConfig.maxTokens,
                top_p: groqConfig.topP,
                response_format: { type: 'json_object' },
            })

            const responseContent = completion.choices[0]?.message?.content

            if (!responseContent) {
                console.error('❌ No response content from Groq')
                return this.createUnknownIntent('No response from AI')
            }

            console.log('🤖 Raw AI Response:', responseContent.substring(0, 200))

            // Parse JSON response
            const parsed = this.parseAIResponse(responseContent)

            // Log what we detected
            console.log('✅ Detected:', {
                intent: parsed.intent,
                chain: parsed.entities.chain,
                hasAddress: !!parsed.entities.address,
                hasTokenAddress: !!(parsed.entities as any).toTokenAddress,
            })

            return parsed
        } catch (error) {
            console.error('❌ AI Service error:', error)

            if (error instanceof Error) {
                console.error('Error details:', error.message)
            }

            return this.createUnknownIntent('AI processing failed')
        }
    }

    /**
     * ⭐ NEW: Build session context prompt to give AI memory
     */
    private buildSessionContextPrompt(sessionContext: SessionContext): string {
        let contextPrompt = '\n\n=== CURRENT SESSION CONTEXT ===\n'

        // ⭐ Tell AI what step user is on
        if (sessionContext.currentStep) {
            contextPrompt += `User is currently in: ${sessionContext.currentStep}\n`

            // ⭐ Provide specific guidance based on step
            const stepGuidance: Record<string, string> = {
                'SWAP_TOKENS_FROM': 'User is selecting which token to swap FROM. They may provide a token symbol or an amount (which means native token).',
                'SWAP_TOKENS_AMOUNT': `User is entering amount to swap. They have already selected: ${sessionContext.fromToken || 'token'}`,
                'SWAP_TOKENS_CONFIRM': 'User needs to confirm or cancel the swap. Look for "confirm", "yes", "cancel", "no".',
                'SEND_CRYPTO_ADDRESS': 'User is providing a recipient address for sending crypto.',
                'SEND_CRYPTO_AMOUNT': 'User is entering amount to send.',
                'SEND_CRYPTO_CONFIRM': 'User needs to confirm or cancel the send.',
            }

            if (stepGuidance[sessionContext.currentStep]) {
                contextPrompt += `Context: ${stepGuidance[sessionContext.currentStep]}\n`
            }
        }

        // ⭐ Tell AI what data we already have
        if (sessionContext.chain) {
            contextPrompt += `Chain: ${sessionContext.chain}\n`
        }
        if (sessionContext.fromToken) {
            contextPrompt += `From Token: ${sessionContext.fromToken}\n`
        }
        if (sessionContext.toToken) {
            contextPrompt += `To Token: ${sessionContext.toToken}\n`
        }
        if (sessionContext.amount) {
            contextPrompt += `Amount: ${sessionContext.amount}\n`
        }
        if (sessionContext.address) {
            contextPrompt += `Address: ${sessionContext.address}\n`
        }
        if (sessionContext.lastViewedToken) {
            contextPrompt += `Last Viewed Token: ${sessionContext.lastViewedToken.symbol} on ${sessionContext.lastViewedToken.chain}\n`
        }

        contextPrompt += '=== END CONTEXT ===\n'
        contextPrompt += '\nIMPORTANT: Use this context to understand what the user is responding to. If they say "no" or "cancel", they want to abort the current action.\n'

        return contextPrompt
    }

    /**
     * Parse AI response (expects JSON format)
     */
    private parseAIResponse(content: string): ParsedAIResponse {
        try {
            // Clean up the content
            let jsonContent = content.trim()

            // Remove markdown code blocks if present
            const codeBlockMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
            if (codeBlockMatch?.[1]) {
                jsonContent = codeBlockMatch[1].trim()
            }

            // Remove any leading/trailing text and extract JSON object
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
            if (jsonMatch?.[0]) {
                jsonContent = jsonMatch[0]
            }

            // Validate it's proper JSON
            if (!isValidJson(jsonContent)) {
                console.error('❌ Invalid JSON:', jsonContent.substring(0, 100))
                throw new Error('Invalid JSON structure')
            }

            const parsed = JSON.parse(jsonContent) as AIResponse

            // Validate required fields
            if (!parsed.intent) {
                console.error('❌ Missing intent field in response')
                throw new Error('Missing intent field')
            }

            return {
                intent: this.normalizeIntent(parsed.intent),
                entities: parsed.entities || {},
                confidence: parsed.confidence || 0.5,
                response: parsed.response || '',
            }
        } catch (error) {
            console.error('❌ Failed to parse AI response:', error)
            console.error('Raw content:', content.substring(0, 200))

            // Fallback: try to detect intent from raw message
            const fallbackIntent = this.detectIntentFromText(content)

            return {
                intent: fallbackIntent,
                entities: {},
                confidence: 0.3,
                response: "I'm here to help! Type 'help' to see what I can do.",
            }
        }
    }

    private detectIntentFromText(text: string): Intent {
        const lower = text.toLowerCase()

        if (lower.includes('balance') || lower.includes('how much')) {
            return Intent.CHECK_BALANCE
        }
        if (lower.includes('send') || lower.includes('transfer')) {
            return Intent.SEND_CRYPTO
        }
        if (lower.includes('receive') || lower.includes('address')) {
            return Intent.VIEW_ADDRESS
        }
        if (lower.includes('swap') || lower.includes('exchange')) {
            return Intent.SWAP_TOKENS
        }
        if (lower.includes('history') || lower.includes('transaction')) {
            return Intent.TRANSACTION_HISTORY
        }
        if (lower.includes('help') || lower.includes('menu')) {
            return Intent.HELP
        }
        if (lower.includes('settings') || lower.includes('pin')) {
            return Intent.SETTINGS
        }

        return Intent.UNKNOWN
    }

    /**
     * Normalize intent string to Intent enum
     */
    private normalizeIntent(intentStr: string | Intent): Intent {
        if (typeof intentStr !== 'string') {
            return intentStr
        }

        const normalized = intentStr.toLowerCase().replace(/[_-]/g, '_')

        // Map to Intent enum
        const intentMap: Record<string, Intent> = {
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
        }

        return intentMap[normalized] || Intent.UNKNOWN
    }

    /**
     * Create unknown intent response
     */
    private createUnknownIntent(reason: string): ParsedAIResponse {
        console.log(`⚠️  Unknown intent: ${reason}`)
        return {
            intent: Intent.UNKNOWN,
            entities: {},
            confidence: 0,
            response: "I didn't quite understand that. Type 'help' to see what I can do!",
        }
    }

    /**
     * ⭐ ENHANCED: Detect simple intent with session awareness
     */
    detectSimpleIntent(message: string, sessionContext?: SessionContext): Intent | null {
        const lower = message.toLowerCase().trim()

        // Don't detect intents if it's a casual greeting
        if (isCasualMessage(message)) {
            return null
        }

        // ⭐ Setup intent
        const setupKeywords = ['setup', 'start', 'begin', 'create', 'get started', 'lets go']
        if (setupKeywords.some(kw => lower.includes(kw))) {
            return Intent.SETUP
        }

        // ⭐ Context-aware cancel
        if (sessionContext?.currentStep && sessionContext.currentStep !== 'IDLE') {
            const cancelKeywords = ['no', 'n', 'cancel', 'stop', 'abort', 'nevermind', 'back']
            if (cancelKeywords.some(kw => lower === kw || lower.startsWith(kw + ' '))) {
                return Intent.CANCEL
            }
        }

        // ⭐ Context-aware confirm
        if (sessionContext?.currentStep && sessionContext.currentStep.includes('CONFIRM')) {
            const confirmKeywords = ['yes', 'y', 'confirm', 'ok', 'okay', 'sure', 'proceed', 'continue', 'go']
            if (confirmKeywords.includes(lower)) {
                return Intent.CONFIRM
            }
        }

        // ⭐ FIXED: Better send/withdraw detection
        const sendPatterns = [
            /^send/i,
            /^transfer/i,
            /^pay/i,
            /^withdraw/i,
            /cash out/i,
            /send .* to/i,
            /transfer .* to/i,
        ]
        if (sendPatterns.some(pattern => pattern.test(lower))) {
            return Intent.SEND_CRYPTO
        }

        // ⭐ FIXED: Better swap detection
        const swapPatterns = [
            /^swap/i,
            /^trade/i,
            /^exchange/i,
            /^buy/i,
            /^purchase/i,
            /swap .* for/i,
            /trade .* for/i,
            /buy .*sol/i,
            /buy .*eth/i,
            /buy .*usdc/i,
        ]
        if (swapPatterns.some(pattern => pattern.test(lower))) {
            return Intent.SWAP_TOKENS
        }

        // ⭐ Balance check
        const balanceKeywords = ['balance', 'how much', 'check', 'wallet', 'funds']
        if (balanceKeywords.some(kw => lower.includes(kw))) {
            return Intent.CHECK_BALANCE
        }

        // ⭐ Address/receive
        const addressKeywords = ['address', 'receive', 'deposit', 'fund', 'my wallet']
        if (addressKeywords.some(kw => lower.includes(kw))) {
            return Intent.VIEW_ADDRESS
        }

        // ⭐ Help
        if (lower === 'help' || lower === 'menu' || lower === 'commands' || lower === 'what can you do') {
            return Intent.HELP
        }

        // ⭐ History
        if (lower.includes('history') || lower.includes('transactions') || lower === 'txs') {
            return Intent.TRANSACTION_HISTORY
        }

        return null
    }

    /**
     * Generate contextual response based on error
     */
    generateErrorResponse(error: Error): string {
        const errorMessages: Record<string, string> = {
            INSUFFICIENT_BALANCE: "Oops! You don't have enough balance for this transaction.",
            INVALID_ADDRESS: 'That address looks invalid. Please double-check and try again.',
            INVALID_PIN: 'Incorrect PIN. Please try again.',
            PIN_LOCKED: 'Too many failed attempts. Your account is temporarily locked.',
            TRANSACTION_FAILED: 'Transaction failed. Please try again later.',
            RPC_ERROR: 'Network error. Please try again in a moment.',
        }

        for (const [key, message] of Object.entries(errorMessages)) {
            if (error.message.includes(key)) {
                return message
            }
        }

        return 'Something went wrong. Please try again or type "help" for assistance.'
    }

    /**
     * Extract amount from message
     */
    extractAmount(message: string): number | null {
        // Match patterns like: "send 0.5", "0.5 SOL", "transfer 100"
        const patterns = [
            /(\d+\.?\d*)\s*(?:sol|eth|bnb|0g)/i,
            /(?:send|transfer|swap)\s+(\d+\.?\d*)/i,
            /(\d+\.?\d*)\s+(?:to|for)/i,
        ]

        for (const pattern of patterns) {
            const match = message.match(pattern)
            if (match?.[1]) {
                const amount = parseFloat(match[1])
                if (!isNaN(amount) && amount > 0) {
                    return amount
                }
            }
        }

        return null
    }

    /**
     * Extract address from message
     */
    extractAddress(message: string): string | null {
        // Match Solana addresses (base58, 32-44 chars)
        const solanaMatch = message.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/)
        if (solanaMatch?.[0]) {
            return solanaMatch[0]
        }

        // Match EVM addresses (0x + 40 hex chars)
        const evmMatch = message.match(/\b0x[a-fA-F0-9]{40}\b/)
        if (evmMatch?.[0]) {
            return evmMatch[0]
        }

        // Match phone numbers for naira transfers (optional future feature)
        const phoneMatch = message.match(/\b(\+?\d{10,15})\b/)
        if (phoneMatch?.[0]) {
            return phoneMatch[0]
        }

        return null
    }

    /**
 * ✅ FIXED: extractTokens method with proper null checks
 * Replace your current extractTokens method with this
 */

    extractTokens(message: string): { from?: string; to?: string } {
        const lower = message.toLowerCase()

        // Common tokens
        const tokens = ['sol', 'eth', 'bnb', 'usdc', 'usdt', '0g', 'matic', 'dai']

        // Try to find "X for Y" or "X to Y" pattern
        const swapMatch = lower.match(/(?:swap|trade|exchange)\s+(\w+)\s+(?:for|to)\s+(\w+)/i)

        // ✅ FIX: Check if both swapMatch[1] and swapMatch[2] exist
        if (swapMatch && swapMatch[1] && swapMatch[2]) {
            return {
                from: swapMatch[1].toUpperCase(),
                to: swapMatch[2].toUpperCase()
            }
        }

        // Try to find "buy X" pattern
        const buyMatch = lower.match(/(?:buy|purchase|get)\s+(?:\d+\s+)?(\w+)/i)

        // ✅ FIX: Check if buyMatch[1] exists
        if (buyMatch && buyMatch[1]) {
            const token = buyMatch[1].toUpperCase()
            if (tokens.includes(token.toLowerCase())) {
                return { to: token }
            }
        }

        // Look for any mentioned tokens
        const mentioned = tokens.filter(t => lower.includes(t))

        // ✅ FIX: Check if mentioned[0] and mentioned[1] exist
        if (mentioned.length >= 2) {
            const from = mentioned[0]
            const to = mentioned[1]

            // Extra safety: verify both exist before using
            if (from && to) {
                return {
                    from: from.toUpperCase(),
                    to: to.toUpperCase()
                }
            }
        } else if (mentioned.length === 1) {
            const token = mentioned[0]

            // ✅ FIX: Check if mentioned[0] exists
            if (token) {
                return { to: token.toUpperCase() }
            }
        }

        return {}
    }
    extractChain(message: string): string | null {
        const lower = message.toLowerCase()

        // Solana aliases
        if (/\b(sol|solana)\b/i.test(lower)) return 'solana'

        // Ethereum aliases
        if (/\b(eth|ethereum)\b/i.test(lower)) return 'ethereum'

        // BSC aliases
        if (/\b(bnb|bsc|binance)\b/i.test(lower)) return 'bsc'

        // Base
        if (/\bbase\b/i.test(lower)) return 'base'

        // 0G
        if (/\b0g\b/i.test(lower)) return '0g'

        return null
    }

    preprocessMessage(message: string): {
        intent: Intent | null
        chain: string | null
        amount: number | null
        address: string | null
        tokens: { from?: string, to?: string }
    } {
        return {
            intent: this.detectSimpleIntent(message),
            chain: this.extractChain(message),
            amount: this.extractAmount(message),
            address: this.extractAddress(message),
            tokens: this.extractTokens(message)
        }
    }


}

// Export singleton instance
export const aiService = new AIService()