// ─── Query Key Factory ───────────────────────────────────────────────────────
// Centralized factory for React Query cache keys.
// Prevents typos and makes invalidation predictable.
// Usage: queryKeys.products.list({ page: 1 }) → ['products', 'list', { page: 1 }]

export const queryKeys = {
    products: {
        all: ['products'],
        list: (filters) => ['products', 'list', filters],
        featured: () => ['products', 'featured'],
        detail: (handle) => ['products', 'detail', handle],
    },
    brands: {
        all: ['brands'],
        list: () => ['brands', 'list'],
    },
};
