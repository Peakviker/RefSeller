/**
 * Notification Worker - BullMQ worker that processes notification delivery jobs
 * Handles rate limiting, bot blocked detection, Telegram API calls, and error handling
 * @module NotificationWorker
 */

import { Worker } from 'bullmq';
import notificationStorage from './NotificationStorage.js';
import { TEMPLATES } from './NotificationTemplates.js';
import { scheduleNotification } from './NotificationRateLimiter.js';

/**
 * Start the notification worker
 * @param {Object} bot - Telegraf bot instance
 * @returns {Worker} BullMQ worker instance
 */
export function startNotificationWorker(bot) {
  let worker = null;
  
  try {
    worker = new Worker(
      'notifications',
      async (job) => {
      const { notificationId, userId, type } = job.data;

      console.log(`[NotificationWorker] Processing notification ${notificationId} for user ${userId}`);

      try {
        // Check if bot is blocked by user
        const isBlocked = await notificationStorage.isUserBotBlocked(userId);
        if (isBlocked) {
          await notificationStorage.updateStatus(notificationId, 'cancelled', {
            errorMessage: 'Bot blocked by user'
          });
          console.log(`[NotificationWorker] Notification ${notificationId} cancelled - bot blocked`);
          return { status: 'cancelled', reason: 'bot_blocked' };
        }

        // Get notification from database
        const notification = await notificationStorage.getNotification(notificationId);
        if (!notification) {
          throw new Error(`Notification ${notificationId} not found`);
        }

        // Get template and render message
        const template = TEMPLATES[type];
        if (!template) {
          throw new Error(`Template not found for type: ${type}`);
        }

        const content = typeof notification.content === 'string' 
          ? JSON.parse(notification.content) 
          : notification.content;
        
        const message = template(content);

        // Update status to sending
        await notificationStorage.updateStatus(notificationId, 'sending');

        // Send notification with rate limiting
        const sentMessage = await scheduleNotification(userId, async () => {
          return await bot.telegram.sendMessage(userId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
        });

        // Update status to sent
        await notificationStorage.updateStatus(notificationId, 'sent', {
          sentAt: new Date(),
          telegramMessageId: sentMessage.message_id.toString()
        });

        // Update user's last notification time
        await notificationStorage.updateLastNotificationTime(userId);

        console.log(`[NotificationWorker] Notification ${notificationId} sent successfully`);
        return { status: 'sent', messageId: sentMessage.message_id };

      } catch (error) {
        console.error(`[NotificationWorker] Error processing notification ${notificationId}:`, error);

        // Handle specific Telegram API errors
        if (error.response) {
          const errorCode = error.response.error_code;
          const description = error.response.description;

          // Bot blocked by user (403)
          if (errorCode === 403) {
            await notificationStorage.markBotBlocked(userId, true);
            await notificationStorage.updateStatus(notificationId, 'failed', {
              errorMessage: `Bot blocked: ${description}`
            });
            console.log(`[NotificationWorker] User ${userId} blocked the bot`);
            return { status: 'failed', reason: 'bot_blocked' };
          }

          // Chat not found (400)
          if (errorCode === 400 && description.includes('chat not found')) {
            await notificationStorage.updateStatus(notificationId, 'failed', {
              errorMessage: `Chat not found: ${description}`
            });
            console.log(`[NotificationWorker] Chat not found for user ${userId}`);
            return { status: 'failed', reason: 'chat_not_found' };
          }

          // Rate limit (429) - will be retried by BullMQ
          if (errorCode === 429) {
            const retryAfter = error.response.parameters?.retry_after || 60;
            console.log(`[NotificationWorker] Rate limited, retry after ${retryAfter}s`);
            throw new Error(`Rate limited: retry after ${retryAfter}s`);
          }
        }

        // Increment retry count
        const currentRetryCount = notification.retry_count || 0;
        await notificationStorage.updateStatus(notificationId, 'pending', {
          retryCount: currentRetryCount + 1,
          errorMessage: error.message
        });

        // Re-throw to trigger BullMQ retry mechanism
        throw error;
      }
    },
      {
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
              console.error('[NotificationWorker] Redis connection failed after 10 attempts');
              return null; // Stop retrying
            }
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false // Don't queue commands when offline
        },
        concurrency: 3, // Reduced from 5 to 3 to lower CPU usage
        limiter: {
          max: 15, // Reduced from 20 to 15
          duration: 60000 // per minute
        }
      }
    );

    // Worker event handlers
    worker.on('completed', (job) => {
      console.log(`[NotificationWorker] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
      console.error('[NotificationWorker] Worker error:', err.message);
      // Don't crash on connection errors
      if (err.message.includes('ECONNREFUSED') || err.message.includes('Connection')) {
        console.warn('[NotificationWorker] Redis connection error, worker will retry');
      }
    });

    worker.on('closed', () => {
      console.log('[NotificationWorker] Worker closed');
    });

    console.log('[NotificationWorker] Worker started successfully');
    return worker;
  } catch (error) {
    console.error('[NotificationWorker] Failed to start worker:', error.message);
    // Return a dummy worker object to prevent crashes
    return {
      close: async () => {},
      on: () => {}
    };
  }
}

/**
 * Gracefully shutdown the worker
 * @param {Worker} worker - Worker instance to close
 */
export async function stopNotificationWorker(worker) {
  await worker.close();
  console.log('[NotificationWorker] Worker stopped');
}





