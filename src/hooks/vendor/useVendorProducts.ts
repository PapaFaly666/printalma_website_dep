import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';
import { API_CONFIG } from '../../config/api';

/**
 * Hook React Query pour récupérer les produits du vendeur
 * Cache: 5 minutes, invalidation manuelle via refetch()
 */
export function useVendorProducts() {
  return useQuery({
    queryKey: queryKeys.vendorProducts,
    queryFn: async () => {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/products`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const fallback = await fetch(`${API_CONFIG.BASE_URL}/public/best-sellers?limit=20`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!fallback.ok) throw new Error(`HTTP error! status: ${fallback.status}`);
        const fallbackResult = await fallback.json();
        if (fallbackResult.success && fallbackResult.data?.bestSellers) return fallbackResult.data.bestSellers;
        if (Array.isArray(fallbackResult.data)) return fallbackResult.data;
        if (Array.isArray(fallbackResult)) return fallbackResult;
        return [];
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) return result.data;
      if (result.data?.products && Array.isArray(result.data.products)) return result.data.products;
      if (Array.isArray(result)) return result;
      if (result.products && Array.isArray(result.products)) return result.products;
      return [];
    },
    staleTime: cacheTimes.stats,
    gcTime: cacheTimes.stats * 2,
    retry: 2,
  });
}

export function usePrefetchVendorProducts() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendorProducts,
      queryFn: async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/products`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return [];
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) return result.data;
        return [];
      },
    });
}
