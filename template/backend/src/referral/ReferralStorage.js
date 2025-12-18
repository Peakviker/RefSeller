import pg from 'pg';
const { Pool } = pg;
import { eventBus } from '../app/Application.js';

/**
 * Хранилище реферальной системы на PostgreSQL
 * Структура таблицы users:
 * - id: VARCHAR(255) PRIMARY KEY
 * - username: VARCHAR(255)
 * - referrer_id: VARCHAR(255) (внешний ключ на users.id)
 * - earnings_level1: DECIMAL(10, 2) - 30% с первого уровня
 * - earnings_level2: DECIMAL(10, 2) - 10% со второго уровня
 * - joined_at: TIMESTAMP
 */

class ReferralStorage {
    constructor() {
        this.pool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'telegram_bot',
            user: process.env.POSTGRES_USER || 'telegram',
            password: process.env.POSTGRES_PASSWORD
        });
        
        this.initDatabase();
    }

    async initDatabase() {
        const client = await this.pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(255),
                    referrer_id VARCHAR(255),
                    earnings_level1 DECIMAL(10, 2) DEFAULT 0,
                    earnings_level2 DECIMAL(10, 2) DEFAULT 0,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_referrer_id ON users(referrer_id);
            `);
            console.log('✅ Database initialized');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
        } finally {
            client.release();
        }
    }

    /**
     * Регистрирует нового пользователя или обновляет существующего
     */
    async registerUser(userId, username, referrerId = null) {
        const userIdStr = String(userId);
        const referrerIdStr = referrerId ? String(referrerId) : null;

        try {
            // Проверяем, существует ли пользователь
            const existing = await this.pool.query(
                'SELECT * FROM users WHERE id = $1',
                [userIdStr]
            );

            // Если пользователь существует и у него уже есть реферер, не меняем
            if (existing.rows.length > 0 && existing.rows[0].referrer_id) {
                console.log(`User ${userIdStr} already has referrer`);
                return existing.rows[0];
            }

            // Создаем или обновляем пользователя
            const result = await this.pool.query(
                `INSERT INTO users (id, username, referrer_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id) 
                 DO UPDATE SET username = $2, referrer_id = COALESCE(users.referrer_id, $3)
                 RETURNING *`,
                [userIdStr, username || 'Unknown', referrerIdStr]
            );

            console.log(`✅ User ${userIdStr} registered with referrer ${referrerIdStr}`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error registering user:', error);
            return null;
        }
    }

    /**
     * Получить данные пользователя
     */
    async getUser(userId) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM users WHERE id = $1',
                [String(userId)]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error getting user:', error);
            return null;
        }
    }

    /**
     * Добавить заработок рефереру
     */
    async addEarnings(userId, amount, level = 1) {
        const userIdStr = String(userId);
        const column = `earnings_level${level}`;
        
        try {
            // Get user before update to calculate new balance
            const userBefore = await this.getUser(userIdStr);
            
            await this.pool.query(
                `UPDATE users SET earnings_level${level} = earnings_level${level} + $1 WHERE id = $2`,
                [amount, userIdStr]
            );
            
            // Get updated user
            const userAfter = await this.getUser(userIdStr);
            const newBalance = parseFloat(userAfter.earnings_level1 || 0) + parseFloat(userAfter.earnings_level2 || 0);
            
            // Emit income_credited event for notification
            eventBus.emit('referral.income_credited', {
                eventType: 'referral.income_credited',
                userId: userIdStr,
                income: {
                    amount: amount,
                    currency: 'RUB',
                    fromReferralId: null, // Will be set by processSale
                    fromReferralUsername: null,
                    referralLevel: level,
                    newBalance: newBalance,
                    transactionId: `txn_${Date.now()}`,
                    creditedAt: new Date().toISOString()
                }
            });
            
            console.log(`💰 Added ${amount} earnings to user ${userIdStr} (level${level})`);
        } catch (error) {
            console.error('❌ Error adding earnings:', error);
        }
    }

    /**
     * Обработать продажу и начислить процент рефереру
     */
    async processSale(userId, saleAmount) {
        const user = await this.getUser(userId);
        if (!user) {
            console.log(`User ${userId} not found`);
            return;
        }

        // Начисляем 30% реферу первого уровня
        if (user.referrer_id) {
            const level1Earning = saleAmount * 0.30;
            
            // Emit referral.purchase event before crediting
            eventBus.emit('referral.purchase', {
                eventType: 'referral.purchase',
                referrerId: user.referrer_id,
                referral: {
                    userId: String(userId),
                    username: user.username
                },
                purchase: {
                    amount: saleAmount,
                    currency: 'RUB',
                    expectedReward: level1Earning,
                    rewardPercentage: 30,
                    createdAt: new Date().toISOString()
                }
            });
            
            await this.addEarnings(user.referrer_id, level1Earning, 1);
            
            // Начисляем 10% реферу второго уровня
            const referrer = await this.getUser(user.referrer_id);
            if (referrer?.referrer_id) {
                const level2Earning = saleAmount * 0.10;
                
                // Emit referral.purchase event for level 2
                eventBus.emit('referral.purchase', {
                    eventType: 'referral.purchase',
                    referrerId: referrer.referrer_id,
                    referral: {
                        userId: String(userId),
                        username: user.username
                    },
                    purchase: {
                        amount: saleAmount,
                        currency: 'RUB',
                        expectedReward: level2Earning,
                        rewardPercentage: 10,
                        createdAt: new Date().toISOString()
                    }
                });
                
                await this.addEarnings(referrer.referrer_id, level2Earning, 2);
            }
        }
    }
    
    /**
     * Получить количество рефералов пользователя
     */
    async getReferralCount(userId) {
        try {
            const result = await this.pool.query(
                'SELECT COUNT(*) as count FROM users WHERE referrer_id = $1',
                [String(userId)]
            );
            return parseInt(result.rows[0]?.count || 0);
        } catch (error) {
            console.error('❌ Error getting referral count:', error);
            return 0;
        }
    }

    /**
     * Получить статистику пользователя
     */
    async getUserStats(userId) {
        const userIdStr = String(userId);
        
        try {
            const userResult = await this.pool.query(
                'SELECT * FROM users WHERE id = $1',
                [userIdStr]
            );
            
            if (userResult.rows.length === 0) return null;
            
            const user = userResult.rows[0];
            
            // Получаем рефералов
            const referralsResult = await this.pool.query(
                'SELECT id, username, joined_at FROM users WHERE referrer_id = $1 ORDER BY joined_at DESC',
                [userIdStr]
            );

            return {
                userId: userIdStr,
                username: user.username,
                referralsCount: referralsResult.rows.length,
                referrals: referralsResult.rows.map(ref => ({
                    id: ref.id,
                    username: ref.username,
                    joinedAt: ref.joined_at
                })),
                totalEarnings: parseFloat(user.earnings_level1 || 0) + parseFloat(user.earnings_level2 || 0),
                earningsByLevel: {
                    level1: parseFloat(user.earnings_level1 || 0),
                    level2: parseFloat(user.earnings_level2 || 0)
                },
                joinedAt: user.joined_at
            };
        } catch (error) {
            console.error('❌ Error getting user stats:', error);
            return null;
        }
    }

    /**
     * Получить всех пользователей
     */
    async getAllUsers() {
        try {
            const result = await this.pool.query('SELECT * FROM users ORDER BY joined_at DESC');
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting all users:', error);
            return [];
        }
    }

    /**
     * Закрыть пул соединений (для graceful shutdown)
     */
    async close() {
        await this.pool.end();
        console.log('Database connection pool closed');
    }
}

// Singleton instance
const storage = new ReferralStorage();

export default storage;
