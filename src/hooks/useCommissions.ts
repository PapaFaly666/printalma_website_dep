import { useState, useEffect, useCallback } from 'react';
import { commissionService, VendorCommissionData, CommissionStats } from '../services/commissionService';

export interface UseCommissionsReturn {
  // État des commissions
  commissions: VendorCommissionData[];
  stats: CommissionStats | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  updateCommission: (vendorId: number, rate: number) => Promise<void>;
  refreshCommissions: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearError: () => void;
  
  // Utilitaires
  getVendorCommission: (vendorId: number) => number | null;
  formatCFA: (amount: number) => string;
}

export const useCommissions = (): UseCommissionsReturn => {
  const [commissions, setCommissions] = useState<VendorCommissionData[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshCommissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await commissionService.getAllVendorCommissions();
      setCommissions(data);
    } catch (err: any) {
      console.error('Erreur chargement commissions:', err);
      setError(err.message || 'Erreur lors du chargement des commissions');
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const statsData = await commissionService.getCommissionStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Erreur chargement stats:', err);
      // Les stats sont optionnelles, on n'affiche pas d'erreur critique
    }
  }, []);

  const updateCommission = useCallback(async (vendorId: number, rate: number) => {
    setError(null);
    
    try {
      await commissionService.updateVendorCommission(vendorId, rate);
      
      // Mettre à jour localement la commission
      setCommissions(prev => 
        prev.map(commission => 
          commission.vendorId === vendorId 
            ? { ...commission, commissionRate: rate, lastUpdated: new Date().toISOString() }
            : commission
        )
      );
      
      // Rafraîchir les stats en arrière-plan
      refreshStats();
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la commission');
      throw err; // Re-throw pour permettre à l'UI de gérer l'erreur
    }
  }, [refreshStats]);

  const getVendorCommission = useCallback((vendorId: number): number | null => {
    const vendor = commissions.find(c => c.vendorId === vendorId);
    return vendor ? vendor.commissionRate : null;
  }, [commissions]);

  const formatCFA = useCallback((amount: number): string => {
    return commissionService.formatCFA(amount);
  }, []);

  // Chargement initial
  useEffect(() => {
    refreshCommissions();
    refreshStats();
  }, [refreshCommissions, refreshStats]);

  return {
    // État
    commissions,
    stats,
    loading,
    error,
    
    // Actions
    updateCommission,
    refreshCommissions,
    refreshStats,
    clearError,
    
    // Utilitaires
    getVendorCommission,
    formatCFA,
  };
};