/**
 * Frontend Error Handling Utilities
 */

/**
 * Extract user-friendly error message from API error
 */
export function getErrorMessage(error) {
    // Check if it's an API error response
    if (error?.response?.data?.error) {
        const apiError = error.response.data.error;
        
        // If it's an object with message
        if (typeof apiError === 'object' && apiError.message) {
            return apiError.message;
        }
        
        // If it's a string
        if (typeof apiError === 'string') {
            return apiError;
        }
    }
    
    // Check for network errors
    if (error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error' || !navigator.onLine) {
        return 'Сервер временно недоступен. Проверьте соединение и попробуйте позже.';
    }
    
    // Check for failed fetch (CORS, connection refused, etc)
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch') || error instanceof TypeError) {
        return 'Сервер временно недоступен. Попробуйте позже.';
    }
    
    // Check for timeout
    if (error?.code === 'ECONNABORTED' || error?.name === 'AbortError') {
        return 'Превышено время ожидания. Попробуйте снова.';
    }
    
    // HTTP status codes
    const status = error?.response?.status;
    if (status) {
        switch (status) {
            case 400:
                return 'Неверные данные запроса.';
            case 401:
                return 'Требуется авторизация.';
            case 403:
                return 'Доступ запрещен.';
            case 404:
                return 'Ресурс не найден.';
            case 409:
                return 'Конфликт данных.';
            case 422:
                return 'Данные не могут быть обработаны.';
            case 429:
                return 'Слишком много запросов. Попробуйте позже.';
            case 500:
                return 'Ошибка сервера. Попробуйте позже.';
            case 502:
                return 'Сервис временно недоступен.';
            case 503:
                return 'Сервис на обслуживании. Попробуйте позже.';
            default:
                return `Ошибка: ${status}`;
        }
    }
    
    // Generic error message fallback
    return error?.message || 'Произошла неизвестная ошибка';
}

/**
 * Log error to console in development
 */
export function logError(error, context = {}) {
    // Always log errors in production for debugging
    console.error('Error occurred:', error);
    console.error('Context:', context);
    if (error?.stack) {
        console.error('Stack:', error.stack);
    }
}

/**
 * Check if error is retryable (network/timeout errors)
 */
export function isRetryableError(error) {
    // Network errors
    if (error?.message === 'Network Error' || !navigator.onLine) {
        return true;
    }
    
    // Fetch errors (connection refused, CORS, etc)
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Failed to fetch')) {
        return true;
    }
    
    // Timeout
    if (error?.code === 'ECONNABORTED' || error?.name === 'AbortError') {
        return true;
    }
    
    // Server errors (5xx)
    const status = error?.response?.status;
    if (status && status >= 500) {
        return true;
    }
    
    // Rate limit (can retry after waiting)
    if (status === 429) {
        return true;
    }
    
    return false;
}

/**
 * Get retry delay from error (e.g., Retry-After header)
 */
export function getRetryDelay(error, attemptNumber = 1) {
    // Check for Retry-After header
    const retryAfter = error?.response?.headers?.['retry-after'];
    if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
            return seconds * 1000; // Convert to milliseconds
        }
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const baseDelay = 1000;
    const maxDelay = 10000; // Max 10 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 500;
    return delay + jitter;
}

/**
 * Show error to user using Telegram WebApp alert
 */
export function showError(webApp, error, title = 'Ошибка') {
    const message = getErrorMessage(error);
    
    if (webApp?.showAlert) {
        webApp.showAlert(message);
    } else if (webApp?.showPopup) {
        webApp.showPopup({
            title,
            message,
            buttons: [{ type: 'close' }]
        });
    } else {
        // Fallback to browser alert
        alert(`${title}: ${message}`);
    }
    
    // Log for debugging
    logError(error, { title, message });
}

/**
 * Show confirmation dialog
 */
export function showConfirm(webApp, message, onConfirm, onCancel) {
    if (webApp?.showConfirm) {
        webApp.showConfirm(message, (confirmed) => {
            if (confirmed) {
                onConfirm?.();
            } else {
                onCancel?.();
            }
        });
    } else if (webApp?.showPopup) {
        webApp.showPopup({
            title: 'Подтверждение',
            message,
            buttons: [
                { id: 'ok', type: 'default', text: 'OK' },
                { id: 'cancel', type: 'cancel' }
            ]
        }, (buttonId) => {
            if (buttonId === 'ok') {
                onConfirm?.();
            } else {
                onCancel?.();
            }
        });
    } else {
        // Fallback to browser confirm
        const confirmed = window.confirm(message);
        if (confirmed) {
            onConfirm?.();
        } else {
            onCancel?.();
        }
    }
}





