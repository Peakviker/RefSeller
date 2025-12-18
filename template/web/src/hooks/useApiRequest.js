import { useState, useCallback, useRef, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { getErrorMessage, logError, showError } from '../utils/errorHandler';
import { useTelegram } from './useTelegram';

/**
 * Custom hook for making API requests with loading/error state management
 * 
 * @param {Function} requestFn - Function that makes the API request
 * @param {Object} options - Configuration options
 * @returns {Object} { data, loading, error, execute, reset }
 */
export function useApiRequest(options = {}) {
    const {
        onSuccess,
        onError,
        showErrorAlert = true
    } = options;
    
    const { webApp } = useTelegram();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);
    
    // Стабилизируем callbacks через ref, чтобы избежать пересоздания execute
    const callbacksRef = useRef({ onSuccess, onError, showErrorAlert, webApp });
    callbacksRef.current = { onSuccess, onError, showErrorAlert, webApp };

    // Отслеживаем монтирование компонента
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const execute = useCallback(async (requestFn, ...args) => {
        if (!isMountedRef.current) return;
        
        if (isMountedRef.current) {
            setLoading(true);
            setError(null);
        }

        try {
            const result = await requestFn(...args);
            
            if (!isMountedRef.current) return result;
            
            setData(result);
            
            if (callbacksRef.current.onSuccess) {
                callbacksRef.current.onSuccess(result);
            }
            
            return result;
        } catch (err) {
            if (!isMountedRef.current) throw err;
            
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            
            logError(err, { args });
            
            if (callbacksRef.current.showErrorAlert) {
                showError(callbacksRef.current.webApp, err);
            }
            
            if (callbacksRef.current.onError) {
                callbacksRef.current.onError(err);
            }
            
            throw err;
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []); // execute теперь стабилен - не зависит от изменяющихся значений

    const reset = useCallback(() => {
        setData(null);
        setLoading(false);
        setError(null);
    }, []);

    return { data, loading, error, execute, reset };
}

/**
 * Hook for GET requests
 */
export function useGet(url, options = {}) {
    const { execute, ...state } = useApiRequest(options);
    
    // Стабилизируем url и retryConfig через ref
    const configRef = useRef({ url, retryConfig: options.retryConfig });
    configRef.current = { url, retryConfig: options.retryConfig };
    
    const get = useCallback((customUrl) => {
        return execute(
            () => apiClient.get(customUrl || configRef.current.url, {}, configRef.current.retryConfig)
        );
    }, [execute]); // execute теперь стабилен, поэтому get тоже стабилен
    
    return { ...state, get };
}

/**
 * Hook for POST requests
 */
export function usePost(url, options = {}) {
    const { execute, ...state } = useApiRequest(options);
    
    const configRef = useRef({ url, retryConfig: options.retryConfig });
    configRef.current = { url, retryConfig: options.retryConfig };
    
    const post = useCallback((data, customUrl) => {
        return execute(
            () => apiClient.post(customUrl || configRef.current.url, data, {}, configRef.current.retryConfig)
        );
    }, [execute]);
    
    return { ...state, post };
}

/**
 * Hook for PATCH requests
 */
export function usePatch(url, options = {}) {
    const { execute, ...state } = useApiRequest(options);
    
    const configRef = useRef({ url, retryConfig: options.retryConfig });
    configRef.current = { url, retryConfig: options.retryConfig };
    
    const patch = useCallback((data, customUrl) => {
        return execute(
            () => apiClient.patch(customUrl || configRef.current.url, data, {}, configRef.current.retryConfig)
        );
    }, [execute]);
    
    return { ...state, patch };
}

/**
 * Hook for DELETE requests
 */
export function useDelete(url, options = {}) {
    const { execute, ...state } = useApiRequest(options);
    
    const configRef = useRef({ url, retryConfig: options.retryConfig });
    configRef.current = { url, retryConfig: options.retryConfig };
    
    const del = useCallback((customUrl) => {
        return execute(
            () => apiClient.delete(customUrl || configRef.current.url, {}, configRef.current.retryConfig)
        );
    }, [execute]);
    
    return { ...state, delete: del };
}





