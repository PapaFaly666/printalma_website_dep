import { useState, useEffect, useCallback } from 'react';
import { PaymentConfigService, OrangeMoneyConfig } from '../services/paymentConfigService';

export function useOrangeMoneyConfig(isAdmin: boolean = false) {
  const [config, setConfig] = useState<OrangeMoneyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pour Orange Money, on ne récupère que la config admin
      // car il n'y a pas d'endpoint public pour Orange Money
      if (isAdmin) {
        const data = await PaymentConfigService.getOrangeMoneyAdminConfig();
        setConfig(data);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors de la récupération de la configuration Orange Money:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const refetch = useCallback(() => {
    return fetchConfig();
  }, [fetchConfig]);

  return { config, loading, error, refetch };
}
