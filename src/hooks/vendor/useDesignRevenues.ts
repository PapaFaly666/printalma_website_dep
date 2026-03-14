import { useQuery } from '@tanstack/react-query';
import vendorDesignRevenueService, { DesignRevenue, RevenueStats, DesignUsage } from '../../services/vendorDesignRevenueService';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';

/**
 * Hook pour récupérer les statistiques de revenus des designs
 * Cache: 2 minutes (données frequently updated)
 */
export function useDesignRevenueStats(period: 'week' | 'month' | 'year' | 'all' = 'month') {
  return useQuery({
    queryKey: ['vendor', 'design-revenue-stats', period],
    queryFn: () => vendorDesignRevenueService.getRevenueStats(period),
    staleTime: cacheTimes.frequent * 2,
    gcTime: cacheTimes.frequent * 3,
  });
}

/**
 * Hook pour récupérer les revenus de designs avec filtres
 * Cache: 2 minutes (données frequently updated)
 */
export function useDesignRevenues(filters: {
  period?: 'week' | 'month' | 'year' | 'all';
  sortBy?: 'revenue' | 'usage' | 'recent';
  search?: string;
}) {
  return useQuery({
    queryKey: ['vendor', 'design-revenues', filters],
    queryFn: () => vendorDesignRevenueService.getDesignRevenues(filters),
    staleTime: cacheTimes.frequent * 2,
    gcTime: cacheTimes.frequent * 3,
  });
}

/**
 * Hook pour récupérer l'historique d'utilisation d'un design
 * Cache: 5 minutes (données historiques)
 */
export function useDesignUsageHistory(designId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['vendor', 'design-usage-history', designId],
    queryFn: () => vendorDesignRevenueService.getDesignUsageHistory(designId),
    enabled,
    staleTime: cacheTimes.charts / 2,
    gcTime: cacheTimes.charts,
  });
}

/**
 * Prefetch des données de revenus de designs pour optimisation
 */
export function usePrefetchDesignRevenues() {
  // Ce hook pourrait être étendu pour précharger les données
  return {
    prefetchStats: async (period: 'week' | 'month' | 'year' | 'all' = 'month') => {
      // Implementation si nécessaire
    }
  };
}
