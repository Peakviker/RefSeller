import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Временно отключаем persist для отладки React error #185
const ENABLE_PERSIST = process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_PERSIST !== 'false';

const storeConfig = (set, get) => ({
    // State
    preferences: {
        purchaseEnabled: true,
        referralRegisteredEnabled: true,
        referralPurchaseEnabled: true,
        incomeCreditedEnabled: true
    },
    history: [],
    stats: null,
    loading: false,
    error: null,

    // Actions с защитой от обновлений после размонтирования
    setPreferences: (preferences) => {
        try {
            set({
                preferences,
                error: null
            });
        } catch (error) {
            console.warn('setPreferences called after unmount:', error);
        }
    },

    updatePreference: (key, value) => {
        try {
            set((state) => ({
                preferences: {
                    ...state.preferences,
                    [key]: value
                }
            }));
        } catch (error) {
            console.warn('updatePreference called after unmount:', error);
        }
    },

    setHistory: (history) => {
        try {
            set({ history });
        } catch (error) {
            console.warn('setHistory called after unmount:', error);
        }
    },

    addToHistory: (notification) => {
        try {
            set((state) => ({
                history: [notification, ...state.history]
            }));
        } catch (error) {
            console.warn('addToHistory called after unmount:', error);
        }
    },

    setStats: (stats) => {
        try {
            set({ stats });
        } catch (error) {
            console.warn('setStats called after unmount:', error);
        }
    },

    setLoading: (loading) => {
        try {
            set({ loading });
        } catch (error) {
            console.warn('setLoading called after unmount:', error);
        }
    },

    setError: (error) => {
        try {
            set({ error, loading: false });
        } catch (err) {
            console.warn('setError called after unmount:', err);
        }
    },

    clearError: () => {
        try {
            set({ error: null });
        } catch (error) {
            console.warn('clearError called after unmount:', error);
        }
    },

    clearHistory: () => {
        try {
            set({ history: [] });
        } catch (error) {
            console.warn('clearHistory called after unmount:', error);
        }
    },

    // Getters
    getPreferences: () => get().preferences,

    isNotificationEnabled: (type) => {
        const preferences = get().preferences;
        return preferences[`${type}Enabled`] !== false;
    },

    getHistory: () => get().history,

    getStats: () => get().stats
});

// Условно применяем persist middleware
export const useNotificationStore = ENABLE_PERSIST
    ? create(
        persist(storeConfig, {
            name: 'notification-storage',
            partialize: (state) => ({
                preferences: state.preferences
            })
        })
    )
    : create(storeConfig);





