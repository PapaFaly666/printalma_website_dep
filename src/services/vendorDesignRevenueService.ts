// src/services/vendorDesignRevenueService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface DesignUsage {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  productName: string;
  usedAt: string;
  revenue: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  commissionRate: number; // Pourcentage de commission (ex: 70)
  paymentStatus: string;
  orderPaymentStatus: 'PAID' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
}

export interface DesignRevenue {
  id: number;
  designId: number;
  designName: string;
  designImage: string;
  designPrice: number;
  totalUsages: number;
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  lastUsedAt: string;
  usageHistory: DesignUsage[];
}

export interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  totalUsages: number;
  uniqueDesignsUsed: number;
  averageRevenuePerDesign: number;
  topDesigns: Array<{
    designId: number;
    designName: string;
    revenue: number;
    usages: number;
  }>;
}

export interface PayoutRequest {
  amount: number;
  bankAccountId: number;
  requestedAt: string;
}

export interface PayoutHistory {
  id: number;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string; // Masqué partiellement
  };
}

class VendorDesignRevenueService {
  private baseUrl = `${API_BASE}/vendor/design-revenues`;

  /**
   * Récupérer les statistiques de revenus globales
   */
  async getRevenueStats(period: 'week' | 'month' | 'year' | 'all' = 'month'): Promise<RevenueStats> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats`, {
        params: { period },
        ...this.getAuthOptions()
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur récupération stats revenus:', error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des designs avec leurs revenus
   */
  async getDesignRevenues(params: {
    period?: 'week' | 'month' | 'year' | 'all';
    sortBy?: 'revenue' | 'usage' | 'recent';
    search?: string;
  } = {}): Promise<DesignRevenue[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/designs`, {
        params,
        ...this.getAuthOptions()
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur récupération revenus designs:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique détaillé d'un design spécifique
   */
  async getDesignUsageHistory(designId: number): Promise<DesignUsage[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/designs/${designId}/history`, {
        ...this.getAuthOptions()
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur récupération historique design:', error);
      throw error;
    }
  }

  /**
   * Demander un paiement (retrait des revenus)
   */
  async requestPayout(amount: number, bankAccountId: number): Promise<PayoutRequest> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payout`,
        { amount, bankAccountId },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur demande paiement:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des paiements
   */
  async getPayoutHistory(): Promise<PayoutHistory[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/payouts`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération historique paiements:', error);
      throw error;
    }
  }

  /**
   * Exporter les données de revenus en CSV
   */
  async exportRevenuesToCSV(period: 'week' | 'month' | 'year' | 'all' = 'month'): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseUrl}/export`, {
        params: { period, format: 'csv' },
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur export CSV:', error);
      throw error;
    }
  }

  /**
   * Récupérer les paramètres de commission
   */
  async getCommissionSettings(): Promise<{
    commissionRate: number;
    minimumPayout: number;
    payoutSchedule: string;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/commission-settings`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération paramètres commission:', error);
      throw error;
    }
  }

  /**
   * Headers d'authentification
   */
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Options de requête avec credentials
   */
  private getAuthOptions() {
    return {
      headers: this.getAuthHeaders(),
      withCredentials: true,
      credentials: 'include' as RequestCredentials
    };
  }
}

export default new VendorDesignRevenueService();
