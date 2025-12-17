import referralStorage from '../referral/ReferralStorage.js';

export const REFERRAL_STATS_PATH = "/referral/stats/:userId";
export const REFERRAL_SALE_PATH = "/referral/sale";

/**
 * Настраивает endpoints для реферальной системы
 * @param api Express app instance
 */
export function setupReferralEndpoints(api) {
    // Получить статистику пользователя
    api.get('/referral/stats/:userId', async (request, response) => {
        try {
            const { userId } = request.params;
            
            if (!userId) {
                return response.status(400).json({
                    error: 'userId is required'
                });
            }
            
            const stats = await referralStorage.getUserStats(userId);
            
            if (!stats) {
                return response.status(404).json({
                    error: 'User not found'
                });
            }
            
            response.status(200).json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Error getting referral stats:', error);
            response.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });
    
    // Обработать продажу (для тестирования реферальной системы)
    api.post('/referral/sale', async (request, response) => {
        try {
            const { userId, amount } = request.body;
            
            if (!userId || !amount) {
                return response.status(400).json({
                    error: 'userId and amount are required'
                });
            }
            
            if (amount <= 0) {
                return response.status(400).json({
                    error: 'amount must be greater than 0'
                });
            }
            
            // Обрабатываем продажу и начисляем процент рефереру
            await referralStorage.processSale(userId, amount);
            
            response.status(200).json({
                success: true,
                message: 'Sale processed successfully'
            });
            
        } catch (error) {
            console.error('Error processing sale:', error);
            response.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });
    
    // Получить всех пользователей (для админки)
    api.get('/referral/users', async (request, response) => {
        try {
            const users = await referralStorage.getAllUsers();
            
            response.status(200).json({
                success: true,
                count: users.length,
                data: users
            });
            
        } catch (error) {
            console.error('Error getting all users:', error);
            response.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });
}

