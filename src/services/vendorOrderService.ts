import {
  Order,
  OrderStatus,
  OrderStatistics,
  BackendOrderStatistics,
  OrderFilters
} from '../types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Interface pour les réponses de l'API
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

// Interface pour les statistiques vendeur
export interface VendorOrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  monthlyGrowth: number;
  averageOrderValue: number;
  revenueThisMonth?: number;
  ordersThisMonth?: number;
  revenueLastMonth?: number;
  ordersLastMonth?: number;
}

// Interface pour les filtres de commandes vendeur
export interface VendorOrderFilters extends OrderFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Interface pour la mise à jour du statut
interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

// Interface pour la réponse paginée
interface PaginatedOrderResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class VendorOrderService {
  private baseURL = API_BASE_URL;

  // Helper to get bearer token from stored session (if backend requires it)
  private getAuthHeader(): Record<string, string> {
    try {
      const stored = localStorage.getItem('auth_session');
      if (!stored) return {};
      const data = JSON.parse(stored);
      const token: string | undefined = data?.user?.token || data?.token;
      if (token && typeof token === 'string') {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      // ignore
    }
    return {};
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  // Détection si on est en mode développement (backend non disponible)
  private isDevelopmentMode(): boolean {
    return import.meta.env.MODE === 'development';
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
          ...(options.headers as Record<string, string> | undefined)
        },
        ...options
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Erreur API vendeur ${endpoint}:`, error);

      // En mode développement, créer une erreur spéciale pour gérer les fallbacks
      if (this.isDevelopmentMode() && (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('ERR_CONNECTION_REFUSED') ||
        errorMessage.includes('400') ||
        errorMessage.includes('404') ||
        errorMessage.includes('500')
      )) {
        const developmentError = new Error('DEVELOPMENT_MODE_FALLBACK');
        (developmentError as any).originalError = error;
        throw developmentError;
      }

      throw error as any;
    }
  }

  // ==========================================
  // MÉTHODES PRINCIPALES - VENDEUR
  // ==========================================

  /**
   * Récupère toutes les commandes du vendeur connecté
   */
  async getVendorOrders(filters?: VendorOrderFilters): Promise<PaginatedOrderResponse> {
    try {
      let url = '/vendor/orders';
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
        if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log('🔍 URL récupération commandes vendeur:', url);
      const response = await this.apiCall<PaginatedOrderResponse>(url);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des données mock pour les commandes');
        return this.getMockOrders(filters);
      }
      throw error;
    }
  }

  /**
   * Récupère les détails d'une commande spécifique du vendeur
   */
  async getVendorOrderDetails(orderId: number): Promise<Order> {
    try {
      const response = await this.apiCall<Order>(`/vendor/orders/${orderId}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des données mock pour les détails de commande');
        return this.getMockOrderDetails(orderId);
      }
      throw error;
    }
  }

  // ❌ MÉTHODE SUPPRIMÉE: updateOrderStatus
  // Les vendeurs ne peuvent plus modifier les statuts des commandes
  // Seuls les administrateurs peuvent gérer les états d'avancement

  /**
   * Récupère les statistiques des commandes du vendeur
   */
  async getVendorOrderStatistics(): Promise<VendorOrderStatistics> {
    try {
      const response = await this.apiCall<VendorOrderStatistics>('/vendor/orders/statistics');
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des statistiques mock');
        return this.getMockStatistics();
      }
      throw error;
    }
  }

  // ❌ MÉTHODE SUPPRIMÉE: markOrderReady
  // Les vendeurs ne peuvent plus modifier les statuts des commandes

  // ❌ MÉTHODE SUPPRIMÉE: confirmShipment
  // Les vendeurs ne peuvent plus modifier les statuts des commandes

  /**
   * Récupère les commandes par statut
   */
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const response = await this.apiCall<Order[]>(`/vendor/orders/status/${status}`);
    return response.data;
  }

  /**
   * Recherche des commandes par critères
   */
  async searchOrders(query: string): Promise<Order[]> {
    const response = await this.apiCall<Order[]>(`/vendor/orders/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Exporte les commandes vers CSV
   */
  async exportOrdersToCSV(filters?: VendorOrderFilters): Promise<Blob> {
    let url = '/vendor/orders/export/csv';
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      credentials: 'include',
      headers: {
        'Accept': 'text/csv'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export CSV');
    }

    return response.blob();
  }

  /**
   * Récupère les notifications de commandes du vendeur
   */
  async getOrderNotifications(): Promise<any[]> {
    const response = await this.apiCall<any[]>('/vendor/orders/notifications');
    return response.data;
  }

  /**
   * Marque une notification comme lue
   */
  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.apiCall<void>(`/vendor/orders/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Calcule les statistiques localement à partir d'une liste de commandes
   */
  calculateLocalStatistics(orders: Order[]): VendorOrderStatistics {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    // Calculer la croissance mensuelle (simulation)
    const currentMonth = new Date().getMonth();
    const currentMonthOrders = orders.filter(order =>
      new Date(order.createdAt).getMonth() === currentMonth
    );
    const previousMonthOrders = orders.filter(order =>
      new Date(order.createdAt).getMonth() === currentMonth - 1
    );

    const monthlyGrowth = previousMonthOrders.length > 0
      ? ((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100
      : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      monthlyGrowth,
      pendingOrders: statusCounts['PENDING'] || 0,
      processingOrders: statusCounts['PROCESSING'] || 0,
      shippedOrders: statusCounts['SHIPPED'] || 0,
      deliveredOrders: statusCounts['DELIVERED'] || 0,
      cancelledOrders: statusCounts['CANCELLED'] || 0
    };
  }

  /**
   * Formate un montant en CFA
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0) + ' F';
  }

  /**
   * Formate une date
   */
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Obtient le label d'un statut
   */
  getStatusLabel(status: OrderStatus): string {
    const labels = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En traitement',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'REJECTED': 'Rejetée'
    };
    return labels[status] || status;
  }

  /**
   * Obtient la couleur d'un statut
   */
  getStatusColor(status: OrderStatus): string {
    const colors = {
      'PENDING': '#ffc107',
      'CONFIRMED': '#17a2b8',
      'PROCESSING': '#fd7e14',
      'SHIPPED': '#6f42c1',
      'DELIVERED': '#28a745',
      'CANCELLED': '#dc3545',
      'REJECTED': '#6c757d'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Obtient le variant de badge pour un statut (lecture seule)
   */
  getStatusVariant(status: OrderStatus): string {
    const variants = {
      'PENDING': 'warning',
      'CONFIRMED': 'info',
      'PROCESSING': 'primary',
      'SHIPPED': 'success',
      'DELIVERED': 'success',
      'CANCELLED': 'danger',
      'REJECTED': 'danger'
    };
    return variants[status] || 'secondary';
  }

  /**
   * Vérifie si un statut a été atteint dans la progression
   */
  isStatusReached(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const targetIndex = statusOrder.indexOf(targetStatus);

    // Gérer les statuts terminaux
    if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
      return targetStatus === 'PENDING'; // Seule la première étape est atteinte
    }

    return currentIndex >= targetIndex && targetIndex !== -1;
  }

  // ❌ MÉTHODE SUPPRIMÉE: canUpdateStatus
  // Les vendeurs ne peuvent plus modifier les statuts des commandes

  // ==========================================
  // MÉTHODES MOCK POUR LE DÉVELOPPEMENT
  // ==========================================

  private getMockOrders(filters?: VendorOrderFilters): PaginatedOrderResponse {
    const mockOrders: Order[] = [
      {
        id: 1,
        orderNumber: 'CMD-2024-01-0001',
        userId: 1000,
        user: {
          id: 1000,
          firstName: 'Marie',
          lastName: 'Durand',
          email: 'marie.durand@test.printalma.com',
          role: 'CUSTOMER'
        },
        status: 'PROCESSING',
        totalAmount: 35000,
        shippingAddress: {
          street: '123 Rue de la Mer',
          city: 'Dakar',
          region: 'Dakar',
          country: 'SN',
          fullFormatted: '123 Rue de la Mer, Dakar, Dakar, SN'
        },
        phoneNumber: '+221770000001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        orderItems: [
          {
            id: 1,
            quantity: 2,
            unitPrice: 17500,
            productName: 'T-shirt Design Afrique',
            product: {
              id: 1,
              name: 'T-shirt Premium',
              designName: 'Motif Wax Traditionnel',
              price: 17500
            }
          }
        ]
      },
      {
        id: 2,
        orderNumber: 'CMD-2024-01-0002',
        userId: 1001,
        user: {
          id: 1001,
          firstName: 'Amadou',
          lastName: 'Ba',
          email: 'amadou.ba@test.printalma.com',
          role: 'CUSTOMER'
        },
        status: 'CONFIRMED',
        totalAmount: 28000,
        shippingAddress: {
          street: '45 Avenue des Baobabs',
          city: 'Thiès',
          region: 'Thiès',
          country: 'SN',
          fullFormatted: '45 Avenue des Baobabs, Thiès, Thiès, SN'
        },
        phoneNumber: '+221770000002',
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-16T14:20:00Z',
        orderItems: [
          {
            id: 2,
            quantity: 1,
            unitPrice: 28000,
            productName: 'Hoodie Premium Baobab',
            product: {
              id: 2,
              name: 'Hoodie Premium',
              designName: 'Baobab Sunset',
              price: 28000
            }
          }
        ]
      },
      {
        id: 3,
        orderNumber: 'CMD-2024-01-0003',
        userId: 1002,
        user: {
          id: 1002,
          firstName: 'Fatou',
          lastName: 'Sall',
          email: 'fatou.sall@test.printalma.com',
          role: 'CUSTOMER'
        },
        status: 'PENDING',
        totalAmount: 42000,
        shippingAddress: {
          street: '7 Rue des Arts',
          city: 'Saint-Louis',
          region: 'Saint-Louis',
          country: 'SN',
          fullFormatted: '7 Rue des Arts, Saint-Louis, Saint-Louis, SN'
        },
        phoneNumber: '+221770000003',
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-17T09:15:00Z',
        orderItems: [
          {
            id: 3,
            quantity: 3,
            unitPrice: 14000,
            productName: 'Mug Téranga Sénégal',
            product: {
              id: 3,
              name: 'Mug Céramique',
              designName: 'Téranga Spirit',
              price: 14000
            }
          }
        ]
      }
    ];

    // Appliquer les filtres si nécessaires
    let filteredOrders = [...mockOrders];

    if (filters?.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.user.firstName.toLowerCase().includes(searchLower) ||
        order.user.lastName.toLowerCase().includes(searchLower) ||
        order.user.email.toLowerCase().includes(searchLower)
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const orders = filteredOrders.slice(start, end);

    return {
      orders,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  private getMockStatistics(): VendorOrderStatistics {
    return {
      totalOrders: 3,
      totalRevenue: 105000,
      averageOrderValue: 35000,
      monthlyGrowth: 15.2,
      pendingOrders: 1,
      processingOrders: 1,
      shippedOrders: 0,
      deliveredOrders: 1,
      cancelledOrders: 0
    };
  }

  private getMockOrderDetails(orderId: number): Order {
    const mockOrders = this.getMockOrders().orders;
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Commande non trouvée');
    }
    return order;
  }

  /**
   * Gère les erreurs d'API
   */
  handleError(error: any, context = ''): string {
    console.error(`Erreur vendeur commandes ${context}:`, error);

    if (error.message?.includes('401') || error.message?.includes('Non autorisé')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return 'Vous n\'avez pas les permissions pour cette action.';
    } else if (error.message?.includes('404')) {
      return 'Commande non trouvée ou vous n\'y avez pas accès.';
    } else if (error.message?.includes('400')) {
      return error.message || 'Données invalides.';
    } else {
      return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }
}

// Export du service singleton
export const vendorOrderService = new VendorOrderService();
export default vendorOrderService;