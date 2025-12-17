import './App.css';
import {useCallback, useEffect} from "react";
import {useTelegram} from "./hooks/useTelegram";
import {Route, Routes, useNavigate, Navigate} from "react-router-dom";
import Main from "./screens/main/MainScreen";
import {PATH_SERVER, PATH_AUTH, PATH_MAIN, PATH_SHOP} from "./constants/Paths";
import ServerScreen from "./screens/server/ServerScreen";
import AuthScreen from "./screens/auth/AuthScreen";
import ShopScreen from "./screens/shop/ShopScreen";

// Компонент для защиты роутов
const ProtectedRoute = ({ children }) => {
    const isAuthorized = localStorage.getItem('user_authorized') === 'true';
    return isAuthorized ? children : <Navigate to={PATH_AUTH} replace />;
};

// Компонент для редиректа с главной страницы
const RootRedirect = () => {
    const isAuthorized = localStorage.getItem('user_authorized') === 'true';
    return <Navigate to={isAuthorized ? PATH_MAIN : PATH_AUTH} replace />;
};

function App() {
    const {webApp} = useTelegram()
    const navigate = useNavigate();

    const onBackClick = useCallback(() => {
        navigate(-1)
    }, [navigate])

    const onMainClick = useCallback(() => {
        webApp.showAlert("Main button click")
    }, [webApp])

    useEffect(() => {
        webApp.ready()
        webApp.BackButton.onClick(onBackClick)
        webApp.MainButton.onClick(onMainClick)
        return () => {
            webApp.BackButton.offClick(onBackClick)
            webApp.MainButton.offClick(onMainClick)
        };
    }, [webApp])

    return (
        <div className="App">
            <Routes>
                <Route index element={<RootRedirect/>}/>
                <Route path={PATH_AUTH} element={<AuthScreen/>}/>
                <Route path={PATH_MAIN} element={
                    <ProtectedRoute>
                        <Main/>
                    </ProtectedRoute>
                }/>
                <Route path={PATH_SERVER} element={
                    <ProtectedRoute>
                        <ServerScreen/>
                    </ProtectedRoute>
                }/>
                <Route path={PATH_SHOP} element={
                    <ProtectedRoute>
                        <ShopScreen/>
                    </ProtectedRoute>
                }/>
            </Routes>
        </div>
    );
}

export default App;
