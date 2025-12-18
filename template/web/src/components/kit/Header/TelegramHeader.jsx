import React from 'react';
import './TelegramHeader.css';

const TelegramHeader = (props) => {
    const { className, children, ...restProps } = props;
    // Преобразуем children в строку, если это не примитив
    const safeChildren = children == null ? '' : (typeof children === 'object' ? String(children) : children);
    return (
        <div {...restProps} className={'telegramHeader ' + (className || '')}>
            {safeChildren}
        </div>
    );
};

export default TelegramHeader;
