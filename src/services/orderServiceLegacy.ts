// Extension du service OrderService avec des méthodes héritées pour la compatibilité
import { orderService } from './orderService';

// Méthodes héritées pour la compatibilité avec les composants existants
export const orderServiceLegacy = {
  ...orderService,

  // Méthodes pour l'admin (à implémenter selon le backend)
  async getAllOrders() {
    try {
      const response = await fetch(`${orderService.baseUrl}/orders/admin/all`, {
        headers: orderService.getHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les commandes:', error);
      throw error;
    }
  },

  // Utilitaire de gestion d'erreurs
  handleError(error: any, context = ''): string {
    console.error(`Erreur ${context}:`, error);

    if (error.message?.includes('401') || error.message?.includes('Non autorisé')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    }
    if (error.message?.includes('403') || error.message?.includes('Accès refusé')) {
      return 'Vous n\'avez pas les permissions nécessaires.';
    }
    if (error.message?.includes('404') || error.message?.includes('Non trouvé')) {
      return 'Ressource introuvable.';
    }
    if (error.message?.includes('500') || error.message?.includes('Erreur serveur')) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return error.message || 'Une erreur est survenue.';
  },

  // Calcul des totaux de commande
  calculateOrderTotals(items: any[]) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = items.length > 0 ? 1500 : 0; // Frais de port fixes
    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  },

  // Créer une commande depuis le panier
  async createOrderFromCart(cartItems: any[], shippingInfo: any) {
    try {
      const orderData = {
        shippingDetails: {
          shippingName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          shippingStreet: shippingInfo.address,
          shippingCity: shippingInfo.city,
          shippingRegion: shippingInfo.city,
          shippingPostalCode: shippingInfo.postalCode,
          shippingCountry: shippingInfo.country || 'Sénégal'
        },
        phoneNumber: shippingInfo.phone,
        notes: shippingInfo.notes || '',
        orderItems: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity || 1,
          size: item.size,
          color: item.color,
          colorId: item.colorId || 1
        })),
        paymentMethod: 'PAYTECH' as const,
        initiatePayment: true
      };

      return orderService.createOrderWithPayment(orderData);
    } catch (error) {
      console.error('Erreur lors de la création de commande depuis le panier:', error);
      throw error;
    }
  }
};

export default orderServiceLegacy;