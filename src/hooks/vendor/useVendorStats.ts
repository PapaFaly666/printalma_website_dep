import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorStatsService } from '../../services/vendorStatsService';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';

/**
 * Hook pour récupérer les statistiques du vendeur
 * Cache: 5 minutes
 */
export function useVendorStats() {
  return useQuery({
    queryKey: queryKeys.vendorStats,
    queryFn: () => vendorStatsService.getVendorStats(),
    staleTime: cacheTimes.stats,
    gcTime: cacheTimes.stats * 2,
  });
}

/**
 * Hook pour récupérer le revenu mensuel
 * Cache: 10 minutes (données de graphique)
 */
export function useMonthlyRevenue(months: number = 7) {
  return useQuery({
    queryKey: queryKeys.monthlyRevenue(months),
    queryFn: () => vendorStatsService.getMonthlyRevenue(months),
    staleTime: cacheTimes.charts,
    gcTime: cacheTimes.charts * 2,
    enabled: months > 0,
  });
}

/**
 * Hook pour récupérer les statistiques de revenus avec pourcentages
 * Cache: 10 minutes (données de graphique)
 */
export function useRevenueStats() {
  return useQuery({
    queryKey: queryKeys.revenueStats,
    queryFn: () => vendorStatsService.getRevenueStats(),
    staleTime: cacheTimes.charts,
    gcTime: cacheTimes.charts * 2,
  });
}

/**
 * Hook pour récupérer l'historique des clics boutique
 * Cache: 10 minutes (données de graphique)
 */
export function useShopClicksHistory(days: number = 7) {
  return useQuery({
    queryKey: queryKeys.shopClicks(days),
    queryFn: () => vendorStatsService.getShopClicksHistory(days),
    staleTime: cacheTimes.charts,
    gcTime: cacheTimes.charts * 2,
    enabled: days > 0,
  });
}

/**
 * Hook pour précharger les données du dashboard
 * Utilisez ce hook pour prefetch les données avant navigation
 */
export function usePrefetchDashboardData() {
  const queryClient = useQueryClient();

  const prefetch = () => {
    // Prefetch des stats vendeur
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendorStats,
      queryFn: () => vendorStatsService.getVendorStats(),
      staleTime: cacheTimes.stats,
    });

    // Prefetch du revenu mensuel
    queryClient.prefetchQuery({
      queryKey: queryKeys.monthlyRevenue(7),
      queryFn: () => vendorStatsService.getMonthlyRevenue(7),
      staleTime: cacheTimes.charts,
    });

    // Prefetch des stats de revenus
    queryClient.prefetchQuery({
      queryKey: queryKeys.revenueStats,
      queryFn: () => vendorStatsService.getRevenueStats(),
      staleTime: cacheTimes.charts,
    });

    // Prefetch des clics boutique
    queryClient.prefetchQuery({
      queryKey: queryKeys.shopClicks(7),
      queryFn: () => vendorStatsService.getShopClicksHistory(7),
      staleTime: cacheTimes.charts,
    });
  };

  return { prefetch };
}
