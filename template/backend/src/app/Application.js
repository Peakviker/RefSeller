import { EventEmitter } from 'events';
import { launchBot } from "../telegram/Bot.js";
import {launchApi, MESSAGE_PATH} from "../http/Api.js";
import {setupReferralEndpoints} from "../http/ReferralApi.js";
import { setupNotificationRoutes } from "../http/NotificationApi.js";
import { initYooKassa } from "../payment/YooKassa.js";
import NotificationService from "../notification/NotificationService.js";
import { startNotificationWorker } from "../notification/NotificationWorker.js";
import { startCleanupInterval, stopCleanupInterval } from "../notification/NotificationRateLimiter.js";
import logger from "../utils/logger.js";
import { 
    setupUnhandledRejectionHandler, 
    setupUncaughtExceptionHandler,
    createShutdownHandler,
    notFoundHandler
} from "../utils/errorHandler.js";

/**
 * Global event bus for inter-module communication
 * Used by notification system to listen to events from payment, referral, etc.
 */
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(20); // Increase limit for multiple listeners

/**
 * This is the entry point of our app
 * Call this method inside index.js to launch the bot and the api
 *
 */
export function launchApp() {
    // Setup global error handlers
    setupUnhandledRejectionHandler();
    setupUncaughtExceptionHandler();
    
    logger.info('🚀 Starting Telegram Mini App...');
    
    // Initialize YooKassa
    if (process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
        initYooKassa(process.env.YOOKASSA_SHOP_ID, process.env.YOOKASSA_SECRET_KEY);
        logger.info('💳 YooKassa initialized');
    } else {
        logger.warn('YooKassa credentials not found in environment variables');
    }

    // Read token from .env file and use it to launch telegram bot
    const bot = launchBot(process.env.BOT_TOKEN);
    logger.info('🤖 Telegram Bot launched');

    // Launch api
    const api = launchApi();
    logger.info('🌐 Express API launched');

    // Setup referral endpoints
    setupReferralEndpoints(api);
    logger.info('📊 Referral endpoints configured');

    // Setup notification API endpoints
    setupNotificationRoutes(api);
    logger.info('🔔 Notification endpoints configured');

    // Регистрируем 404 handlers ПОСЛЕ всех роутов
    api.use('/api/*', notFoundHandler);
    api.use('/referral/*', notFoundHandler);
    api.use('/notifications/*', notFoundHandler);
    logger.info('📋 404 handlers registered for API routes');

    // Initialize notification system
    if (process.env.NOTIFICATION_QUEUE_ENABLED !== 'false') {
        let notificationService = null;
        let notificationWorker = null;
        
        try {
            notificationService = new NotificationService(bot, eventBus);
            
            // Only start worker if service is enabled
            if (notificationService.isEnabled) {
                notificationWorker = startNotificationWorker(bot);
                
                // Start cleanup interval for rate limiter (prevents memory leaks)
                // Increased interval to 30 minutes to reduce CPU usage
                startCleanupInterval(30 * 60 * 1000);
                logger.info('🧹 Rate limiter cleanup interval started (30 min)');
            } else {
                logger.warn('⚠️  Notification service disabled - Redis unavailable');
            }
        } catch (error) {
            logger.error('Failed to initialize notification system:', error);
            logger.warn('⚠️  Continuing without notification system');
        }
        
        // Setup Bull Board dashboard for queue monitoring (T046)
        if (process.env.NODE_ENV !== 'production' || process.env.BULL_BOARD_ENABLED === 'true') {
            import('@bull-board/api').then(({ createBullBoard }) => {
                import('@bull-board/api/bullMQAdapter.js').then(({ BullMQAdapter }) => {
                    import('@bull-board/express').then(({ ExpressAdapter }) => {
                        const serverAdapter = new ExpressAdapter();
                        serverAdapter.setBasePath('/admin/queues');
                        
                        createBullBoard({
                            queues: [new BullMQAdapter(notificationService.queue)],
                            serverAdapter
                        });
                        
                        api.use('/admin/queues', serverAdapter.getRouter());
                        logger.info('📊 Bull Board dashboard available at /admin/queues');
                    });
                });
            }).catch(err => {
                logger.error('Failed to setup Bull Board:', err);
            });
        }
        
        // Graceful shutdown handlers
        const shutdownHandler = createShutdownHandler([
            async () => {
                logger.info('Stopping cleanup interval...');
                stopCleanupInterval();
            },
            async () => {
                if (notificationService) {
                    logger.info('Closing notification service...');
                    try {
                        await notificationService.close();
                    } catch (error) {
                        logger.error('Error closing notification service:', error);
                    }
                }
            },
            async () => {
                if (notificationWorker && notificationWorker.close) {
                    logger.info('Closing notification worker...');
                    try {
                        await notificationWorker.close();
                    } catch (error) {
                        logger.error('Error closing notification worker:', error);
                    }
                }
            },
            async () => {
                logger.info('Stopping Telegram bot...');
                await bot.stop('SIGTERM');
            }
        ]);
        
        process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
        process.on('SIGINT', () => shutdownHandler('SIGINT'));
        
        logger.info('🔔 Notification system initialized');
    } else {
        logger.info('Notification system disabled via env var');
    }

    // Listen to post requests on messages endpoint
    api.post(MESSAGE_PATH, async (request, response, next) => {
        await handleMessageRequest(bot, request, response, next);
    });
    
    logger.info('✅ Application started successfully');
}

// Import ValidationError for handleMessageRequest
import { ValidationError } from "../utils/errors.js";


/**
 * Receives data from the mini app and sends a simple message using answerWebAppQuery
 * @see https://core.telegram.org/bots/api#answerwebappquery
 *
 * We will use InlineQueryResult to create our message
 * @see https://core.telegram.org/bots/api#inlinequeryresult
 */
const handleMessageRequest = async (bot, request, response, next) => {
    try {
        // Read data from the request body received by the mini app
        const {queryId, message} = request.body

        if (!queryId || !message) {
            throw new ValidationError('Missing required fields: queryId, message');
        }

        // We are creating InlineQueryResultArticle
        // See https://core.telegram.org/bots/api#inlinequeryresultarticle
        const article = {
            type: 'article',
            id: queryId,
            title: 'Message from the mini app',
            input_message_content: {
                message_text: `MiniApp: ${message}`
            }
        }

        // Use queryId and data to send a message to the bot chat
        await bot.answerWebAppQuery(queryId, article);
        
        logger.info('Message sent to bot chat', { queryId, messageLength: message.length });

        // End the request with a success code
        response.status(200).json({
            success: true,
            message: 'Message sent successfully'
        });

    } catch (error) {
        logger.error('Error handling message request:', error);
        next(error);
    }
}
