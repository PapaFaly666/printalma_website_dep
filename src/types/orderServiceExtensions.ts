// Extensions de type pour le service OrderService afin de maintenir la compatibilité
import { OrderService } from '../services/orderService';

// Déclaration des méthodes additionnelles pour la compatibilité
declare module '../services/orderService' {
  interface OrderService {
    getAllOrders(): Promise<any>;
    handleError(error: any, context?: string): string;
    calculateOrderTotals(items: any[]): any;
    createOrderFromCart(cartItems: any[], shippingInfo: any): Promise<any>;
  }
}

// Implémentation des méthodes d'extension
export const extendOrderService = (service: OrderService): OrderService => {
  const extendedService = service as any;

  extendedService.getAllOrders = async () => {
    try {
      const response = await fetch(`${service.baseUrl}/orders/admin/all`, {
        headers: service.getHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les commandes:', error);
      throw error;
    }
  };

  extendedService.handleError = (error: any, context = ''): string => {
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
  };

  extendedService.calculateOrderTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = items.length > 0 ? 1500 : 0; // Frais de port fixes
    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  extendedService.createOrderFromCart = async (cartItems: any[], shippingInfo: any) => {
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

      return service.createOrderWithPayment(orderData);
    } catch (error) {
      console.error('Erreur lors de la création de commande depuis le panier:', error);
      throw error;
    }
  };

  return extendedService;
};

export default extendOrderService;