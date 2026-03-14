import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../../services/ordersService';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';

/**
 * Hook pour récupérer les commandes du vendeur avec statistiques
 * Cache: 2 minutes (données frequently updated)
 */
export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.myOrders,
    queryFn: () => ordersService.getMyOrders(),
    staleTime: cacheTimes.frequent * 2,
    gcTime: cacheTimes.frequent * 3,
  });
}

/**
 * Hook pour récupérer uniquement les statistiques financières
 * Cache: 2 minutes (données frequently updated)
 */
export function useVendorFinances() {
  return useQuery({
    queryKey: queryKeys.vendorFinances,
    queryFn: async () => {
      const response = await ordersService.getMyOrders();
      return {
        yearlyRevenue: response.statistics?.annualRevenue || 0,
        monthlyRevenue: response.statistics?.monthlyRevenue || 0,
        availableAmount: response.statistics?.totalVendorAmount || 0,
        totalOrders: response.statistics?.totalOrders || 0,
        totalCommission: response.statistics?.totalCommission || 0,
        totalRevenue: response.statistics?.totalRevenue || 0,
        pendingWithdrawalAmount: response.vendorFinances?.pendingWithdrawalAmount || 0,
      };
    },
    staleTime: cacheTimes.frequent * 2,
    gcTime: cacheTimes.frequent * 3,
  });
}

/**
 * Hook pour précharger les données financières
 */
export function usePrefetchFinances() {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.myOrders,
      queryFn: () => ordersService.getMyOrders(),
      staleTime: cacheTimes.frequent * 2,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.vendorFinances,
      queryFn: async () => {
        const response = await ordersService.getMyOrders();
        return {
          yearlyRevenue: response.statistics?.annualRevenue || 0,
          monthlyRevenue: response.statistics?.monthlyRevenue || 0,
          availableAmount: response.statistics?.totalVendorAmount || 0,
        };
      },
      staleTime: cacheTimes.frequent * 2,
    });
  };

  return { prefetch };
}
