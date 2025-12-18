import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { createPayment, getPaymentInfo } from '../payment/YooKassa.js';
import { getProduct, getAllProducts } from '../shop/Products.js';
import { eventBus } from '../app/Application.js';
import logger from '../utils/logger.js';
import { errorHandler, notFoundHandler, asyncHandler } from '../utils/errorHandler.js';
import { NotFoundError, ValidationError, PaymentError } from '../utils/errors.js';
import { swaggerSpec } from '../swagger/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
export const MESSAGE_PATH = "/message";

export function launchApi() {
    // Setup HTTP api
    const api = express();
    
    // Middleware
    api.use(express.json());
    api.use(cors());
    
    // Request logging middleware
    api.use((req, res, next) => {
        logger.logRequest(req);
        next();
    });
    
    // Swagger documentation
    api.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Telegram Mini App API Documentation'
    }));
    
    // Swagger JSON endpoint
    api.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // API эндпоинты для магазина
    setupShopRoutes(api);

    // Раздача статических файлов из build папки веб-приложения
    const webBuildPath = path.join(__dirname, '../../web/build');
    logger.info('📁 Web build path:', { path: webBuildPath });
    
    // Проверяем существование директории build
    const buildExists = fs.existsSync(webBuildPath);
    if (!buildExists) {
        logger.warn('⚠️  Web build directory not found:', { path: webBuildPath });
        logger.warn('⚠️  Static files will not be served. Make sure to build the frontend first.');
    } else {
        // Раздача статических файлов
        api.use(express.static(webBuildPath, { 
            index: false, // Не использовать index.html автоматически
            fallthrough: true, // Продолжать обработку если файл не найден
            setHeaders: (res, path) => {
                // Отключаем кэширование для HTML и JS файлов
                if (path.endsWith('.html') || path.endsWith('.js')) {
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                }
            }
        }));
    }

    // Явный обработчик для корневого пути
    api.get('/', (req, res, next) => {
        if (buildExists) {
            const indexPath = path.join(webBuildPath, 'index.html');
            // Проверяем существование каждый раз (не кэшируем)
            if (fs.existsSync(indexPath)) {
                // Отключаем кэширование для index.html
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.sendFile(indexPath);
            } else {
                logger.error('index.html not found in build directory');
                res.status(503).json({ 
                    success: false, 
                    error: 'Frontend index.html not found' 
                });
            }
        } else {
            res.status(503).json({ 
                success: false, 
                error: 'Frontend not built. Please build the frontend first.' 
            });
        }
    });

    // Все остальные запросы отправляем на index.html (для React Router)
    // ВАЖНО: этот роут должен быть ПОСЛЕ всех API роутов, поэтому он регистрируется здесь,
    // но реально будет обрабатывать только запросы, которые не были обработаны другими роутами
    api.get('*', (req, res, next) => {
        // Пропускаем API эндпоинты - они должны быть обработаны раньше
        // Если запрос дошел сюда, значит он не был обработан другими роутами
        if (req.path.startsWith('/message') || 
            req.path.startsWith('/api/') || 
            req.path.startsWith('/referral/') ||
            req.path.startsWith('/notifications/') ||
            req.path.startsWith('/admin/') ||
            req.path.startsWith('/api-docs')) {
            // Если это API путь, но он дошел сюда, значит роут не найден
            // Передаем дальше к 404 handler
            return next();
        }
        
        // Проверяем существование файла перед отправкой
        if (buildExists) {
            const indexPath = path.join(webBuildPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                // Отключаем кэширование для index.html
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.sendFile(indexPath);
            } else {
                next(); // Передаем дальше если index.html не найден
            }
        } else {
            next(); // Передаем дальше если build не существует
        }
    });
    
    // 404 handler for API routes (будет зарегистрирован после setupReferralEndpoints в Application.js)
    // Удалено отсюда, чтобы не перехватывать роуты до их регистрации
    
    // Global error handler (must be last)
    api.use(errorHandler);

    // Listen to server start on port
    api.listen(PORT, () => {
        logger.info(`🚀 Express server running on port ${PORT}`);
        logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    return api;
}

function setupShopRoutes(api) {
    /**
     * @swagger
     * /api/products:
     *   get:
     *     summary: Получить список всех товаров
     *     tags: [Shop]
     *     responses:
     *       200:
     *         description: Список товаров успешно получен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 products:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Product'
     *       500:
     *         $ref: '#/components/responses/ServerError'
     */
    api.get('/api/products', asyncHandler(async (req, res) => {
        const products = getAllProducts();
        logger.info('Products fetched', { count: products.length });
        res.json({ success: true, products });
    }));

    /**
     * @swagger
     * /api/products/{productId}:
     *   get:
     *     summary: Получить товар по ID
     *     tags: [Shop]
     *     parameters:
     *       - in: path
     *         name: productId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID товара
     *     responses:
     *       200:
     *         description: Товар найден
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 product:
     *                   $ref: '#/components/schemas/Product'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    api.get('/api/products/:productId', asyncHandler(async (req, res) => {
        const { productId } = req.params;
        const product = getProduct(productId);
        
        if (!product) {
            throw new NotFoundError('Product', productId);
        }
        
        logger.info('Product fetched', { productId });
        res.json({ success: true, product });
    }));

    /**
     * @swagger
     * /api/payment/create:
     *   post:
     *     summary: Создать платеж через YooKassa
     *     tags: [Payment]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - productId
     *               - userId
     *             properties:
     *               productId:
     *                 type: string
     *                 description: ID товара
     *               userId:
     *                 type: string
     *                 description: ID пользователя Telegram
     *               username:
     *                 type: string
     *                 description: Username пользователя
     *     responses:
     *       200:
     *         description: Платеж создан
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 paymentId:
     *                   type: string
     *                 confirmationUrl:
     *                   type: string
     *                 status:
     *                   type: string
     *                 amount:
     *                   type: object
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    api.post('/api/payment/create', asyncHandler(async (req, res) => {
        const { productId, userId, username } = req.body;

        if (!productId || !userId) {
            throw new ValidationError('Missing required fields: productId, userId');
        }

        const product = getProduct(productId);
        if (!product) {
            throw new NotFoundError('Product', productId);
        }

        // Создаём платёж через YooKassa
        try {
            const payment = await createPayment({
                amount: product.price,
                currency: product.currency,
                description: `Покупка: ${product.name}`,
                returnUrl: process.env.APP_URL || 'https://t.me/your_bot',
                metadata: {
                    productId: product.id,
                    userId: userId,
                    username: username || 'unknown'
                },
                customerEmail: `user${userId}@telegram.user`,
                receiptItem: {
                    description: product.name
                }
            });

            logger.info('Payment created', { 
                paymentId: payment.id, 
                userId, 
                productId,
                amount: payment.amount 
            });

            res.json({
                success: true,
                paymentId: payment.id,
                confirmationUrl: payment.confirmation.confirmation_url,
                status: payment.status,
                amount: payment.amount
            });
        } catch (error) {
            logger.error('Payment creation failed', { error, userId, productId });
            throw new PaymentError('Failed to create payment', error.message);
        }
    }));

    // Получить статус платежа
    api.get('/api/payment/status/:paymentId', asyncHandler(async (req, res) => {
        const { paymentId } = req.params;
        
        try {
            const payment = await getPaymentInfo(paymentId);
            
            logger.info('Payment status fetched', { paymentId, status: payment.status });
            
            res.json({
                success: true,
                paymentId: payment.id,
                status: payment.status,
                paid: payment.paid,
                amount: payment.amount,
                metadata: payment.metadata
            });
        } catch (error) {
            logger.error('Failed to get payment status', { error, paymentId });
            throw new PaymentError('Failed to get payment status', error.message);
        }
    }));

    // Webhook для уведомлений от YooKassa
    api.post('/api/payment/webhook', asyncHandler(async (req, res) => {
        const notification = req.body;
        const event = notification.event;
        const payment = notification.object;

        logger.info('📬 Webhook received', { event, paymentId: payment.id });

        switch (event) {
            case 'payment.succeeded':
                // Успешный платёж - выдаём товар пользователю
                logger.info('✅ Payment succeeded', {
                    paymentId: payment.id,
                    userId: payment.metadata?.userId,
                    productId: payment.metadata?.productId,
                    amount: `${payment.amount.value} ${payment.amount.currency}`
                });
                
                // Emit event for notification system
                eventBus.emit('payment.succeeded', {
                    eventType: 'payment.succeeded',
                    userId: payment.metadata?.userId,
                    username: payment.metadata?.username,
                    payment: {
                        id: payment.id,
                        amount: parseFloat(payment.amount.value),
                        currency: payment.amount.currency,
                        productId: payment.metadata?.productId,
                        productName: payment.description,
                        description: payment.description,
                        createdAt: payment.created_at
                    }
                });
                
                // TODO: Выдать товар пользователю
                // await grantProductToUser(payment.metadata.userId, payment.metadata.productId);
                break;

            case 'payment.waiting_for_capture':
                // Платёж ожидает подтверждения (для двухстадийных платежей)
                logger.info('⏳ Payment waiting for capture', {
                    paymentId: payment.id,
                    amount: `${payment.amount.value} ${payment.amount.currency}`
                });
                break;

            case 'payment.canceled':
                // Платёж отменён или ошибка оплаты
                logger.warn('❌ Payment canceled', {
                    paymentId: payment.id,
                    reason: payment.cancellation_details?.reason || 'unknown',
                    userId: payment.metadata?.userId
                });
                
                // TODO: Уведомить пользователя об отмене
                // await notifyUserAboutCancellation(payment.metadata.userId, payment.id);
                break;

            case 'refund.succeeded':
                // Успешный возврат денег
                const refund = notification.object;
                logger.info('💰 Refund succeeded', {
                    refundId: refund.id,
                    paymentId: refund.payment_id,
                    amount: `${refund.amount.value} ${refund.amount.currency}`
                });
                
                // TODO: Забрать товар у пользователя при возврате
                // await revokeProductFromUser(userId, productId);
                // await notifyUserAboutRefund(userId, refund.id);
                break;

            default:
                logger.warn('⚠️ Unknown webhook event', { event });
        }

        // Отвечаем YooKassa что webhook обработан
        res.json({ success: true });
    }));
}
