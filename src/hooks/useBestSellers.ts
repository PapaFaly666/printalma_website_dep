import { useState, useEffect, useCallback } from 'react';
import {
  BestSellersQueryParams,
  BestSellersState,
  BestSellerProduct, // ✅ Mise à jour: Utiliser le nouveau type
  BestSellersPagination,
  BestSellersStats
} from '../types/bestSellers';
import { fetchBestSellersWithFallback, refreshBestSellersCache } from '../services/bestSellersService';

const initialState: BestSellersState = {
  data: [],
  loading: false,
  error: null,
  pagination: null,
  stats: null
};

export function useBestSellers(initialParams: BestSellersQueryParams = {}) {
  const [state, setState] = useState<BestSellersState>(initialState);
  const [params, setParams] = useState<BestSellersQueryParams>({
    period: 'month',
    limit: 10,
    offset: 0,
    ...initialParams
  });

  const fetchData = useCallback(async (fetchParams: BestSellersQueryParams = params) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // ✅ CORRECTION: Utiliser fetchBestSellersWithFallback pour la compatibilité
      const response = await fetchBestSellersWithFallback(fetchParams);
      
      if (response.data && response.data.length > 0) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          pagination: null, // ✅ Simplifié pour l'instant
          stats: null       // ✅ Simplifié pour l'instant
        });
      } else if (response.error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Aucune donnée disponible'
        }));
      }
    } catch (error) {
      console.error('Error in useBestSellers:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur de connexion au serveur'
      }));
    }
  }, [params]);

  const refreshCache = useCallback(async () => {
    try {
      const response = await refreshBestSellersCache();
      if (response.success) {
        // Recharger les données après rafraîchissement du cache
        await fetchData();
        return { success: true, message: response.message };
      } else {
        return { success: false, message: 'Erreur lors du rafraîchissement du cache' };
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }, [fetchData]);

  const updateParams = useCallback((newParams: Partial<BestSellersQueryParams>) => {
    const updatedParams = { ...params, ...newParams, offset: 0 }; // Reset offset when changing other params
    setParams(updatedParams);
  }, [params]);

  const loadMore = useCallback(() => {
    if (state.pagination?.hasMore) {
      const newParams = {
        ...params,
        offset: (params.offset || 0) + (params.limit || 10)
      };
      setParams(newParams);
    }
  }, [params, state.pagination?.hasMore]);

  const resetPagination = useCallback(() => {
    setParams(prev => ({ ...prev, offset: 0 }));
  }, []);

  // Charger les données au montage et quand les paramètres changent
  useEffect(() => {
    fetchData(params);
  }, [fetchData, params]);

  return {
    // État
    ...state,
    
    // Paramètres
    params,
    
    // Actions
    fetchData,
    refreshCache,
    updateParams,
    loadMore,
    resetPagination,
    
    // Utilitaires
    hasMore: state.pagination?.hasMore || false,
    total: state.pagination?.total || 0,
    currentPage: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
    totalPages: state.pagination ? Math.ceil(state.pagination.total / state.pagination.limit) : 0
  };
}

// Hook spécialisé pour les statistiques uniquement
export function useBestSellersStats(period: BestSellersQueryParams['period'] = 'month') {
  const [stats, setStats] = useState<BestSellersStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchBestSellersWithFallback({ period, limit: 1 });
      
      if ((response as any).success && (response as any).data) {
        setStats((response as any).data.stats);
      } else {
        setError('Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
} 