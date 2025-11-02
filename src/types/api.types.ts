/**
 * API and Response Type Definitions
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export enum ApiErrorCode {
  // Authentication errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_NOT_ONBOARDED = 'USER_NOT_ONBOARDED',
  ONBOARDING_INCOMPLETE = 'ONBOARDING_INCOMPLETE',
  
  // Wallet errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  
  // PIN errors
  INVALID_PIN = 'INVALID_PIN',
  PIN_LOCKED = 'PIN_LOCKED',
  PIN_REQUIRED = 'PIN_REQUIRED',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  
  // Chain errors
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  RPC_ERROR = 'RPC_ERROR',
  
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}