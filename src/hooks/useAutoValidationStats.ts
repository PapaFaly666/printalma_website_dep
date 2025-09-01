import { useState, useEffect, useCallback } from 'react';
import { autoValidationService, AutoValidationStats } from '../services/autoValidationService';

export const useAutoValidationStats = (autoRefresh = false, interval = 30000) => {
  const [stats, setStats] = useState<AutoValidationStats['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await autoValidationService.getAutoValidationStats();
      setStats(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur récupération stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (autoRefresh) {
      const timer = setInterval(fetchStats, interval);
      return () => clearInterval(timer);
    }
  }, [autoRefresh, interval, fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};