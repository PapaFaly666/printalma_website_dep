import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import newOrderService from '../services/newOrderService';
import { Order, OrderStatus, OrderStatistics, AdminOrderFilters } from '../types/order';

// ==========================================
// QUERY KEYS
// ==========================================

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: any) => [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  statistics: () => [...orderKeys.all, 'statistics'] as const,
};

// ==========================================
// TYPES
// ==========================================

interface OrdersResponse {
  orders: Order[];
  totalPages: number;
  total: number;
  page: number;
  limit: number;
}

// ==========================================
// HOOKS
// ==========================================

/**
 * Hook pour charger la liste des commandes avec caching
 * Les données sont mises en cache pendant 5 minutes (staleTime)
 * Le cache est conservé pendant 10 minutes (gcTime)
 */
export const useOrders = (filters: AdminOrderFilters = {}) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      console.log('🔄 [useOrders] Fetching orders from API...', filters);
      const result = await newOrderService.getAllOrders(filters);
      console.log('✅ [useOrders] Orders fetched:', result.orders.length);
      return result;
    },
    // Configuration du cache
    staleTime: 5 * 60 * 1000, // 5 minutes - les données sont fraîches pendant 5min
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime) - conservation en cache
    refetchOnMount: false, // Ne pas refetch automatiquement au montage
    refetchOnWindowFocus: false, // Ne pas refetch quand la fenêtre reprend le focus
    refetchOnReconnect: false, // Ne pas refetch à la reconnexion
    // Garder les anciennes données pendant le chargement des nouvelles
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook pour charger les statistiques des commandes avec caching
 */
export const useOrderStatistics = () => {
  return useQuery({
    queryKey: orderKeys.statistics(),
    queryFn: async () => {
      console.log('🔄 [useOrderStatistics] Fetching statistics from API...');
      const stats = await newOrderService.getStatistics();
      console.log('✅ [useOrderStatistics] Statistics fetched');
      return stats as OrderStatistics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/**
 * Hook pour charger une commande spécifique avec caching
 */
export const useOrder = (orderId: number | undefined) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId!),
    queryFn: async () => {
      console.log('🔄 [useOrder] Fetching order from API...', orderId);
      const order = await newOrderService.getOrderByIdAdmin(orderId!);
      console.log('✅ [useOrder] Order fetched:', order.orderNumber);
      return order as Order;
    },
    enabled: !!orderId, // Ne faire la requête que si l'ID est fourni
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Hook pour mettre à jour le statut d'une commande
 * Invalide automatiquement le cache après succès
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
      notes,
    }: {
      orderId: number;
      newStatus: OrderStatus;
      notes?: string;
    }) => {
      console.log('🔄 [useUpdateOrderStatus] Updating order status...', { orderId, newStatus });
      await newOrderService.updateOrderStatus(orderId, newStatus, notes);
      return { orderId, newStatus };
    },
    onSuccess: (data) => {
      console.log('✅ [useUpdateOrderStatus] Order status updated, invalidating cache...');

      // Invalider toutes les listes de commandes pour forcer un refetch
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists(),
      });

      // Invalider les statistiques
      queryClient.invalidateQueries({
        queryKey: orderKeys.statistics(),
      });

      // Invalider la commande spécifique
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(data.orderId),
      });

      // Afficher une notification de succès
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Statut mis à jour', {
          body: `La commande a été mise à jour avec succès`,
          icon: '/favicon.ico',
          tag: 'success',
        });
      }
    },
    onError: (error: any) => {
      console.error('❌ [useUpdateOrderStatus] Error:', error);

      // Afficher une notification d'erreur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Erreur', {
          body: error?.message || 'Impossible de mettre à jour le statut',
          icon: '/favicon.ico',
          tag: 'error',
        });
      }
    },
  });
};

/**
 * Hook pour rafraîchir manuellement les commandes
 * Utilisé pour le bouton "Actualiser" et les WebSocket updates
 */
export const useRefreshOrders = () => {
  const queryClient = useQueryClient();

  return {
    refreshOrders: () => {
      console.log('🔄 [useRefreshOrders] Manually refreshing orders...');
      queryClient.invalidateQueries({
        queryKey: orderKeys.lists(),
      });
    },
    refreshStatistics: () => {
      console.log('🔄 [useRefreshOrders] Manually refreshing statistics...');
      queryClient.invalidateQueries({
        queryKey: orderKeys.statistics(),
      });
    },
    refreshAll: () => {
      console.log('🔄 [useRefreshOrders] Manually refreshing all order data...');
      queryClient.invalidateQueries({
        queryKey: orderKeys.all,
      });
    },
  };
};

/**
 * Hook pour mettre à jour une commande localement dans le cache
 * Utile pour les mises à jour optimistes ou les WebSocket updates
 */
export const useUpdateOrderInCache = () => {
  const queryClient = useQueryClient();

  return {
    updateOrder: (orderId: number, updater: (old: Order) => Order) => {
      // Mettre à jour dans le cache de détail
      queryClient.setQueryData<Order>(
        orderKeys.detail(orderId),
        (old) => old ? updater(old) : old
      );

      // Mettre à jour dans toutes les listes
      queryClient.setQueriesData(
        { queryKey: orderKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order: Order) =>
              order.id === orderId ? updater(order) : order
            ),
          };
        }
      );
    },
    updateOrderStatus: (orderId: number, newStatus: OrderStatus) => {
      // Mise à jour optimiste du statut
      queryClient.setQueriesData(
        { queryKey: orderKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map((order: Order) =>
              order.id === orderId ? { ...order, status: newStatus } : order
            ),
          };
        }
      );
    },
  };
};
