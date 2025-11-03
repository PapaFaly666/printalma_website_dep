// Service de gestion des commandes avec intégration PayTech
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
import AuthManager from '../utils/authUtils';

// Structure conforme à la documentation API v2
export interface ShippingDetails {
  // Identité (au moins un des deux requis selon doc)
  firstName?: string;          // Max 100 caractères
  lastName?: string;           // Max 100 caractères
  company?: string;            // Max 150 caractères (optionnel)

  // Adresse (OBLIGATOIRE)
  street: string;              // Max 200 caractères (OBLIGATOIRE)
  apartment?: string;          // Max 100 caractères (optionnel)
  city: string;                // Max 100 caractères (OBLIGATOIRE)
  region?: string;             // Max 100 caractères (optionnel)
  postalCode?: string;         // Max 20 caractères (optionnel)
  country: string;             // Max 100 caractères (OBLIGATOIRE)
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
  // Détails de livraison (OBLIGATOIRE - objet imbriqué)
  shippingDetails: ShippingDetails;

  // Contact (OBLIGATOIRE)
  phoneNumber: string;           // Numéro de téléphone

  // Produits (OBLIGATOIRE - au moins 1 article)
  orderItems: OrderItem[];

  // Options de paiement
  paymentMethod?: 'PAYTECH' | 'PAYDUNYA' | 'CASH_ON_DELIVERY' | 'OTHER';  // Défaut: CASH_ON_DELIVERY
  initiatePayment?: boolean;     // Pour déclencher paiement PayTech/PayDunya (défaut: false)

  // Notes additionnelles (optionnel)
  notes?: string;                // Commentaires sur la commande

  // DEPRECATED - Ne plus utiliser dans les nouvelles implémentations
  // Le backend calcule automatiquement le montant total
  totalAmount?: number;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus?: string;
    totalAmount: number;
    // Champs de la documentation API
    payment?: {
      token: string;
      redirect_url: string;
    };
    // Support ancien format (compatibilité)
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

  // Créer une commande avec paiement (utilisateur authentifié)
  async createOrderWithPayment(orderData: CreateOrderRequest): Promise<OrderResponse> {
    try {
      console.log('🛒 [OrderService] Création de commande avec paiement (utilisateur authentifié):', orderData);

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
  async createQuickOrder(cartItem: any, shippingInfo: any): Promise<OrderResponse> {
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
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          street: shippingInfo.address,
          city: shippingInfo.city,
          region: shippingInfo.city, // Utiliser la ville comme région
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country || 'Sénégal'
        },
        phoneNumber: shippingInfo.phone,
        notes: shippingInfo.notes || '',
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
      const itemsWithPrices = cartItems.map((item, index) => {
        const productId = Number(item.productId);
        if (!productId || productId <= 0) {
          throw new Error(`Invalid productId in cart item ${index}: ${item.productId}. Must be greater than 0`);
        }
        return {
          productId: productId,
          quantity: item.quantity || 1,
          unitPrice: item.price || item.unitPrice || 0, // Récupérer le prix
          size: item.size,
          color: item.color,
          colorId: item.colorId || 1
        };
      });

      const orderData: CreateOrderRequest = {
        shippingDetails: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          street: shippingInfo.address,
          city: shippingInfo.city,
          region: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country || 'Sénégal'
        },
        phoneNumber: shippingInfo.phone,
        notes: shippingInfo.notes || '',
        orderItems: itemsWithPrices,
        paymentMethod: (paymentMethod === 'PAYTECH' || paymentMethod === 'CASH_ON_DELIVERY')
          ? paymentMethod as 'PAYTECH' | 'CASH_ON_DELIVERY'
          : 'CASH_ON_DELIVERY',
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
      console.log('🛒 [OrderService] Création de commande guest (route /orders/guest):', orderData);

      const response = await fetch(`${this.baseUrl}/orders/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
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