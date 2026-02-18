import { useState, useEffect, useCallback } from 'react';
import { PaymentConfigService, PaydunyaConfig } from '../services/paymentConfigService';

export function usePaydunyaConfig(isAdmin: boolean = false) {
  const [config, setConfig] = useState<PaydunyaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: PaydunyaConfig;

      // Si isAdmin = true, récupérer la config admin complète (avec cookies)
      // Sinon, récupérer la config publique
      if (isAdmin) {
        data = await PaymentConfigService.getPaydunyaAdminConfig();
      } else {
        data = await PaymentConfigService.getPaydunyaConfig();
      }

      setConfig(data);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors de la récupération de la configuration Paydunya:', err);
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
