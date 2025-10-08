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
  | 'CANCELLED';

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
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get<{
        success: boolean;
        message: string;
        data: Order[];
      }>(
        `${API_BASE_URL}/my-orders?${params.toString()}`,
        {
          headers: getAuthHeaders(),
          withCredentials: true
        }
      );

      // Le backend retourne {success, message, data: Order[]}
      // On doit transformer en {orders: Order[], pagination: {...}}
      const orders = response.data.data || [];
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const total = orders.length;
      const totalPages = Math.ceil(total / limit);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages
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
