import logger from './logger.js';
import { AppError } from './errors.js';

/**
 * Express error handling middleware
 * Must be placed after all routes
 */
export function errorHandler(err, req, res, next) {
    // Log the error
    logger.logError(err, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        body: req.body,
        query: req.query
    });

    // Default to 500 if no status code
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational !== undefined ? err.isOperational : false;

    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            statusCode
        }
    };

    // Add additional details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
        errorResponse.error.name = err.name;
        
        if (err.details) {
            errorResponse.error.details = err.details;
        }
    }

    // Add retry information if available
    if (err.retryAfter) {
        res.setHeader('Retry-After', err.retryAfter);
        errorResponse.error.retryAfter = err.retryAfter;
    }

    // Log critical errors (non-operational)
    if (!isOperational) {
        logger.error('CRITICAL ERROR - Non-operational error occurred', {
            error: err.message,
            stack: err.stack,
            path: req.path
        });
    }

    res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler for routes
 */
export function notFoundHandler(req, res, next) {
    const err = new AppError(`Route ${req.method} ${req.path} not found`, 404);
    next(err);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: app.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Handle unhandled promise rejections
 */
export function setupUnhandledRejectionHandler() {
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', {
            promise,
            reason: reason?.stack || reason
        });
        
        // In production, you might want to exit the process
        if (process.env.NODE_ENV === 'production') {
            logger.error('Exiting due to unhandled rejection...');
            process.exit(1);
        }
    });
}

/**
 * Handle uncaught exceptions
 */
export function setupUncaughtExceptionHandler() {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', {
            error: error.message,
            stack: error.stack
        });
        
        logger.error('Exiting due to uncaught exception...');
        process.exit(1);
    });
}

/**
 * Graceful shutdown handler
 */
export function createShutdownHandler(cleanupFns = []) {
    return async (signal) => {
        logger.info(`${signal} received, starting graceful shutdown...`);
        
        try {
            // Execute all cleanup functions
            for (const cleanupFn of cleanupFns) {
                await cleanupFn();
            }
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    };
}





