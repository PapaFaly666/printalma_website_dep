import { useQuery } from '@tanstack/react-query';
import vendorDesignRevenueService from '../../services/vendorDesignRevenueService';
import { RevenueStats } from '../../services/vendorDesignRevenueService';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';

/**
 * Hook pour récupérer les revenus des designs
 * Cache: 10 minutes (données de graphique)
 */
export function useDesignRevenue() {
  return useQuery({
    queryKey: queryKeys.designRevenue,
    queryFn: () => vendorDesignRevenueService.getRevenueStats('all'),
    staleTime: cacheTimes.charts,
    gcTime: cacheTimes.charts * 2,
  });
}
