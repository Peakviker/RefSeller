import React from 'react';
import TelegramButton from "../Button/TelegramButton";
import './TelegramDetailedButton.css';
import TelegramText from "../Text/TelegramText";

const TelegramDetailedButton = (props) => {
    const { buttontitle, buttondescription, onButtomClick, buttonlabel, className, ...restProps } = props;
    
    return (
        <div {...restProps} className={'telegramDetailedButton ' + (className || '')}>
            <TelegramText className={'telegramSubtitle'}>{buttontitle}</TelegramText>
            <TelegramText className={'telegramHint'}>{buttondescription}</TelegramText>
            <TelegramButton onClick={onButtomClick}>{buttonlabel}</TelegramButton>
        </div>
    );
};

export default TelegramDetailedButton;

