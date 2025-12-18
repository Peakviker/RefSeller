/**
 * API Client with retry mechanism and error handling
 */

import { isRetryableError, getRetryDelay, logError } from './errorHandler';

/**
 * Configuration for API client
 */
const DEFAULT_CONFIG = {
    maxRetries: 3,
    timeout: 10000, // 10 seconds
    retryDelay: 1000, // 1 second base delay
};

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced fetch with retry mechanism
 */
export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...retryConfig };
    const { maxRetries, timeout } = config;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // If response is not ok, throw error with response data
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData?.error?.message || `HTTP ${response.status}`);
                error.response = {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData,
                    headers: Object.fromEntries(response.headers.entries())
                };
                throw error;
            }
            
            // Success - return response
            return response;
            
        } catch (error) {
            lastError = error;
            
            // Handle abort/timeout
            if (error.name === 'AbortError') {
                error.code = 'ECONNABORTED';
                error.message = 'Request timeout';
            }
            
            // Handle fetch errors (network, CORS, connection refused, etc)
            if (error instanceof TypeError) {
                if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    error.code = 'NETWORK_ERROR';
                    error.message = error.message || 'Failed to fetch';
                }
            }
            
            // Handle any error without response (network issues)
            if (!error.response && !error.code) {
                error.code = 'NETWORK_ERROR';
            }
            
            logError(error, { url, attempt, maxRetries });
            
            // If not retryable or last attempt, throw
            if (!isRetryableError(error) || attempt === maxRetries) {
                throw error;
            }
            
            // Calculate delay and wait before retry
            const delay = getRetryDelay(error, attempt);
            console.log(`Retrying request (attempt ${attempt}/${maxRetries}) after ${delay}ms...`);
            await sleep(delay);
        }
    }
    
    // This shouldn't be reached, but just in case
    throw lastError;
}

/**
 * GET request with retry
 */
export async function get(url, options = {}, retryConfig = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    }, retryConfig);
    
    return response.json();
}

/**
 * POST request with retry
 */
export async function post(url, data = {}, options = {}, retryConfig = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(data)
    }, retryConfig);
    
    return response.json();
}

/**
 * PATCH request with retry
 */
export async function patch(url, data = {}, options = {}, retryConfig = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(data)
    }, retryConfig);
    
    return response.json();
}

/**
 * DELETE request with retry
 */
export async function del(url, options = {}, retryConfig = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    }, retryConfig);
    
    return response.json();
}

/**
 * Default export with all methods
 */
const apiClient = {
    get,
    post,
    patch,
    delete: del,
    fetchWithRetry
};

export default apiClient;





