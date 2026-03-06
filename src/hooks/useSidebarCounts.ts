import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

interface SidebarCounts {
  mockupsCount: number;
  paymentRequestsCount: number;
  designValidationCount: number;
}

export const useSidebarCounts = () => {
  const [counts, setCounts] = useState<SidebarCounts>({
    mockupsCount: 0,
    paymentRequestsCount: 0,
    designValidationCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        let mockupsCount = 0;
        let paymentRequestsCount = 0;
        let designValidationCount = 0;

        // Récupérer le nombre de mockups (produits vendeurs)
        try {
          const mockupsResponse = await axios.get(`${API_BASE}/vendor/admin/products`, {
            withCredentials: true,
            headers
          });
          mockupsCount = mockupsResponse.data?.products?.length || 0;
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.warn('Erreur lors de la récupération des mockups:', err.message);
          }
        }

        // Récupérer le nombre de demandes de paiement en attente
        try {
          const paymentRequestsResponse = await axios.get(
            `${API_BASE}/admin/funds-requests?status=PENDING`,
            {
              withCredentials: true,
              headers
            }
          );
          paymentRequestsCount = paymentRequestsResponse.data?.requests?.length || 0;
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.warn('Erreur lors de la récupération des demandes de paiement:', err.message);
          }
        }

        // Récupérer le nombre de designs en attente de validation
        try {
          const designValidationResponse = await axios.get(
            `${API_BASE}/admin/cascade/pending-designs`,
            {
              withCredentials: true,
              headers
            }
          );
          designValidationCount = designValidationResponse.data?.designs?.length || 0;
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.warn('Erreur lors de la récupération des designs en attente:', err.message);
          }
        }

        setCounts({
          mockupsCount,
          paymentRequestsCount,
          designValidationCount,
        });
        setError(null);
      } catch (err) {
        console.error('Erreur générale lors de la récupération des compteurs:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  return { counts, loading, error };
};
