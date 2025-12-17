import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import './AuthScreen.css';

const AuthScreen = () => {
    const { user, webApp } = useTelegram();
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);

    const handleContinue = () => {
        if (accepted) {
            // Сохраняем в localStorage что пользователь прошел авторизацию
            localStorage.setItem('user_authorized', 'true');
            localStorage.setItem('user_id', user?.id);
            navigate('/main');
        }
    };

    // Получаем фото профиля пользователя (если есть)
    const getProfilePhoto = () => {
        // В реальном приложении можно получить через API бота
        // Пока используем placeholder
        return user?.photo_url || null;
    };

    return (
        <div className="auth-screen">
            <div className="auth-container">
                <div className="auth-card">
                    {/* Фото профиля */}
                    <div className="profile-photo">
                        {getProfilePhoto() ? (
                            <img src={getProfilePhoto()} alt="Profile" />
                        ) : (
                            <div className="profile-placeholder">
                                {user?.first_name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>

                    {/* Приветствие */}
                    <h1 className="auth-title">
                        Привет, {user?.first_name} {user?.last_name}! 👋
                    </h1>

                    {/* Описание */}
                    <p className="auth-description">
                        Мы автоматически получили твои данные из Telegram. 
                        Для продолжения прими условия использования.
                    </p>

                    {/* Информация о пользователе */}
                    <div className="user-info">
                        <div className="info-row">
                            <span className="info-label">Имя:</span>
                            <span className="info-value">
                                {user?.first_name} {user?.last_name}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Username:</span>
                            <span className="info-value">@{user?.username || 'не указан'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Telegram ID:</span>
                            <span className="info-value">{user?.id}</span>
                        </div>
                    </div>

                    {/* Чекбокс */}
                    <div className="checkbox-container">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="checkbox-input"
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-text">
                                Я принимаю{' '}
                                <a href="#" className="link">условия использования</a>
                                {' '}и{' '}
                                <a href="#" className="link">политику конфиденциальности</a>
                            </span>
                        </label>
                    </div>

                    {/* Кнопка продолжить */}
                    <button
                        className={`continue-button ${accepted ? 'active' : 'disabled'}`}
                        onClick={handleContinue}
                        disabled={!accepted}
                    >
                        Продолжить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;

