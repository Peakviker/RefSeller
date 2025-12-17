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
        <div style={{marginTop: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '8px'}}>
            <div style={{fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                🧪 Тест продажи
            </div>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '12px'}}>
                Симуляция продажи для начисления процента рефереру
            </div>
            <TelegramInput 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Сумма продажи"
            />
            <TelegramButton
                onClick={handleTestSale}
                disabled={loading || !user?.id}
            >
                {loading ? 'Обработка...' : 'Обработать продажу'}
            </TelegramButton>
        </div>
    );
};

export default TestSaleButton;

