/**
 * Webhook Controller - Complete with Transaction Features
 * Handles incoming WhatsApp messages and routes to appropriate handlers
 */

import type { Request, Response } from 'express'
import { twilioService } from '../services/twilio.service.js'
import { aiService } from '../services/ai.service.js'
import { onboardingService } from '../services/onboarding.service.js'
import { sessionService } from '../services/session.service.js'
import { walletService } from '../services/wallet.service.js'
import { transactionService } from '../services/transaction.service.js'
import { prisma } from '../models/prisma.client.js'
import {
  extractPhoneNumber,
  formatWhatsAppNumber,
} from '../config/twilio.config.js'
import {
  OnboardingStep,
  MainStep,
  Intent,
  type TwilioWebhookPayload,
} from '../types/index.js'
import {
  sanitizeInput,
  getUserFriendlyErrorMessage,
} from '../utils/index.js'
import {
  getTokenDetails_DEXSCREENER,
  getTokenDetails_DEXTOOLS,
  getCustomTokenDataForEvmChainUsingUniSwapV30g,
} from '../services/token.service.js'
import type { TokenDetails } from '../types/token.types.js'

/**
 * Main webhook handler - receives all incoming messages
 */
export async function handleIncomingMessage(
  req: Request,
  res: Response
): Promise<void> {
  const startTime = Date.now()
  const payload = req.body as TwilioWebhookPayload

  // Extract data from webhook
  const whatsappNumber = payload.From
  const phone = extractPhoneNumber(whatsappNumber)
  const message = sanitizeInput(payload.Body)
  const profileName = payload.ProfileName || null
  const messageSid = payload.MessageSid

  console.log(`\n📨 Message received from ${phone}: "${message.substring(0, 50)}..."`)

  try {
    // Update user's last active timestamp
    await prisma.touchUser(phone).catch(() => {
      // User might not exist yet, ignore error
    })

    // Check if user exists and is onboarded
    const isOnboarded = await prisma.isUserOnboarded(phone)

    let responseMessage: string

    if (!isOnboarded) {
      // Route to onboarding flow
      responseMessage = await handleOnboardingFlow(phone, message, profileName || undefined)
    } else {
      // Route to main conversation flow
      responseMessage = await handleMainFlow(phone, message)
    }

    // Send response via Twilio
    await twilioService.sendMessage({
      to: phone,
      message: responseMessage,
    })

    // Log webhook for debugging
    const processingTime = Date.now() - startTime
    await prisma.logWebhook({
      phone,
      message,
      profileName,
      messageSid,
      responseStatus: 'success',
      responseMessage: responseMessage.substring(0, 200),
      processingTime,
      errorDetails: null,
    })

    console.log(`✅ Response sent to ${phone} (${processingTime}ms)`)

    // Respond to Twilio with 200 OK
    res.status(200).send('OK')
  } catch (error) {
    console.error('❌ Error handling webhook:', error)

    // Log error
    await prisma.logWebhook({
      phone,
      message,
      profileName,
      messageSid,
      responseStatus: 'error',
      responseMessage: null,
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime,
    })

    // Send user-friendly error message
    const errorMessage = getUserFriendlyErrorMessage(error as Error)
    await twilioService
      .sendMessage({ to: phone, message: errorMessage })
      .catch((sendError) => {
        console.error('Failed to send error message:', sendError)
      })

    // Still respond 200 to Twilio (prevent retries)
    res.status(200).send('OK')
  }
}

/**
 * Handle onboarding flow for new users
 */
async function handleOnboardingFlow(
  phone: string,
  message: string,
  profileName?: string
): Promise<string> {
  // Get current progress
  const progress = await onboardingService.getProgress(phone)

  // Check simple intents first (yes/no/cancel)
  const simpleIntent = aiService.detectSimpleIntent(message)

  switch (progress.step) {
    case OnboardingStep.AWAITING_NAME:
      // First message - start onboarding
      if (message.toLowerCase() === 'start' || message.toLowerCase() === 'hi' || !message) {
        return onboardingService.startOnboarding(phone, profileName)
      }
      // User provided name
      return onboardingService.processName(phone, message)

    case OnboardingStep.AWAITING_PIN:
      // User creating PIN
      return onboardingService.processPin(phone, message)

    case OnboardingStep.CONFIRMING_PIN:
      // User confirming PIN
      return onboardingService.confirmPin(phone, message)

    case OnboardingStep.DISPLAYING_SEED:
      // Waiting for user to confirm they saved seed
      if (simpleIntent === Intent.CONFIRM || message.toLowerCase() === 'saved') {
        return onboardingService.confirmSeedSaved(phone)
      }
      return 'Please type "SAVED" once you have securely written down your seed phrase.'

    case OnboardingStep.COMPLETED:
      // Should not reach here, but redirect to main flow
      return 'Your wallet is ready! Type "help" to see what you can do.'

    default:
      return onboardingService.startOnboarding(phone, profileName)
  }
}

/**
 * Handle main conversation flow for onboarded users
 */
async function handleMainFlow(phone: string, message: string): Promise<string> {
  try {
    // Get user
    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return 'User not found. Please start over by typing "start".'
    }

    // Get or create session
    const session = await sessionService.getOrCreateSession(
      phone,
      MainStep.IDLE,
      user.id
    )

    // Check simple intents first (for faster response)
    const simpleIntent = aiService.detectSimpleIntent(message)

    if (simpleIntent) {
      return handleSimpleIntent(simpleIntent, phone, user.id, session.currentStep)
    }

    // If in middle of a flow, handle step-by-step
    if (session.currentStep !== MainStep.IDLE) {
      return handleFlowStep(phone, user.id, message, session.currentStep, session.context)
    }

    // Use AI to understand intent
    console.log('🤖 Analyzing message with AI...')
    const aiResponse = await aiService.analyzeMessage(message, {
      userName: user.name || 'User',
      conversationHistory: [
        {
          role: 'system',
          content: `Context: User's name is ${user.name || 'not set'}. User's profile name is ${user.profileName || 'not set'}.`
        }
      ]
    })
    
    console.log(`✅ AI detected intent: ${aiResponse.intent} (confidence: ${aiResponse.confidence})`)

    // If AI couldn't determine intent well, use response directly
    if (aiResponse.confidence < 0.4 || aiResponse.intent === Intent.UNKNOWN) {
      return aiResponse.response || getHelpMessage()
    }

    // Route to appropriate handler based on intent (pass AI response for custom messages)
    return routeByIntent(aiResponse.intent, phone, user.id, aiResponse.entities, aiResponse.response)
  } catch (error) {
    console.error('❌ Error in main flow:', error)
    return "I'm having trouble processing that right now. Type 'help' to see what I can do!"
  }
}

/**
 * Handle simple intents (help, confirm, cancel)
 */
function handleSimpleIntent(
  intent: Intent,
  phone: string,
  userId: string,
  currentStep: string
): string {
  switch (intent) {
    case Intent.HELP:
      // For simple help keyword, show full help menu
      return getHelpMessage()

    case Intent.CONFIRM:
      // Handle based on current step
      return 'Please specify what you want to confirm.'

    case Intent.CANCEL:
      // Cancel current flow
      sessionService.resetSession(phone, userId)
      return '❌ Action cancelled. Type "help" to see available options.'

    default:
      return 'How can I help you? Type "help" to see options.'
  }
}

/**
 * Handle step-by-step flow navigation
 */
async function handleFlowStep(
  phone: string,
  userId: string,
  message: string,
  currentStep: string,
  context: any
): Promise<string> {
  try {
    switch (currentStep) {
      // Send crypto flow
      case MainStep.SEND_CRYPTO_CHAIN:
        return await handleSendChainStep(phone, userId, message, context)
      
      case MainStep.SEND_CRYPTO_ADDRESS:
        return await handleSendAddressStep(phone, userId, message, context)
      
      case MainStep.SEND_CRYPTO_AMOUNT:
        return await handleSendAmountStep(phone, userId, message, context)
      
      case MainStep.SEND_CRYPTO_CONFIRM:
        return await handleSendConfirmStep(phone, userId, message, context)
      
      case MainStep.SEND_CRYPTO_PIN:
        return await handleSendPinStep(phone, userId, message, context)

      // Swap flow
      case MainStep.SWAP_TOKENS_CHAIN:
        return await handleSwapChainStep(phone, userId, message, context)
      
      case MainStep.SWAP_TOKENS_FROM:
        return await handleSwapFromTokenStep(phone, userId, message, context)
      
      case MainStep.SWAP_TOKENS_TO:
        return await handleSwapToTokenStep(phone, userId, message, context)
      
      case MainStep.SWAP_TOKENS_AMOUNT:
        return await handleSwapAmountStep(phone, userId, message, context)
      
      case MainStep.SWAP_TOKENS_CONFIRM:
        return await handleSwapConfirmStep(phone, userId, message, context)
      
      case MainStep.SWAP_TOKENS_PIN:
        return await handleSwapPinStep(phone, userId, message, context)

      default:
        // Reset to idle if unknown step
        await sessionService.resetSession(phone, userId)
        return 'Something went wrong. Type "help" to see what I can do!'
    }
  } catch (error) {
    console.error('Error in flow step:', error)
    await sessionService.resetSession(phone, userId)
    return 'An error occurred. Please start over. Type "help" for options.'
  }
}

/**
 * Route by AI-detected intent
 */
async function routeByIntent(
  intent: Intent,
  phone: string,
  userId: string,
  entities: any,
  aiResponse?: string
): Promise<string> {
  try {
    switch (intent) {
      case Intent.CHECK_BALANCE:
        return handleCheckBalance(userId, entities.chain)

      case Intent.VIEW_ADDRESS:
        return handleViewAddress(userId, entities.chain)

      case Intent.SEND_CRYPTO:
        return handleSendCrypto(phone, userId, entities)

      case Intent.RECEIVE_CRYPTO:
        return handleReceiveCrypto(userId, entities.chain)

      case Intent.SWAP_TOKENS:
        return handleSwapTokens(phone, userId, entities)

      case Intent.TRANSACTION_HISTORY:
        return handleTransactionHistory(userId, entities.chain)

      case Intent.SETTINGS:
        return handleSettings(userId)

      case Intent.HELP:
        // Use AI's custom response if available, otherwise use default
        return aiResponse || getHelpMessage()

      default:
        return aiResponse || "I didn't quite understand that. Type 'help' to see what I can do!"
    }
  } catch (error) {
    console.error(`❌ Error routing intent ${intent}:`, error)
    return "Something went wrong. Type 'help' to see what I can do!"
  }
}

/**
 * Handle check balance intent
 */
async function handleCheckBalance(
  userId: string,
  chain?: string
): Promise<string> {
  try {
    if (chain) {
      // Get balance for specific chain
      const balance = await walletService.getWalletBalance(userId, chain as any)
      return `🟣 ${balance.chainName}\n\nAddress: ${balance.address}\n\nBalance: ${balance.nativeBalance.formatted} ${balance.nativeSymbol}`
    }

    // Get all balances
    const balances = await walletService.getAllBalances(userId)
    
    let response = '💰 Your Wallet Balances:\n\n'
    for (const bal of balances) {
      response += `${bal.chainKey === 'solana' ? '🟣' : '🔵'} ${bal.chainName}: ${bal.nativeBalance.formatted} ${bal.nativeSymbol}\n`
    }
    
    response += '\nType "send" to transfer funds or "swap" to exchange tokens.'
    
    return response
  } catch (error) {
    console.error('Error checking balance:', error)
    return 'Sorry, I could not fetch your balance right now. Please try again.'
  }
}

/**
 * Handle view address intent
 */
async function handleViewAddress(
  userId: string,
  chain?: string
): Promise<string> {
  try {
    if (chain) {
      const wallet = await walletService.getUserWallet(userId, chain as any)
      return `${chain === 'solana' ? '🟣' : '🔵'} ${wallet.chainKey.toUpperCase()} Address:\n\n${wallet.address}\n\nShare this address to receive crypto.`
    }

    const wallets = await walletService.getUserWallets(userId)
    let response = '📬 Your Wallet Addresses:\n\n'
    
    for (const wallet of wallets) {
      response += `${wallet.chain === 'SVM' ? '🟣' : '🔵'} ${wallet.chainKey.toUpperCase()}:\n${wallet.address}\n\n`
    }
    
    return response
  } catch (error) {
    console.error('Error viewing address:', error)
    return 'Sorry, I could not fetch your address right now. Please try again.'
  }
}

/**
 * Handle send crypto intent
 */
async function handleSendCrypto(
  phone: string,
  userId: string,
  entities: any
): Promise<string> {
  try {
    // If all required info is provided, execute immediately
    if (entities.chain && entities.address && entities.amount) {
      return await executeSendTransaction(userId, entities)
    }

    // Start send flow if partial info
    await sessionService.updateSession(phone, {
      currentStep: MainStep.SEND_CRYPTO_CHAIN,
      context: entities,
    })

    if (!entities.chain) {
      return 'Which chain would you like to send from?\n\n🟣 Solana\n🔵 Ethereum\n🔵 Base\n🟡 BSC\n⚫ 0G'
    }

    if (!entities.address) {
      return `Please provide the recipient's address on ${entities.chain}.`
    }

    if (!entities.amount) {
      return `How much would you like to send?`
    }

    return 'Please provide: chain, address, and amount to send.'
  } catch (error) {
    console.error('Error initiating send:', error)
    return 'Failed to initiate send. Please try again with: send [amount] [token] to [address] on [chain]'
  }
}

/**
 * Handle receive crypto intent
 */
async function handleReceiveCrypto(
  userId: string,
  chain?: string
): Promise<string> {
  return handleViewAddress(userId, chain)
}

/**
 * Handle swap tokens intent
 */
async function handleSwapTokens(
  phone: string,
  userId: string,
  entities: any
): Promise<string> {
  try {
    // If all required info is provided, execute immediately
    if (entities.chain && entities.fromToken && entities.toToken && entities.amount) {
      return await executeSwapTransaction(userId, entities)
    }

    // Start swap flow if partial info
    await sessionService.updateSession(phone, {
      currentStep: MainStep.SWAP_TOKENS_CHAIN,
      context: entities,
    })

    if (!entities.chain) {
      return 'Which chain would you like to swap on?\n\n🟣 Solana\n🔵 Ethereum\n🔵 Base\n🟡 BSC'
    }

    if (!entities.fromToken || !entities.toToken) {
      return `Which tokens would you like to swap? (e.g., "swap 1 SOL for USDC")`
    }

    if (!entities.amount) {
      return `How much ${entities.fromToken} would you like to swap?`
    }

    return 'Please provide: amount, from token, to token, and chain.'
  } catch (error) {
    console.error('Error initiating swap:', error)
    return 'Failed to initiate swap. Please try again with: swap [amount] [from token] for [to token] on [chain]'
  }
}

/**
 * Handle transaction history intent
 */
async function handleTransactionHistory(
  userId: string,
  chain?: string
): Promise<string> {
  try {
    const transactions = await transactionService.getTransactionHistory(userId, {
      chainKey: chain as any,
      limit: 10,
    })

    if (transactions.length === 0) {
      return "You don't have any transactions yet."
    }

    let response = '📜 Recent Transactions:\n\n'
    
    for (const tx of transactions.slice(0, 5)) {
      response += `${tx.type} - ${tx.amount} ${tx.tokenSymbol || tx.chainKey}\n`
      response += `Status: ${tx.status}\n`
      response += `${new Date(tx.createdAt).toLocaleDateString()}\n\n`
    }

    return response
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return 'Sorry, I could not fetch your transaction history right now.'
  }
}

/**
 * Handle settings intent
 */
async function handleSettings(userId: string): Promise<string> {
  return '⚙️ Settings:\n\n1. Change PIN\n2. Security settings\n3. Export seed phrase\n\nReply with a number to continue.'
}

// ==================== SEND FLOW HANDLERS ====================

/**
 * Handle chain selection for send
 */
async function handleSendChainStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const chain = message.toLowerCase().trim()
  const validChains = ['solana', 'ethereum', 'base', 'bsc', '0g']
  
  if (!validChains.includes(chain)) {
    return 'Please select a valid chain:\n\n🟣 Solana\n🔵 Ethereum\n🔵 Base\n🟡 BSC\n⚫ 0G'
  }

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SEND_CRYPTO_ADDRESS,
    context: { ...context, chain },
  })

  return `Great! What's the recipient's ${chain} address?`
}

/**
 * Handle address input for send
 */
async function handleSendAddressStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const address = message.trim()
  
  // Basic validation (detailed validation happens in transaction service)
  if (address.length < 20) {
    return 'That doesn\'t look like a valid address. Please provide a valid address.'
  }

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SEND_CRYPTO_AMOUNT,
    context: { ...context, address },
  })

  return 'How much would you like to send? (e.g., 0.5 or 1.5)'
}

/**
 * Handle amount input for send
 */
async function handleSendAmountStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const amount = parseFloat(message.trim())
  
  if (isNaN(amount) || amount <= 0) {
    return 'Please enter a valid amount (e.g., 0.5 or 1.5)'
  }

  const { chain, address, tokenAddress } = context
  const tokenSymbol = context.tokenSymbol || (chain === 'solana' ? 'SOL' : 'ETH')

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SEND_CRYPTO_CONFIRM,
    context: { ...context, amount },
  })

  return `📤 Send Summary:\n\n` +
    `Amount: ${amount} ${tokenSymbol}\n` +
    `To: ${address.substring(0, 10)}...${address.substring(address.length - 8)}\n` +
    `Chain: ${chain}\n\n` +
    `Reply "confirm" to proceed or "cancel" to abort.`
}

/**
 * Handle confirmation for send
 */
async function handleSendConfirmStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const response = message.toLowerCase().trim()
  
  if (response === 'cancel') {
    await sessionService.resetSession(phone, userId)
    return '❌ Transaction cancelled.'
  }
  
  if (response !== 'confirm' && response !== 'yes') {
    return 'Please reply "confirm" to proceed or "cancel" to abort.'
  }

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SEND_CRYPTO_PIN,
    context,
  })

  return '🔐 Please enter your PIN to authorize the transaction:'
}

/**
 * Handle PIN and execute send
 */
async function handleSendPinStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const pin = message.trim()
  
  try {
    // Execute transaction
    const result = await executeSendTransaction(userId, { ...context, pin })
    
    // Reset session
    await sessionService.resetSession(phone, userId)
    
    return result
  } catch (error) {
    console.error('Send transaction failed:', error)
    await sessionService.resetSession(phone, userId)
    return `❌ Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Execute send transaction
 */
async function executeSendTransaction(
  userId: string,
  params: {
    chain: string
    address: string
    amount: number
    tokenAddress?: string
    pin: string
    note?: string
  }
): Promise<string> {
  try {
    let transaction

    // Determine chain type (SVM or EVM)
    const chainType = params.chain === 'solana' ? 'SVM' : 'EVM'

    if (params.tokenAddress) {
      // Send token
      transaction = await transactionService.sendToken({
        userId,
        chain: chainType,
        chainKey: params.chain as any,
        toAddress: params.address,
        amount: params.amount,
        tokenAddress: params.tokenAddress,
        pin: params.pin,
        note: params.note,
      })
    } else {
      // Send native token
      transaction = await transactionService.sendNative({
        userId,
        chain: chainType,
        chainKey: params.chain as any,
        toAddress: params.address,
        amount: params.amount,
        pin: params.pin,
        note: params.note,
      })
    }

    return `✅ Transaction Sent!\n\n` +
      `Amount: ${transaction.amount} ${transaction.tokenSymbol}\n` +
      `To: ${transaction.toAddress?.substring(0, 10)}...${transaction.toAddress?.substring(transaction.toAddress.length - 8)}\n` +
      `Hash: ${transaction.hash.substring(0, 20)}...\n` +
      `Status: ${transaction.status}\n\n` +
      `Your transaction is being processed!`
  } catch (error) {
    throw error
  }
}

// ==================== SWAP FLOW HANDLERS ====================

/**
 * Handle chain selection for swap
 */
async function handleSwapChainStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const chain = message.toLowerCase().trim()
  const validChains = ['solana', 'ethereum', 'base', 'bsc']
  
  if (!validChains.includes(chain)) {
    return 'Please select a valid chain:\n\n🟣 Solana\n🔵 Ethereum\n🔵 Base\n🟡 BSC'
  }

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SWAP_TOKENS_FROM,
    context: { ...context, chain },
  })

  return `What token would you like to swap from? (e.g., SOL, USDC, ETH)`
}

/**
 * Handle from token selection
 */
async function handleSwapFromTokenStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const fromToken = message.trim().toUpperCase()

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SWAP_TOKENS_TO,
    context: { ...context, fromToken },
  })

  return `What token would you like to swap to? (e.g., USDC, SOL)`
}

/**
 * Handle to token selection
 */
async function handleSwapToTokenStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const toToken = message.trim().toUpperCase()

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SWAP_TOKENS_AMOUNT,
    context: { ...context, toToken },
  })

  return `How much ${context.fromToken} would you like to swap?`
}

/**
 * Handle amount for swap
 */
async function handleSwapAmountStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const amount = parseFloat(message.trim())
  
  if (isNaN(amount) || amount <= 0) {
    return 'Please enter a valid amount (e.g., 0.5 or 1.5)'
  }

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SWAP_TOKENS_CONFIRM,
    context: { ...context, amount },
  })

  return `🔄 Swap Summary:\n\n` +
    `Swap: ${amount} ${context.fromToken} → ${context.toToken}\n` +
    `Chain: ${context.chain}\n` +
    `Slippage: 1.5%\n\n` +
    `Reply "confirm" to proceed or "cancel" to abort.`
}

/**
 * Handle swap confirmation
 */
async function handleSwapConfirmStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const response = message.toLowerCase().trim()
  
  if (response === 'cancel') {
    await sessionService.resetSession(phone, userId)
    return '❌ Swap cancelled.'
  }
  
  if (response !== 'confirm' && response !== 'yes') {
    return 'Please reply "confirm" to proceed or "cancel" to abort.'
  }

  await sessionService.updateSession(phone, {
    currentStep: MainStep.SWAP_TOKENS_PIN,
    context,
  })

  return '🔐 Please enter your PIN to authorize the swap:'
}

/**
 * Handle PIN and execute swap
 */
async function handleSwapPinStep(
  phone: string,
  userId: string,
  message: string,
  context: any
): Promise<string> {
  const pin = message.trim()
  
  try {
    // Execute swap
    const result = await executeSwapTransaction(userId, { ...context, pin })
    
    // Reset session
    await sessionService.resetSession(phone, userId)
    
    return result
  } catch (error) {
    console.error('Swap transaction failed:', error)
    await sessionService.resetSession(phone, userId)
    return `❌ Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Execute swap transaction
 */
async function executeSwapTransaction(
  userId: string,
  params: {
    chain: string
    fromToken: string
    toToken: string
    amount: number
    pin: string
    slippage?: number
  }
): Promise<string> {
  try {
    // Determine chain type (SVM or EVM)
    const chainType = params.chain === 'solana' ? 'SVM' : 'EVM'

    // Note: Token addresses need to be resolved from symbols
    // This is a simplified version - you'd need a token registry
    const fromTokenInfo = {
      address: params.fromToken === 'SOL' ? 'native' : params.fromToken,
      symbol: params.fromToken,
      decimals: 9,
    }

    const toTokenInfo = {
      address: params.toToken,
      symbol: params.toToken,
      decimals: 9,
    }

    const transaction = await transactionService.swap({
      userId,
      chain: chainType,
      chainKey: params.chain as any,
      fromToken: fromTokenInfo as any,
      toToken: toTokenInfo as any,
      amount: params.amount,
      slippage: params.slippage || 150,
      pin: params.pin,
    })

    return `✅ Swap Complete!\n\n` +
      `Swapped: ${transaction.amount} ${params.fromToken} → ${params.toToken}\n` +
      `Hash: ${transaction.hash.substring(0, 20)}...\n` +
      `Status: ${transaction.status}\n\n` +
      `Your swap is being processed!`
  } catch (error) {
    throw error
  }
}

/**
 * Get help message
 */
function getHelpMessage(): string {
  return `🤖 Here's what I can do:\n\n💰 Check Balance - "balance" or "how much SOL do I have?"\n\n📤 Send Crypto - "send 0.5 SOL to [address]"\n\n📥 Receive - "show my address" or "receive"\n\n🔄 Swap - "swap ETH for USDC"\n\n📜 History - "show transactions"\n\n⚙️ Settings - "settings"\n\nJust chat naturally! I'll understand. 😊`
}

/**
 * Handle message status updates (optional)
 */
export async function handleMessageStatus(
  req: Request,
  res: Response
): Promise<void> {
  const { MessageSid, MessageStatus } = req.body

  console.log(`📊 Message ${MessageSid} status: ${MessageStatus}`)

  // You can track message delivery here if needed
  // For now, just acknowledge

  res.status(200).send('OK')
}