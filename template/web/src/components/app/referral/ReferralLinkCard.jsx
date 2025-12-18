import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useTelegram} from "../../../hooks/useTelegram";
import { useReferralStore } from "../../../stores/referralStore";
import { useGet } from "../../../hooks/useApiRequest";
import { TELEGRAM_BOT_URL, API_URL } from "../../../logic/server/Variables";
import TestSaleButton from "./TestSaleButton";
import './ReferralLinkCard.css';

const ReferralLinkCard = () => {
    const {user, webApp} = useTelegram();
    const [copied, setCopied] = useState(false);
    const isMountedRef = useRef(true);
    
    // Zustand store
    const { stats, loading, error, setStats, setLoading, setError, shouldFetch } = useReferralStore();
    
    // API hook
    const { get } = useGet(`${API_URL}/referral/stats/${user?.id}`, {
        showErrorAlert: true,
        onSuccess: (data) => {
            if (isMountedRef.current && data.success) {
                setStats(data.data);
            }
        },
        onError: (error) => {
            if (isMountedRef.current) {
                setError(error.message);
            }
        }
    });
    
    // Формируем реферальную ссылку на основе ID пользователя
    const getReferralLink = () => {
        if (!user?.id) return 'Загрузка...';
        
        // Извлекаем имя бота из TELEGRAM_BOT_URL (например, https://t.me/BotName -> BotName)
        const botMatch = TELEGRAM_BOT_URL.match(/t\.me\/([^/]+)/);
        const botUsername = botMatch ? botMatch[1] : 'YOUR_BOT_USERNAME';
        
        return `https://t.me/${botUsername}?start=ref_${user.id}`;
    };
    
    const referralLink = getReferralLink();
    
    // Функция загрузки статистики
    const fetchStats = useCallback(async () => {
        if (!user?.id || !isMountedRef.current) return;
        
        // Проверяем кэш
        if (!shouldFetch()) {
            return;
        }
        
        if (isMountedRef.current) {
            setLoading(true);
        }
        await get();
    }, [user?.id, get]); // Убираем shouldFetch и setLoading из зависимостей
    
    // Загружаем статистику пользователя при монтировании
    useEffect(() => {
        isMountedRef.current = true;
        if (user?.id) {
            fetchStats();
        }
        return () => {
            isMountedRef.current = false;
        };
        // Используем только user?.id, fetchStats стабилен благодаря useCallback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    const handleCopy = () => {
        if (!user?.id) return;
        
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            webApp.showPopup({
                title: 'Скопировано!',
                message: 'Ссылка скопирована в буфер обмена',
                buttons: [{type: 'ok'}]
            });
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Ошибка копирования:', err);
        });
    };

    const handleShare = () => {
        if (!user?.id) return;
        
        // Используем Telegram Share API
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Присоединяйся ко мне!')}`;
        window.open(shareUrl, '_blank');
    };

    return (
        <div className="referral-link-card">
            <div className="referral-header">Ваша реферальная ссылка</div>
            <div className="referral-description">
                Приглашайте друзей и получайте 30% с каждой продажи + 10% со второго уровня
            </div>
            
            {/* Статистика */}
            {loading && (
                <div className="referral-loading">⏳ Загрузка статистики...</div>
            )}
            
            {error && !loading && (
                <div className="referral-error">
                    <p>⚠️ {String(error)}</p>
                    <button onClick={fetchStats} className="referral-button refresh-button">
                        🔄 Попробовать снова
                    </button>
                </div>
            )}
            
            {!loading && !error && stats && (
                <div className="referral-stats">
                    <div className="stat-item">
                        <div className="stat-label">Приглашено друзей</div>
                        <div className="stat-value">{stats.referralsCount || 0}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Заработано всего</div>
                        <div className="stat-value">{(stats.totalEarnings || 0).toFixed(2)} ₽</div>
                    </div>
                    <div className="stat-details">
                        <div className="stat-detail">Уровень 1: {(stats.earningsByLevel?.level1 || 0).toFixed(2)} ₽</div>
                        <div className="stat-detail">Уровень 2: {(stats.earningsByLevel?.level2 || 0).toFixed(2)} ₽</div>
                    </div>
                </div>
            )}
            
            {!loading && !stats && (
                <div className="referral-no-stats">
                    Статистика будет доступна после приглашения друзей
                </div>
            )}
            
            <div className="referral-link-container">
                <input 
                    type="text" 
                    value={referralLink} 
                    readOnly 
                    className="referral-link-input"
                />
            </div>

            <div className="referral-actions">
                <button 
                    className="referral-button copy-button" 
                    onClick={handleCopy}
                    disabled={!user?.id}
                >
                    📋 {copied ? 'Скопировано!' : 'Копировать'}
                </button>
                <button 
                    className="referral-button share-button" 
                    onClick={handleShare}
                    disabled={!user?.id}
                >
                    📤 Поделиться
                </button>
            </div>
            
            {/* Тестовая кнопка продажи */}
            <TestSaleButton onSaleProcessed={fetchStats} />
            
            {/* Список рефералов */}
            {!loading && stats && Array.isArray(stats.referrals) && stats.referrals.length > 0 && (
                <div className="referrals-list">
                    <div className="referrals-header">Ваши рефералы:</div>
                    {stats.referrals.map((ref, index) => (
                        <div key={ref.id || index} className="referral-item">
                            <span className="referral-number">{index + 1}.</span>
                            <span className="referral-name">{String(ref.username || '')}</span>
                            <span className="referral-date">
                                {ref.joinedAt ? new Date(ref.joinedAt).toLocaleDateString('ru-RU') : ''}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReferralLinkCard;

