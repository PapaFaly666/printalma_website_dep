import { API_CONFIG } from '../config/api';
import axios from 'axios';

// Types basés sur le backend NestJS implémenté
export interface CommissionResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface VendorCommissionData {
  vendorId: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: string;
  commissionRate: number;
  estimatedMonthlyRevenue?: number;
  lastUpdated?: string;
}

export interface CommissionStats {
  averageCommission: number;
  minCommission: number;
  maxCommission: number;
  totalVendors: number;
  freeVendors: number;
  highCommissionVendors: number;
}

export interface CommissionHistoryEntry {
  id: number;
  oldRate: number;
  newRate: number;
  changedBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
  changedAt: string;
  ipAddress?: string;
}

class CommissionService {
  private baseUrl = `${API_CONFIG.BASE_URL}`;

  // Client axios centralisé, cookies HttpOnly uniquement
  private api = axios.create({
    baseURL: this.baseUrl,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Gestion globale du 401
    this.api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    );
  }

  private handleAuthError(): void {
    // Redirection simple vers la page de connexion
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Gestion centralisée des erreurs API - CORRIGÉE avec authentification
   */
  private async handleApiErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'Erreur lors de la communication avec le serveur';
    
    // Gestion spéciale des erreurs d'authentification
    if (response.status === 401) {
      console.warn('🚨 Erreur 401 - Token invalide ou expiré');
      this.handleAuthError();
      throw new Error('Session expirée - Redirection vers login...');
    }

    if (response.status === 403) {
      console.warn('🚨 Erreur 403 - Permissions insuffisantes');
      errorMessage = 'Accès interdit - Permissions administrateur requises';
    }
    
    try {
      const errorData = await response.json();
      
      if (errorData.error) {
        switch (errorData.error) {
          case 'INVALID_COMMISSION_RATE':
            errorMessage = 'Taux de commission invalide (doit être entre 0 et 100%)';
            break;
          case 'VENDOR_NOT_FOUND':
            errorMessage = 'Vendeur introuvable';
            break;
          case 'UNAUTHORIZED':
            this.handleAuthError();
            errorMessage = 'Session expirée - Redirection vers login...';
            break;
          case 'FORBIDDEN':
            errorMessage = 'Accès interdit - Vous n\'avez pas les permissions nécessaires';
            break;
          default:
            errorMessage = errorData.message || errorMessage;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Si la réponse n'est pas du JSON, utiliser le message par défaut basé sur le status
      if (response.status === 404) {
        errorMessage = 'Ressource introuvable';
      } else if (response.status >= 500) {
        errorMessage = 'Erreur serveur - Veuillez réessayer plus tard';
      }
    }

    console.error(`❌ Erreur API ${response.status}:`, errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Mettre à jour la commission d'un vendeur
   * PUT /admin/vendors/:id/commission
   */
  async updateVendorCommission(vendorId: number, commissionRate: number): Promise<void> {
    try {
      const { data } = await this.api.put<CommissionResponse>(`/admin/vendors/${vendorId}/commission`, { commissionRate });
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour de la commission');
      }
      console.log('✅ Commission mise à jour:', data.message);
    } catch (error: any) {
      // Adapter gestion fetch→axios
      if (error?.response) {
        const resp: Response = error.response;
        await this.handleApiErrorResponse(resp);
      }
      console.error('❌ Erreur updateVendorCommission:', error);
      throw error;
    }
  }

  /**
   * 🆕 NOUVEAU - Obtenir MA commission en tant que vendeur connecté
   * GET /vendor/my-commission
   */
  async getMyCommission(): Promise<any> {
    try {
      const { data } = await this.api.get<CommissionResponse>(`/vendor/my-commission`);
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération de votre commission');
      }
      return data.data;
    } catch (error: any) {
      if (error?.response) {
        const resp: Response = error.response;
        await this.handleApiErrorResponse(resp);
      }
      console.error('❌ Erreur getMyCommission:', error);
      // Fallback: retourner commission par défaut de 40%
      return { commissionRate: 40, isDefault: true };
    }
  }

  /**
   * Obtenir la commission d'un vendeur spécifique (ADMIN ONLY)
   * GET /admin/vendors/:id/commission
   */
  async getVendorCommission(vendorId: number): Promise<any> {
    try {
      const { data } = await this.api.get<CommissionResponse>(`/admin/vendors/${vendorId}/commission`);
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération de la commission');
      }
      return data.data;
    } catch (error: any) {
      if (error?.response) {
        const resp: Response = error.response;
        await this.handleApiErrorResponse(resp);
      }
      console.error('❌ Erreur getVendorCommission:', error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les commissions avec infos vendeurs
   * GET /admin/vendors/commissions
   */
  async getAllVendorCommissions(): Promise<VendorCommissionData[]> {
    try {
      const { data } = await this.api.get<CommissionResponse>(`/admin/vendors/commissions`);
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des commissions');
      }
      return data.data || [];
    } catch (error: any) {
      if (error?.response) {
        const resp: Response = error.response;
        await this.handleApiErrorResponse(resp);
      }
      console.error('❌ Erreur getAllVendorCommissions:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques globales des commissions
   * GET /admin/commission-stats
   */
  async getCommissionStats(): Promise<CommissionStats> {
    try {
      const { data } = await this.api.get<CommissionResponse>(`/admin/commission-stats`);
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
      }
      return data.data;
    } catch (error: any) {
      if (error?.response) {
        const resp: Response = error.response;
        await this.handleApiErrorResponse(resp);
      }
      console.error('❌ Erreur getCommissionStats:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des changements de commission d'un vendeur
   * GET /admin/vendors/:id/commission/history
   */
  async getVendorCommissionHistory(vendorId: number): Promise<CommissionHistoryEntry[]> {
    try {
      const { data } = await this.api.get<CommissionResponse>(`/admin/vendors/${vendorId}/commission/history`);
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération de l\'historique');
      }
      return data.data || [];
    } catch (error: any) {
      if (error?.response) {
        const resp: Response = error.response;
        await this.handleApiErrorResponse(resp);
      }
      console.error('❌ Erreur getVendorCommissionHistory:', error);
      throw error;
    }
  }

  /**
   * Calculer la répartition des revenus pour preview
   * Calcul côté frontend basé sur la logique backend
   */
  calculateRevenueSplit(totalAmount: number, commissionRate: number) {
    const commission = Math.round((totalAmount * commissionRate) / 100);
    const vendorRevenue = totalAmount - commission;
    
    return {
      totalAmount,
      commissionRate,
      commissionAmount: commission,
      vendorRevenue,
      // Formatage FCFA
      formatted: {
        total: this.formatCFA(totalAmount),
        commission: this.formatCFA(commission),
        vendor: this.formatCFA(vendorRevenue),
      }
    };
  }

  /**
   * Formater un montant en FCFA (compatible backend)
   */
  formatCFA(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  /**
   * Valider un taux de commission (compatible backend)
   */
  validateCommissionRate(rate: number): boolean {
    return typeof rate === 'number' && 
           rate >= 0 && 
           rate <= 100 && 
           !isNaN(rate);
  }
}

// Singleton pour utilisation dans toute l'app
export const commissionService = new CommissionService();
export default commissionService;