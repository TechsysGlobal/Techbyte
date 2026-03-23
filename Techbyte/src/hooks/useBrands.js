import { useQuery } from '@tanstack/react-query';
import { fetchBrands } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

/**
 * Custom hook for fetching all brands.
 * Used by BrandsSection on the homepage.
 */
export const useBrands = () => {
    return useQuery({
        queryKey: queryKeys.brands.list(),
        queryFn: fetchBrands,
    });
};
