/**
 * Database storage layer for notification system
 * Handles CRUD operations for notifications, preferences, and queue
 * @module NotificationStorage
 */

import pkg from 'pg';
const { Pool } = pkg;

class NotificationStorage {
  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'telegram_bot',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: 10, // Reduced from 20 to 10 to lower resource usage
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Increased from 2s to 5s
      // Prevent connection pool from retrying too aggressively
      allowExitOnIdle: true
    });
    
    // Handle pool errors gracefully
    this.pool.on('error', (err) => {
      console.error('[NotificationStorage] Unexpected pool error:', err.message);
    });
  }

  /**
   * Create a new notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} content - Notification content (will be stored as JSONB)
   * @returns {Promise<Object>} Created notification record
   */
  async createNotification(userId, type, content) {
    const result = await this.pool.query(
      `INSERT INTO notifications (user_id, type, content, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [userId, type, JSON.stringify(content)]
    );
    return result.rows[0];
  }

  /**
   * Get notification by ID
   * @param {number} notificationId - Notification ID
   * @returns {Promise<Object|null>} Notification record or null
   */
  async getNotification(notificationId) {
    const result = await this.pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update notification status with optional extra fields
   * @param {number} notificationId - Notification ID
   * @param {string} status - New status
   * @param {Object} extra - Extra fields to update
   * @param {Date} extra.sentAt - Sent timestamp
   * @param {string} extra.telegramMessageId - Telegram message ID
   * @param {string} extra.errorMessage - Error message
   * @param {number} extra.retryCount - Retry count
   * @returns {Promise<Object>} Updated notification
   */
  async updateStatus(notificationId, status, extra = {}) {
    const fields = ['status = $2'];
    const values = [notificationId, status];
    let paramIndex = 3;

    if (extra.sentAt) {
      fields.push(`sent_at = $${paramIndex++}`);
      values.push(extra.sentAt);
    }
    if (extra.telegramMessageId) {
      fields.push(`telegram_message_id = $${paramIndex++}`);
      values.push(extra.telegramMessageId);
    }
    if (extra.errorMessage) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(extra.errorMessage);
    }
    if (extra.retryCount !== undefined) {
      fields.push(`retry_count = $${paramIndex++}`);
      values.push(extra.retryCount);
    }

    const query = `UPDATE notifications SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user notification preferences
   * Returns default enabled preferences if not found
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Preferences object
   */
  async getPreferences(userId) {
    const result = await this.pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows[0]) {
      return {
        purchaseEnabled: result.rows[0].purchase_enabled,
        referralRegisteredEnabled: result.rows[0].referral_registered_enabled,
        referralPurchaseEnabled: result.rows[0].referral_purchase_enabled,
        incomeCreditedEnabled: result.rows[0].income_credited_enabled
      };
    }
    
    // Default: all enabled
    return {
      purchaseEnabled: true,
      referralRegisteredEnabled: true,
      referralPurchaseEnabled: true,
      incomeCreditedEnabled: true
    };
  }

  /**
   * Update user notification preferences with UPSERT
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences to update
   * @param {boolean} preferences.purchaseEnabled
   * @param {boolean} preferences.referralRegisteredEnabled
   * @param {boolean} preferences.referralPurchaseEnabled
   * @param {boolean} preferences.incomeCreditedEnabled
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(userId, preferences) {
    const result = await this.pool.query(
      `INSERT INTO notification_preferences (
        user_id, purchase_enabled, referral_registered_enabled,
        referral_purchase_enabled, income_credited_enabled
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        purchase_enabled = EXCLUDED.purchase_enabled,
        referral_registered_enabled = EXCLUDED.referral_registered_enabled,
        referral_purchase_enabled = EXCLUDED.referral_purchase_enabled,
        income_credited_enabled = EXCLUDED.income_credited_enabled,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        preferences.purchaseEnabled ?? true,
        preferences.referralRegisteredEnabled ?? true,
        preferences.referralPurchaseEnabled ?? true,
        preferences.incomeCreditedEnabled ?? true
      ]
    );
    return result.rows[0];
  }

  /**
   * Check if user has blocked the bot
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if bot is blocked
   */
  async isUserBotBlocked(userId) {
    const result = await this.pool.query(
      'SELECT bot_blocked FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.bot_blocked || false;
  }

  /**
   * Mark user as having blocked/unblocked the bot
   * @param {string} userId - User ID
   * @param {boolean} blocked - Blocked status
   * @returns {Promise<void>}
   */
  async markBotBlocked(userId, blocked = true) {
    await this.pool.query(
      'UPDATE users SET bot_blocked = $1, bot_blocked_at = $2 WHERE id = $3',
      [blocked, blocked ? new Date() : null, userId]
    );
  }

  /**
   * Update last notification timestamp for user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastNotificationTime(userId) {
    await this.pool.query(
      'UPDATE users SET last_notification_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Get notification history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @param {number} offset - Offset for pagination
   * @param {Object} filters - Optional filters
   * @param {string} filters.type - Filter by notification type
   * @param {string} filters.status - Filter by status
   * @returns {Promise<Array>} Array of notifications
   */
  async getHistory(userId, limit = 20, offset = 0, filters = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (filters.type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.period - Time period (day, week, month)
   * @returns {Promise<Object>} Statistics object
   */
  async getStats(userId, options = {}) {
    const period = options.period || 'month';
    const interval = {
      day: '1 day',
      week: '7 days',
      month: '30 days'
    }[period] || '30 days';

    const result = await this.pool.query(
      `SELECT 
        type,
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delivery_time_seconds
       FROM notifications 
       WHERE user_id = $1 
         AND created_at > NOW() - INTERVAL '${interval}'
       GROUP BY type, status
       ORDER BY type, status`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Close database connection pool
   * @returns {Promise<void>}
   */
  async close() {
    await this.pool.end();
  }
}

// Export singleton instance
const storage = new NotificationStorage();
export default storage;





