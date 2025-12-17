import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPayment, getPaymentInfo } from '../payment/YooKassa.js';
import { getProduct, getAllProducts } from '../shop/Products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8000
export const MESSAGE_PATH = "/message"

export function launchApi() {
    // Setup HTTP api
    const api = express()
    api.use(express.json())
    api.use(cors())

    // API эндпоинты для магазина
    setupShopRoutes(api);

    // Раздача статических файлов из build папки веб-приложения
    const webBuildPath = path.join(__dirname, '../../web/build');
    api.use(express.static(webBuildPath));

    // Все остальные запросы отправляем на index.html (для React Router)
    api.get('*', (req, res) => {
        // Пропускаем API эндпоинты
        if (req.path.startsWith('/message') || req.path.startsWith('/api/')) {
            return;
        }
        res.sendFile(path.join(webBuildPath, 'index.html'));
    });

    // Listen to server start on port
    api.listen(PORT, () => console.log(`express is up on port ${PORT}`))

    return api
}

function setupShopRoutes(api) {
    // Получить все товары
    api.get('/api/products', (req, res) => {
        try {
            const products = getAllProducts();
            res.json({ success: true, products });
        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Получить конкретный товар
    api.get('/api/products/:productId', (req, res) => {
        try {
            const product = getProduct(req.params.productId);
            if (!product) {
                return res.status(404).json({ success: false, error: 'Product not found' });
            }
            res.json({ success: true, product });
        } catch (error) {
            console.error('Error getting product:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Создать платеж
    api.post('/api/payment/create', async (req, res) => {
        try {
            const { productId, userId, username } = req.body;

            if (!productId || !userId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing required fields: productId, userId' 
                });
            }

            const product = getProduct(productId);
            if (!product) {
                return res.status(404).json({ success: false, error: 'Product not found' });
            }

            // Создаём платёж через YooKassa
            const payment = await createPayment({
                amount: product.price,
                currency: product.currency,
                description: `Покупка: ${product.name}`,
                returnUrl: process.env.APP_URL || 'https://t.me/your_bot',
                metadata: {
                    productId: product.id,
                    userId: userId,
                    username: username || 'unknown'
                }
            });

            res.json({
                success: true,
                paymentId: payment.id,
                confirmationUrl: payment.confirmation.confirmation_url,
                status: payment.status,
                amount: payment.amount
            });
        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Получить статус платежа
    api.get('/api/payment/status/:paymentId', async (req, res) => {
        try {
            const payment = await getPaymentInfo(req.params.paymentId);
            res.json({
                success: true,
                paymentId: payment.id,
                status: payment.status,
                paid: payment.paid,
                amount: payment.amount,
                metadata: payment.metadata
            });
        } catch (error) {
            console.error('Error getting payment status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Webhook для уведомлений от YooKassa
    api.post('/api/payment/webhook', async (req, res) => {
        try {
            const notification = req.body;
            const event = notification.event;
            const payment = notification.object;

            console.log(`📬 Webhook received: ${event}, Payment ID: ${payment.id}`);

            switch (event) {
                case 'payment.succeeded':
                    // Успешный платёж - выдаём товар пользователю
                    console.log(`✅ Payment ${payment.id} succeeded`);
                    console.log(`   User: ${payment.metadata?.userId}`);
                    console.log(`   Product: ${payment.metadata?.productId}`);
                    console.log(`   Amount: ${payment.amount.value} ${payment.amount.currency}`);
                    
                    // TODO: Выдать товар пользователю
                    // await grantProductToUser(payment.metadata.userId, payment.metadata.productId);
                    // await notifyUserAboutPurchase(payment.metadata.userId, payment.metadata.productId);
                    break;

                case 'payment.waiting_for_capture':
                    // Платёж ожидает подтверждения (для двухстадийных платежей)
                    console.log(`⏳ Payment ${payment.id} waiting for capture`);
                    console.log(`   Amount: ${payment.amount.value} ${payment.amount.currency}`);
                    
                    // Если используете автоматическое подтверждение (capture: true),
                    // это событие может не приходить
                    break;

                case 'payment.canceled':
                    // Платёж отменён или ошибка оплаты
                    console.log(`❌ Payment ${payment.id} canceled`);
                    console.log(`   Reason: ${payment.cancellation_details?.reason || 'unknown'}`);
                    console.log(`   User: ${payment.metadata?.userId}`);
                    
                    // TODO: Уведомить пользователя об отмене
                    // await notifyUserAboutCancellation(payment.metadata.userId, payment.id);
                    break;

                case 'refund.succeeded':
                    // Успешный возврат денег
                    const refund = notification.object;
                    console.log(`💰 Refund ${refund.id} succeeded`);
                    console.log(`   Payment ID: ${refund.payment_id}`);
                    console.log(`   Amount: ${refund.amount.value} ${refund.amount.currency}`);
                    
                    // TODO: Забрать товар у пользователя при возврате
                    // await revokeProductFromUser(userId, productId);
                    // await notifyUserAboutRefund(userId, refund.id);
                    break;

                default:
                    console.log(`⚠️ Unknown webhook event: ${event}`);
            }

            // Отвечаем YooKassa что webhook обработан
            res.json({ success: true });
        } catch (error) {
            console.error('❌ Error processing webhook:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
}
