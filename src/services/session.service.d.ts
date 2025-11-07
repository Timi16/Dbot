/**
 * Session Service
 * Manages conversation state and context for users
 */
import type { SessionData, ConversationStep, SessionContext, CreateSessionParams, UpdateSessionParams } from '../types/index.js';
export declare class SessionService {
    /**
     * Create a new session
     */
    createSession(params: CreateSessionParams): Promise<SessionData>;
    /**
     * Get session by phone number
     */
    getSession(phone: string): Promise<SessionData | null>;
    /**
     * Get or create session
     */
    getOrCreateSession(phone: string, defaultStep: ConversationStep, userId?: string | null): Promise<SessionData>;
    /**
     * Update session
     */
    updateSession(phone: string, params: UpdateSessionParams): Promise<SessionData>;
    /**
     * Update session context only
     */
    updateContext(phone: string, context: Partial<SessionContext>): Promise<SessionData>;
    /**
     * Update session step only
     */
    updateStep(phone: string, step: ConversationStep): Promise<SessionData>;
    /**
     * Delete session
     */
    deleteSession(phone: string): Promise<void>;
    /**
     * Reset session (clear context, set to idle)
     */
    resetSession(phone: string, userId?: string | null): Promise<SessionData>;
    /**
     * Check if session exists and is valid
     */
    hasActiveSession(phone: string): Promise<boolean>;
    /**
     * Get session context
     */
    getContext(phone: string): Promise<SessionContext>;
    /**
     * Clear all expired sessions (maintenance)
     */
    clearExpiredSessions(): Promise<number>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=session.service.d.ts.map