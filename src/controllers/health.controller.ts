/**
 * Health Controller
 * Health check and status endpoints
 */

import type { Request, Response } from 'express'
import { checkDatabaseHealth } from '../models/prisma.client.js'
import { env } from '../config/index.js'

export class HealthController {
  /**
   * Basic health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Detailed health check
   */
  async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check database
      const dbHealthy = await checkDatabaseHealth()

      const health = {
        success: true,
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'up' : 'down',
          app: 'up',
        },
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }

      res.status(dbHealthy ? 200 : 503).json(health)
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      })
    }
  }

  /**
   * Get app info
   */
  async getInfo(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      name: 'WhatsApp Crypto Bot',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  }
}

// Export singleton instance
export const healthController = new HealthController()