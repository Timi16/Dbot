import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.config.js'

/**
 * Prisma Client Singleton
 * 
 * Best practices:
 * - Single instance across the application
 * - Proper connection pooling
 * - Graceful shutdown handling
 * - Development query logging
 * - Production error logging
 */

// Extend PrismaClient with custom methods if needed
class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      errorFormat: 'pretty',
    })
  }

  /**
   * Custom method: Clean up expired sessions
   * Run this periodically (e.g., via cron job)
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await this.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    return result.count
  }

  /**
   * Custom method: Get user with all relations
   */
  async getUserComplete(phone: string) {
    return this.user.findUnique({
      where: { phone },
      include: {
        wallets: true,
        settings: true,
        sessions: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 transactions
        },
      },
    })
  }

  /**
   * Custom method: Check if user exists and is onboarded
   */
  async isUserOnboarded(phone: string): Promise<boolean> {
    const user = await this.user.findUnique({
      where: { phone },
      select: { onboardingStatus: true },
    })
    return user?.onboardingStatus === 'COMPLETED'
  }

  /**
   * 🔥 FIXED: Update user's last active timestamp
   * Now uses UPSERT to handle new users automatically
   */
  async touchUser(phone: string, profileName?: string | null): Promise<void> {
    await this.user.upsert({
      where: { phone },
      update: { 
        lastActive: new Date(),
        updatedAt: new Date()
      },
      create: {
        phone,
        profileName: profileName || null,
        name: profileName || null,
        lastActive: new Date(),
        // No onboardingStatus or onboardingStep - let defaults handle it
      }
    })
  }

  /**
   * Custom method: Increment failed PIN attempts
   */
  async incrementFailedPinAttempts(userId: string): Promise<number> {
    const user = await this.user.update({
      where: { id: userId },
      data: {
        failedPinAttempts: { increment: 1 },
      },
      select: { failedPinAttempts: true },
    })
    
    // Lock account after 3 failed attempts (5 minutes)
    if (user.failedPinAttempts >= 3) {
      const lockUntil = new Date()
      lockUntil.setMinutes(lockUntil.getMinutes() + 5)
      
      await this.user.update({
        where: { id: userId },
        data: { pinLockedUntil: lockUntil },
      })
    }
    
    return user.failedPinAttempts
  }

  /**
   * Custom method: Reset failed PIN attempts
   */
  async resetFailedPinAttempts(userId: string): Promise<void> {
    await this.user.update({
      where: { id: userId },
      data: {
        failedPinAttempts: 0,
        pinLockedUntil: null,
      },
    })
  }

  /**
   * Custom method: Check if user's PIN is locked
   */
  async isPinLocked(userId: string): Promise<boolean> {
    const user = await this.user.findUnique({
      where: { id: userId },
      select: { pinLockedUntil: true },
    })
    
    if (!user?.pinLockedUntil) return false
    
    // Check if lock has expired
    if (user.pinLockedUntil < new Date()) {
      // Auto-unlock
      await this.resetFailedPinAttempts(userId)
      return false
    }
    
    return true
  }

  /**
   * Custom method: Log webhook for debugging
   */
  async logWebhook(data: {
    phone: string
    message: string
    profileName?: string | null
    messageSid: string
    responseStatus?: string | null
    responseMessage?: string | null
    errorDetails?: string | null
    processingTime?: number | null
  }): Promise<void> {
    await this.webhookLog.create({
      data: {
        phone: data.phone,
        message: data.message,
        profileName: data.profileName ?? null,
        messageSid: data.messageSid,
        responseStatus: data.responseStatus ?? null,
        responseMessage: data.responseMessage ?? null,
        errorDetails: data.errorDetails ?? null,
        processingTime: data.processingTime ?? null,
      },
    })
  }

  /**
   * Custom method: Get user's wallet for specific chain
   */
  async getUserWallet(userId: string, chain: 'SVM' | 'EVM') {
    return this.wallet.findUnique({
      where: {
        userId_chain: {
          userId,
          chain,
        },
      },
    })
  }

  /**
   * Custom method: Create transaction record
   */
  async createTransaction(data: {
    userId: string
    chain: 'SVM' | 'EVM'
    chainKey: string
    type: 'SEND' | 'RECEIVE' | 'SWAP'
    fromAddress: string
    toAddress?: string | null
    amount: string
    tokenAddress?: string | null
    tokenSymbol?: string | null
    tokenDecimals?: number | null
    hash: string
    note?: string | null
  }) {
    return this.transaction.create({
      data: {
        userId: data.userId,
        chain: data.chain,
        chainKey: data.chainKey,
        type: data.type,
        fromAddress: data.fromAddress,
        toAddress: data.toAddress ?? null,
        amount: data.amount,
        tokenAddress: data.tokenAddress ?? null,
        tokenSymbol: data.tokenSymbol ?? null,
        tokenDecimals: data.tokenDecimals ?? null,
        hash: data.hash,
        note: data.note ?? null,
      },
    })
  }

  /**
   * Custom method: Update transaction status
   */
  async updateTransactionStatus(
    hash: string,
    status: 'PENDING' | 'CONFIRMED' | 'FAILED',
    blockNumber?: string | null,
    gasUsed?: string | null,
    gasFee?: string | null,
    errorMessage?: string | null
  ) {
    return this.transaction.update({
      where: { hash },
      data: {
        status,
        blockNumber: blockNumber ?? null,
        gasUsed: gasUsed ?? null,
        gasFee: gasFee ?? null,
        errorMessage: errorMessage ?? null,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      },
    })
  }
}

// Singleton instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: ExtendedPrismaClient | undefined
}

// Create single instance
export const prisma = global.prisma || new ExtendedPrismaClient()

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Graceful shutdown handler
 * Call this when your app is shutting down
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
  console.log('✅ Prisma disconnected gracefully')
}

/**
 * Connect to database and run health check
 */
export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')
    
    // Run a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database health check passed')
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    throw error
  }
}

/**
 * Database health check
 * Use this for API health endpoints
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return false
  }
}

/**
 * Clean up old data (maintenance task)
 * Run this periodically via cron
 */
export async function performDatabaseMaintenance(): Promise<{
  expiredSessions: number
  oldWebhookLogs: number
}> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Clean expired sessions
  const expiredSessions = await prisma.cleanExpiredSessions()

  // Clean old webhook logs (keep last 30 days)
  const oldWebhookLogs = await prisma.webhookLog.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  })

  console.log(`🧹 Database maintenance completed:`)
  console.log(`  - Removed ${expiredSessions} expired sessions`)
  console.log(`  - Removed ${oldWebhookLogs.count} old webhook logs`)

  return {
    expiredSessions,
    oldWebhookLogs: oldWebhookLogs.count,
  }
}

/**
 * Transaction helper - ensures atomic operations
 * Use this for operations that need to be all-or-nothing
 */
export async function executeTransaction<T>(
  callback: (tx: ExtendedPrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as ExtendedPrismaClient)
  })
}

// Export types for use in other files
export type { 
  User, 
  Wallet, 
  Session, 
  Transaction, 
  UserSettings,
  Contact,
  WebhookLog,
  OnboardingStatus,
  ChainType,
  TransactionType,
  TransactionStatus,
} from '@prisma/client'