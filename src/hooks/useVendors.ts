import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import {
  VendorInfo,
  VendorsListResponse,
  VendorsStatsResponse,
  VendorStatItem,
  ApiError
} from '../types/auth.types';

interface UseVendorsState {
  vendors: VendorInfo[];
  stats: VendorStatItem[];
  total: number;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  statsError: string | null;
}

interface UseVendorsActions {
  refreshVendors: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  clearStatsError: () => void;
}

export type UseVendorsReturn = UseVendorsState & UseVendorsActions;

export const useVendors = (options?: {
  autoFetch?: boolean;
  fetchStats?: boolean;
}): UseVendorsReturn => {
  const {
    autoFetch = true,
    fetchStats = true
  } = options || {};

  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [stats, setStats] = useState<VendorStatItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  /**
   * Récupère la liste des vendeurs
   */
  const refreshVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: VendorsListResponse = await authService.listVendors();
      
      setVendors(response.vendors);
      setTotal(response.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erreur lors du chargement des vendeurs');
      console.error('Erreur lors du chargement des vendeurs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les statistiques des vendeurs
   */
  const refreshStats = useCallback(async () => {
    if (!fetchStats) return;
    
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const response: VendorsStatsResponse = await authService.getVendorsStats();
      
      setStats(response.stats);
    } catch (err) {
      const apiError = err as ApiError;
      setStatsError(apiError.message || 'Erreur lors du chargement des statistiques');
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [fetchStats]);

  /**
   * Rafraîchit à la fois les vendeurs et les statistiques
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshVendors(),
      fetchStats ? refreshStats() : Promise.resolve()
    ]);
  }, [refreshVendors, refreshStats, fetchStats]);

  /**
   * Efface l'erreur de chargement des vendeurs
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Efface l'erreur de chargement des statistiques
   */
  const clearStatsError = useCallback(() => {
    setStatsError(null);
  }, []);

  // Chargement initial
  useEffect(() => {
    if (autoFetch) {
      refreshAll();
    }
  }, [autoFetch, refreshAll]);

  return {
    // État
    vendors,
    stats,
    total,
    loading,
    statsLoading,
    error,
    statsError,
    
    // Actions
    refreshVendors,
    refreshStats,
    refreshAll,
    clearError,
    clearStatsError
  };
};

/**
 * Hook simplifié pour récupérer uniquement la liste des vendeurs
 */
export const useVendorsList = () => {
  return useVendors({ fetchStats: false });
};

/**
 * Hook simplifié pour récupérer uniquement les statistiques
 */
export const useVendorsStats = () => {
  const [stats, setStats] = useState<VendorStatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: VendorsStatsResponse = await authService.getVendorsStats();
      setStats(response.stats);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    clearError: () => setError(null)
  };
}; 