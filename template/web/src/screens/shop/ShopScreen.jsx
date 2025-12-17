import React, { useState, useEffect } from 'react';
import TelegramScreen from "../../components/kit/Screen/TelegramScreen";
import TelegramText from "../../components/kit/Text/TelegramText";
import ProductCard from "../../components/app/shop/ProductCard";
import { API_URL } from "../../logic/server/Variables";
import './ShopScreen.css';

const ShopScreen = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/products`);
            const data = await response.json();
            
            if (data.success) {
                setProducts(data.products);
            } else {
                setError('Не удалось загрузить товары');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TelegramScreen showbackbutton={true}>
            <TelegramText className={'telegramTitle'}>🛍️ Магазин</TelegramText>
            <TelegramText className={'telegramSubtitle'}>
                Купите медвежонка и другие товары
            </TelegramText>

            <div className="shop-products">
                {loading && <div className="shop-loading">Загрузка товаров...</div>}
                
                {error && <div className="shop-error">{error}</div>}
                
                {!loading && !error && products.length === 0 && (
                    <div className="shop-empty">Товары не найдены</div>
                )}
                
                {!loading && !error && products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </TelegramScreen>
    );
};

export default ShopScreen;

