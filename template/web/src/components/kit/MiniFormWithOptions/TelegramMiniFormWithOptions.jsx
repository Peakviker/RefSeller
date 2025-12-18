import React, {useState} from 'react';
import TelegramInput from "../Input/TelegramInput";
import TelegramButton from "../Button/TelegramButton";
import './TelegramMiniFormWithOptions.css';
import TelegramText from "../Text/TelegramText";
import TelegramSelect from "../Select/TelegramSelect";

const TelegramMiniFormWithOptions = (props) => {
    const { 
        options: optionsProp, 
        fieldlabel, 
        fielddescription, 
        fieldhint, 
        optionslabel, 
        buttonlabel, 
        onSubmit, 
        className,
        ...restProps 
    } = props;
    
    const optionsArray = Array.isArray(optionsProp) ? optionsProp : [];
    const [input, setInput] = useState('')
    const [options, setOptions] = useState(optionsArray.length > 0 ? [optionsArray[0]] : [])

    const onChangeInput = (e) => {
        setInput(e.target.value)
    }

    const onChangeOption = (e) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setOptions(options)
    }

    const onButtonClick = () => {
        onSubmit(input, options)
    }

    return (
        <div {...restProps} className={'telegramMiniFormWithOptions ' + (className || '')}>
            <TelegramText className={'telegramSubtitle'}>{fieldlabel}</TelegramText>
            <TelegramText className={'telegramHint'}>{fielddescription}</TelegramText>

            <TelegramInput
                type="text"
                placeholder={fieldhint}
                value={input}
                onChange={onChangeInput}
            />

            <TelegramText className={'telegramSubtitle'}>{optionslabel}</TelegramText>

            <TelegramSelect
                value={options}
                multiple={true}
                onChange={onChangeOption}
                elements={optionsArray}
            />

            <TelegramButton onClick={onButtonClick}>{buttonlabel}</TelegramButton>
        </div>
    );
};

export default TelegramMiniFormWithOptions;
