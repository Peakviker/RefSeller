import React from 'react';
import './PartnerLanding.css';

const PartnerLanding = () => {
    const stats = [
        { label: 'Активных партнеров', value: '1,234' },
        { label: 'Выплачено', value: '₽2.5M' },
        { label: 'Средний доход', value: '₽15K/мес' },
    ];

    const cases = [
        {
            name: 'Алексей К.',
            role: 'Блогер',
            result: '₽45,000 за месяц',
            description: 'Привлек 150 пользователей через свой канал'
        },
        {
            name: 'Мария С.',
            role: 'Инфлюенсер',
            result: '₽28,000 за месяц',
            description: 'Поделилась ссылкой в соцсетях'
        },
        {
            name: 'Дмитрий В.',
            role: 'Предприниматель',
            result: '₽67,000 за месяц',
            description: 'Интегрировал в свою бизнес-модель'
        }
    ];

    const reviews = [
        {
            name: 'Елена М.',
            rating: 5,
            text: 'Отличная программа! Выплаты приходят вовремя, все прозрачно.'
        },
        {
            name: 'Игорь П.',
            rating: 5,
            text: 'Легко начать, хорошие условия. Рекомендую!'
        },
        {
            name: 'Ольга К.',
            rating: 5,
            text: 'Помогает дополнительно зарабатывать без особых усилий.'
        }
    ];

    const commissionRates = [
        { level: '1-10 рефералов', rate: '10%', earnings: 'до ₽5,000' },
        { level: '11-50 рефералов', rate: '15%', earnings: 'до ₽25,000' },
        { level: '51-100 рефералов', rate: '20%', earnings: 'до ₽50,000' },
        { level: '100+ рефералов', rate: '25%', earnings: 'от ₽50,000' },
    ];

    return (
        <div className="partner-landing">
            <div className="landing-header">
                <h2 className="landing-title">💰 Партнерская программа</h2>
                <p className="landing-subtitle">
                    Зарабатывайте, привлекая новых пользователей в наш сервис
                </p>
            </div>

            {/* Статистика */}
            <div className="landing-stats">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-item">
                        <div className="stat-value">{String(stat.value || '')}</div>
                        <div className="stat-label">{String(stat.label || '')}</div>
                    </div>
                ))}
            </div>

            {/* Таблица комиссий */}
            <div className="landing-section">
                <h3 className="section-title">Уровни комиссий</h3>
                <div className="commission-table">
                    <div className="table-header">
                        <div className="table-col">Уровень</div>
                        <div className="table-col">Комиссия</div>
                        <div className="table-col">Заработок</div>
                    </div>
                    {commissionRates.map((item, index) => (
                        <div key={index} className="table-row">
                            <div className="table-col">{String(item.level || '')}</div>
                            <div className="table-col rate">{String(item.rate || '')}</div>
                            <div className="table-col earnings">{String(item.earnings || '')}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* График доходности (визуализация) */}
            <div className="landing-section">
                <h3 className="section-title">Динамика выплат</h3>
                <div className="earnings-chart">
                    <div className="chart-bars">
                        {[25, 40, 35, 55, 45, 60, 70].map((height, index) => (
                            <div key={index} className="chart-bar-container">
                                <div 
                                    className="chart-bar" 
                                    style={{ height: `${height}%` }}
                                />
                                <div className="chart-label">{index + 1}</div>
                            </div>
                        ))}
                    </div>
                    <div className="chart-legend">
                        <span>Недели</span>
                    </div>
                </div>
            </div>

            {/* Кейсы */}
            <div className="landing-section">
                <h3 className="section-title">Успешные кейсы</h3>
                <div className="cases-grid">
                    {cases.map((caseItem, index) => (
                        <div key={index} className="case-card">
                            <div className="case-header">
                                <div className="case-avatar">
                                    {String(caseItem.name || '').charAt(0) || '?'}
                                </div>
                                <div className="case-info">
                                    <div className="case-name">{String(caseItem.name || '')}</div>
                                    <div className="case-role">{String(caseItem.role || '')}</div>
                                </div>
                            </div>
                            <div className="case-result">{String(caseItem.result || '')}</div>
                            <div className="case-description">{String(caseItem.description || '')}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Отзывы */}
            <div className="landing-section">
                <h3 className="section-title">Отзывы партнеров</h3>
                <div className="reviews-list">
                    {reviews.map((review, index) => (
                        <div key={index} className="review-card">
                            <div className="review-header">
                                <div className="review-name">{String(review.name || '')}</div>
                                <div className="review-rating">
                                    {'⭐'.repeat(Number(review.rating) || 0)}
                                </div>
                            </div>
                            <div className="review-text">{String(review.text || '')}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Офер */}
            <div className="landing-section">
                <h3 className="section-title">Условия партнерской программы</h3>
                <div className="offer-content">
                    <div className="offer-item">
                        <strong>1. Общие положения</strong>
                        <p>
                            Партнерская программа предоставляет возможность получения вознаграждения
                            за привлечение новых пользователей в сервис. Участие бесплатное.
                        </p>
                    </div>
                    <div className="offer-item">
                        <strong>2. Условия участия</strong>
                        <p>
                            Для участия необходимо быть зарегистрированным пользователем.
                            Привлечение пользователей происходит через уникальную реферальную ссылку.
                        </p>
                    </div>
                    <div className="offer-item">
                        <strong>3. Вознаграждение</strong>
                        <p>
                            Комиссия начисляется с каждой покупки привлеченного пользователя.
                            Выплаты производятся еженедельно при достижении минимальной суммы ₽1,000.
                        </p>
                    </div>
                    <div className="offer-item">
                        <strong>4. Правила</strong>
                        <p>
                            Запрещено использовать спам, мошенничество и другие незаконные методы.
                            При нарушении правил аккаунт может быть заблокирован.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerLanding;
