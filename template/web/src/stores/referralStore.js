import { create } from 'zustand';

/**
 * Referral Store
 * Manages referral system data (stats, referrals list)
 */
export const useReferralStore = create((set, get) => ({
    // State
    stats: null,
    loading: false,
    error: null,
    lastFetch: null,
    
    // Cache duration (2 minutes for frequently changing data)
    CACHE_DURATION: 2 * 60 * 1000,

    // Actions
    setStats: (stats) => set({
        stats,
        lastFetch: Date.now(),
        error: null
    }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clearError: () => set({ error: null }),

    updateStats: (updates) => set((state) => ({
        stats: state.stats ? { ...state.stats, ...updates } : updates
    })),

    incrementReferralCount: () => set((state) => ({
        stats: state.stats ? {
            ...state.stats,
            referralCount: (state.stats.referralCount || 0) + 1
        } : null
    })),

    updateEarnings: (level, amount) => set((state) => {
        if (!state.stats) return state;
        
        return {
            stats: {
                ...state.stats,
                [`earningsLevel${level}`]: 
                    (state.stats[`earningsLevel${level}`] || 0) + amount,
                totalEarnings: 
                    (state.stats.totalEarnings || 0) + amount
            }
        };
    }),

    clearStats: () => set({
        stats: null,
        lastFetch: null
    }),

    // Getters
    getStats: () => get().stats,

    getTotalEarnings: () => {
        const stats = get().stats;
        return (stats?.earningsLevel1 || 0) + (stats?.earningsLevel2 || 0);
    },

    getReferralCount: () => {
        return get().stats?.referralCount || 0;
    },

    isCacheValid: () => {
        const state = get();
        if (!state.lastFetch) return false;
        return Date.now() - state.lastFetch < state.CACHE_DURATION;
    },

    shouldFetch: () => {
        const state = get();
        return !state.loading && (!state.stats || !state.isCacheValid());
    }
}));





