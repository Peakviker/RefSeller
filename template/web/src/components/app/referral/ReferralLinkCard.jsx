import React, {useState, useEffect, useCallback} from 'react';
import {useTelegram} from "../../../hooks/useTelegram";
import TestSaleButton from "./TestSaleButton";
import './ReferralLinkCard.css';

const ReferralLinkCard = () => {
    const {user, webApp} = useTelegram();
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Формируем реферальную ссылку на основе ID пользователя
    const referralLink = user?.id 
        ? `https://t.me/NeiroRefBot?start=ref_${user.id}`
        : 'Загрузка...';
    
    // Функция загрузки статистики
    const fetchStats = useCallback(async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            // Используем относительный путь - nginx проксирует /referral на backend
            const response = await fetch(`/referral/stats/${user.id}`);
            const data = await response.json();
            
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);
    
    // Загружаем статистику пользователя при монтировании
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

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
            {!loading && stats && (
                <div className="referral-stats">
                    <div className="stat-item">
                        <div className="stat-label">Приглашено друзей</div>
                        <div className="stat-value">{stats.referralsCount}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Заработано всего</div>
                        <div className="stat-value">{stats.totalEarnings.toFixed(2)} ₽</div>
                    </div>
                    <div className="stat-details">
                        <div className="stat-detail">Уровень 1: {stats.earningsByLevel.level1.toFixed(2)} ₽</div>
                        <div className="stat-detail">Уровень 2: {stats.earningsByLevel.level2.toFixed(2)} ₽</div>
                    </div>
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
                <button 
                    className="referral-button refresh-button" 
                    onClick={fetchStats}
                    disabled={loading}
                >
                    🔄 Обновить
                </button>
            </div>
            
            {/* Тестовая кнопка продажи */}
            <TestSaleButton onSaleProcessed={fetchStats} />
            
            {/* Список рефералов */}
            {!loading && stats && stats.referrals.length > 0 && (
                <div className="referrals-list">
                    <div className="referrals-header">Ваши рефералы:</div>
                    {stats.referrals.map((ref, index) => (
                        <div key={ref.id} className="referral-item">
                            <span className="referral-number">{index + 1}.</span>
                            <span className="referral-name">{ref.username}</span>
                            <span className="referral-date">
                                {new Date(ref.joinedAt).toLocaleDateString('ru-RU')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReferralLinkCard;

