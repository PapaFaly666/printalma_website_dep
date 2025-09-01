import { useState, useEffect, useCallback } from 'react';
import { 
  OptimizedBestSellersService, 
  OptimizedBestSellersOptions,
  OptimizedBestSellerProduct,
  OptimizedBestSellersResponse
} from '../services/optimizedBestSellersService';

interface BestSellersState {
  data: OptimizedBestSellerProduct[];
  pagination: OptimizedBestSellersResponse['pagination'] | null;
  stats: OptimizedBestSellersResponse['stats'] | null;
  loading: boolean;
  error: string | null;
  cacheInfo: OptimizedBestSellersResponse['cacheInfo'] | null;
  meta: OptimizedBestSellersResponse['meta'] | null;
}

interface UseOptimizedBestSellersOptions extends OptimizedBestSellersOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

/**
 * 🚀 Hook React Optimisé pour les Meilleures Ventes
 */
export const useOptimizedBestSellers = (options: UseOptimizedBestSellersOptions = {}) => {
  const [state, setState] = useState<BestSellersState>({
    data: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
    cacheInfo: null,
    meta: null
  });

  const service = new OptimizedBestSellersService();
  const { autoRefresh, refreshInterval = 5 * 60 * 1000, ...apiOptions } = options;

  const fetchBestSellers = useCallback(async (customOptions?: OptimizedBestSellersOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const finalOptions = { ...apiOptions, ...customOptions };
      const result = await service.getBestSellers(finalOptions);
      
      setState({
        data: result.data,
        pagination: result.pagination,
        stats: result.stats,
        cacheInfo: result.cacheInfo || null,
        meta: result.meta,
        loading: false,
        error: null
      });
      
      // Log des performances
      console.log(`🏆 Best sellers chargés:`, {
        count: result.data.length,
        executionTime: result.meta.executionTime,
        dataSource: result.meta.dataSource,
        cached: result.cacheInfo?.cached
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      console.error('❌ Erreur chargement best sellers:', err);
    }
  }, [apiOptions]);

  // Chargement initial
  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  // Rafraîchissement automatique
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh des best sellers...');
        fetchBestSellers();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchBestSellers]);

  // Méthodes utilitaires
  const refresh = useCallback(() => {
    console.log('🔄 Rafraîchissement manuel des best sellers...');
    fetchBestSellers();
  }, [fetchBestSellers]);

  const loadMore = useCallback(() => {
    if (state.pagination?.hasMore) {
      const newOffset = state.pagination.offset + state.pagination.limit;
      console.log(`📄 Chargement de plus de résultats (offset: ${newOffset})...`);
      fetchBestSellers({ offset: newOffset });
    }
  }, [state.pagination, fetchBestSellers]);

  const changePeriod = useCallback((period: OptimizedBestSellersOptions['period']) => {
    console.log(`📅 Changement de période: ${period}`);
    fetchBestSellers({ period, offset: 0 }); // Reset offset
  }, [fetchBestSellers]);

  const changeSort = useCallback((
    sortBy: OptimizedBestSellersOptions['sortBy'], 
    sortOrder: OptimizedBestSellersOptions['sortOrder'] = 'desc'
  ) => {
    console.log(`📊 Changement de tri: ${sortBy} ${sortOrder}`);
    fetchBestSellers({ sortBy, sortOrder, offset: 0 }); // Reset offset
  }, [fetchBestSellers]);

  const filterByVendor = useCallback((vendorId: number | undefined) => {
    console.log(`👤 Filtrage par vendeur: ${vendorId}`);
    fetchBestSellers({ vendorId, offset: 0 }); // Reset offset
  }, [fetchBestSellers]);

  const filterByCategory = useCallback((categoryId: number | undefined) => {
    console.log(`📂 Filtrage par catégorie: ${categoryId}`);
    fetchBestSellers({ categoryId, offset: 0 }); // Reset offset
  }, [fetchBestSellers]);

  return {
    // Données
    data: state.data,
    pagination: state.pagination,
    stats: state.stats,
    cacheInfo: state.cacheInfo,
    meta: state.meta,
    
    // États
    loading: state.loading,
    error: state.error,
    
    // Métriques utiles
    hasData: state.data.length > 0,
    hasMore: state.pagination?.hasMore || false,
    total: state.pagination?.total || 0,
    currentPage: state.pagination?.currentPage || 1,
    totalPages: state.pagination?.totalPages || 0,
    
    // Actions
    refresh,
    loadMore,
    changePeriod,
    changeSort,
    filterByVendor,
    filterByCategory,
    fetchBestSellers,
    
    // Informations de performance
    executionTime: state.meta?.executionTime || 0,
    dataSource: state.meta?.dataSource || 'unknown',
    isCached: state.cacheInfo?.cached || false,
    cacheAge: state.cacheInfo?.cacheAge || 0
  };
};

/**
 * 📊 Hook pour les statistiques rapides uniquement
 */
export const useQuickStats = (autoRefresh = false, refreshInterval = 10 * 60 * 1000) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState(null);

  const service = new OptimizedBestSellersService();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.getQuickStats();
      setStats(result.data);
      setMeta(result.meta);
      console.log(`📊 Stats rapides chargées en ${result.meta.executionTime}ms`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur stats';
      setError(errorMessage);
      console.error('❌ Erreur stats rapides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh des stats rapides...');
        fetchStats();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchStats]);

  return {
    stats,
    meta,
    loading,
    error,
    refresh: fetchStats,
    executionTime: meta?.executionTime || 0,
    dataSource: meta?.dataSource || 'unknown'
  };
}; 