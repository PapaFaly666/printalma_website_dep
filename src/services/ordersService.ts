// src/services/ordersService.ts

import axios from 'axios';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/orders`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Types
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'ALL';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  designId?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  designName?: string;
  productImage?: string;
  designImage?: string;
  size?: string;
  color?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  vendorId?: number;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  statusHistory?: {
    status: OrderStatus;
    updatedAt: string;
    notes?: string;
  }[];
  items: OrderItem[];
  user?: {
    id: number;
    username: string;
    email: string;
  };
  vendor?: {
    id: number;
    username: string;
    email: string;
  };
  commission_info?: {
    commission_rate: number;
    commission_amount: number;
    vendor_amount: number;
    total_amount: number;
    applied_rate: number;
    has_custom_rate: boolean;
    commission_applied_at: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export const ordersService = {
  /**
   * Récupérer les commandes de l'utilisateur connecté (vendeur ou client)
   */
  getMyOrders: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    try {
      // Utiliser l'API directe avec fetch au lieu d'axios pour éviter les conversions
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Construction des params - l'API my-orders ne supporte pas de filtres complexes
      const response = await fetch(`${API_BASE_URL}/my-orders`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors du chargement des commandes');
      }

      // Transformer les données de l'API vers le format attendu
      const orders: Order[] = result.data.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        vendorId: order.vendorId,
        status: order.status,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddressFull || `${order.shippingStreet}, ${order.shippingCity}`,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentAttempts: order.paymentAttempts || 0,
        phoneNumber: order.phoneNumber,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippedAt: order.shippedAt,
        confirmedAt: order.confirmedAt,
        deliveredAt: order.deliveredAt,

        // Mapping des items
        items: order.orderItems?.map((item: any) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          designId: item.designId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productName: item.product?.name || 'Produit inconnu',
          designName: item.designMetadata?.designName,
          productImage: item.mockupUrl,
          designImage: item.designMetadata?.designImageUrl,
          size: item.size,
          color: item.color
        })) || [],

        // User info - utiliser customer_info si disponible
        user: {
          id: order.userId,
          username: order.customer_info?.full_name || order.user?.username || 'Client',
          email: order.customer_info?.email || order.user?.email || order.email
        },

        // Commission info - C'EST CE QU'ON VEUT AFFICHER !
        commission_info: (order.commissionRate !== undefined && order.commissionAmount !== undefined) ? {
          commission_rate: order.commissionRate,
          commission_amount: order.commissionAmount, // LES GAINS DU VENDEUR
          vendor_amount: order.vendorAmount, // LE MONTANT PERÇU PAR LE VENDEUR
          total_amount: order.totalAmount,
          applied_rate: order.commissionRate,
          has_custom_rate: false,
          commission_applied_at: order.commissionAppliedAt
        } : undefined,

        // Vendor info
        vendor: order.vendor ? {
          id: order.vendor.id,
          username: order.vendor.shopName || `${order.vendor.firstName} ${order.vendor.lastName}`,
          email: order.vendor.email
        } : undefined
      }));

      // Filtrage côté client car l'API ne supporte pas tous les filtres
      let filteredOrders = orders;

      if (filters?.status && filters.status !== 'ALL') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.user?.username.toLowerCase().includes(searchLower) ||
          order.user?.email.toLowerCase().includes(searchLower)
        );
      }

      // Pas de pagination - retourner toutes les commandes
      return {
        orders: filteredOrders,
        pagination: {
          page: 1,
          limit: filteredOrders.length,
          total: filteredOrders.length,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les commandes (admin uniquement)
   */
  getAllOrders: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get<OrdersResponse>(
        `${API_BASE_URL}/admin/all?${params.toString()}`,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des commandes (admin):', error);
      throw error;
    }
  },

  /**
   * Récupérer une commande par ID
   */
  getOrderById: async (id: number): Promise<Order> => {
    try {
      const response = await axios.get<Order>(
        `${API_BASE_URL}/${id}`,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le statut d'une commande (admin uniquement)
   */
  updateOrderStatus: async (
    id: number,
    data: UpdateOrderStatusDto
  ): Promise<Order> => {
    try {
      const response = await axios.patch<Order>(
        `${API_BASE_URL}/${id}/status`,
        data,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 403) {
          throw new Error('Vous n\'avez pas l\'autorisation de modifier cette commande');
        }
        if (error.response?.status === 404) {
          throw new Error('Commande introuvable');
        }
        if (error.response?.status === 400) {
          throw new Error(message || 'Statut invalide');
        }
      }
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  /**
   * Annuler une commande (client/vendeur)
   */
  cancelOrder: async (id: number, reason?: string): Promise<Order> => {
    try {
      const response = await axios.patch<Order>(
        `${API_BASE_URL}/${id}/cancel`,
        { reason },
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (error.response?.status === 403) {
          throw new Error('Vous ne pouvez pas annuler cette commande');
        }
        if (error.response?.status === 400) {
          throw new Error(message || 'Impossible d\'annuler cette commande');
        }
      }
      console.error('Erreur lors de l\'annulation de la commande:', error);
      throw error;
    }
  },

  /**
   * Obtenir les statistiques des commandes (admin/vendeur)
   */
  getOrderStats: async (): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stats`,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      throw error;
    }
  }
};
