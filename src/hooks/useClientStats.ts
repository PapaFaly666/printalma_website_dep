import { useState, useEffect } from 'react';
import authService from '../services/auth.service';

interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
  recentLogins: number;
}

export const useClientStats = () => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.getClientStats();
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats,
    clearError: () => setError(null)
  };
}; 