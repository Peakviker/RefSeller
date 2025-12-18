import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Временно отключаем persist для отладки React error #185
const ENABLE_PERSIST = process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENABLE_PERSIST !== 'false';

const storeConfig = (set, get) => ({
    // State
    user: null,
    isAuthorized: false,
    userId: null,

    // Actions с защитой от обновлений после размонтирования
    setUser: (userData) => {
        // Проверка на размонтирование через try-catch
        try {
            set({
                user: userData,
                userId: userData?.id || null
            });
        } catch (error) {
            console.warn('setUser called after unmount:', error);
        }
    },

    authorize: (userId) => {
        try {
            set({
                isAuthorized: true,
                userId
            });
        } catch (error) {
            console.warn('authorize called after unmount:', error);
        }
    },

    logout: () => {
        try {
            set({
                user: null,
                isAuthorized: false,
                userId: null
            });
        } catch (error) {
            console.warn('logout called after unmount:', error);
        }
    },

    updateUser: (updates) => {
        try {
            set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            }));
        } catch (error) {
            console.warn('updateUser called after unmount:', error);
        }
    },

    // Getters
    getUser: () => get().user,
    getUserId: () => get().userId,
    getIsAuthorized: () => get().isAuthorized
});

// Условно применяем persist middleware
export const useUserStore = ENABLE_PERSIST
    ? create(
        persist(storeConfig, {
            name: 'user-storage',
            partialize: (state) => ({
                isAuthorized: state.isAuthorized,
                userId: state.userId,
                user: state.user
            })
        })
    )
    : create(storeConfig);
