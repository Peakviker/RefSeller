/**
 * Cleanup script for archiving old notifications
 * Run periodically (e.g., monthly) to archive notifications older than 6 months
 * 
 * Usage: node src/notification/cleanup.js
 */

import notificationStorage from './NotificationStorage.js';

/**
 * Archive old notifications to reduce database size
 * @param {number} monthsOld - Archive notifications older than this many months
 * @returns {Promise<Object>} Cleanup statistics
 */
async function archiveOldNotifications(monthsOld = 6) {
  console.log(`[Cleanup] Starting cleanup for notifications older than ${monthsOld} months...`);
  
  try {
    // Archive sent notifications older than specified months
    const archiveResult = await notificationStorage.pool.query(
      `WITH archived AS (
        DELETE FROM notifications 
        WHERE status = 'sent' 
          AND sent_at < NOW() - INTERVAL '${monthsOld} months'
        RETURNING *
      )
      SELECT COUNT(*) as count FROM archived`
    );
    
    const archivedCount = parseInt(archiveResult.rows[0]?.count || 0);
    
    // Clean up old failed notifications (older than 30 days)
    const failedResult = await notificationStorage.pool.query(
      `DELETE FROM notifications 
       WHERE status = 'failed' 
         AND created_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );
    
    const failedCount = failedResult.rowCount;
    
    // Clean up cancelled notifications (older than 30 days)
    const cancelledResult = await notificationStorage.pool.query(
      `DELETE FROM notifications 
       WHERE status = 'cancelled' 
         AND created_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );
    
    const cancelledCount = cancelledResult.rowCount;
    
    // Clean up completed queue entries (older than 7 days)
    const queueResult = await notificationStorage.pool.query(
      `DELETE FROM notification_queue 
       WHERE status IN ('completed', 'failed') 
         AND processed_at < NOW() - INTERVAL '7 days'
       RETURNING id`
    );
    
    const queueCount = queueResult.rowCount;
    
    const stats = {
      archivedNotifications: archivedCount,
      deletedFailed: failedCount,
      deletedCancelled: cancelledCount,
      deletedQueueEntries: queueCount,
      timestamp: new Date().toISOString()
    };
    
    console.log('[Cleanup] Cleanup completed:');
    console.log(`  - Archived notifications: ${archivedCount}`);
    console.log(`  - Deleted failed: ${failedCount}`);
    console.log(`  - Deleted cancelled: ${cancelledCount}`);
    console.log(`  - Deleted queue entries: ${queueCount}`);
    
    return stats;
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Vacuum database to reclaim space
 */
async function vacuumDatabase() {
  console.log('[Cleanup] Running VACUUM on notification tables...');
  
  try {
    await notificationStorage.pool.query('VACUUM ANALYZE notifications');
    await notificationStorage.pool.query('VACUUM ANALYZE notification_queue');
    await notificationStorage.pool.query('VACUUM ANALYZE notification_preferences');
    
    console.log('[Cleanup] VACUUM completed');
  } catch (error) {
    console.error('[Cleanup] Error during VACUUM:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  console.log('[Cleanup] Fetching database statistics...');
  
  try {
    const notificationsResult = await notificationStorage.pool.query(
      `SELECT 
        status,
        COUNT(*) as count,
        pg_size_pretty(pg_total_relation_size('notifications')) as table_size
       FROM notifications 
       GROUP BY status`
    );
    
    const queueResult = await notificationStorage.pool.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM notification_queue 
       GROUP BY status`
    );
    
    const preferencesResult = await notificationStorage.pool.query(
      `SELECT COUNT(*) as count FROM notification_preferences`
    );
    
    console.log('\n[Cleanup] Database Statistics:');
    console.log('\nNotifications by status:');
    notificationsResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    console.log('\nQueue by status:');
    queueResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    console.log(`\nTotal preferences: ${preferencesResult.rows[0].count}`);
    console.log(`Table size: ${notificationsResult.rows[0]?.table_size || 'N/A'}\n`);
  } catch (error) {
    console.error('[Cleanup] Error fetching stats:', error);
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function main() {
  try {
    console.log('[Cleanup] ========================================');
    console.log('[Cleanup] Notification System Cleanup Started');
    console.log('[Cleanup] ========================================\n');
    
    // Show stats before cleanup
    await getDatabaseStats();
    
    // Run cleanup
    const stats = await archiveOldNotifications(6);
    
    // Vacuum database
    await vacuumDatabase();
    
    // Show stats after cleanup
    await getDatabaseStats();
    
    console.log('\n[Cleanup] ========================================');
    console.log('[Cleanup] Cleanup Completed Successfully');
    console.log('[Cleanup] ========================================\n');
    
    // Close database connection
    await notificationStorage.close();
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup] Cleanup failed:', error);
    await notificationStorage.close();
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { archiveOldNotifications, vacuumDatabase, getDatabaseStats };





