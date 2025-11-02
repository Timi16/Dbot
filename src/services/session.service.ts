/**
 * Session Service
 * Manages conversation state and context for users
 */

import { prisma } from '../models/prisma.client.js'
import { env } from '../config/index.js'
import type {
  SessionData,
  ConversationStep,
  SessionContext,
  CreateSessionParams,
  UpdateSessionParams,
} from '../types/index.js'
import { NotFoundError } from '../utils/index.js'
import { MainStep } from '../types/session.types.js'

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(params: CreateSessionParams): Promise<SessionData> {
    const expiryMinutes = params.expiryMinutes || env.SESSION_EXPIRY_MINUTES
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    // Delete existing session for this phone first
    await this.deleteSession(params.phone)

    const session = await prisma.session.create({
      data: {
        phone: params.phone,
        userId: params.userId ?? null,
        currentStep: params.currentStep,
        context: (params.context || {}) as any,
        expiresAt,
      },
    })

    return session as SessionData
  }

  /**
   * Get session by phone number
   */
  async getSession(phone: string): Promise<SessionData | null> {
    const session = await prisma.session.findUnique({
      where: { phone },
    })

    if (!session) {
      return null
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(phone)
      return null
    }

    return session as SessionData
  }

  /**
   * Get or create session
   */
  async getOrCreateSession(
    phone: string,
    defaultStep: ConversationStep,
    userId?: string | null
  ): Promise<SessionData> {
    const existing = await this.getSession(phone)
    
    if (existing) {
      return existing
    }

    return this.createSession({
      phone,
      userId: userId ?? undefined,
      currentStep: defaultStep,
      context: {},
    })
  }

  /**
   * Update session
   */
  async updateSession(
    phone: string,
    params: UpdateSessionParams
  ): Promise<SessionData> {
    const session = await this.getSession(phone)
    
    if (!session) {
      throw new NotFoundError('Session')
    }

    const expiryMinutes = params.expiryMinutes || env.SESSION_EXPIRY_MINUTES
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    // Merge context if provided
    const newContext = params.context
      ? { ...session.context, ...params.context }
      : session.context

    const updated = await prisma.session.update({
      where: { phone },
      data: {
        currentStep: params.currentStep ?? session.currentStep,
        context: newContext as any,
        expiresAt,
      },
    })

    return updated as SessionData
  }

  /**
   * Update session context only
   */
  async updateContext(
    phone: string,
    context: Partial<SessionContext>
  ): Promise<SessionData> {
    return this.updateSession(phone, { context })
  }

  /**
   * Update session step only
   */
  async updateStep(
    phone: string,
    step: ConversationStep
  ): Promise<SessionData> {
    return this.updateSession(phone, { currentStep: step })
  }

  /**
   * Delete session
   */
  async deleteSession(phone: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { phone },
    })
  }

  /**
   * Reset session (clear context, set to idle)
   */
  async resetSession(phone: string, userId?: string | null): Promise<SessionData> {
    await this.deleteSession(phone)
    
    return this.createSession({
      phone,
      userId: userId ?? undefined,
      currentStep: MainStep.IDLE,
      context: {},
    })
  }

  /**
   * Check if session exists and is valid
   */
  async hasActiveSession(phone: string): Promise<boolean> {
    const session = await this.getSession(phone)
    return session !== null
  }

  /**
   * Get session context
   */
  async getContext(phone: string): Promise<SessionContext> {
    const session = await this.getSession(phone)
    return (session?.context as SessionContext) || {}
  }

  /**
   * Clear all expired sessions (maintenance)
   */
  async clearExpiredSessions(): Promise<number> {
    return prisma.cleanExpiredSessions()
  }
}

// Export singleton instance
export const sessionService = new SessionService()