// Service de gestion des commandes avec intégration PayTech
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
import AuthManager from '../utils/authUtils';

export interface ShippingDetails {
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  size?: string;
  color?: string;
  colorId?: number;
}

export interface CreateOrderRequest {
  shippingDetails: ShippingDetails;
  phoneNumber: string;
  notes?: string;
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
}

export class OrderService {
  public baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Préparer les en-têtes avec authentification
  public getHeaders(): HeadersInit {
    return AuthManager.getAuthHeaders();
  }

  // Créer une commande avec paiement PayTech
  async createOrderWithPayment(orderData: CreateOrderRequest): Promise<OrderResponse> {
    try {
      console.log('🛒 [OrderService] Création de commande avec paiement:', orderData);

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
      const orderData: CreateOrderRequest = {
        shippingDetails: {
          shippingName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          shippingStreet: shippingInfo.address,
          shippingCity: shippingInfo.city,
          shippingRegion: shippingInfo.city, // Utiliser la ville comme région
          shippingPostalCode: shippingInfo.postalCode,
          shippingCountry: shippingInfo.country || 'Sénégal'
        },
        phoneNumber: shippingInfo.phone,
        notes: shippingInfo.notes || '',
        orderItems: [{
          productId: Number(cartItem.id) || 0,
          quantity: 1,
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

  // Créer une commande pour un utilisateur non connecté (guest checkout)
  async createGuestOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    try {
      console.log('🛒 [OrderService] Création de commande guest:', orderData);

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