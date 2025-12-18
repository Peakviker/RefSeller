import React from 'react';
import './TelegramLink.css';
import {useTelegram} from "../../../hooks/useTelegram";

const TelegramLink = (props) => {
    const {webApp} = useTelegram()
    const { href, className, children, ...restProps } = props;

    const options = {
        try_instant_view: true
    }

    const onClick = () => {
        webApp.openLink(href, options)
    }

    // Преобразуем children в строку, если это не примитив
    const safeChildren = children == null ? '' : (typeof children === 'object' ? String(children) : children);
    
    return (
        <u {...restProps} onClick={onClick} className={'telegramLink ' + (className || '')}>
            {safeChildren}
        </u>
    );
};

export default TelegramLink;
