import React, { useState } from 'react';
import { useTelegram } from "../../../hooks/useTelegram";
import { API_URL } from "../../../logic/server/Variables";
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { user, webApp } = useTelegram();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);

    const handleBuy = async () => {
        if (loading) return;

        setLoading(true);
        setPaymentStatus(null);

        try {
            // Создаём платёж
            const response = await fetch(`${API_URL}/api/payment/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product.id,
                    userId: user?.id || localStorage.getItem('user_id'),
                    username: user?.username || user?.first_name || 'unknown'
                })
            });

            const data = await response.json();

            if (data.success && data.confirmationUrl) {
                // Открываем страницу оплаты через Telegram WebApp
                webApp.openLink(data.confirmationUrl);
                
                // Можно также использовать openInvoice, если у вас есть invoice URL
                // webApp.openInvoice(data.confirmationUrl, (status) => {
                //     if (status === 'paid') {
                //         setPaymentStatus('success');
                //     } else {
                //         setPaymentStatus('cancelled');
                //     }
                // });
            } else {
                setPaymentStatus('error');
                console.error('Payment creation failed:', data.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            setPaymentStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-card">
            {product.image && (
                <div className="product-image">
                    {typeof product.image === 'string' ? (
                        <img src={product.image} alt={String(product.name || '')} />
                    ) : (
                        String(product.image)
                    )}
                </div>
            )}
            <div className="product-info">
                <h3 className="product-name">{String(product.name || '')}</h3>
                <p className="product-description">{String(product.description || '')}</p>
                <div className="product-footer">
                    <div className="product-price">
                        {String(product.price || 0)} {product.currency === 'RUB' ? '₽' : String(product.currency || '')}
                    </div>
                    <button 
                        className={`product-buy-button ${loading ? 'loading' : ''}`}
                        onClick={handleBuy}
                        disabled={loading}
                    >
                        {loading ? 'Обработка...' : 'Купить'}
                    </button>
                </div>
                {paymentStatus === 'success' && (
                    <div className="payment-status success">✅ Оплата прошла успешно!</div>
                )}
                {paymentStatus === 'error' && (
                    <div className="payment-status error">❌ Ошибка оплаты</div>
                )}
                {paymentStatus === 'cancelled' && (
                    <div className="payment-status cancelled">Оплата отменена</div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;

