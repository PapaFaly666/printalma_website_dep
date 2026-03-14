/**
 * Hooks React Query pour le vendeur
 *
 * Ces hooks gèrent automatiquement le cache, le rafraîchissement et les erreurs
 * pour toutes les données du vendeur.
 */

// Stats et revenus
export {
  useVendorStats,
  useMonthlyRevenue,
  useRevenueStats,
  useShopClicksHistory,
  usePrefetchDashboardData,
} from './useVendorStats';

// Commandes et finances
export {
  useMyOrders,
  useVendorFinances,
  usePrefetchFinances,
} from './useVendorOrders';

// Profil
export {
  useExtendedVendorProfile,
  usePrefetchVendorProfile,
} from './useVendorProfile';

// Dashboard
export {
  useDesignRevenue,
} from './useVendorDashboard';

// Produits
export {
  useVendorProducts,
  usePrefetchVendorProducts,
} from './useVendorProducts';

// Designs
export {
  useVendorDesigns,
} from './useVendorDesigns';

// Galeries
export {
  useVendorGalleries,
  usePublicVendorGallery,
  useCreateOrUpdateGallery,
  useUpdateGalleryInfo,
  useDeleteGallery,
  useTogglePublishGallery,
  useChangeGalleryStatus,
  usePrefetchGallery,
} from './useVendorGalleries';

// Fonds et retraits
export {
  useVendorEarnings,
  useFundsRequests,
  useCreateFundsRequest,
  useOrderStatistics,
  usePrefetchFunds,
} from './useFunds';

// Revenus de designs
export {
  useDesignRevenueStats,
  useDesignRevenues,
  useDesignUsageHistory,
  usePrefetchDesignRevenues,
} from './useDesignRevenues';
