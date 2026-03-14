import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';

/**
 * Hook pour récupérer le profil étendu du vendeur
 * Cache: 10 minutes (données rarement modifiées)
 */
export function useExtendedVendorProfile() {
  return useQuery({
    queryKey: queryKeys.extendedVendorProfile,
    queryFn: async () => {
      const data = await authService.getExtendedVendorProfile();
      return data.success ? data.vendor : null;
    },
    staleTime: cacheTimes.static,
    gcTime: cacheTimes.static * 2,
    retry: 1,
  });
}

/**
 * Hook pour précharger le profil vendeur
 */
export function usePrefetchVendorProfile() {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.extendedVendorProfile,
      queryFn: async () => {
        const data = await authService.getExtendedVendorProfile();
        return data.success ? data.vendor : null;
      },
      staleTime: cacheTimes.static,
    });
  };

  return { prefetch };
}
