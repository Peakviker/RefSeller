import React, {useState} from 'react';
import TelegramInput from "../Input/TelegramInput";
import TelegramButton from "../Button/TelegramButton";
import './TelegramOptionsForm.css';
import TelegramText from "../Text/TelegramText";
import TelegramSelect from "../Select/TelegramSelect";

const TelegramOptionsForm = (props) => {
    const { 
        options: optionsProp, 
        formlabel, 
        formdescription, 
        optionslabel, 
        optionsmultiple, 
        buttonlabel, 
        onSubmit, 
        className,
        ...restProps 
    } = props;
    
    const optionsArray = Array.isArray(optionsProp) ? optionsProp : [];
    const [options, setOptions] = useState(optionsArray.length > 0 ? [optionsArray[0]] : [])

    const onChangeOption = (e) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setOptions(options)
    }

    const onButtonClick = () => {
        onSubmit(options)
    }

    return (
        <div {...restProps} className={'telegramOptionsForm ' + (className || '')}>
            <TelegramText className={'telegramSubtitle'}>{formlabel}</TelegramText>
            <TelegramText className={'telegramHint'}>{formdescription}</TelegramText>

            <TelegramText className={'telegramSubtitle'}>{optionslabel}</TelegramText>

            <TelegramSelect
                value={options}
                multiple={optionsmultiple}
                onChange={onChangeOption}
                elements={optionsArray}
            />

            <TelegramButton onClick={onButtonClick}>{buttonlabel}</TelegramButton>
        </div>
    );
};

export default TelegramOptionsForm;
