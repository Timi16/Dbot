/**
 * Error Handling Utilities
 * Custom error classes and error handling helpers
 */

import { ApiErrorCode } from '../types/index.js'

/**
 * Base custom error class
 */
export class AppError extends Error {
  public readonly code: ApiErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details: Record<string, unknown> | undefined

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ApiErrorCode.VALIDATION_ERROR, 400, true, details)
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, ApiErrorCode.UNAUTHORIZED, 401, true)
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ApiErrorCode.USER_NOT_FOUND, 404, true)
  }
}

/**
 * Insufficient balance error (400)
 */
export class InsufficientBalanceError extends AppError {
  constructor(required: string, available: string) {
    super(
      `Insufficient balance. Required: ${required}, Available: ${available}`,
      ApiErrorCode.INSUFFICIENT_BALANCE,
      400,
      true,
      { required, available }
    )
  }
}

/**
 * Invalid PIN error (401)
 */
export class InvalidPinError extends AppError {
  constructor(attemptsRemaining?: number) {
    const message = attemptsRemaining !== undefined
      ? `Invalid PIN. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
      : 'Invalid PIN'
    
    super(message, ApiErrorCode.INVALID_PIN, 401, true, { attemptsRemaining })
  }
}

/**
 * PIN locked error (403)
 */
export class PinLockedError extends AppError {
  constructor(unlockTime: Date) {
    const minutes = Math.ceil((unlockTime.getTime() - Date.now()) / 60000)
    super(
      `Account locked due to too many failed PIN attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      ApiErrorCode.PIN_LOCKED,
      403,
      true,
      { unlockTime: unlockTime.toISOString() }
    )
  }
}

/**
 * Transaction failed error (400)
 */
export class TransactionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ApiErrorCode.TRANSACTION_FAILED, 400, true, details)
  }
}

/**
 * RPC error (503)
 */
export class RpcError extends AppError {
  constructor(chain: string, message: string = 'RPC request failed') {
    super(
      `${chain} ${message}`,
      ApiErrorCode.RPC_ERROR,
      503,
      true,
      { chain }
    )
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Too many requests. Please try again later.',
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      true,
      retryAfter !== undefined ? { retryAfter } : undefined
    )
  }
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error | AppError): {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    }
  }

  // Unknown error - don't expose internal details
  return {
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  }
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error('❌ Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Safe error message for user display
 * Sanitizes technical errors into user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.message
  }

  // Map common errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'ECONNREFUSED': 'Unable to connect to the network. Please try again.',
    'ETIMEDOUT': 'Request timed out. Please try again.',
    'ENOTFOUND': 'Network error. Please check your connection.',
  }

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      return message
    }
  }

  return 'Something went wrong. Please try again.'
}