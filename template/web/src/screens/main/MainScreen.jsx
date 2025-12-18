import React from 'react';
import {useTelegram} from "../../hooks/useTelegram";
import {useNavigate} from "react-router-dom";
import { PATH_SHOP, PATH_NOTIFICATION_SETTINGS } from "../../constants/Paths";
import TelegramScreen from "../../components/kit/Screen/TelegramScreen";
import TelegramDetailedButton from "../../components/kit/DetailedButton/TelegramDetailedButton";
import ReferralLinkCard from "../../components/app/referral/ReferralLinkCard";
import UserProfile from "../../components/app/user/UserProfile";
import PartnerLanding from "../../components/app/partner/PartnerLanding";
import { useUserStore } from "../../stores/userStore";
import { TELEGRAM_BOT_URL } from "../../logic/server/Variables";
import './MainScreen.css';

const Main = () => {
    const {isTelegramWebApp} = useTelegram()
    const navigate = useNavigate();
    const {isAuthorized, user} = useUserStore(state => ({ isAuthorized: state.isAuthorized, user: state.user }));

    // Проверяем, является ли пользователь авторизованным через Telegram
    const isTelegramUser = isTelegramWebApp && isAuthorized && user;

    // Обработчики авторизации
    const handleTelegramAuth = () => {
        window.open(TELEGRAM_BOT_URL, '_blank', 'noopener,noreferrer');
    };

    const handleGoogleAuth = () => {
        // TODO: Реализовать Google авторизацию
        console.log('Google auth');
    };

    const handleYandexAuth = () => {
        // TODO: Реализовать Yandex ID авторизацию
        console.log('Yandex ID auth');
    };

    const handleEmailAuth = () => {
        // TODO: Реализовать Email авторизацию
        console.log('Email auth');
    };

    // Если пользователь не авторизован или не в Telegram - показываем гостевую версию
    if (!isTelegramUser) {
        return (
            <TelegramScreen showbackbutton={false}>
                <div className="guest-profile">
                    <div className="user-avatar guest-avatar">
                        <div className="user-avatar-placeholder">Г</div>
                    </div>
                    <div className="user-info-block">
                        <h2 className="user-name">Гость</h2>
                        <p className="user-username">Не авторизован</p>
                    </div>
                </div>

                <div className="auth-buttons">
                    <button 
                        onClick={handleTelegramAuth}
                        className="auth-button auth-button-primary"
                    >
                        📱 Регистрация через Telegram
                    </button>
                    
                    <div className="auth-buttons-secondary">
                        <button 
                            onClick={handleGoogleAuth}
                            className="auth-button auth-button-secondary"
                        >
                            🔍 Google
                        </button>
                        <button 
                            onClick={handleYandexAuth}
                            className="auth-button auth-button-secondary"
                        >
                            🟦 Yandex ID
                        </button>
                        <button 
                            onClick={handleEmailAuth}
                            className="auth-button auth-button-secondary"
                        >
                            ✉️ Email
                        </button>
                    </div>
                </div>

                <PartnerLanding />
            </TelegramScreen>
        );
    }

    // Для авторизованных Telegram пользователей показываем обычную версию
    return (
        <TelegramScreen showbackbutton={false}>
            <UserProfile user={user} />

            <ReferralLinkCard />

            <TelegramDetailedButton
                buttontitle={'🛍️ Магазин'}
                buttondescription={
                    'Купить медвежонка рилсмейкера и другие товары'
                }
                buttonlabel={'Перейти в магазин'}
                onButtomClick={() => navigate(PATH_SHOP)}
            />

            <TelegramDetailedButton
                buttontitle={'🔔 Настройки уведомлений'}
                buttondescription={
                    'Управление push-уведомлениями в Telegram'
                }
                buttonlabel={'Открыть настройки'}
                onButtomClick={() => navigate(PATH_NOTIFICATION_SETTINGS)}
            />
        </TelegramScreen>
    );
};

export default Main;
