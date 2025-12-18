import React from 'react';
import './TelegramButton.css';

const TelegramButton = (props) => {
    const { className, children, ...restProps } = props;
    // Преобразуем children в строку, если это не примитив
    const safeChildren = children == null ? '' : (typeof children === 'object' ? String(children) : children);
    return (
        <button {...restProps} className={'telegramButton ' + (className || '')}>
            {safeChildren}
        </button>
    );
};

export default TelegramButton;
