import { Order } from '../types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Types pour les demandes d'appel de fonds
export interface FundsRequest {
  id: number;
  vendorId: number;
  vendor?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shopName?: string;
  };
  amount: number;
  requestedAmount: number;
  description: string;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';
  phoneNumber?: string;
  iban?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  rejectReason?: string;
  approvedDate?: string;
  requestDate: string;
  validatedAt?: string;
  processedDate?: string;
  processedBy?: number;
  adminNote?: string;
  orderIds?: number[]; // Commandes liées à cette demande
  availableBalance: number; // Solde disponible au moment de la demande
  commissionRate: number; // Taux de commission appliqué
  createdAt: string;
  updatedAt: string;
}

// Interface pour les statistiques des gains vendeur
export interface VendorEarnings {
  totalEarnings: number;
  pendingAmount: number;
  availableAmount: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  commissionPaid: number;
  totalCommission: number;
  averageCommissionRate: number;
}

// Interface pour les filtres des demandes
export interface FundsRequestFilters {
  status?: FundsRequest['status'];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: FundsRequest['paymentMethod'];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface pour créer une nouvelle demande
export interface CreateFundsRequest {
  amount: number;
  description?: string; // Optionnel maintenant
  paymentMethod: FundsRequest['paymentMethod'];
  phoneNumber?: string;
  iban?: string;
  orderIds?: number[];
}

// Interface pour la réponse paginée
interface PaginatedFundsResponse {
  requests: FundsRequest[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Interface pour les réponses API
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

export class VendorFundsService {
  private baseURL = API_BASE_URL;

  // Helper pour obtenir les headers d'authentification
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

  // Détection du mode développement
  private isDevelopmentMode(): boolean {
    return import.meta.env.MODE === 'development';
  }

  // Méthode générique pour les appels API
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
      console.error(`Erreur API fonds vendeur ${endpoint}:`, error);

      // En mode développement, utiliser les données mock
      if (this.isDevelopmentMode() && (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('400') ||
        errorMessage.includes('404') ||
        errorMessage.includes('500')
      )) {
        const developmentError = new Error('DEVELOPMENT_MODE_FALLBACK');
        (developmentError as any).originalError = error;
        throw developmentError;
      }

      throw error;
    }
  }

  // ==========================================
  // MÉTHODES PRINCIPALES - VENDEUR
  // ==========================================

  /**
   * Récupère les gains et statistiques du vendeur
   */
  async getVendorEarnings(): Promise<VendorEarnings> {
    try {
      console.log('🔍 Tentative d\'appel API /vendor/earnings vers:', this.baseURL);
      const response = await this.apiCall<VendorEarnings>('/vendor/earnings');
      console.log('✅ Réponse API reçue:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Erreur API /vendor/earnings:', error);
      console.log('🔧 Utilisation des gains mock en fallback avec nouvelles valeurs');
      return this.getMockEarnings();
    }
  }

  /**
   * Récupère toutes les demandes d'appel de fonds du vendeur
   */
  async getVendorFundsRequests(filters?: FundsRequestFilters): Promise<PaginatedFundsResponse> {
    try {
      let url = '/vendor/funds-requests';
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
        if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
        if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await this.apiCall<PaginatedFundsResponse>(url);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Erreur API: Utilisation des demandes mock en fallback');
      return this.getMockFundsRequests(filters);
    }
  }

  /**
   * Crée une nouvelle demande d'appel de fonds
   */
  async createFundsRequest(request: CreateFundsRequest): Promise<FundsRequest> {
    try {
      // Ajouter une description automatique pour le backend
      const payloadBase: any = {
        amount: request.amount,
        paymentMethod: request.paymentMethod,
        description: request.description || `Demande de retrait de ${this.formatCurrency(request.amount)}`,
        orderIds: request.orderIds
      };
      const requestData = request.paymentMethod === 'BANK_TRANSFER'
        ? { ...payloadBase, iban: request.iban }
        : { ...payloadBase, phoneNumber: request.phoneNumber };

      const response = await this.apiCall<FundsRequest>('/vendor/funds-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      return response.data;
    } catch (error) {
      console.warn('⚠️ Erreur API: Simulation de création de demande en fallback');
      return this.createMockFundsRequest(request);
    }
  }

  /**
   * Récupère les détails d'une demande spécifique
   */
  async getFundsRequestDetails(requestId: number): Promise<FundsRequest> {
    try {
      const response = await this.apiCall<FundsRequest>(`/vendor/funds-requests/${requestId}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des détails mock');
        return this.getMockFundsRequestDetails(requestId);
      }
      throw error;
    }
  }

  /**
   * Annule une demande en attente
   */
  async cancelFundsRequest(requestId: number): Promise<FundsRequest> {
    try {
      const response = await this.apiCall<FundsRequest>(`/vendor/funds-requests/${requestId}/cancel`, {
        method: 'PATCH'
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Simulation d\'annulation');
        throw new Error('Fonction non disponible en mode développement');
      }
      throw error;
    }
  }

  /**
   * Récupère les commandes disponibles pour appel de fonds
   */
  async getAvailableOrdersForFunds(): Promise<Order[]> {
    try {
      const response = await this.apiCall<Order[]>('/vendor/orders/available-for-funds');
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des commandes mock');
        return this.getMockAvailableOrders();
      }
      throw error;
    }
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

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
  getStatusLabel(status: FundsRequest['status']): string {
    const labels = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvée',
      'REJECTED': 'Rejetée',
      'PAID': 'Payée'
    };
    return labels[status] || status;
  }

  /**
   * Obtient la couleur d'un statut
   */
  getStatusColor(status: FundsRequest['status']): string {
    const colors = {
      'PENDING': '#ffc107',
      'APPROVED': '#17a2b8',
      'REJECTED': '#dc3545',
      'PAID': '#28a745'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Obtient le label d'une méthode de paiement
   */
  getPaymentMethodLabel(method: FundsRequest['paymentMethod']): string {
    const labels = {
      'WAVE': 'Wave',
      'ORANGE_MONEY': 'Orange Money',
      'BANK_TRANSFER': 'Virement bancaire'
    };
    return labels[method] || method;
  }

  // ==========================================
  // MÉTHODES MOCK POUR LE DÉVELOPPEMENT
  // ==========================================

  private getMockEarnings(): VendorEarnings {
    // 💰 VALEURS DE TEST - Modifiez ces valeurs selon vos besoins
    return {
      totalEarnings: 450000,        // Total des gains du vendeur
      pendingAmount: 75000,         // Montant en attente de traitement
      availableAmount: 375000,      // Montant disponible pour retrait
      thisMonthEarnings: 125000,    // Gains de ce mois
      lastMonthEarnings: 98000,     // Gains du mois dernier
      commissionPaid: 45000,        // Commissions déjà payées
      totalCommission: 50000,       // Total des commissions
      averageCommissionRate: 0.12   // Taux de commission moyen (12%)
    };
  }

  private getMockFundsRequests(filters?: FundsRequestFilters): PaginatedFundsResponse {
    const mockRequests: FundsRequest[] = [
      {
        id: 1,
        vendorId: 2000,
        amount: 45000,
        requestedAmount: 45000,
        description: 'Vente de 3 T-shirts design Afrique',
        paymentMethod: 'WAVE',
        phoneNumber: '+221770001234',
        status: 'PAID',
        requestDate: '2024-01-15T10:30:00Z',
        processedDate: '2024-01-16T14:20:00Z',
        processedBy: 1,
        adminNote: 'Paiement effectué via Wave',
        orderIds: [1, 2],
        availableBalance: 45000,
        commissionRate: 0.10,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T14:20:00Z'
      },
      {
        id: 2,
        vendorId: 2000,
        amount: 23500,
        requestedAmount: 23500,
        description: 'Vente de 1 Hoodie premium',
        paymentMethod: 'ORANGE_MONEY',
        phoneNumber: '+221770001234',
        status: 'PENDING',
        requestDate: '2024-01-17T09:15:00Z',
        orderIds: [3],
        availableBalance: 23500,
        commissionRate: 0.10,
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-17T09:15:00Z'
      },
      {
        id: 3,
        vendorId: 2000,
        amount: 32000,
        requestedAmount: 32000,
        description: 'Vente de mugs personnalisés',
        paymentMethod: 'WAVE',
        phoneNumber: '+221770001234',
        status: 'REJECTED',
        rejectReason: 'Informations de paiement incorrectes',
        requestDate: '2024-01-10T15:45:00Z',
        processedDate: '2024-01-11T09:30:00Z',
        processedBy: 1,
        adminNote: 'Numéro de téléphone Wave invalide',
        availableBalance: 32000,
        commissionRate: 0.10,
        createdAt: '2024-01-10T15:45:00Z',
        updatedAt: '2024-01-11T09:30:00Z'
      }
    ];

    // Appliquer les filtres
    let filteredRequests = [...mockRequests];

    if (filters?.status) {
      filteredRequests = filteredRequests.filter(req => req.status === filters.status);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const total = filteredRequests.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const requests = filteredRequests.slice(start, end);

    return {
      requests,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  private createMockFundsRequest(request: CreateFundsRequest): FundsRequest {
    const newId = Date.now(); // Simule un ID unique

    return {
      id: newId,
      vendorId: 2000,
      amount: request.amount,
      requestedAmount: request.amount,
      description: request.description || `Demande de retrait ${this.formatCurrency(request.amount)}`,
      paymentMethod: request.paymentMethod,
      phoneNumber: request.phoneNumber,
      status: 'PENDING',
      requestDate: new Date().toISOString(),
      orderIds: request.orderIds,
      availableBalance: request.amount,
      commissionRate: 0.10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getMockFundsRequestDetails(requestId: number): FundsRequest {
    const mockRequests = this.getMockFundsRequests().requests;
    const request = mockRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }
    return request;
  }

  private getMockAvailableOrders(): Order[] {
    // Utiliser les commandes déjà disponibles dans le service de commandes
    return [
      {
        id: 4,
        orderNumber: 'CMD-2024-01-0004',
        userId: 1003,
        user: {
          id: 1003,
          firstName: 'Ibrahim',
          lastName: 'Diop',
          email: 'ibrahim.diop@test.printalma.com',
          role: 'CUSTOMER'
        },
        status: 'DELIVERED',
        totalAmount: 21000,
        shippingAddress: {
          street: '12 Boulevard de la République',
          city: 'Ziguinchor',
          region: 'Ziguinchor',
          country: 'SN',
          fullFormatted: '12 Boulevard de la République, Ziguinchor, Ziguinchor, SN'
        },
        phoneNumber: '+221770000004',
        createdAt: '2024-01-18T11:00:00Z',
        updatedAt: '2024-01-20T16:30:00Z',
        orderItems: [
          {
            id: 4,
            quantity: 1,
            unitPrice: 21000,
            productName: 'Tote Bag Artisanal',
            product: {
              id: 4,
              name: 'Tote Bag Canvas',
              designName: 'Art Traditionnel',
              price: 21000
            }
          }
        ]
      }
    ];
  }

  /**
   * Gère les erreurs d'API
   */
  handleError(error: any, context = ''): string {
    console.error(`Erreur fonds vendeur ${context}:`, error);

    if (error.message?.includes('401') || error.message?.includes('Non autorisé')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return 'Vous n\'avez pas les permissions pour cette action.';
    } else if (error.message?.includes('404')) {
      return 'Demande non trouvée.';
    } else if (error.message?.includes('400')) {
      return error.message || 'Données invalides.';
    } else {
      return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }
}

// Export du service singleton
export const vendorFundsService = new VendorFundsService();
export default vendorFundsService;