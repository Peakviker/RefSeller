import React from 'react';
import './TelegramText.css';

const TelegramText = (props) => {
    const { className, children, ...restProps } = props;
    // Преобразуем children в строку, если это не примитив
    const safeChildren = children == null ? '' : (typeof children === 'object' ? String(children) : children);
    return (
        <p {...restProps} className={'telegramText ' + (className || '')}>
            {safeChildren}
        </p>
    );
};

export default TelegramText;
