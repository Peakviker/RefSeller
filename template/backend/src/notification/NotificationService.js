/**
 * Notification Service - Main business logic for handling notification events
 * Listens to application events and creates notifications based on user preferences
 * @module NotificationService
 */

import { Queue } from 'bullmq';
import notificationStorage from './NotificationStorage.js';

/**
 * Priority levels for different notification types
 */
const PRIORITY = {
  purchase: 1,          // Highest priority - critical user action
  income_credited: 1,   // High priority - money related
  referral_purchase: 5, // Normal priority
  referral_registered: 10 // Low priority - informational
};

export default class NotificationService {
  /**
   * @param {Object} bot - Telegraf bot instance
   * @param {EventEmitter} eventBus - Global event bus
   */
  constructor(bot, eventBus) {
    this.bot = bot;
    this.eventBus = eventBus;
    this.storage = notificationStorage;
    this.isEnabled = false;
    
    // Initialize BullMQ queue with connection error handling
    try {
      this.queue = new Queue('notifications', {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          db: parseInt(process.env.REDIS_DB) || 1,
          connectTimeout: 5000, // 5 second timeout
          retryStrategy: (times) => {
            // Exponential backoff with max delay of 30 seconds
            const delay = Math.min(times * 1000, 30000);
            if (times > 10) {
              // Stop retrying after 10 attempts
              console.error('[NotificationService] Redis connection failed after 10 attempts, disabling notifications');
              this.isEnabled = false;
              return null; // Stop retrying
            }
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false // Don't queue commands when offline
        }
      });
      
      // Handle connection errors
      this.queue.on('error', (error) => {
        console.error('[NotificationService] Queue error:', error.message);
        this.isEnabled = false;
      });
      
      this.isEnabled = true;
      this.setupEventListeners();
    } catch (error) {
      console.error('[NotificationService] Failed to initialize queue:', error);
      this.isEnabled = false;
      this.queue = null;
    }
  }

  /**
   * Setup event listeners for all notification triggers
   */
  setupEventListeners() {
    this.eventBus.on('payment.succeeded', (data) => this.handlePurchase(data));
    this.eventBus.on('referral.registered', (data) => this.handleReferralRegistered(data));
    this.eventBus.on('referral.purchase', (data) => this.handleReferralPurchase(data));
    this.eventBus.on('referral.income_credited', (data) => this.handleIncomeCredited(data));
    
    console.log('[NotificationService] Event listeners registered');
  }

  /**
   * Handle purchase completion event (User Story 1)
   * @param {Object} data - Event data
   */
  async handlePurchase(data) {
    try {
      const { userId, payment } = data;
      
      // Check user preferences
      const prefs = await this.storage.getPreferences(userId);
      if (!prefs.purchaseEnabled) {
        console.log(`[NotificationService] Purchase notification disabled for user ${userId}`);
        return;
      }

      // Create notification content
      const content = {
        amount: payment.amount,
        currency: payment.currency || 'RUB',
        productName: payment.productName || payment.description,
        productId: payment.productId,
        paymentId: payment.id,
        purchaseDate: payment.createdAt || new Date().toISOString()
      };

      // Create notification record
      const notification = await this.storage.createNotification(userId, 'purchase', content);
      
      // Enqueue for delivery
      await this.enqueueNotification(notification, PRIORITY.purchase);
      
      console.log(`[NotificationService] Purchase notification created: ${notification.id}`);
    } catch (error) {
      console.error('[NotificationService] Error handling purchase:', error);
    }
  }

  /**
   * Handle referral registration event (User Story 3)
   * @param {Object} data - Event data
   */
  async handleReferralRegistered(data) {
    try {
      const { referrerId, referral } = data;
      
      // Check user preferences
      const prefs = await this.storage.getPreferences(referrerId);
      if (!prefs.referralRegisteredEnabled) {
        console.log(`[NotificationService] Referral registered notification disabled for user ${referrerId}`);
        return;
      }

      // Get total referrals count (simplified - in production query DB)
      const content = {
        referralId: referral.userId,
        referralUsername: referral.username,
        referralFirstName: referral.firstName || 'Пользователь',
        registrationDate: referral.registeredAt || new Date().toISOString(),
        totalReferrals: referral.totalReferrals || 1,
        profileComplete: true
      };

      const notification = await this.storage.createNotification(referrerId, 'referral_registered', content);
      await this.enqueueNotification(notification, PRIORITY.referral_registered);
      
      console.log(`[NotificationService] Referral registered notification created: ${notification.id}`);
    } catch (error) {
      console.error('[NotificationService] Error handling referral registered:', error);
    }
  }

  /**
   * Handle referral purchase event (User Story 4)
   * @param {Object} data - Event data
   */
  async handleReferralPurchase(data) {
    try {
      const { referrerId, referral, purchase } = data;
      
      // Check user preferences
      const prefs = await this.storage.getPreferences(referrerId);
      if (!prefs.referralPurchaseEnabled) {
        console.log(`[NotificationService] Referral purchase notification disabled for user ${referrerId}`);
        return;
      }

      const content = {
        referralId: referral.userId,
        referralUsername: referral.username,
        purchaseAmount: purchase.amount,
        currency: purchase.currency || 'RUB',
        expectedReward: purchase.expectedReward,
        rewardPercentage: purchase.rewardPercentage || 30,
        purchaseDate: purchase.createdAt || new Date().toISOString()
      };

      const notification = await this.storage.createNotification(referrerId, 'referral_purchase', content);
      await this.enqueueNotification(notification, PRIORITY.referral_purchase);
      
      console.log(`[NotificationService] Referral purchase notification created: ${notification.id}`);
    } catch (error) {
      console.error('[NotificationService] Error handling referral purchase:', error);
    }
  }

  /**
   * Handle income credited event (User Story 5)
   * @param {Object} data - Event data
   */
  async handleIncomeCredited(data) {
    try {
      const { userId, income } = data;
      
      // Check user preferences
      const prefs = await this.storage.getPreferences(userId);
      if (!prefs.incomeCreditedEnabled) {
        console.log(`[NotificationService] Income credited notification disabled for user ${userId}`);
        return;
      }

      const content = {
        amount: income.amount,
        currency: income.currency || 'RUB',
        fromReferralId: income.fromReferralId,
        fromReferralUsername: income.fromReferralUsername,
        referralLevel: income.referralLevel || 1,
        newBalance: income.newBalance,
        transactionId: income.transactionId,
        creditedAt: income.creditedAt || new Date().toISOString()
      };

      const notification = await this.storage.createNotification(userId, 'income_credited', content);
      await this.enqueueNotification(notification, PRIORITY.income_credited);
      
      console.log(`[NotificationService] Income credited notification created: ${notification.id}`);
    } catch (error) {
      console.error('[NotificationService] Error handling income credited:', error);
    }
  }

  /**
   * Enqueue notification for delivery via BullMQ
   * @param {Object} notification - Notification record from DB
   * @param {number} priority - Job priority (1=highest, 10=lowest)
   */
  async enqueueNotification(notification, priority = 5) {
    if (!this.isEnabled || !this.queue) {
      console.warn('[NotificationService] Queue not available, skipping notification:', notification.id);
      return;
    }
    
    try {
      const jobId = `notification-${notification.id}`;
      
      await this.queue.add(
        'send-notification',
        {
          notificationId: notification.id,
          userId: notification.user_id,
          type: notification.type
        },
        {
          jobId,
          priority,
          attempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3,
          backoff: {
            type: 'exponential',
            delay: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS) || 60000 // 1min, 2min, 4min
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500      // Keep last 500 failed jobs for debugging
        }
      );
    } catch (error) {
      console.error('[NotificationService] Failed to enqueue notification:', error.message);
      // Don't throw - gracefully degrade
    }
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async close() {
    await this.queue.close();
    console.log('[NotificationService] Service closed');
  }
}





