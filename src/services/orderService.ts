// Service de gestion des commandes avec intégration PayTech
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
import AuthManager from '../utils/authUtils';

export interface ShippingDetails {
  name: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice?: number; // 🎯 Ajout du prix unitaire pour le calcul
  size?: string;
  color?: string;
  colorId?: number;
}

export interface CreateOrderRequest {
  shippingDetails: ShippingDetails;
  phoneNumber: string;
  notes?: string;
  totalAmount?: number; // 🎯 Ajout du montant total pour PayTech
  orderItems: OrderItem[];
  paymentMethod: 'PAYTECH' | 'CASH';
  initiatePayment: boolean;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    paymentData?: {
      token: string;
      redirect_url: string;
    };
  };
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  phoneNumber: string;
  notes?: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  confirmedAt?: string;
  userId?: number;
  user?: any;
  // Ajouter les propriétés pour compatibilité avec useCart
  shippingAddress?: string;
}

// Type unifié pour éviter les incompatibilités
export type OrderResult = Order;

export class OrderService {
  public baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Préparer les en-têtes avec authentification
  public getHeaders(): HeadersInit {
    return AuthManager.getAuthHeaders();
  }

  // 🎯 Calculer le montant total d'une commande
  calculateOrderTotal(orderItems: OrderItem[]): number {
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + ((item.unitPrice || 0) * item.quantity);
    }, 0);

    const shippingCost = orderItems.length > 0 ? 1500 : 0; // Frais de port fixes
    const total = subtotal + shippingCost;

    console.log('💰 [OrderService] Calcul du montant total:', {
      subtotal,
      shippingCost,
      total,
      itemsCount: orderItems.length
    });

    return total;
  }

  // Créer une commande avec paiement PayTech
  async createOrderWithPayment(orderData: CreateOrderRequest): Promise<OrderResponse> {
    try {
      console.log('🛒 [OrderService] Création de commande avec paiement:', orderData);

      // 🎯 Calculer le montant total si non fourni
      if (!orderData.totalAmount) {
        orderData.totalAmount = this.calculateOrderTotal(orderData.orderItems);
      }

      // 🎯 Validation du montant pour PayTech
      if (orderData.paymentMethod === 'PAYTECH' && orderData.totalAmount < 100) {
        throw new Error(`Le montant total (${orderData.totalAmount} XOF) est inférieur au minimum requis (100 XOF) pour PayTech`);
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] Commande créée avec succès:', result);

      return result;
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de la création de commande:', error);
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }
  }

  // Méthode simplifiée pour commande rapide depuis le panier
  async createQuickOrder(cartItem: any, shippingInfo: any, userToken?: string): Promise<OrderResponse> {
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
        console.warn('⚠️ [OrderService] Prix unitaire non valide:', { price: cartItem.price, unitPrice: cartItem.unitPrice });
      }

      const orderData: CreateOrderRequest = {
        shippingDetails: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          street: shippingInfo.address,
          city: shippingInfo.city,
          region: shippingInfo.city, // Utiliser la ville comme région
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country || 'Sénégal'
        },
        phoneNumber: shippingInfo.phone,
        notes: shippingInfo.notes || '',
        totalAmount: this.calculateOrderTotal([{
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

      return this.createOrderWithPayment(orderData);
    } catch (error) {
      console.error('❌ [OrderService] Erreur lors de la création de commande rapide:', error);
      throw error;
    }
  }

  // Obtenir les commandes de l'utilisateur
  async getUserOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/my-orders`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de la récupération des commandes:', error);
      throw new Error(error.message || 'Erreur lors de la récupération des commandes');
    }
  }

  // Obtenir le statut d'une commande spécifique
  async getOrderStatus(orderId: number): Promise<Order> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de la récupération du statut:', error);
      throw new Error(error.message || 'Erreur lors de la récupération du statut');
    }
  }

  // Mettre à jour le statut d'une commande (admin)
  async updateOrderStatus(orderId: number, status: string, notes?: string): Promise<Order> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status, notes })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de la mise à jour du statut:', error);
      throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
    }
  }

  // Annuler une commande
  async cancelOrder(orderId: number): Promise<Order> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de l\'annulation de la commande:', error);
      throw new Error(error.message || 'Erreur lors de l\'annulation de la commande');
    }
  }

  // Vérifier si l'utilisateur est authentifié
  isUserAuthenticated(): boolean {
    return AuthManager.isAuthenticated();
  }

  // Obtenir les informations de l'utilisateur connecté
  getCurrentUser(): any {
    return AuthManager.getUser();
  }

  // Obtenir toutes les commandes (admin)
  async getAllOrders(): Promise<any> {
    try {
      console.log('📋 [OrderService] Récupération de toutes les commandes (admin)');

      const response = await fetch(`${this.baseUrl}/orders/admin/all`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de la récupération de toutes les commandes:', error);
      throw new Error(error.message || 'Erreur lors de la récupération des commandes');
    }
  }

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
  }

  // Calcul des totaux de commande
  calculateOrderTotals(items: any[]): any {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = items.length > 0 ? 1500 : 0; // Frais de port fixes
    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  // Créer une commande depuis le panier (compatibilité avec useCart)
  async createOrderFromCart(cartItems: any[], shippingInfo: any, paymentMethod?: string): Promise<OrderResult> {
    try {
      console.log('🛒 [OrderService] Création de commande depuis le panier:', { cartItems, shippingInfo, paymentMethod });

      // Validation des productIds selon la documentation
      // Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
      const validatedItems = cartItems.map((item, index) => {
        const productId = Number(item.productId);
        if (!productId || productId <= 0) {
          throw new Error(`Invalid productId in cart item ${index}: ${item.productId}. Must be greater than 0`);
        }
        return {
          productId: productId,
          quantity: item.quantity || 1,
          size: item.size,
          color: item.color,
          colorId: item.colorId || 1
        };
      });

      // 🎯 Ajouter les prix unitaires aux orderItems et calculer le total
      const itemsWithPrices = validatedItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice || 0 // S'assurer que le prix est inclus
      }));

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
        totalAmount: this.calculateOrderTotal(itemsWithPrices), // 🎯 Calculer le montant total
        orderItems: itemsWithPrices,
        paymentMethod: (paymentMethod === 'PAYTECH' || paymentMethod === 'CASH') ? paymentMethod as 'PAYTECH' | 'CASH' : 'PAYTECH',
        initiatePayment: true
      };

      const response = await (this.isUserAuthenticated()
        ? this.createOrderWithPayment(orderData)
        : this.createGuestOrder(orderData)
      );

          // Convertir OrderResponse en OrderResult pour compatibilité
      // @ts-ignore - Compatibilité avec l'écosystème existant, conversion simplifiée
      return response.data as OrderResult;
    } catch (error) {
      console.error('❌ [OrderService] Erreur lors de la création de commande depuis le panier:', error);
      throw error;
    }
  }

  // Créer une commande pour un utilisateur non connecté (guest checkout)
  async createGuestOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    try {
      console.log('🛒 [OrderService] Création de commande guest:', orderData);

      // 🎯 Calculer le montant total si non fourni (pour guest aussi)
      if (!orderData.totalAmount) {
        orderData.totalAmount = this.calculateOrderTotal(orderData.orderItems);
      }

      // 🎯 Validation du montant pour PayTech (pour guest aussi)
      if (orderData.paymentMethod === 'PAYTECH' && orderData.totalAmount < 100) {
        throw new Error(`Le montant total (${orderData.totalAmount} XOF) est inférieur au minimum requis (100 XOF) pour PayTech`);
      }

      const response = await fetch(`${this.baseUrl}/orders/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] Commande guest créée avec succès:', result);

      return result;
    } catch (error: any) {
      console.error('❌ [OrderService] Erreur lors de la création de commande guest:', error);
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }
  }
}

// Exporter l'instance du service
export const orderService = new OrderService();