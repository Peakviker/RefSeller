import React, {useState} from 'react';
import {useTelegram} from "../../../hooks/useTelegram";
import TelegramButton from "../../kit/Button/TelegramButton";
import TelegramInput from "../../kit/Input/TelegramInput";

const TestSaleButton = ({onSaleProcessed}) => {
    const {user, webApp} = useTelegram();
    const [amount, setAmount] = useState('100');
    const [loading, setLoading] = useState(false);

    const handleTestSale = async () => {
        if (!user?.id || !amount) return;
        
        const saleAmount = parseFloat(amount);
        if (isNaN(saleAmount) || saleAmount <= 0) {
            webApp.showAlert('Введите корректную сумму');
            return;
        }

        setLoading(true);
        try {
            // Используем относительный путь - nginx проксирует /referral на backend
            const response = await fetch(`/referral/sale`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    amount: saleAmount
                })
            });

            const data = await response.json();
            
            if (data.success) {
                webApp.showPopup({
                    title: 'Успешно!',
                    message: `Продажа на ${saleAmount}₽ обработана. Реферер получил свой процент.`,
                    buttons: [{type: 'ok'}]
                });
                
                if (onSaleProcessed) {
                    onSaleProcessed();
                }
            } else {
                webApp.showAlert('Ошибка обработки продажи');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            webApp.showAlert('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '6px'}}>
            <div style={{fontSize: '11px', color: '#666', marginBottom: '6px'}}>
                🧪 Тест продажи (симуляция для реферера)
            </div>
            <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                <TelegramInput 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Сумма"
                    style={{flex: 1, padding: '6px 8px', fontSize: '12px'}}
                />
                <TelegramButton
                    onClick={handleTestSale}
                    disabled={loading || !user?.id}
                    style={{padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap'}}
                >
                    {loading ? '...' : 'Тест'}
                </TelegramButton>
            </div>
        </div>
    );
};

export default TestSaleButton;

