import React from 'react';
import './TelegramInput.css';

const TelegramInput = (props) => {
    const { className, ...restProps } = props;
    return (
        <input {...restProps} className={'telegramInput ' + (className || '')}/>
    );
};

export default TelegramInput;
