import './App.css';
import {useCallback, useEffect, useRef} from "react";
import {useTelegram} from "./hooks/useTelegram";
import {Route, Routes, useNavigate, Navigate} from "react-router-dom";
import Main from "./screens/main/MainScreen";
import {PATH_SERVER, PATH_AUTH, PATH_MAIN, PATH_SHOP, PATH_NOTIFICATION_SETTINGS} from "./constants/Paths";
import ServerScreen from "./screens/server/ServerScreen";
import ShopScreen from "./screens/shop/ShopScreen";
import NotificationSettings from "./screens/notification/NotificationSettings";
import ErrorBoundary from "./components/kit/ErrorBoundary";
import apiClient from "./utils/apiClient";
import { API_URL } from "./logic/server/Variables";

import { useUserStore } from "./stores/userStore";

// Компонент для защиты роутов (только для Telegram-авторизованных)
const ProtectedRoute = ({ children }) => {
    const isAuthorized = useUserStore(state => state.isAuthorized);
    return isAuthorized ? children : <Navigate to={PATH_MAIN} replace />;
};

// Редирект с корня на главную
const RootRedirect = () => {
    return <Navigate to={PATH_MAIN} replace />;
};

function App() {
    const {webApp, isTelegramWebApp, user} = useTelegram()
    const navigate = useNavigate();
    const {setUser, authorize, isAuthorized} = useUserStore();

    const registrationAttempted = useRef(false);
    const isMountedRef = useRef(true);

    // Автоматическая авторизация и регистрация при открытии через Telegram
    // Используем userId вместо user объекта, чтобы избежать бесконечных циклов
    const userId = user?.id || null;
    useEffect(() => {
        isMountedRef.current = true;
        
        // Убираем isAuthorized из зависимостей, чтобы избежать циклов
        // Проверяем только один раз при монтировании
        if (isTelegramWebApp && user && !registrationAttempted.current) {
            registrationAttempted.current = true;
            
            // Проверяем, не авторизован ли уже пользователь
            const currentAuth = useUserStore.getState().isAuthorized;
            if (currentAuth) {
                return () => {
                    isMountedRef.current = false;
                };
            }
            
            // Сначала авторизуем локально
            if (isMountedRef.current) {
                setUser(user);
                authorize(user.id);
            }
            
            // Регистрируем пользователя на сервере (создаем запись в БД для реферальной системы)
            apiClient.post(`${API_URL}/referral/register`, {
                userId: user.id,
                username: user.username || user.first_name || 'Unknown'
            }).then((response) => {
                if (isMountedRef.current && response.success) {
                    console.log('User registered successfully:', response.data);
                }
            }).catch((error) => {
                // Если пользователь уже зарегистрирован или ошибка - игнорируем
                if (isMountedRef.current) {
                    console.log('Registration result:', error.message || 'User may already be registered');
                }
            });
        }
        
        return () => {
            isMountedRef.current = false;
        };
        // Используем только userId и isTelegramWebApp, убираем isAuthorized чтобы избежать циклов
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTelegramWebApp, userId])

    const onBackClick = useCallback(() => {
        navigate(-1)
    }, [navigate])

    const onMainClick = useCallback(() => {
        if (webApp.showAlert) {
            webApp.showAlert("Main button click")
        }
    }, [webApp])

    useEffect(() => {
        if (isTelegramWebApp && webApp) {
            if (webApp.ready) webApp.ready()
            if (webApp.BackButton?.onClick) webApp.BackButton.onClick(onBackClick)
            if (webApp.MainButton?.onClick) webApp.MainButton.onClick(onMainClick)
            return () => {
                if (webApp.BackButton?.offClick) webApp.BackButton.offClick(onBackClick)
                if (webApp.MainButton?.offClick) webApp.MainButton.offClick(onMainClick)
            };
        }
    }, [webApp, isTelegramWebApp, onBackClick, onMainClick])

    return (
        <ErrorBoundary 
            title="Ошибка приложения"
            message="Произошла непредвиденная ошибка. Попробуйте перезагрузить приложение."
            showReloadButton={true}
        >
            <div className="App">
                <Routes>
                    <Route index element={<RootRedirect/>}/>
                    <Route path={PATH_AUTH} element={<Navigate to={PATH_MAIN} replace />}/>
                    <Route path={PATH_MAIN} element={
                        <ErrorBoundary>
                            <Main/>
                        </ErrorBoundary>
                    }/>
                    <Route path={PATH_SERVER} element={
                        <ProtectedRoute>
                            <ErrorBoundary>
                                <ServerScreen/>
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }/>
                    <Route path={PATH_SHOP} element={
                        <ProtectedRoute>
                            <ErrorBoundary>
                                <ShopScreen/>
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }/>
                    <Route path={PATH_NOTIFICATION_SETTINGS} element={
                        <ProtectedRoute>
                            <ErrorBoundary>
                                <NotificationSettings/>
                            </ErrorBoundary>
                        </ProtectedRoute>
                    }/>
                </Routes>
            </div>
        </ErrorBoundary>
    );
}

export default App;
