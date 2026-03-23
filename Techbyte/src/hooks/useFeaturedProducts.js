import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

/**
 * Custom hook for featured products on the homepage.
 * Fetches top 12 products sorted by inventory (proxy for popularity).
 */
export const useFeaturedProducts = () => {
    return useQuery({
        queryKey: queryKeys.products.featured(),
        queryFn: () =>
            fetchProducts({
                limit: 12,
                sort: 'variantInventoryQty',
                order: 'desc',
            }),
    });
};
