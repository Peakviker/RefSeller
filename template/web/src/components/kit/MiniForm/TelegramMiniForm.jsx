import React, {useState} from 'react';
import TelegramInput from "../Input/TelegramInput";
import TelegramButton from "../Button/TelegramButton";
import './TelegramMiniForm.css';
import TelegramText from "../Text/TelegramText";

const TelegramMiniForm = (props) => {
    const { 
        fieldlabel, 
        fielddescription, 
        fieldhint, 
        buttonlabel, 
        onSubmit, 
        className,
        ...restProps 
    } = props;
    
    const [input, setInput] = useState('')

    const onChangeInput = (e) => {
        setInput(e.target.value)
    }

    const onButtonClick = () => {
        onSubmit(input)
    }

    return (
        <div {...restProps} className={'telegramMiniForm ' + (className || '')}>
            <TelegramText className={'telegramSubtitle'}>{fieldlabel}</TelegramText>
            <TelegramText className={'telegramHint'}>{fielddescription}</TelegramText>

            <TelegramInput
                type="text"
                placeholder={fieldhint}
                value={input}
                onChange={onChangeInput}
            />

            <TelegramButton onClick={onButtonClick}>{buttonlabel}</TelegramButton>
        </div>
    );
};

export default TelegramMiniForm;
