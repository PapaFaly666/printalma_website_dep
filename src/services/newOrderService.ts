import { 
  Order, 
  OrderStatus,
  PaymentMethod,
  BackendOrderStatistics,
  AdminOrderFilters
} from '../types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// ✅ Interfaces selon la nouvelle documentation API
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

interface ShippingDetailsPayload { // Définition de l'objet attendu par le backend
  firstName?: string;
  lastName?: string;
  company?: string;
  street?: string;
  apartment?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  // Assurez-vous que cela correspond à ce que le backend attend réellement
}

interface CreateOrderRequest {
  shippingDetails: ShippingDetailsPayload; // Modifié pour accepter un objet
  phoneNumber: string;
  notes?: string;
  totalAmount?: number; // 🎯 Ajout du montant total pour PayTech
  orderItems: {
    productId: number;
    quantity: number;
    unitPrice?: number; // 🎯 Ajout du prix unitaire pour le calcul
    size?: string;
    color?: string;
    colorId?: number;
  }[];
}

interface UpdateStatusRequest {
  status: OrderStatus;
  notes?: string;
}

interface PaginatedResponse<T> {
  orders?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters?: any;
}

interface OrderStatisticsResponse {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersToday: number;
    revenueToday: number;
  };
  statusBreakdown: {
    PENDING: number;
    CONFIRMED: number;
    PROCESSING: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
    REJECTED: number;
  };
  recentActivity: Array<{
    orderId: number;
    orderNumber: string;
    action: string;
    timestamp: string;
    customer: string;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    totalOrders: number;
    totalRevenue: number;
  }>;
}

// Interface adaptée pour le frontend
export interface OrderStatistics {
  totalOrders: number;
  revenue: {
    total: number;
    monthly: number;
  };
  ordersCount: {
    today: number;
    week: number;
    month: number;
  };
  ordersByStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export class NewOrderService {
  private baseURL = API_BASE_URL;

  // ==========================================
  // GESTION D'ERREURS ET UTILITAIRES
  // ==========================================

  private async handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error(result.message || 'Données invalides');
        case 401:
          // Redirection auto vers login si nécessaire
          throw new Error('Non authentifié - Veuillez vous reconnecter');
        case 403:
          throw new Error('Accès refusé - Permissions insuffisantes');
        case 404:
          throw new Error('Ressource non trouvée');
        case 500:
          throw new Error('Erreur serveur - Veuillez réessayer');
        default:
          throw new Error(`Erreur ${response.status}: ${result.message || 'Erreur inconnue'}`);
      }
    }
    
    return result;
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      console.log(`🔗 API Call: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include', // ⭐ ESSENTIEL pour les cookies d'auth
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await this.handleApiResponse<T>(response);
      console.log(`✅ API Success: ${endpoint}`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ API Error ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

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

  // 🎯 Calculer le montant total d'une commande
  calculateOrderTotal(orderItems: any[]): number {
    const subtotal = orderItems.reduce((sum, item) => {
      const unitPrice = item.unitPrice || item.price || 0;
      return sum + (unitPrice * item.quantity);
    }, 0);

    const shippingCost = orderItems.length > 0 ? 1500 : 0; // Frais de port fixes
    const total = subtotal + shippingCost;

    console.log('💰 [NewOrderService] Calcul du montant total:', {
      subtotal,
      shippingCost,
      total,
      itemsCount: orderItems.length,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price || 0
      }))
    });

    return total;
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
  // MÉTHODES CLIENT - Format API Documentation
  // ==========================================

  /**
   * Créer une nouvelle commande
   * POST /orders
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await this.apiCall<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    return response.data;
  }

  /**
   * Récupérer mes commandes avec pagination
   * GET /orders/my-orders?page=1&limit=10&status=PENDING
   */
  async getMyOrders(page = 1, limit = 10, status?: OrderStatus): Promise<{
    orders: Order[];
    pagination: any;
  }> {
    const params = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (status) {
      params.append('status', status);
    }

    const response = await this.apiCall<PaginatedResponse<Order>>(`/orders/my-orders?${params}`);
    
    return {
      orders: response.data.orders || [],
      pagination: response.data.pagination
    };
  }

  /**
   * Récupérer les détails d'une commande
   * GET /orders/:id
   */
  async getOrderById(orderId: number): Promise<Order> {
    // Utiliser directement l'endpoint standard qui renvoie une commande par son ID
    const response = await this.apiCall<Order>(`/orders/${orderId}`);
    return response.data;
  }

  /**
   * Récupérer les détails enrichis d'une commande (Admin uniquement)
   * Inclut les données enrichedVendorProduct avec délimitations et designs
   *
   * Stratégie:
   * 1. Essayer GET /orders/admin/:id (si disponible)
   * 2. Fallback: GET /orders/:id (endpoint standard)
   */
  async getOrderByIdAdmin(orderId: number): Promise<Order> {
    try {
      // Essayer d'abord l'endpoint admin enrichi
      const response = await this.apiCall<Order>(`/orders/admin/${orderId}`);
      console.log('✅ [NewOrderService] Commande chargée via /orders/admin/:id');
      return response.data;
    } catch (error: any) {
      // Si l'endpoint admin n'existe pas (404), utiliser l'endpoint standard
      if (error.message?.includes('404') || error.message?.includes('non trouvée')) {
        console.warn('⚠️ [NewOrderService] Endpoint /orders/admin/:id non disponible, fallback sur /orders/:id');
        const response = await this.apiCall<Order>(`/orders/${orderId}`);
        return response.data;
      }
      // Pour les autres erreurs, les propager
      throw error;
    }
  }

  // ==========================================
  // MÉTHODES ADMIN - Format API Documentation  
  // ==========================================

  /**
   * Récupérer toutes les commandes (Admin)
   * GET /orders/admin/all?page=1&limit=10&status=PENDING&userId=5&search=CMD
   */
  async getAllOrders(filters: AdminOrderFilters = {}): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    
    // Paramètres de pagination
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 10).toString());
    
    // Filtres optionnels
    if (filters.status) params.append('status', filters.status);
    if (filters.userEmail) params.append('userEmail', filters.userEmail);
    if (filters.orderNumber) params.append('search', filters.orderNumber);
    if (filters.userId) params.append('userId', filters.userId.toString());

    console.log('🔍 Filtres getAllOrders:', Object.fromEntries(params));

    const response = await this.apiCall<PaginatedResponse<Order>>(`/orders/admin/all?${params}`);
    
    // ✅ Adapter le format pour le frontend
    return {
      orders: response.data.orders || [],
      total: response.data.pagination?.total || 0,
      totalPages: response.data.pagination?.totalPages || 1,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 10
    };
  }

  /**
   * Modifier le statut d'une commande (Admin)
   * PATCH /orders/:id/status
   */
  async updateOrderStatus(orderId: number, status: OrderStatus, notes?: string): Promise<Order> {
    const updateData: UpdateStatusRequest = { status };
    if (notes) updateData.notes = notes;

    const response = await this.apiCall<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    return response.data;
  }

  /**
   * Récupérer les statistiques (Admin)
   * GET /orders/admin/statistics
   */
  async getStatistics(): Promise<OrderStatistics> {
    const response = await this.apiCall<any>('/orders/admin/statistics');
    const stats = response.data;
    
    console.log('📊 Statistiques reçues du backend:', stats);
    
    // ✅ Adapter le format backend actuel vers frontend
    // Le backend renvoie un format plat, pas un format avec overview
    return {
      totalOrders: stats.totalOrders || 0,
      revenue: {
        total: stats.totalRevenue || 0,
        monthly: stats.revenueThisMonth || 0
      },
      ordersCount: {
        today: stats.ordersToday || 0,
        week: stats.ordersThisWeek || 0,
        month: stats.ordersThisMonth || 0
      },
      ordersByStatus: {
        pending: stats.pendingOrders || 0,
        confirmed: stats.confirmedOrders || 0,
        processing: stats.processingOrders || 0,
        shipped: stats.shippedOrders || 0,
        delivered: stats.deliveredOrders || 0,
        cancelled: stats.cancelledOrders || 0
      }
    };
  }

  /**
   * Recherche de commandes (Admin)
   * GET /orders/admin/search?q=CMD20241127&customerEmail=jean@&phone=+33
   */
  async searchOrders(searchParams: {
    q?: string;
    customerEmail?: string;
    customerName?: string;
    phone?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await this.apiCall<Order[]>(`/orders/admin/search?${params}`);
    return response.data;
  }

  // ==========================================
  // MÉTHODES DE COMPATIBILITÉ ANCIENNES
  // ==========================================

  async cancelOrder(orderId: number): Promise<Order> {
    return this.updateOrderStatus(orderId, 'CANCELLED', 'Commande annulée par le client');
  }

  async createOrderFromCart(
    cartItems: any[],
    shippingDetailsFromCartPage: any, // Renommé pour clarté
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    console.log('📦 Création de commande depuis le panier:', { cartItems, shippingDetails: shippingDetailsFromCartPage, paymentMethod });

    // Préparer l'objet shippingDetails pour le backend
    // S'assurer qu'il correspond à ShippingDetailsPayload et ne contient que les champs attendus
    const backendShippingDetails: ShippingDetailsPayload = {
      firstName: shippingDetailsFromCartPage.firstName,
      lastName: shippingDetailsFromCartPage.lastName,
      company: shippingDetailsFromCartPage.company,
      street: shippingDetailsFromCartPage.street,
      apartment: shippingDetailsFromCartPage.apartment,
      city: shippingDetailsFromCartPage.city,
      region: shippingDetailsFromCartPage.region,
      postalCode: shippingDetailsFromCartPage.postalCode,
      country: shippingDetailsFromCartPage.country,
      // Ne pas inclure d'autres champs potentiels de shippingDetailsFromCartPage ici
      // comme 'phone' qui est géré par phoneNumber, ou 'notes' géré par notes.
    };

    // Validation optionnelle : vérifier que backendShippingDetails n'est pas vide
    // si le backend l'exige (comme le suggère l'erreur originale)
    if (Object.values(backendShippingDetails).every(value => value === undefined || value === '' || value === null)) {
        // Si tous les champs sont vides, cela pourrait être le problème
        console.warn('⚠️ L\'objet backendShippingDetails est entièrement vide ou ne contient que des valeurs null/undefined/chaînes vides.');
        // Selon la logique backend, il peut vouloir au moins un champ renseigné.
        // Si l'erreur "shippingDetails must be a non-empty object" persiste,
        // il faut s'assurer que le backend n'attend pas simplement un objet existant,
        // mais un objet avec au moins certaines propriétés définies.
    }

    // 🎯 Préparer les orderItems avec les prix unitaires
    const processedOrderItems = cartItems.map(item => {
      // Important: Utiliser productId (number) et non id (string composite "1-Blanc-X")
      const productIdAsNumber = parseInt(item.productId, 10);
      if (isNaN(productIdAsNumber) || productIdAsNumber <= 0) {
        throw new Error(`L'article "${item.title || item.productName || item.name || 'Inconnu'}" a un ID de produit invalide (${item.productId}). L'ID doit être supérieur à 0.`);
      }

      // 🆕 CORRECTION: Récupérer correctement size et color selon le format de l'item
      let finalSize: string | undefined;
      let finalColor: string | undefined;
      let colorId: number | undefined;

      // Gestion de la taille - supporter plusieurs formats
      if (item.selectedSize) {
        finalSize = typeof item.selectedSize === 'object' ? item.selectedSize.name : item.selectedSize;
      } else if (item.size) {
        finalSize = typeof item.size === 'object' ? item.size.name : item.size;
      }

      // Gestion de la couleur - supporter plusieurs formats + colorId
      if (item.selectedColorObject) {
        // Format avec objet couleur complet
        finalColor = item.selectedColorObject.name;
        colorId = item.selectedColorObject.id;
      } else if (item.selectedColorId && item.selectedColor) {
        // Format avec ID et nom séparés
        colorId = item.selectedColorId;
        finalColor = typeof item.selectedColor === 'object' ? item.selectedColor.name : item.selectedColor;
      } else if (item.selectedColor) {
        // Format avec couleur seulement
        finalColor = typeof item.selectedColor === 'object' ? item.selectedColor.name : item.selectedColor;
        colorId = typeof item.selectedColor === 'object' ? item.selectedColor.id : undefined;
      } else if (item.color) {
        // Format simple avec couleur comme string
        finalColor = typeof item.color === 'object' ? item.color.name : item.color;
        colorId = typeof item.color === 'object' ? item.color.id : undefined;
      }

      // 🎯 Récupérer le prix unitaire
      const unitPrice = this.extractPrice(item.price || item.unitPrice || 0);

      console.log('📦 Item traité:', {
        original: item,
        processed: {
          productId: productIdAsNumber,
          quantity: item.quantity,
          unitPrice: unitPrice,
          size: finalSize,
          color: finalColor,
          colorId: colorId
        }
      });

      const orderItem: any = {
        productId: productIdAsNumber,
        quantity: item.quantity,
        unitPrice: unitPrice, // 🎯 Ajouter le prix unitaire
      };

      // Ajouter size si disponible
      if (finalSize) {
        orderItem.size = finalSize;
      }

      // Ajouter color si disponible
      if (finalColor) {
        orderItem.color = finalColor;
      }

      // 🆕 Ajouter colorId si disponible
      if (colorId) {
        orderItem.colorId = colorId;
      }

      console.log('🔍 OrderItem final pour backend:', orderItem);

      return orderItem;
    });

    // 🎯 Calculer le montant total
    const totalAmount = this.calculateOrderTotal(processedOrderItems);

    const orderData: CreateOrderRequest = {
      shippingDetails: backendShippingDetails, // Passer l'objet structuré
      phoneNumber: shippingDetailsFromCartPage.phone || shippingDetailsFromCartPage.phoneNumber || 'N/A',
      notes: shippingDetailsFromCartPage.notes || '',
      totalAmount: totalAmount, // 🎯 Ajouter le montant total calculé
      orderItems: processedOrderItems,
    };

    console.log('🚚 Payload envoyé au backend pour POST /orders:', orderData);

    // 🎯 Validation du montant pour PayTech
    // Note: Comparaison avec string car PaymentMethod inclut plusieurs types
    if (paymentMethod && paymentMethod.toString().toUpperCase() === 'PAYTECH' && totalAmount < 100) {
      throw new Error(`Le montant total (${totalAmount} XOF) est inférieur au minimum requis (100 XOF) pour PayTech`);
    }

    try {
      const result = await this.apiCall<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      console.log('✅ Réponse du backend après création de commande:', result);

      return result.data;
    } catch (error) {
      console.error('❌ Erreur lors de la création de commande depuis le panier (newOrderService):', error);
      // L'erreur est déjà un objet Error, on peut la relancer ou utiliser this.handleError
      throw this.handleError(error, 'création commande depuis panier');
    }
  }

  // ==========================================
  // GESTION D'ERREURS
  // ==========================================

  handleError(error: any, context = ''): string {
    let message = 'Une erreur est survenue';
    
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    console.error(`❌ Erreur ${context}:`, error);
    return message;
  }

  // ==========================================
  // TESTS DE CONNECTIVITÉ
  // ==========================================

  async testAuth(): Promise<any> {
    return this.apiCall('/orders/my-orders?limit=1');
  }

  async testAdmin(): Promise<any> {
    return this.apiCall('/orders/admin/statistics');
  }
}

// Export du service singleton
export const newOrderService = new NewOrderService();
export default newOrderService; 