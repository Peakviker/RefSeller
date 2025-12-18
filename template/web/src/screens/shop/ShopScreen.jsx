import React, { useEffect, useRef } from 'react';
import TelegramScreen from "../../components/kit/Screen/TelegramScreen";
import TelegramText from "../../components/kit/Text/TelegramText";
import ProductCard from "../../components/app/shop/ProductCard";
import { API_URL } from "../../logic/server/Variables";
import { useProductsStore } from "../../stores/productsStore";
import { useGet } from "../../hooks/useApiRequest";
import './ShopScreen.css';

const ShopScreen = () => {
    const isMountedRef = useRef(true);
    
    // Zustand store
    const { 
        products, 
        loading, 
        error, 
        setProducts, 
        setLoading, 
        setError,
        shouldFetch 
    } = useProductsStore();
    
    // API hook
    const { get } = useGet(`${API_URL}/api/products`, {
        showErrorAlert: true,
        retryConfig: { maxRetries: 3 },
        onSuccess: (data) => {
            if (isMountedRef.current && data.success) {
                setProducts(data.products);
            }
        },
        onError: (err) => {
            if (isMountedRef.current) {
                setError(err.message);
            }
        }
    });

    useEffect(() => {
        isMountedRef.current = true;
        // Проверяем кэш перед загрузкой
        if (shouldFetch()) {
            if (isMountedRef.current) {
                setLoading(true);
            }
            get();
        }
        return () => {
            isMountedRef.current = false;
        };
        // get теперь стабилен благодаря исправлению useGet
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [get]);

    return (
        <TelegramScreen showbackbutton={true}>
            <TelegramText className={'telegramTitle'}>🛍️ Магазин</TelegramText>
            <TelegramText className={'telegramSubtitle'}>
                Купите медвежонка и другие товары
            </TelegramText>

            <div className="shop-products">
                {loading && <div className="shop-loading">⏳ Загрузка товаров...</div>}
                
                {error && (
                    <div className="shop-error">
                        <p>{String(error)}</p>
                        <button onClick={() => get()} className="retry-button">
                            Попробовать снова
                        </button>
                    </div>
                )}
                
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





