import referralStorage from '../referral/ReferralStorage.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export const REFERRAL_STATS_PATH = "/referral/stats/:userId";
export const REFERRAL_SALE_PATH = "/referral/sale";
export const REFERRAL_REGISTER_PATH = "/referral/register";

/**
 * Настраивает endpoints для реферальной системы
 * @param api Express app instance
 */
export function setupReferralEndpoints(api) {
    // Регистрация пользователя при открытии Mini App
    api.post('/referral/register', asyncHandler(async (request, response) => {
        const { userId, username, referrerId } = request.body;
        
        if (!userId) {
            throw new ValidationError('userId is required');
        }
        
        const user = await referralStorage.registerUser(
            userId, 
            username || 'Unknown', 
            referrerId || null
        );
        
        if (!user) {
            throw new Error('Failed to register user');
        }
        
        logger.info('User registered via API', { userId, username, referrerId });
        
        response.status(200).json({
            success: true,
            data: user
        });
    }));
    // Получить статистику пользователя
    api.get('/referral/stats/:userId', asyncHandler(async (request, response) => {
        const { userId } = request.params;
        
        if (!userId) {
            throw new ValidationError('userId is required');
        }
        
        const stats = await referralStorage.getUserStats(userId);
        
        if (!stats) {
            throw new NotFoundError('User', userId);
        }
        
        logger.info('Referral stats fetched', { userId });
        
        response.status(200).json({
            success: true,
            data: stats
        });
    }));
    
    // Обработать продажу (для тестирования реферальной системы)
    api.post('/referral/sale', asyncHandler(async (request, response) => {
        const { userId, amount } = request.body;
        
        if (!userId || !amount) {
            throw new ValidationError('userId and amount are required');
        }
        
        if (amount <= 0) {
            throw new ValidationError('amount must be greater than 0');
        }
        
        // Обрабатываем продажу и начисляем процент рефереру
        await referralStorage.processSale(userId, amount);
        
        logger.info('Sale processed', { userId, amount });
        
        response.status(200).json({
            success: true,
            message: 'Sale processed successfully'
        });
    }));
    
    // Получить всех пользователей (для админки)
    api.get('/referral/users', asyncHandler(async (request, response) => {
        const users = await referralStorage.getAllUsers();
        
        logger.info('All users fetched', { count: users.length });
        
        response.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    }));
}

