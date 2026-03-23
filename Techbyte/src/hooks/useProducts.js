import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

export const useProducts = (filters) => {
    return useQuery({
        queryKey: queryKeys.products.list(filters),
        queryFn: () => fetchProducts(filters),
        placeholderData: keepPreviousData, // Keep showing old data while fetching new page
    });
};
