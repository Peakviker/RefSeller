/**
 * REST API endpoints for notification system
 * Provides user preferences management, history, statistics, and health checks
 * @module NotificationApi
 */

import notificationStorage from '../notification/NotificationStorage.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { ValidationError, ServiceUnavailableError } from '../utils/errors.js';

/**
 * Setup notification API routes
 * @param {Express} api - Express app instance
 */
export function setupNotificationRoutes(api) {
  /**
   * GET /api/notifications/preferences
   * Get user notification preferences
   * Query params: userId (required)
   */
  api.get('/api/notifications/preferences', asyncHandler(async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    const preferences = await notificationStorage.getPreferences(userId);
    
    logger.info('Notification preferences fetched', { userId });

    res.json({
      success: true,
      preferences
    });
  }));

  /**
   * PATCH /api/notifications/preferences
   * Update user notification preferences
   * Body: { userId, purchaseEnabled?, referralRegisteredEnabled?, ... }
   */
  api.patch('/api/notifications/preferences', asyncHandler(async (req, res) => {
    const { userId, ...preferences } = req.body;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    // Validate boolean fields
    const validKeys = [
      'purchaseEnabled',
      'referralRegisteredEnabled',
      'referralPurchaseEnabled',
      'incomeCreditedEnabled'
    ];

    const updates = {};
    for (const key of validKeys) {
      if (preferences[key] !== undefined) {
        if (typeof preferences[key] !== 'boolean') {
          throw new ValidationError(`${key} must be a boolean`);
        }
        updates[key] = preferences[key];
      }
    }

    const updated = await notificationStorage.updatePreferences(userId, updates);
    
    logger.info('Notification preferences updated', { userId, updates });

    res.json({
      success: true,
      preferences: {
        purchaseEnabled: updated.purchase_enabled,
        referralRegisteredEnabled: updated.referral_registered_enabled,
        referralPurchaseEnabled: updated.referral_purchase_enabled,
        incomeCreditedEnabled: updated.income_credited_enabled
      }
    });
  }));

  /**
   * GET /api/notifications/history
   * Get notification history for user with pagination
   * Query params: userId (required), limit, offset, type, status
   */
  api.get('/api/notifications/history', asyncHandler(async (req, res) => {
    const {
      userId,
      limit = 20,
      offset = 0,
      type,
      status
    } = req.query;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;

    const history = await notificationStorage.getHistory(
      userId,
      parseInt(limit),
      parseInt(offset),
      filters
    );
    
    logger.info('Notification history fetched', { 
      userId, 
      limit: parseInt(limit), 
      offset: parseInt(offset),
      count: history.length 
    });

    res.json({
      success: true,
      history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: history.length
      }
    });
  }));

  /**
   * GET /api/notifications/stats
   * Get notification statistics for user
   * Query params: userId (required), period (day/week/month)
   */
  api.get('/api/notifications/stats', asyncHandler(async (req, res) => {
    const { userId, period = 'month' } = req.query;

    if (!userId) {
      throw new ValidationError('userId is required');
    }

    if (!['day', 'week', 'month'].includes(period)) {
      throw new ValidationError('period must be one of: day, week, month');
    }

    const stats = await notificationStorage.getStats(userId, { period });

    // Aggregate statistics
    const summary = {
      total: 0,
      byType: {},
      byStatus: {},
      avgDeliveryTime: 0
    };

    let totalDeliveryTime = 0;
    let deliveredCount = 0;

    for (const row of stats) {
      const count = parseInt(row.count);
      summary.total += count;

      // By type
      if (!summary.byType[row.type]) {
        summary.byType[row.type] = 0;
      }
      summary.byType[row.type] += count;

      // By status
      if (!summary.byStatus[row.status]) {
        summary.byStatus[row.status] = 0;
      }
      summary.byStatus[row.status] += count;

      // Delivery time
      if (row.avg_delivery_time_seconds && row.status === 'sent') {
        totalDeliveryTime += parseFloat(row.avg_delivery_time_seconds) * count;
        deliveredCount += count;
      }
    }

    if (deliveredCount > 0) {
      summary.avgDeliveryTime = Math.round(totalDeliveryTime / deliveredCount);
    }
    
    logger.info('Notification stats fetched', { userId, period, total: summary.total });

    res.json({
      success: true,
      period,
      summary,
      detailed: stats
    });
  }));

  /**
   * GET /api/notifications/health
   * Health check endpoint for monitoring
   */
  api.get('/api/notifications/health', asyncHandler(async (req, res) => {
    try {
      // Check database connection
      const testQuery = await notificationStorage.pool.query('SELECT 1 as health');
      const dbHealthy = testQuery.rows[0].health === 1;

      // Check Redis (through rate limiter stats)
      const { getStats } = await import('../notification/NotificationRateLimiter.js');
      const rateLimiterStats = getStats();

      const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: dbHealthy,
          type: 'PostgreSQL'
        },
        queue: {
          type: 'BullMQ',
          global: rateLimiterStats.global,
          userLimiters: rateLimiterStats.userLimiters
        },
        version: '1.0.0'
      };

      if (!dbHealthy) {
        throw new ServiceUnavailableError('Database connection failed');
      }

      res.json(health);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      throw new ServiceUnavailableError('Service health check failed', 30);
    }
  }));

  logger.info('Notification API routes registered');
}

