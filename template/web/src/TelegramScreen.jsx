import React, {useEffect} from 'react';
import "./TelegramScreen.css"
import {useTelegram} from "../../../hooks/useTelegram";

const TelegramScreen = (props) => {
    const {webApp, isTelegramWebApp} = useTelegram()
    const { showbackbutton, className, children, ...restProps } = props;
    
    useEffect(() => {
        if (isTelegramWebApp && webApp?.BackButton) {
            if (showbackbutton) {
                webApp.BackButton.show()
            } else {
                webApp.BackButton.hide()
            }
        }
        // webApp - стабильный объект, не нужно в зависимостях
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTelegramWebApp, showbackbutton]);

    return (
        <div {...restProps} className={'telegramScreen ' + (className || '')}>
            {children}
        </div>
    );
};

export default TelegramScreen;
