import {
  CreateOrderDto,
  Order,
  OrderFilters,
  AdminOrderFilters,
  OrderStatistics,
  BackendOrderStatistics,
  OrderResponse,
  CartItem,
  OrderTotals,
  PaymentMethod,
  OrderStatus
} from '../types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Ajout du type pour gérer le filtre "ALL"
type OrderStatusFilter = OrderStatus | 'ALL';

// Interface pour les réponses de l'API selon la documentation
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

// Interface pour la création de commande selon la nouvelle API
interface CreateOrderRequest {
  shippingAddress: string;
  phoneNumber: string;
  notes?: string;
  orderItems: {
    productId: number;
    quantity: number;
    size?: string;
    color?: string;
    colorId?: number;
  }[];
}

// Interface pour changer le statut selon la nouvelle API
interface UpdateStatusRequest {
  status: OrderStatus;
  notes?: string;
}

// Interface pour les statistiques WebSocket
interface WebSocketStats {
  connectedAdmins: number;
  connectedUsers: number;
  total: number;
}

export class OrderService {
  private baseURL = API_BASE_URL;

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP ${response.status}`);
      }
      return result;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  calculateOrderTotals(cartItems: CartItem[]): OrderTotals {
    const subtotal = cartItems.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    );

    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;

    const freeShippingThreshold = 50000;
    const shippingCost = 5000;
    const shippingAmount = subtotal >= freeShippingThreshold ? 0 : shippingCost;

    const totalAmount = subtotal + taxAmount + shippingAmount;
    return {
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      freeShipping: subtotal >= freeShippingThreshold
    };
  }

  extractPrice(priceString: string | number): number {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;

    const cleanPrice = priceString
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.')
      .trim();

    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

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

  getStatusColor(status: OrderStatus): string {
    const colors = {
      'PENDING': '#ffc107',
      'CONFIRMED': '#28a745',
      'PROCESSING': '#007bff',
      'SHIPPED': '#6f42c1',
      'DELIVERED': '#28a745',
      'CANCELLED': '#dc3545',
      'REJECTED': '#6c757d'
    };
    return colors[status] || '#6c757d';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0) + ' CFA';
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // ==========================================
  // MÉTHODES PRINCIPALES - CLIENT
  // ==========================================

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await this.apiCall<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    return response.data;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await this.apiCall<Order[]>('/orders/my-orders');
    return response.data;
  }

  async getOrderById(orderId: number): Promise<Order> {
    const response = await this.apiCall<Order>(`/orders/${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: number): Promise<Order> {
    const response = await this.apiCall<Order>(`/orders/${orderId}/cancel`, {
      method: 'DELETE'
    });
    return response.data;
  }

  // ==========================================
  // MÉTHODES ADMIN
  // ==========================================

  async getAllOrders(
    filters?: AdminOrderFilters | number,
    limit = 10,
    status?: OrderStatusFilter
  ): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let pageNum: number;
    let limitNum: number;
    let statusFilter: OrderStatusFilter | undefined;
    let userEmail: string | undefined;
    let orderNumber: string | undefined;

    if (typeof filters === 'object' && filters !== null) {
      pageNum = typeof filters.page === 'number' && filters.page > 0 ? filters.page : 1;
      limitNum = typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : 10;
      statusFilter = filters.status;
      userEmail = filters.userEmail;
      orderNumber = filters.orderNumber;
    } else {
      pageNum = typeof filters === 'number' && filters > 0 ? filters : 1;
      limitNum = typeof limit === 'number' && limit > 0 ? limit : 10;
      statusFilter = status;
    }

    if (typeof pageNum !== 'number' || isNaN(pageNum) || pageNum < 1) {
      console.warn('⚠️ Page invalide, utilisation de 1 par défaut:', pageNum);
      pageNum = 1;
    }
    if (typeof limitNum !== 'number' || isNaN(limitNum) || limitNum < 1) {
      console.warn('⚠️ Limit invalide, utilisation de 10 par défaut:', limitNum);
      limitNum = 10;
    }

    let url = `/orders/admin/all?page=${pageNum}&limit=${limitNum}`;

    if (statusFilter && statusFilter !== 'ALL') {
      url += `&status=${encodeURIComponent(statusFilter)}`;
    }
    if (userEmail && userEmail.trim()) {
      url += `&userEmail=${encodeURIComponent(userEmail)}`;
    }
    if (orderNumber && orderNumber.trim()) {
      url += `&orderNumber=${encodeURIComponent(orderNumber)}`;
    }

    console.log('🔍 URL getAllOrders générée:', url);
    const response = await this.apiCall<{
      orders: Order[];
      total: number;
      page: number;
      totalPages: number;
    }>(url);
    return response.data;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus, notes?: string): Promise<Order> {
    const response = await this.apiCall<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
    return response.data;
  }

  async getStatistics(): Promise<OrderStatistics> {
    const response = await this.apiCall<BackendOrderStatistics>('/orders/admin/statistics');
    const backendStats = response.data;

    const frontendStats: OrderStatistics = {
      totalOrders: backendStats.totalOrders || 0,
      revenue: {
        total: backendStats.totalRevenue || 0,
        monthly: backendStats.revenueThisMonth || 0
      },
      ordersCount: {
        today: backendStats.ordersToday || 0,
        week: backendStats.ordersThisWeek || 0,
        month: backendStats.ordersThisMonth || 0
      },
      ordersByStatus: {
        pending: backendStats.pendingOrders || 0,
        confirmed: backendStats.confirmedOrders || 0,
        processing: backendStats.processingOrders || 0,
        shipped: backendStats.shippedOrders || 0,
        delivered: backendStats.deliveredOrders || 0,
        cancelled: backendStats.cancelledOrders || 0
      }
    };

    console.log('📊 Stats backend:', backendStats);
    console.log('📊 Stats transformées:', frontendStats);

    return frontendStats;
  }

  async getFrontendStatistics(): Promise<OrderStatistics> {
    const response = await this.apiCall<BackendOrderStatistics>('/orders/admin/frontend-statistics');
    const backendStats = response.data;

    const frontendStats: OrderStatistics = {
      totalOrders: backendStats.totalOrders || 0,
      revenue: {
        total: backendStats.totalRevenue || 0,
        monthly: backendStats.revenueThisMonth || 0
      },
      ordersCount: {
        today: backendStats.ordersToday || 0,
        week: backendStats.ordersThisWeek || 0,
        month: backendStats.ordersThisMonth || 0
      },
      ordersByStatus: {
        pending: backendStats.pendingOrders || 0,
        confirmed: backendStats.confirmedOrders || 0,
        processing: backendStats.processingOrders || 0,
        shipped: backendStats.shippedOrders || 0,
        delivered: backendStats.deliveredOrders || 0,
        cancelled: backendStats.cancelledOrders || 0
      }
    };

    return frontendStats;
  }

  async getWebSocketStats(): Promise<WebSocketStats> {
    const response = await this.apiCall<WebSocketStats>('/orders/admin/websocket-stats');
    return response.data;
  }

  // ==========================================
  // TESTS
  // ==========================================

  async testAuth(): Promise<any> {
    const response = await this.apiCall<any>('/orders/test-auth');
    return response.data;
  }

  async testAdmin(): Promise<any> {
    const response = await this.apiCall<any>('/orders/test-admin');
    return response.data;
  }

  // ==========================================
  // MÉTHODE POUR CRÉER COMMANDE DEPUIS PANIER
  // ==========================================

  async createOrderFromCart(
    cartItems: any[],
    shippingDetails: any,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    try {
      console.log('🛒 Création de commande depuis le panier:', {
        itemsCount: cartItems.length,
        shippingDetails,
        paymentMethod
      });

      const orderItems = cartItems.map(item => {
        const orderItem: any = {
          productId: parseInt(item.id?.toString() || item.productId?.toString()),
          quantity: item.quantity,
        };

        let finalSize: string | undefined;
        let finalColor: string | undefined;
        let colorId: number | undefined;

        if (item.selectedSize) {
          finalSize = typeof item.selectedSize === 'object' ? item.selectedSize.name : item.selectedSize;
        } else if (item.size) {
          finalSize = typeof item.size === 'object' ? item.size.name : item.size;
        }

        if (item.selectedColorObject) {
          finalColor = item.selectedColorObject.name;
          colorId = item.selectedColorObject.id;
        } else if (item.selectedColorId && item.selectedColor) {
          colorId = item.selectedColorId;
          finalColor = typeof item.selectedColor === 'object' ? item.selectedColor.name : item.selectedColor;
        } else if (item.selectedColor) {
          finalColor = typeof item.selectedColor === 'object' ? item.selectedColor.name : item.selectedColor;
          colorId = typeof item.selectedColor === 'object' ? item.selectedColor.id : undefined;
        } else if (item.color) {
          finalColor = typeof item.color === 'object' ? item.color.name : item.color;
          colorId = typeof item.color === 'object' ? item.color.id : undefined;
        }

        if (finalSize) {
          orderItem.size = finalSize;
        }
        if (finalColor) {
          orderItem.color = finalColor;
        }
        if (colorId) {
          orderItem.colorId = colorId;
        }

        console.log('📦 Item de commande traité:', {
          original: item,
          processed: orderItem
        });
        return orderItem;
      });

      const fullAddress = `${shippingDetails.firstName} ${shippingDetails.lastName}, ${shippingDetails.street}${shippingDetails.apartment ? ', ' + shippingDetails.apartment : ''}, ${shippingDetails.city}, ${shippingDetails.region}${shippingDetails.postalCode ? ', ' + shippingDetails.postalCode : ''}, ${shippingDetails.country}`;

      const orderData: CreateOrderRequest = {
        shippingAddress: fullAddress,
        phoneNumber: shippingDetails.phone,
        notes: shippingDetails.notes || `Méthode de paiement: ${paymentMethod}`,
        orderItems
      };

      console.log('📋 Données de commande finales:', orderData);
      const order = await this.createOrder(orderData);

      console.log('✅ Commande créée avec succès:', order);
      return order;
    } catch (error) {
      console.error('❌ Erreur lors de la création de commande:', error);
      throw error;
    }
  }

  // ==========================================
  // GESTION DES ERREURS
  // ==========================================

  handleError(error: any, context = ''): string {
    console.error(`Erreur ${context}:`, error);

    if (error.message?.includes('401') || error.message?.includes('Non autorisé')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return 'Vous n\'avez pas les permissions pour cette action.';
    } else if (error.message?.includes('404')) {
      return 'Élément non trouvé.';
    } else if (error.message?.includes('400')) {
      return error.message || 'Données invalides.';
    } else {
      return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  // ==========================================
  // WEBSOCKET (sera étendu dans le service WebSocket)
  // ==========================================

  onNewOrder?: (notification: any) => void;
  onOrderStatusChanged?: (notification: any) => void;
  onMyOrderUpdated?: (notification: any) => void;
}

// Export du service singleton
export const orderService = new OrderService();
export default orderService;
