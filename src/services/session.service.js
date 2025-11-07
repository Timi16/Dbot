/**
 * Session Service
 * Manages conversation state and context for users
 */
import { prisma } from '../models/prisma.client.js';
import { env } from '../config/index.js';
import { NotFoundError } from '../utils/index.js';
import { MainStep } from '../types/session.types.js';
export class SessionService {
    /**
     * Create a new session
     */
    async createSession(params) {
        const expiryMinutes = params.expiryMinutes || env.SESSION_EXPIRY_MINUTES;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
        // Delete existing session for this phone first
        await this.deleteSession(params.phone);
        const session = await prisma.session.create({
            data: {
                phone: params.phone,
                userId: params.userId ?? null,
                currentStep: params.currentStep,
                context: (params.context || {}),
                expiresAt,
            },
        });
        return session;
    }
    /**
     * Get session by phone number
     */
    async getSession(phone) {
        const session = await prisma.session.findUnique({
            where: { phone },
        });
        if (!session) {
            return null;
        }
        // Check if expired
        if (session.expiresAt < new Date()) {
            await this.deleteSession(phone);
            return null;
        }
        return session;
    }
    /**
     * Get or create session
     */
    async getOrCreateSession(phone, defaultStep, userId) {
        const existing = await this.getSession(phone);
        if (existing) {
            return existing;
        }
        return this.createSession({
            phone,
            userId: userId ?? undefined,
            currentStep: defaultStep,
            context: {},
        });
    }
    /**
     * Update session
     */
    async updateSession(phone, params) {
        const session = await this.getSession(phone);
        if (!session) {
            throw new NotFoundError('Session');
        }
        const expiryMinutes = params.expiryMinutes || env.SESSION_EXPIRY_MINUTES;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
        // Merge context if provided
        const newContext = params.context
            ? { ...session.context, ...params.context }
            : session.context;
        const updated = await prisma.session.update({
            where: { phone },
            data: {
                currentStep: params.currentStep ?? session.currentStep,
                context: newContext,
                expiresAt,
            },
        });
        return updated;
    }
    /**
     * Update session context only
     */
    async updateContext(phone, context) {
        return this.updateSession(phone, { context });
    }
    /**
     * Update session step only
     */
    async updateStep(phone, step) {
        return this.updateSession(phone, { currentStep: step });
    }
    /**
     * Delete session
     */
    async deleteSession(phone) {
        await prisma.session.deleteMany({
            where: { phone },
        });
    }
    /**
     * Reset session (clear context, set to idle)
     */
    async resetSession(phone, userId) {
        await this.deleteSession(phone);
        return this.createSession({
            phone,
            userId: userId ?? undefined,
            currentStep: MainStep.IDLE,
            context: {},
        });
    }
    /**
     * Check if session exists and is valid
     */
    async hasActiveSession(phone) {
        const session = await this.getSession(phone);
        return session !== null;
    }
    /**
     * Get session context
     */
    async getContext(phone) {
        const session = await this.getSession(phone);
        return session?.context || {};
    }
    /**
     * Clear all expired sessions (maintenance)
     */
    async clearExpiredSessions() {
        return prisma.cleanExpiredSessions();
    }
}
// Export singleton instance
export const sessionService = new SessionService();
//# sourceMappingURL=session.service.js.map