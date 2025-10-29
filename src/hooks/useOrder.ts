import { useState, useCallback } from 'react';
import { orderService, type CreateOrderRequest, type OrderResponse, type Order } from '../services/orderService';

export interface UseOrderState {
  loading: boolean;
  error: string | null;
  currentOrder: OrderResponse | null;
  userOrders: Order[];
}

export const useOrder = () => {
  const [state, setState] = useState<UseOrderState>({
    loading: false,
    error: null,
    currentOrder: null,
    userOrders: []
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const setCurrentOrder = (order: OrderResponse | null) => {
    setState(prev => ({ ...prev, currentOrder: order }));
  };

  const setUserOrders = (orders: Order[] | ((prev: Order[]) => Order[])) => {
    setState(prev => ({
      ...prev,
      userOrders: typeof orders === 'function' ? orders(prev.userOrders) : orders
    }));
  };

  // Créer une commande avec paiement PayTech
  const createOrder = useCallback(async (
    orderData: CreateOrderRequest,
    onSuccess?: (order: OrderResponse) => void,
    onError?: (error: string) => void
  ): Promise<OrderResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 [useOrder] Création de commande:', orderData);

      let response: OrderResponse;

      // Vérifier si l'utilisateur est authentifié
      if (orderService.isUserAuthenticated()) {
        response = await orderService.createOrderWithPayment(orderData);
      } else {
        // Utiliser le endpoint guest pour les utilisateurs non connectés
        response = await orderService.createGuestOrder(orderData);
      }

      setCurrentOrder(response);

      // Rediriger vers Paytech si paiement requis
      if (response.success && response.data.paymentData?.redirect_url) {
        // Stocker les informations de commande pour référence
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: response.data.id,
          orderNumber: response.data.orderNumber,
          timestamp: Date.now(),
          paymentToken: response.data.paymentData?.token,
          totalAmount: response.data.totalAmount,
          orderData
        }));

        console.log('🔄 [useOrder] Redirection vers PayTech:', response.data.paymentData.redirect_url);

        // Rediriger vers Paytech après un court délai pour permettre le stockage
        setTimeout(() => {
          window.location.href = response.data.paymentData!.redirect_url;
        }, 100);
      }

      if (onSuccess) onSuccess(response);

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

  // Méthode simplifiée pour commande rapide depuis le panier
  const createQuickOrder = useCallback(async (
    cartItem: any,
    shippingInfo: any,
    onSuccess?: (order: OrderResponse) => void,
    onError?: (error: string) => void
  ): Promise<OrderResponse> => {
    try {
      // Validation du productId selon la documentation
      // Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
      const productId = Number(cartItem.productId);
      if (!productId || productId <= 0) {
        throw new Error(`Invalid productId: ${cartItem.productId}. Must be greater than 0`);
      }

      // 🎯 Récupérer le prix unitaire depuis le cartItem
      const unitPrice = cartItem.price || cartItem.unitPrice || 0;
      if (!unitPrice || unitPrice <= 0) {
        console.warn('⚠️ [useOrder] Prix unitaire non valide:', { price: cartItem.price, unitPrice: cartItem.unitPrice });
      }

      const orderData: CreateOrderRequest = {
        shippingDetails: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          street: shippingInfo.address,
          city: shippingInfo.city,
          region: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country || 'Sénégal'
        },
        phoneNumber: shippingInfo.phone,
        notes: shippingInfo.notes || '',
        totalAmount: orderService.calculateOrderTotal([{
          productId: productId,
          quantity: 1,
          unitPrice: unitPrice,
          size: cartItem.size,
          color: cartItem.color,
          colorId: cartItem.colorId || 1
        }]),
        orderItems: [{
          productId: productId,
          quantity: 1,
          unitPrice: unitPrice,
          size: cartItem.size,
          color: cartItem.color,
          colorId: cartItem.colorId || 1
        }],
        paymentMethod: 'PAYTECH',
        initiatePayment: true
      };

      return createOrder(orderData, onSuccess, onError);
    } catch (error) {
      console.error('❌ [useOrder] Erreur lors de la création de commande rapide:', error);
      throw error;
    }
  }, [createOrder]);

  // Obtenir les commandes de l'utilisateur
  const getUserOrders = useCallback(async (): Promise<Order[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 [useOrder] Récupération des commandes utilisateur');

      if (!orderService.isUserAuthenticated()) {
        setLoading(false);
        return [];
      }

      const orders = await orderService.getUserOrders();
      setUserOrders(orders);
      setLoading(false);

      console.log('✅ [useOrder] Commandes récupérées:', orders.length);
      return orders;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des commandes';
      console.error('❌ [useOrder] Erreur lors de la récupération:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Obtenir le statut d'une commande spécifique
  const getOrderStatus = useCallback(async (orderId: number): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [useOrder] Vérification du statut de la commande:', orderId);

      const order = await orderService.getOrderStatus(orderId);
      setLoading(false);

      // Mettre à jour la commande dans la liste si elle existe
      setUserOrders(prevOrders => prevOrders.map(o => o.id === orderId ? order : o));

      return order;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération du statut';
      console.error('❌ [useOrder] Erreur lors de la vérification du statut:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Mettre à jour le statut d'une commande (admin)
  const updateOrderStatus = useCallback(async (
    orderId: number,
    status: string,
    notes?: string
  ): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      console.log('📝 [useOrder] Mise à jour du statut:', orderId, status);

      const updatedOrder = await orderService.updateOrderStatus(orderId, status, notes);
      setLoading(false);

      // Mettre à jour la commande dans la liste
      setUserOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));

      return updatedOrder;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du statut';
      console.error('❌ [useOrder] Erreur lors de la mise à jour:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Annuler une commande
  const cancelOrder = useCallback(async (orderId: number): Promise<Order> => {
    setLoading(true);
    setError(null);

    try {
      console.log('❌ [useOrder] Annulation de la commande:', orderId);

      const cancelledOrder = await orderService.cancelOrder(orderId);
      setLoading(false);

      // Mettre à jour la commande dans la liste
      setUserOrders(prevOrders => prevOrders.map(o => o.id === orderId ? cancelledOrder : o));

      return cancelledOrder;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'annulation de la commande';
      console.error('❌ [useOrder] Erreur lors de l\'annulation:', err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = useCallback((): boolean => {
    return orderService.isUserAuthenticated();
  }, []);

  // Obtenir les informations de l'utilisateur connecté
  const getCurrentUser = useCallback(() => {
    return orderService.getCurrentUser();
  }, []);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      currentOrder: null,
      userOrders: []
    });
  }, []);

  // Rafraîchir les commandes (utile après un paiement réussi)
  const refreshOrders = useCallback(async () => {
    if (isAuthenticated()) {
      await getUserOrders();
    }
  }, [isAuthenticated, getUserOrders]);

  return {
    // État
    loading: state.loading,
    error: state.error,
    currentOrder: state.currentOrder,
    userOrders: state.userOrders,

    // Actions
    createOrder,
    createQuickOrder,
    getUserOrders,
    getOrderStatus,
    updateOrderStatus,
    cancelOrder,

    // Utilitaires
    isAuthenticated,
    getCurrentUser,
    reset,
    refreshOrders,
    setCurrentOrder
  };
};

export type UseOrderReturn = ReturnType<typeof useOrder>;