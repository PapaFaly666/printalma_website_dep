import { FundsRequest, VendorEarnings } from './vendorFundsService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Types spécifiques pour l'admin
export interface AdminFundsRequestFilters {
  status?: FundsRequest['status'];
  vendorId?: number;
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

export interface ProcessFundsRequest {
  status: 'APPROVED' | 'REJECTED' | 'PAID';
  adminNote?: string;
  rejectReason?: string;
}

export interface AdminFundsStatistics {
  totalPendingRequests: number;
  totalPendingAmount: number;
  totalProcessedToday: number;
  totalProcessedAmount: number;
  averageProcessingTime: number; // en heures
  requestsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  requestsByPaymentMethod: {
    wave: number;
    orangeMoney: number;
    bankTransfer: number;
  };
}

interface PaginatedAdminFundsResponse {
  requests: FundsRequest[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

export class AdminFundsService {
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
      console.error(`Erreur API admin fonds ${endpoint}:`, error);

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
  // MÉTHODES PRINCIPALES - ADMIN
  // ==========================================

  /**
   * Récupère toutes les demandes d'appel de fonds (admin)
   */
  async getAllFundsRequests(filters?: AdminFundsRequestFilters): Promise<PaginatedAdminFundsResponse> {
    try {
      let url = '/admin/funds-requests';
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.vendorId) params.append('vendorId', filters.vendorId.toString());
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

      const response = await this.apiCall<PaginatedAdminFundsResponse>(url);
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des demandes admin mock');
        return this.getMockAdminFundsRequests(filters);
      }
      throw error;
    }
  }

  /**
   * Récupère les statistiques des demandes d'appel de fonds (admin)
   */
  async getAdminFundsStatistics(): Promise<AdminFundsStatistics> {
    try {
      const response = await this.apiCall<AdminFundsStatistics>('/admin/funds-requests/statistics');
      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Utilisation des statistiques admin mock');
        return this.getMockAdminStatistics();
      }
      throw error;
    }
  }

  /**
   * Traite une demande d'appel de fonds (approuve, rejette ou marque comme payée)
   */
  async processFundsRequest(requestId: number, action: ProcessFundsRequest): Promise<FundsRequest> {
    try {
      const response = await this.apiCall<FundsRequest>(`/admin/funds-requests/${requestId}/process`, {
        method: 'PATCH',
        body: JSON.stringify(action)
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Simulation de traitement de demande');
        return this.processMockFundsRequest(requestId, action);
      }
      throw error;
    }
  }

  /**
   * Récupère les détails d'une demande spécifique (admin)
   */
  async getFundsRequestDetails(requestId: number): Promise<FundsRequest> {
    try {
      const response = await this.apiCall<FundsRequest>(`/admin/funds-requests/${requestId}`);
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
   * Approuve plusieurs demandes en lot
   */
  async batchProcessRequests(requestIds: number[], action: ProcessFundsRequest): Promise<FundsRequest[]> {
    try {
      const response = await this.apiCall<FundsRequest[]>('/admin/funds-requests/batch-process', {
        method: 'PATCH',
        body: JSON.stringify({
          requestIds,
          ...action
        })
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVELOPMENT_MODE_FALLBACK') {
        console.warn('⚠️ Mode développement: Simulation de traitement en lot');
        throw new Error('Fonction non disponible en mode développement');
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

  private getMockAdminFundsRequests(filters?: AdminFundsRequestFilters): PaginatedAdminFundsResponse {
    const mockRequests: FundsRequest[] = [
      {
        id: 1,
        vendorId: 2000,
        vendor: {
          id: 2000,
          firstName: 'Khadija',
          lastName: 'Diagne',
          email: 'khadija.design@test.printalma.com',
          shopName: 'Khadija Design Studio'
        },
        amount: 45000,
        requestedAmount: 45000,
        description: 'Vente de 3 T-shirts design Afrique',
        paymentMethod: 'WAVE',
        phoneNumber: '+221770001234',
        status: 'PENDING',
        requestDate: '2024-01-17T09:15:00Z',
        orderIds: [1, 2],
        availableBalance: 45000,
        commissionRate: 0.10,
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-17T09:15:00Z'
      },
      {
        id: 2,
        vendorId: 2001,
        vendor: {
          id: 2001,
          firstName: 'Mamadou',
          lastName: 'Sow',
          email: 'mamadou.art@test.printalma.com',
          shopName: 'Mamadou Art Gallery'
        },
        amount: 23500,
        requestedAmount: 23500,
        description: 'Vente de 1 Hoodie premium',
        paymentMethod: 'ORANGE_MONEY',
        phoneNumber: '+221770002345',
        status: 'APPROVED',
        requestDate: '2024-01-16T14:20:00Z',
        processedDate: '2024-01-17T10:30:00Z',
        processedBy: 1,
        adminNote: 'Demande approuvée, en attente de paiement',
        orderIds: [3],
        availableBalance: 23500,
        commissionRate: 0.10,
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-17T10:30:00Z'
      },
      {
        id: 3,
        vendorId: 2002,
        vendor: {
          id: 2002,
          firstName: 'Awa',
          lastName: 'Fall',
          email: 'awa.creative@test.printalma.com',
          shopName: 'Awa Créative Designs'
        },
        amount: 67200,
        requestedAmount: 67200,
        description: 'Gains du mois de décembre',
        paymentMethod: 'WAVE',
        phoneNumber: '+221770003456',
        status: 'PAID',
        requestDate: '2024-01-15T10:30:00Z',
        processedDate: '2024-01-16T14:20:00Z',
        processedBy: 1,
        adminNote: 'Paiement effectué via Wave',
        orderIds: [4, 5, 6],
        availableBalance: 67200,
        commissionRate: 0.10,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T14:20:00Z'
      }
    ];

    // Appliquer les filtres
    let filteredRequests = [...mockRequests];

    if (filters?.status) {
      filteredRequests = filteredRequests.filter(req => req.status === filters.status);
    }

    if (filters?.vendorId) {
      filteredRequests = filteredRequests.filter(req => req.vendorId === filters.vendorId);
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

  private getMockAdminStatistics(): AdminFundsStatistics {
    return {
      totalPendingRequests: 5,
      totalPendingAmount: 156500,
      totalProcessedToday: 3,
      totalProcessedAmount: 89700,
      averageProcessingTime: 18.5,
      requestsByStatus: {
        pending: 5,
        approved: 3,
        rejected: 1,
        paid: 12
      },
      requestsByPaymentMethod: {
        wave: 8,
        orangeMoney: 6,
        bankTransfer: 1
      }
    };
  }

  private processMockFundsRequest(requestId: number, action: ProcessFundsRequest): FundsRequest {
    // Simuler le traitement d'une demande
    const mockRequests = this.getMockAdminFundsRequests().requests;
    const request = mockRequests.find(r => r.id === requestId);

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    return {
      ...request,
      status: action.status,
      processedDate: new Date().toISOString(),
      processedBy: 1,
      adminNote: action.adminNote,
      rejectReason: action.rejectReason,
      updatedAt: new Date().toISOString()
    };
  }

  private getMockFundsRequestDetails(requestId: number): FundsRequest {
    const mockRequests = this.getMockAdminFundsRequests().requests;
    const request = mockRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Demande non trouvée');
    }
    return request;
  }

  /**
   * Gère les erreurs d'API
   */
  handleError(error: any, context = ''): string {
    console.error(`Erreur admin fonds ${context}:`, error);

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
export const adminFundsService = new AdminFundsService();
export default adminFundsService;