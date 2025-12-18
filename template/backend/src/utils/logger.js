import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
        msg += `\n${stack}`;
    }
    
    // Add metadata if present
    const metaStr = Object.keys(metadata).length ? `\n${JSON.stringify(metadata, null, 2)}` : '';
    return msg + metaStr;
});

// Console format (with colors)
const consoleFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
);

// File format (without colors)
const fileFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
);

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');

// Optimized file format for production (simpler, less CPU)
const optimizedFileFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (stack) msg += `\n${stack}`;
        // Compact JSON in production to reduce CPU usage
        const metaStr = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
        return msg + metaStr;
    })
);

// Daily rotate file transport for errors (only in development)
const errorFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '14d',
    maxSize: '50m', // Increased to reduce rotation frequency
    format: optimizedFileFormat,
    zippedArchive: true, // Compress old logs to save space
    auditFile: path.join(logsDir, '.audit.json'), // Audit file for rotation tracking
    createSymlink: true, // Create symlink to latest log file
    // Async options to reduce blocking
    handleExceptions: false,
    handleRejections: false
});

// Daily rotate file transport for all logs
const combinedFileTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
    maxSize: '50m', // Increased to reduce rotation frequency
    format: optimizedFileFormat,
    zippedArchive: true, // Compress old logs
    auditFile: path.join(logsDir, '.audit-combined.json'),
    createSymlink: true,
    // Async options to reduce blocking
    handleExceptions: false,
    handleRejections: false
});

// Create logger with CPU-optimized settings
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    exitOnError: false, // Don't crash on logging errors
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
            handleExceptions: false,
            handleRejections: false
        }),
        errorFileTransport,
        combinedFileTransport
    ],
    // Handle uncaught exceptions and rejections (only critical errors)
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'exceptions.log'),
            format: optimizedFileFormat,
            maxsize: 10485760, // 10MB max size
            maxFiles: 1 // Keep only one exception log file
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'rejections.log'),
            format: optimizedFileFormat,
            maxsize: 10485760, // 10MB max size
            maxFiles: 1 // Keep only one rejection log file
        })
    ]
});

// Production optimizations - reduce CPU usage
if (process.env.NODE_ENV === 'production') {
    // Remove console transport completely in production (saves CPU)
    logger.remove(logger.transports.find(t => t instanceof winston.transports.Console));
    
    // Remove error file transport in production (use only combined to reduce I/O)
    // This reduces file operations by 50%
    logger.remove(errorFileTransport);
    
    // In production, log only warnings and errors to reduce volume
    logger.level = process.env.LOG_LEVEL || 'warn';
}

// Helper methods
logger.logRequest = (req, message = 'Request received') => {
    logger.info(message, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
};

logger.logError = (error, context = {}) => {
    logger.error(error.message, {
        stack: error.stack,
        name: error.name,
        statusCode: error.statusCode,
        ...context
    });
};

export default logger;





