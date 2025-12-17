import React from 'react';
import TelegramText from "../../components/kit/Text/TelegramText";
import {useTelegram} from "../../hooks/useTelegram";
import {useNavigate} from "react-router-dom";
import { PATH_SERVER, PATH_AUTH, PATH_SHOP } from "../../constants/Paths";
import TelegramScreen from "../../components/kit/Screen/TelegramScreen";
import TelegramDetailedButton from "../../components/kit/DetailedButton/TelegramDetailedButton";
import ReferralLinkCard from "../../components/app/referral/ReferralLinkCard";
import UserProfile from "../../components/app/user/UserProfile";

const Main = () => {
    const {user} = useTelegram()
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user_authorized');
        localStorage.removeItem('user_id');
        navigate(PATH_AUTH);
    };

    return (
        <TelegramScreen showbackbutton={false}>
            <UserProfile user={user} />

            <ReferralLinkCard />

            <TelegramText className={'telegramSubtitle'}>Navigate to a screen:</TelegramText>

            <TelegramDetailedButton
                buttontitle={'🛍️ Магазин'}
                buttondescription={
                    'Купить медвежонка рилсмейкера и другие товары'
                }
                buttonlabel={'Перейти в магазин'}
                onButtomClick={() => navigate(PATH_SHOP)}
            />

            <TelegramDetailedButton
                buttontitle={'Server Screen'}
                buttondescription={
                    'Interact with the bot server through REST API'
                }
                buttonlabel={'Navigate to Server Screen'}
                onButtomClick={() => navigate(PATH_SERVER)}
            />

            <TelegramDetailedButton
                buttontitle={'Выйти'}
                buttondescription={
                    'Выход из аккаунта (для тестирования)'
                }
                buttonlabel={'Logout'}
                onButtomClick={handleLogout}
            />
        </TelegramScreen>
    );
};

export default Main;
