import { useRef, useState, useCallback } from 'react';

// This is a hook function, used to provide access to telegram
export function useTelegram() {
    // Используем ref для стабильной ссылки на webApp - инициализируем один раз
    const webAppRef = useRef(null);
    if (webAppRef.current === null) {
        webAppRef.current = window.Telegram?.WebApp || {};
    }
    const webApp = webAppRef.current;
    
    // Используем state для user - инициализируем один раз
    // user обычно не меняется во время работы приложения
    const [user] = useState(() => {
        return webApp?.initDataUnsafe?.user || null;
    });
    
    // Проверяем, запущено ли приложение из Telegram (есть initData)
    // Это значение также обычно не меняется
    const [isTelegramWebApp] = useState(() => {
        const initData = webApp?.initData;
        return typeof initData === 'string' && initData.length > 0;
    });

    // Стабильная ссылка на webApp для useCallback
    const webAppStable = useRef(webApp);
    webAppStable.current = webApp;
    
    const onArgumentResult = useCallback((functionName, argument, result) => {
        // Show function call result using an alert
        webAppStable.current.showAlert(`${functionName}(${argument}) returned ${result}`)
    }, []);

    const onResult = useCallback((functionName, result) => {
        // Show function call result using an alert
        onArgumentResult(functionName, '', result)
    }, [onArgumentResult]);

    // Use as a callback for some events
    const onReceivedEvent = useCallback((event, data) => {
        // Show function call result using an alert
        webAppStable.current.showAlert(`received event(${event}) with data(${data})`)
    }, []);

    // Call a method on webApp while handling errors
    const executeArgumentMethod = useCallback((methodName, argument, method, ignoreAlert) => {
        try {
            const result = method()
            if (!ignoreAlert) {
                const wrappedResult = `Result: ${result}`
                onArgumentResult(methodName, argument, wrappedResult)
            }
        } catch (error) {
            onArgumentResult(methodName, argument, error)
        }
    }, [onArgumentResult]);

    const executeMethod = useCallback((methodName, method, ignoreAlert) => {
        executeArgumentMethod(methodName, '', method, ignoreAlert)
    }, [executeArgumentMethod]);

    // Возвращаем стабильный объект - используем useRef для стабильности
    const resultRef = useRef(null);
    if (!resultRef.current) {
        resultRef.current = {
            webApp,
            user,
            isTelegramWebApp,
            onArgumentResult,
            onResult,
            onReceivedEvent,
            executeArgumentMethod,
            executeMethod
        };
    } else {
        // Обновляем только изменяемые значения
        resultRef.current.user = user;
        resultRef.current.isTelegramWebApp = isTelegramWebApp;
        // Обновляем функции, чтобы избежать stale closures
        resultRef.current.onArgumentResult = onArgumentResult;
        resultRef.current.onResult = onResult;
        resultRef.current.onReceivedEvent = onReceivedEvent;
        resultRef.current.executeArgumentMethod = executeArgumentMethod;
        resultRef.current.executeMethod = executeMethod;
    }
    
    return resultRef.current;
}
