import { YooCheckout } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid';

// Инициализация YooKassa клиента
let yooKassa = null;

export function initYooKassa(shopId, secretKey) {
    yooKassa = new YooCheckout({
        shopId: shopId,
        secretKey: secretKey
    });
    console.log('YooKassa initialized');
}

/**
 * Создать платеж
 * @param {Object} params - параметры платежа
 * @param {number} params.amount - сумма платежа
 * @param {string} params.currency - валюта (RUB, USD и т.д.)
 * @param {string} params.description - описание платежа
 * @param {string} params.returnUrl - URL для возврата после оплаты
 * @param {Object} params.metadata - дополнительные данные
 * @returns {Promise<Object>} - объект платежа
 */
export async function createPayment({ amount, currency, description, returnUrl, metadata }) {
    if (!yooKassa) {
        throw new Error('YooKassa not initialized');
    }

    const idempotenceKey = uuidv4();
    
    try {
        const payment = await yooKassa.createPayment({
            amount: {
                value: amount.toFixed(2),
                currency: currency
            },
            confirmation: {
                type: 'redirect',
                return_url: returnUrl
            },
            description: description,
            metadata: metadata,
            capture: true // Автоматическое подтверждение платежа
        }, idempotenceKey);

        return payment;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
}

/**
 * Получить информацию о платеже
 * @param {string} paymentId - ID платежа
 * @returns {Promise<Object>} - объект платежа
 */
export async function getPaymentInfo(paymentId) {
    if (!yooKassa) {
        throw new Error('YooKassa not initialized');
    }

    try {
        const payment = await yooKassa.getPayment(paymentId);
        return payment;
    } catch (error) {
        console.error('Error getting payment info:', error);
        throw error;
    }
}

/**
 * Создать возврат
 * @param {string} paymentId - ID платежа
 * @param {number} amount - сумма возврата
 * @param {string} currency - валюта
 * @returns {Promise<Object>} - объект возврата
 */
export async function createRefund(paymentId, amount, currency) {
    if (!yooKassa) {
        throw new Error('YooKassa not initialized');
    }

    const idempotenceKey = uuidv4();

    try {
        const refund = await yooKassa.createRefund({
            payment_id: paymentId,
            amount: {
                value: amount.toFixed(2),
                currency: currency
            }
        }, idempotenceKey);

        return refund;
    } catch (error) {
        console.error('Error creating refund:', error);
        throw error;
    }
}

