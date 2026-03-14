import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  vendorFundsService,
  FundsRequest,
  VendorEarnings,
  CreateFundsRequest,
  FundsRequestFilters
} from '../../services/vendorFundsService';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';
import { toast } from 'sonner';

/**
 * Hook pour récupérer les gains du vendeur
 * Cache: 2 minutes (données financières frequently updated)
 */
export function useVendorEarnings() {
  return useQuery({
    queryKey: queryKeys.vendorFinances,
    queryFn: () => vendorFundsService.getVendorEarnings(),
    staleTime: cacheTimes.frequent * 2,
    gcTime: cacheTimes.frequent * 3,
  });
}

/**
 * Hook pour récupérer les demandes d'appel de fonds
 * Cache: 1 minute (données frequently updated)
 */
export function useFundsRequests(filters: FundsRequestFilters) {
  return useQuery({
    queryKey: [...queryKeys.fundsRequests, filters],
    queryFn: () => vendorFundsService.getVendorFundsRequests(filters),
    staleTime: cacheTimes.frequent,
    gcTime: cacheTimes.frequent * 2,
  });
}

/**
 * Hook pour créer une demande d'appel de fonds
 * Invalide le cache après succès
 */
export function useCreateFundsRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFundsRequest) =>
      vendorFundsService.createFundsRequest(data),
    onSuccess: () => {
      // Invalider le cache des demandes et des gains
      queryClient.invalidateQueries({ queryKey: queryKeys.fundsRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorFinances });
      toast.success('Demande créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création de la demande');
    },
  });
}

/**
 * Hook pour récupérer les statistiques de commandes (via /orders/my-orders)
 * Cache: 2 minutes
 */
export function useOrderStatistics() {
  return useQuery({
    queryKey: ['orders', 'statistics'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }

      const data = await response.json();
      return data.data.statistics;
    },
    staleTime: cacheTimes.frequent * 2,
    gcTime: cacheTimes.frequent * 3,
  });
}

/**
 * Prefetch des données de fonds pour optimisation
 */
export function usePrefetchFunds() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendorFinances,
      queryFn: () => vendorFundsService.getVendorEarnings(),
      staleTime: cacheTimes.frequent * 2,
    });
  };
}
