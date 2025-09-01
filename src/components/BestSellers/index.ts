// Export des composants des meilleures ventes
export { BestSellersDisplay } from './BestSellersDisplay';
export { BestSellersContainer } from './BestSellersContainer';

// Export des types
export type {
  BestSellersPeriod,
  BestSellersQueryParams,
  RealBestSellerProduct,
  BestSellersPagination,
  BestSellersStats,
  BestSellersResponse,
  CacheRefreshResponse,
  BestSellersState
} from '../../types/bestSellers';

// Export des hooks
export { useBestSellers, useBestSellersStats } from '../../hooks/useBestSellers';

// Export des services
export {
  fetchBestSellers,
  refreshBestSellersCache,
  fetchBestSellersWithFallback,
  fetchBestSellersStats
} from '../../services/bestSellersService'; 