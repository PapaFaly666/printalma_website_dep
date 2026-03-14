import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration globale de React Query
 *
 * Options configurées :
 * - staleTime: 5 minutes (données considérées fraîches pendant 5 min)
 * - retry: 2 tentatives en cas d'échec
 * - refetchOnWindowFocus: true (rafraîchit quand l'utilisateur revient sur l'onglet)
 * - refetchOnReconnect: true (rafraîchit quand la connexion est rétablie)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durée pendant laquelle les données sont considérées comme fraîches
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Nombre de tentatives en cas d'erreur
      retry: 2,

      // Délai entre les tentatives de retry
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Rafraîchir automatiquement au focus de la fenêtre
      refetchOnWindowFocus: true,

      // Rafraîchir automatiquement lors de la reconnexion
      refetchOnReconnect: true,

      // Garde les données en cache pendant 30 minutes après inactivité
      gcTime: 30 * 60 * 1000, // 30 minutes (anciennement cacheTime)
    },
    mutations: {
      // Pas de retry automatique pour les mutations
      retry: false,

      // Erreurs non affichées dans la console (gérées manuellement)
      throwOnError: false,
    },
  },
});

/**
 * Clés de query utilisées dans l'application
 * Centralisation pour faciliter l'invalidation et le prefetch
 */
export const queryKeys = {
  // Stats vendeur
  vendorStats: ['vendor', 'stats'] as const,
  vendorStatsDetail: (id: number) => ['vendor', 'stats', id] as const,

  // Revenus
  monthlyRevenue: (months: number) => ['vendor', 'revenue', 'monthly', months] as const,
  revenueStats: ['vendor', 'revenue', 'stats'] as const,
  designRevenue: ['vendor', 'revenue', 'design'] as const,

  // Clics boutique
  shopClicks: (days: number) => ['vendor', 'shop', 'clicks', days] as const,

  // Produits vendeur
  vendorProducts: ['vendor', 'products'] as const,
  vendorProduct: (id: number) => ['vendor', 'products', id] as const,

  // Designs vendeur
  vendorDesigns: ['vendor', 'designs'] as const,
  vendorDesign: (id: number) => ['vendor', 'designs', id] as const,

  // Commandes
  orders: ['orders'] as const,
  vendorOrders: ['vendor', 'orders'] as const,
  order: (id: number) => ['orders', id] as const,

  // Finances
  vendorFinances: ['vendor', 'finances'] as const,
  myOrders: ['orders', 'my-orders'] as const,

  // Profil
  vendorProfile: ['vendor', 'profile'] as const,
  extendedVendorProfile: ['vendor', 'profile', 'extended'] as const,

  // Galeries
  vendorGalleries: ['vendor', 'galleries'] as const,
  publicGallery: (vendorId: number) => ['public', 'galleries', vendorId] as const,

  // Fonds et retraits
  fundsRequests: ['vendor', 'funds-requests'] as const,
  fundsRequest: (id: number) => ['vendor', 'funds-requests', id] as const,
} as const;

/**
 * Temps de cache spécifiques pour différents types de données
 */
export const cacheTimes = {
  // Statistics: 5 minutes
  stats: 5 * 60 * 1000,

  // Charts: 10 minutes
  charts: 10 * 60 * 1000,

  // Données frequently updated: 1 minute
  frequent: 1 * 60 * 1000,

  // Données rarement modifiées: 30 minutes
  static: 30 * 60 * 1000,
} as const;
