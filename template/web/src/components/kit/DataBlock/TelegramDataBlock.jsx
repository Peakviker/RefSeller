import React from 'react';
import './TelegramDataBlock.css';

const TelegramDataBlock = (props) => {
    const { className, children, ...restProps } = props;
    // Преобразуем children в строку, если это не примитив
    const safeChildren = children == null ? '' : (typeof children === 'object' ? String(children) : children);
    return (
        <div {...restProps} className={'telegramDataBlock ' + (className || '')}>
            {safeChildren}
        </div>
    );
};

export default TelegramDataBlock;
