import { useState, useCallback } from 'react';
import { orderService, type CreateOrderWithPaymentRequest, type OrderWithPaymentResponse } from '../services/orderService';
import type { Order } from '../types/order';

export interface UseOrderState {
  loading: boolean;
  error: string | null;
  currentOrder: OrderWithPaymentResponse['data'] | Order | null;
}

export const useOrder = () => {
  const [state, setState] = useState<UseOrderState>({
    loading: false,
    error: null,
    currentOrder: null,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const setCurrentOrder = (order: OrderWithPaymentResponse['data'] | Order | null) => {
    setState(prev => ({ ...prev, currentOrder: order }));
  };

  // Créer une commande avec paiement PayTech
  const createOrder = useCallback(async (
    orderRequest: CreateOrderWithPaymentRequest,
    onSuccess?: (order: OrderWithPaymentResponse['data'] | Order) => void,
    onError?: (error: string) => void
  ): Promise<OrderWithPaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 [useOrder] Création de commande:', orderRequest);

      const response = await orderService.createOrderWithPayment(orderRequest);

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la création de la commande');
      }

      setCurrentOrder(response.data);
      setLoading(false);

      console.log('✅ [useOrder] Commande créée avec succès:', response.data);

      if (onSuccess) onSuccess(response.data);
      return response;

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création de la commande';
      console.error('❌ [useOrder] Erreur lors de la création:', err);
      setError(errorMessage);
      setLoading(false);

      if (onError) onError(errorMessage);
      throw err;
    }
  }, []);

  // Créer une commande rapide depuis le formulaire
  const createQuickOrder = useCallback(async (
    product: any,
    quantity: number,
    formData: any,
    shippingFee: number = 0,
    onSuccess?: (order: OrderWithPaymentResponse['data'] | Order) => void,
    onError?: (error: string) => void
  ): Promise<OrderWithPaymentResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 [useOrder] Création de commande rapide:', {
        product: product.name,
        quantity,
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          city: formData.city
        }
      });

      const response = await orderService.createQuickOrder(
        product,
        quantity,
        formData,
        shippingFee
      );

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la création de la commande');
      }

      setCurrentOrder(response.data);
      setLoading(false);

      console.log('✅ [useOrder] Commande rapide créée:', response.data);

      // Rediriger vers Paytech si nécessaire
      if (response.data?.paymentData?.redirect_url) {
        console.log('🔄 [useOrder] Redirection vers PayTech...');
        window.location.href = response.data.paymentData.redirect_url;
      }

      if (onSuccess) onSuccess(response.data);
      return response;

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création de la commande';
      console.error('❌ [useOrder] Erreur lors de la création rapide:', err);
      setError(errorMessage);
      setLoading(false);

      if (onError) onError(errorMessage);
      throw err;
    }
  }, []);

  // Obtenir les commandes de l'utilisateur
  const getUserOrders = useCallback(async (
    page: number = 1,
    limit: number = 10
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderService.getUserOrders(page, limit);
      setLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des commandes';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Obtenir le statut d'une commande spécifique
  const getOrderStatus = useCallback(async (orderId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderService.getOrderStatus(orderId);
      setLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la vérification du statut';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Annuler une commande
  const cancelOrder = useCallback(async (orderId: number, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const order = await orderService.cancelOrder(orderId);
      setLoading(false);
      setCurrentOrder(order);

      return {
        success: true,
        data: order,
        message: 'Commande annulée avec succès'
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'annulation de la commande';
      setError(errorMessage);
      setLoading(false);

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }, []);

  // Vérifier si l'utilisateur a des commandes en cours
  const hasPendingOrders = useCallback(async () => {
    try {
      return await orderService.hasPendingOrders();
    } catch (err) {
      console.error('Erreur lors de la vérification des commandes en cours:', err);
      return false;
    }
  }, []);

  // Obtenir le nombre total de commandes
  const getOrderCount = useCallback(async () => {
    try {
      return await orderService.getOrderCount();
    } catch (err) {
      console.error('Erreur lors de la récupération du nombre de commandes:', err);
      return 0;
    }
  }, []);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      currentOrder: null,
    });
  }, []);

  // Stocker les informations de commande pour la page de retour
  const storePendingOrder = useCallback((orderData: OrderWithPaymentResponse['data'], formData: any) => {
    const pendingOrder = {
      orderId: orderData?.id,
      orderNumber: orderData?.orderNumber,
      timestamp: Date.now(),
      paymentToken: orderData?.paymentData?.token,
      totalAmount: orderData?.totalAmount,
      customerInfo: formData,
      status: orderData?.status,
      paymentStatus: orderData?.paymentStatus,
    };

    localStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
    console.log('💾 [useOrder] Commande en cours stockée:', pendingOrder);
  }, []);

  // Récupérer les informations de commande en attente
  const getPendingOrder = useCallback(() => {
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      try {
        const data = JSON.parse(pendingOrder);
        // Vérifier si la commande n'est pas trop vieille (24h)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data;
        } else {
          localStorage.removeItem('pendingOrder');
        }
      } catch (error) {
        console.error('Erreur lors de la lecture de la commande en attente:', error);
        localStorage.removeItem('pendingOrder');
      }
    }
    return null;
  }, []);

  // Nettoyer les commandes en attente expirées
  const cleanupExpiredOrders = useCallback(() => {
    const pendingOrder = getPendingOrder();
    if (!pendingOrder) {
      return;
    }

    // Si la commande a été créée il y a plus de 24h, la supprimer
    if (Date.now() - pendingOrder.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('pendingOrder');
      console.log('🗑️ [useOrder] Commande expirée nettoyée');
    }
  }, [getPendingOrder]);

  return {
    // État
    loading: state.loading,
    error: state.error,
    currentOrder: state.currentOrder,

    // Actions principales
    createOrder,
    createQuickOrder,
    getUserOrders,
    getOrderStatus,
    cancelOrder,

    // Utilitaires
    hasPendingOrders,
    getOrderCount,
    reset,

    // Gestion du stockage
    storePendingOrder,
    getPendingOrder,
    cleanupExpiredOrders,
  };
};

export type UseOrderReturn = ReturnType<typeof useOrder>;