/**
 * Health Controller
 * Health check and status endpoints
 */
import type { Request, Response } from 'express';
export declare class HealthController {
    /**
     * Basic health check
     */
    healthCheck(req: Request, res: Response): Promise<void>;
    /**
     * Detailed health check
     */
    detailedHealthCheck(req: Request, res: Response): Promise<void>;
    /**
     * Get app info
     */
    getInfo(req: Request, res: Response): Promise<void>;
}
export declare const healthController: HealthController;
//# sourceMappingURL=health.controller.d.ts.map