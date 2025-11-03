/**
 * Twilio Middleware
 * Validates Twilio webhook signatures for security
 */

import type { Request, Response, NextFunction } from 'express'
import { validateTwilioSignature, twilioConfig } from '../config/index.js'
import { AuthenticationError } from '../utils/index.js'

/**
 * Validate Twilio webhook signature
 * Ensures requests actually come from Twilio
 */
export function validateTwilioWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip validation in development if configured
  if (!twilioConfig.validateWebhook) {
    console.warn('⚠️  Twilio signature validation is DISABLED')
    next()
    return
  }

  try {
    // Get signature from headers
    const twilioSignature = req.headers['x-twilio-signature'] as string

    if (!twilioSignature) {
      throw new AuthenticationError('Missing Twilio signature')
    }

    // Construct full URL
    const protocol = req.protocol
    const host = req.get('host')
    const url = `${protocol}://${host}${req.originalUrl}`

    // Validate signature
    const isValid = validateTwilioSignature(
      twilioConfig.authToken,
      twilioSignature,
      url,
      req.body
    )

    if (!isValid) {
      throw new AuthenticationError('Invalid Twilio signature')
    }

    // Signature is valid, continue
    next()
  } catch (error) {
    console.error('❌ Twilio signature validation failed:', error)
    
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Unauthorized request',
        },
      })
      return
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Validation error',
      },
    })
  }
}

/**
 * Parse Twilio webhook body
 * Ensures body is available for signature validation
 */
export function parseTwilioWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Twilio sends application/x-www-form-urlencoded
  // Express body-parser should handle this
  
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Empty request body',
      },
    })
    return
  }

  next()
}

/**
 * Rate limiting for webhook endpoint
 * Prevents abuse
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimitWebhook(
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.body.From || req.ip || 'unknown'
    const now = Date.now()

    // Get or create rate limit entry
    let entry = requestCounts.get(identifier)

    // Reset if window has passed
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      requestCounts.set(identifier, entry)
    }

    // Increment count
    entry.count++

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      console.warn(`⚠️  Rate limit exceeded for ${identifier}`)
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      })
      return
    }

    next()
  }
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now()
  
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(key)
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimitCache, 5 * 60 * 1000)