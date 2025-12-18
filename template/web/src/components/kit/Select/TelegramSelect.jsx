import React from 'react';
import './TelegramSelect.css';

const TelegramSelect = (props) => {
    const { elements, className, ...restProps } = props;
    const elementsArray = Array.isArray(elements) ? elements : [];
    
    return (
        <select {...restProps} className={'telegramSelect ' + (className || '')}>
            { elementsArray.map((element, index) => {
                // Убеждаемся, что element - это примитив (строка/число), а не объект
                const displayValue = typeof element === 'object' ? String(element) : element;
                return <option key={index} value={displayValue}>{displayValue}</option>;
            }) }
        </select>
    );
};

export default TelegramSelect;
