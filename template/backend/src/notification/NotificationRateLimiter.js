/**
 * Rate limiting for Telegram Bot API notifications
 * Multi-layered approach: per-user + global throttle
 * @module NotificationRateLimiter
 */

import Bottleneck from 'bottleneck';

/**
 * User-level rate limiter: 15 notifications/minute per user (reduced from 20)
 * Prevents spam to individual users
 */
export const userLimiter = new Bottleneck({
  reservoir: 15, // 15 requests (reduced from 20)
  reservoirRefreshAmount: 15,
  reservoirRefreshInterval: 60 * 1000, // per minute
  maxConcurrent: 1 // one notification at a time per user
});

/**
 * Global rate limiter: 20 messages/second (reduced from 25)
 * Stays under Telegram's 30/sec limit with safety buffer
 */
export const globalLimiter = new Bottleneck({
  reservoir: 20, // 20 requests (reduced from 25)
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 1000, // per second
  maxConcurrent: 3 // Reduced from 5 to 3 to lower CPU usage
});

/**
 * User-specific limiters cache
 * Key: userId, Value: Bottleneck instance
 */
const userLimiters = new Map();

/**
 * Get or create user-specific limiter
 * @param {string} userId - User ID
 * @returns {Bottleneck} User-specific rate limiter
 */
export function getUserLimiter(userId) {
  if (!userLimiters.has(userId)) {
    const limiter = new Bottleneck({
      reservoir: 15, // Reduced from 20 to 15
      reservoirRefreshAmount: 15,
      reservoirRefreshInterval: 60 * 1000,
      maxConcurrent: 1
    });
    userLimiters.set(userId, limiter);
  }
  return userLimiters.get(userId);
}

/**
 * Schedule notification with rate limiting
 * Applies both user-level and global rate limiting
 * @param {string} userId - User ID
 * @param {Function} sendFn - Function to send notification
 * @returns {Promise<any>} Result of sendFn
 */
export async function scheduleNotification(userId, sendFn) {
  const userLimiter = getUserLimiter(userId);
  
  // Apply both user-level and global rate limiting
  return await globalLimiter.schedule(() => 
    userLimiter.schedule(() => sendFn())
  );
}

/**
 * Check if user has pending notifications (would be rate limited)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if rate limited
 */
export async function isUserRateLimited(userId) {
  const limiter = getUserLimiter(userId);
  const counts = limiter.counts();
  return counts.EXECUTING + counts.QUEUED >= 15; // Updated to match new limit
}

/**
 * Clear user limiter (for testing or reset)
 * @param {string} userId - User ID
 */
export function clearUserLimiter(userId) {
  const limiter = userLimiters.get(userId);
  if (limiter) {
    limiter.stop();
    userLimiters.delete(userId);
  }
}

/**
 * Get rate limiter statistics
 * @returns {Object} Statistics for monitoring
 */
export function getStats() {
  const globalCounts = globalLimiter.counts();
  const userCount = userLimiters.size;
  
  return {
    global: {
      executing: globalCounts.EXECUTING,
      queued: globalCounts.QUEUED,
      done: globalCounts.DONE
    },
    userLimiters: {
      active: userCount,
      total: userLimiters.size
    }
  };
}

/**
 * Cleanup inactive user limiters (run periodically)
 * Removes limiters with no pending or executing jobs
 * Also enforces max size limit to prevent memory leaks
 */
export function cleanupInactiveLimiters() {
  const MAX_LIMITERS = 500; // Reduced from 1000 to 500 to lower memory usage
  
  let cleaned = 0;
  
  // First, remove inactive limiters
  for (const [userId, limiter] of userLimiters.entries()) {
    try {
      const counts = limiter.counts();
      if (counts.EXECUTING === 0 && counts.QUEUED === 0) {
        limiter.stop();
        userLimiters.delete(userId);
        cleaned++;
      }
    } catch (error) {
      // If limiter is already stopped, just remove it
      userLimiters.delete(userId);
      cleaned++;
    }
  }
  
  // If still too many, remove oldest inactive ones (FIFO)
  if (userLimiters.size > MAX_LIMITERS) {
    const entries = Array.from(userLimiters.entries());
    const toRemove = entries.slice(0, userLimiters.size - MAX_LIMITERS);
    
    for (const [userId, limiter] of toRemove) {
      try {
        const counts = limiter.counts();
        if (counts.EXECUTING === 0 && counts.QUEUED === 0) {
          limiter.stop();
          userLimiters.delete(userId);
          cleaned++;
        }
      } catch (error) {
        userLimiters.delete(userId);
        cleaned++;
      }
    }
  }
  
  if (cleaned > 0) {
    console.log(`[NotificationRateLimiter] Cleaned up ${cleaned} inactive limiters`);
  }
}

/**
 * Cleanup interval reference (for cleanup on shutdown)
 */
let cleanupInterval = null;

/**
 * Start periodic cleanup of inactive limiters
 * @param {number} intervalMs - Cleanup interval in milliseconds (default: 30 minutes)
 * @returns {NodeJS.Timeout} Interval reference
 */
export function startCleanupInterval(intervalMs = 30 * 60 * 1000) {
  // Clear existing interval if any
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    try {
      cleanupInactiveLimiters();
    } catch (error) {
      console.error('[NotificationRateLimiter] Cleanup error:', error.message);
    }
  }, intervalMs);
  return cleanupInterval;
}

/**
 * Stop periodic cleanup
 */
export function stopCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}





