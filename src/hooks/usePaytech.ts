import { useState, useCallback } from 'react';
import { paytechService, type PayTechPaymentRequest, type PayTechPaymentResponse } from '../services/paytechService';

export interface UsePaytechState {
  loading: boolean;
  error: string | null;
  paymentData: PayTechPaymentResponse | null;
}

export const usePaytech = () => {
  const [state, setState] = useState<UsePaytechState>({
    loading: false,
    error: null,
    paymentData: null,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const initiatePayment = useCallback(async (paymentData: PayTechPaymentRequest): Promise<PayTechPaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('💳 [usePaytech] Initialisation du paiement:', paymentData);

      // Validation des données
      if (!paymentData.item_name || paymentData.item_name.trim().length === 0) {
        throw new Error('Le nom du produit est requis');
      }

      if (!paymentData.item_price || paymentData.item_price <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      if (!paymentData.command_name || paymentData.command_name.trim().length === 0) {
        throw new Error('La description de la commande est requise');
      }

      // Ajouter les URLs de retour automatiquement
      const enhancedPaymentData: PayTechPaymentRequest = {
        ...paymentData,
        currency: paymentData.currency || 'XOF',
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        custom_field: paymentData.custom_field ? JSON.stringify(paymentData.custom_field) : undefined,
      };

      console.log('💳 [usePaytech] Données enrichies:', enhancedPaymentData);

      const response = await paytechService.initiatePayment(enhancedPaymentData);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'initialisation du paiement');
      }

      setState(prev => ({ ...prev, paymentData: response, loading: false }));
      console.log('✅ [usePaytech] Paiement initialisé avec succès:', response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors du paiement';
      console.error('❌ [usePaytech] Erreur:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  const checkStatus = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [usePaytech] Vérification du statut pour token:', token);

      const status = await paytechService.checkPaymentStatus(token);

      setState(prev => ({ ...prev, loading: false }));

      console.log('📡 [usePaytech] Statut reçu:', status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification du statut';
      console.error('❌ [usePaytech] Erreur vérification statut:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const redirectToPayment = useCallback((response: PayTechPaymentResponse) => {
    if (response.success && response.data?.redirect_url) {
      console.log('🔄 [usePaytech] Redirection vers:', response.data.redirect_url);
      window.location.href = response.data.redirect_url;
    } else {
      throw new Error('URL de redirection invalide');
    }
  }, []);

  const initiatePaymentAndRedirect = useCallback(async (paymentData: PayTechPaymentRequest) => {
    try {
      const response = await initiatePayment(paymentData);

      if (response.success && response.data?.redirect_url) {
        // Stocker les informations de paiement pour la page de retour
        localStorage.setItem('pendingPayment', JSON.stringify({
          token: response.data.token,
          ref_command: response.data.ref_command,
          amount: paymentData.item_price,
          item_name: paymentData.item_name,
          timestamp: Date.now(),
        }));

        redirectToPayment(response);
      } else {
        throw new Error('Réponse de paiement invalide');
      }
    } catch (error) {
      console.error('❌ [usePaytech] Erreur lors du paiement avec redirection:', error);
      throw error;
    }
  }, [initiatePayment, redirectToPayment]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      paymentData: null,
    });
  }, []);

  // Obtenir les méthodes de paiement disponibles
  const getAvailableMethods = useCallback(() => {
    return paytechService.getAvailablePaymentMethods();
  }, []);

  // Calculer les frais de transaction
  const calculateFees = useCallback((amount: number, method: string) => {
    return paytechService.calculateFees(amount, method);
  }, []);

  return {
    // État
    loading: state.loading,
    error: state.error,
    paymentData: state.paymentData,

    // Actions
    initiatePayment,
    initiatePaymentAndRedirect,
    checkStatus,
    redirectToPayment,
    reset,

    // Utilitaires
    getAvailableMethods,
    calculateFees,
  };
};

export type UsePaytechReturn = ReturnType<typeof usePaytech>;