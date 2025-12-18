import { create } from 'zustand';

/**
 * Products Store
 * Manages shop products data
 */
export const useProductsStore = create((set, get) => ({
    // State
    products: [],
    loading: false,
    error: null,
    lastFetch: null,
    
    // Cache duration (5 minutes)
    CACHE_DURATION: 5 * 60 * 1000,

    // Actions
    setProducts: (products) => set({
        products,
        lastFetch: Date.now(),
        error: null
    }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clearError: () => set({ error: null }),

    addProduct: (product) => set((state) => ({
        products: [...state.products, product]
    })),

    updateProduct: (productId, updates) => set((state) => ({
        products: state.products.map(p =>
            p.id === productId ? { ...p, ...updates } : p
        )
    })),

    removeProduct: (productId) => set((state) => ({
        products: state.products.filter(p => p.id !== productId)
    })),

    clearProducts: () => set({
        products: [],
        lastFetch: null
    }),

    // Getters
    getProduct: (productId) => {
        const state = get();
        return state.products.find(p => p.id === productId);
    },

    getProducts: () => get().products,

    isCacheValid: () => {
        const state = get();
        if (!state.lastFetch) return false;
        return Date.now() - state.lastFetch < state.CACHE_DURATION;
    },

    shouldFetch: () => {
        const state = get();
        return !state.loading && (!state.products.length || !state.isCacheValid());
    }
}));





