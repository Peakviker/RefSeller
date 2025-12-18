/**
 * Base error class for all custom errors
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 400 - Bad Request
 * Used for validation errors and invalid input
 */
export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = null) {
        super(message, 400);
        this.details = details;
    }
}

/**
 * 401 - Unauthorized
 * Used when authentication is required but missing/invalid
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

/**
 * 403 - Forbidden
 * Used when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
    }
}

/**
 * 404 - Not Found
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource', identifier = null) {
        const message = identifier 
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404);
    }
}

/**
 * 409 - Conflict
 * Used for duplicate resources or conflicting state
 */
export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

/**
 * 422 - Unprocessable Entity
 * Used when request is well-formed but semantically invalid
 */
export class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable entity', details = null) {
        super(message, 422);
        this.details = details;
    }
}

/**
 * 429 - Too Many Requests
 * Used for rate limiting
 */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = null) {
        super(message, 429);
        this.retryAfter = retryAfter;
    }
}

/**
 * 500 - Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, false);
    }
}

/**
 * 502 - Bad Gateway
 * Used when external service fails
 */
export class ExternalServiceError extends AppError {
    constructor(service = 'External service', message = null) {
        super(message || `${service} unavailable`, 502);
        this.service = service;
    }
}

/**
 * 503 - Service Unavailable
 * Used when service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable', retryAfter = null) {
        super(message, 503);
        this.retryAfter = retryAfter;
    }
}

/**
 * Database error wrapper
 */
export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', originalError = null) {
        super(message, 500, false);
        this.originalError = originalError;
    }
}

/**
 * Payment processing error
 */
export class PaymentError extends AppError {
    constructor(message = 'Payment processing failed', details = null) {
        super(message, 402);
        this.details = details;
    }
}

/**
 * Telegram API error wrapper
 */
export class TelegramError extends AppError {
    constructor(message = 'Telegram API error', originalError = null) {
        super(message, 500);
        this.originalError = originalError;
    }
}





