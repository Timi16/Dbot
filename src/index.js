/**
 * Main Server Entry Point
 * Initializes Express app, connects database, sets up routes and middleware
 */
import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.config.js';
import { connectPrisma, disconnectPrisma } from './models/prisma.client.js';
import webhookRoutes from './routes/webhook.routes.js';
import { errorHandler, notFoundHandler, timeoutHandler, securityHeaders, } from './middleware/error.middleware.js';
import { requestLogger, performanceLogger, errorLogger as loggerErrorHandler, } from './middleware/logger.middleware.js';
/**
 * Initialize Express app
 */
const app = express();
/**
 * Security middleware
 */
app.use(helmet()); // Security headers
app.use(securityHeaders); // Custom security headers
app.use(cors()); // CORS (adjust for production)
/**
 * Body parsing middleware
 * Twilio sends application/x-www-form-urlencoded
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
/**
 * Request timeout (30 seconds)
 */
app.use(timeoutHandler(30000));
/**
 * Logging middleware
 */
if (env.NODE_ENV === 'development') {
    app.use(requestLogger);
    app.use(performanceLogger(1000)); // Log requests > 1 second
}
/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        const dbHealthy = await import('./models/prisma.client.js').then((m) => m.checkDatabaseHealth());
        if (!dbHealthy) {
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                database: 'disconnected',
            });
            return;
        }
        res.json({
            success: true,
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'Health check failed',
        });
    }
});
/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'WhatsApp Crypto Bot API',
        version: '1.0.0',
        endpoints: {
            webhook: 'POST /webhook',
            health: 'GET /health',
        },
    });
});
/**
 * Mount webhook routes
 */
app.use('/', webhookRoutes);
/**
 * 404 handler (must be after all routes)
 */
app.use(notFoundHandler);
/**
 * Error logging middleware
 */
app.use(loggerErrorHandler);
/**
 * Global error handler (must be last)
 */
app.use(errorHandler);
/**
 * Start server
 */
async function startServer() {
    try {
        console.log('🚀 Starting WhatsApp Crypto Bot Server...\n');
        // Connect to database
        console.log('📊 Connecting to database...');
        await connectPrisma();
        // Start Express server
        const PORT = env.PORT;
        const server = app.listen(PORT, () => {
            console.log(`\n✅ Server is running!`);
            console.log(`   Port: ${PORT}`);
            console.log(`   Environment: ${env.NODE_ENV}`);
            console.log(`   Webhook URL: http://localhost:${PORT}/webhook`);
            console.log(`   Health Check: http://localhost:${PORT}/health`);
            console.log('\n📱 Ready to receive WhatsApp messages!\n');
        });
        // Graceful shutdown handlers
        const gracefulShutdown = async (signal) => {
            console.log(`\n\n🛑 ${signal} received. Starting graceful shutdown...`);
            // Close server (stop accepting new connections)
            server.close(async () => {
                console.log('🔌 Server closed. No longer accepting connections.');
                try {
                    // Disconnect from database
                    await disconnectPrisma();
                    console.log('✅ Graceful shutdown complete.');
                    process.exit(0);
                }
                catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('❌ UNCAUGHT EXCEPTION:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ UNHANDLED REJECTION:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
/**
 * Run the server
 */
startServer();
export default app;
//# sourceMappingURL=index.js.map