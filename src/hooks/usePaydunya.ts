import { useState, useCallback } from 'react';
import { paydunyaService, type PayDunyaPaymentRequest, type PayDunyaPaymentResponse, type PayDunyaPaymentStatus } from '../services/paydunyaService';

export interface UsePaydunyaState {
  loading: boolean;
  error: string | null;
  paymentData: PayDunyaPaymentResponse | null;
  isConfigured: boolean;
  configurationErrors: string[];
}

export const usePaydunya = () => {
  const [state, setState] = useState<UsePaydunyaState>({
    loading: false,
    error: null,
    paymentData: null,
    isConfigured: false,
    configurationErrors: [],
  });

  // Initialiser la configuration au montage du hook
  useState(() => {
    const configValidation = paydunyaService.validateConfiguration();
    setState(prev => ({
      ...prev,
      isConfigured: configValidation.isValid,
      configurationErrors: configValidation.errors,
    }));
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  // Initier un paiement PayDunya
  const initiatePayment = useCallback(async (paymentData: PayDunyaPaymentRequest): Promise<PayDunyaPaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('💳 [usePaydunya] Initialisation du paiement:', paymentData);

      // Vérifier la configuration
      const configValidation = paydunyaService.validateConfiguration();
      if (!configValidation.isValid) {
        throw new Error(`Configuration PayDunya invalide: ${configValidation.errors.join(', ')}`);
      }

      // Validation des données
      if (!paymentData.invoice?.total_amount || paymentData.invoice.total_amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      if (!paymentData.invoice?.description || paymentData.invoice.description.trim().length === 0) {
        throw new Error('La description de la facture est requise');
      }

      if (!paymentData.customer?.name || paymentData.customer.name.trim().length === 0) {
        throw new Error('Le nom du client est requis');
      }

      if (!paymentData.customer?.phone || paymentData.customer.phone.trim().length === 0) {
        throw new Error('Le numéro de téléphone du client est requis');
      }

      if (!paymentData.store?.name || paymentData.store.name.trim().length === 0) {
        throw new Error('Le nom de la boutique est requis');
      }

      // Enrichir les données avec les URLs de callback
      const enhancedPaymentData: PayDunyaPaymentRequest = {
        ...paymentData,
        invoice: {
          ...paymentData.invoice,
          // S'assurer que le montant est bien un nombre
          total_amount: Number(paymentData.invoice.total_amount),
        },
        actions: {
          callback_url: `${window.location.origin}/api/paydunya/callback`,
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`,
          ...paymentData.actions,
        },
      };

      console.log('💳 [usePaydunya] Données enrichies:', enhancedPaymentData);

      const response = await paydunyaService.initiatePayment(enhancedPaymentData);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'initialisation du paiement');
      }

      setState(prev => ({ ...prev, paymentData: response, loading: false }));
      console.log('✅ [usePaydunya] Paiement initialisé avec succès:', response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors du paiement';
      console.error('❌ [usePaydunya] Erreur:', err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Vérifier le statut d'un paiement
  const checkStatus = useCallback(async (token: string): Promise<PayDunyaPaymentStatus> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [usePaydunya] Vérification du statut pour token:', token);

      const status = await paydunyaService.checkPaymentStatus(token);

      setState(prev => ({ ...prev, loading: false }));

      console.log('📡 [usePaydunya] Statut reçu:', status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification du statut';
      console.error('❌ [usePaydunya] Erreur vérification statut:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Rediriger vers la page de paiement PayDunya
  const redirectToPayment = useCallback((response: PayDunyaPaymentResponse) => {
    if (response.success && response.data?.redirect_url) {
      console.log('🔄 [usePaydunya] Redirection vers:', response.data.redirect_url);

      // Stocker les informations de paiement pour la page de retour
      localStorage.setItem('paydunyaPendingPayment', JSON.stringify({
        token: response.data.token,
        invoiceToken: response.data.invoice?.token,
        totalAmount: response.data.invoice?.total_amount || 0,
        timestamp: Date.now(),
      }));

      window.location.href = response.data.redirect_url;
    } else {
      throw new Error('URL de redirection PayDunya invalide');
    }
  }, []);

  // Initier le paiement et rediriger automatiquement
  const initiatePaymentAndRedirect = useCallback(async (paymentData: PayDunyaPaymentRequest) => {
    try {
      const response = await initiatePayment(paymentData);

      if (response.success && response.data?.redirect_url) {
        redirectToPayment(response);
      } else {
        throw new Error('Réponse de paiement PayDunya invalide');
      }
    } catch (error) {
      console.error('❌ [usePaydunya] Erreur lors du paiement avec redirection:', error);
      throw error;
    }
  }, [initiatePayment, redirectToPayment]);

  // Créer une commande avec paiement PayDunya
  const createOrderWithPayment = useCallback(async (orderRequest: {
    shippingDetails: {
      name: string;
      street: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
    };
    phoneNumber: string;
    notes?: string;
    orderItems: Array<{
      productId: number;
      quantity: number;
      size?: string;
      colorId?: number;
    }>;
    initiatePayment: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 [usePaydunya] Création de commande avec paiement:', orderRequest);

      const response = await paydunyaService.createOrderWithPayment({
        ...orderRequest,
        paymentMethod: 'PAYDUNYA',
      });

      setState(prev => ({ ...prev, loading: false }));
      console.log('✅ [usePaydunya] Commande créée avec succès:', response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la commande';
      console.error('❌ [usePaydunya] Erreur création commande:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      paymentData: null,
      isConfigured: state.isConfigured,
      configurationErrors: state.configurationErrors,
    });
  }, [state.isConfigured, state.configurationErrors]);

  // Obtenir les méthodes de paiement disponibles
  const getAvailableMethods = useCallback(() => {
    return paydunyaService.getAvailablePaymentMethods();
  }, []);

  // Calculer les frais de transaction
  const calculateFees = useCallback((amount: number, method: string) => {
    return paydunyaService.calculateFees(amount, method);
  }, []);

  // Obtenir le montant total avec frais
  const getTotalWithFees = useCallback((amount: number, method: string) => {
    return paydunyaService.getTotalWithFees(amount, method);
  }, []);

  // Tester la configuration PayDunya
  const testConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await paydunyaService.testConfiguration();

      if (!result.success) {
        setError(result.message);
      }

      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du test de configuration';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Demander un remboursement (admin seulement)
  const requestRefund = useCallback(async (paymentToken: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paydunyaService.requestRefund(paymentToken, reason);

      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la demande de remboursement';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    // État
    loading: state.loading,
    error: state.error,
    paymentData: state.paymentData,
    isConfigured: state.isConfigured,
    configurationErrors: state.configurationErrors,

    // Actions principales
    initiatePayment,
    initiatePaymentAndRedirect,
    checkStatus,
    redirectToPayment,
    createOrderWithPayment,

    // Actions utilitaires
    reset,
    getAvailableMethods,
    calculateFees,
    getTotalWithFees,
    testConfiguration,
    requestRefund,
  };
};

export type UsePaydunyaReturn = ReturnType<typeof usePaydunya>;