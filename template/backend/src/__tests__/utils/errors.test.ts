import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  PaymentError
} from '../../utils/errors.js';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
      expect(error.stack).toBeDefined();
    });

    it('should default to status 500', () => {
      const error = new AppError('Server error');
      expect(error.statusCode).toBe(500);
    });

    it('should allow non-operational errors', () => {
      const error = new AppError('Critical error', 500, false);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with status 400', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should include validation details', () => {
      const details: any = { field: 'email', issue: 'invalid format' };
      const error = new ValidationError('Validation failed', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with status 404', () => {
      const error = new NotFoundError('User', '123' as any);
      
      expect(error.message).toBe("User with identifier '123' not found");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should work without identifier', () => {
      const error = new NotFoundError('Product');
      expect(error.message).toBe('Product not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with status 401', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('PaymentError', () => {
    it('should create payment error with status 402', () => {
      const error = new PaymentError('Payment failed');
      
      expect(error.message).toBe('Payment failed');
      expect(error.statusCode).toBe(402);
      expect(error.name).toBe('PaymentError');
    });

    it('should include payment details', () => {
      const details: any = { transactionId: 'tx_123', reason: 'insufficient funds' };
      const error = new PaymentError('Payment failed', details);
      
      expect(error.details).toEqual(details);
    });
  });
});

