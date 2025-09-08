import { API_CONFIG } from '../config/api';

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
  private baseUrl = `${API_CONFIG.BASE_URL}/admin`;

  /**
   * Obtenir le token d'authentification
   */
  private getAuthToken(): string {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token d\'authentification requis');
    }
    return token;
  }

  /**
   * Headers par défaut pour les requêtes API
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`,
    };
  }

  /**
   * Gestion centralisée des erreurs API
   */
  private async handleApiError(response: Response): Promise<never> {
    let errorMessage = 'Erreur lors de la communication avec le serveur';
    
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
            errorMessage = 'Accès non autorisé - Permissions administrateur requises';
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
      // Si la réponse n'est pas du JSON, utiliser le message par défaut
      if (response.status === 401) {
        errorMessage = 'Session expirée - Veuillez vous reconnecter';
      } else if (response.status === 403) {
        errorMessage = 'Accès interdit - Permissions insuffisantes';
      } else if (response.status === 404) {
        errorMessage = 'Ressource introuvable';
      } else if (response.status >= 500) {
        errorMessage = 'Erreur serveur - Veuillez réessayer plus tard';
      }
    }

    throw new Error(errorMessage);
  }

  /**
   * Mettre à jour la commission d'un vendeur
   * PUT /admin/vendors/:id/commission
   */
  async updateVendorCommission(vendorId: number, commissionRate: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vendors/${vendorId}/commission`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ commissionRate }),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data: CommissionResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour de la commission');
      }

      console.log('✅ Commission mise à jour:', data.message);
    } catch (error) {
      console.error('❌ Erreur updateVendorCommission:', error);
      throw error;
    }
  }

  /**
   * Obtenir la commission d'un vendeur spécifique
   * GET /admin/vendors/:id/commission
   */
  async getVendorCommission(vendorId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/vendors/${vendorId}/commission`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data: CommissionResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération de la commission');
      }

      return data.data;
    } catch (error) {
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
      const response = await fetch(`${this.baseUrl}/vendors/commissions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data: CommissionResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des commissions');
      }

      return data.data || [];
    } catch (error) {
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
      const response = await fetch(`${this.baseUrl}/commission-stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data: CommissionResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques');
      }

      return data.data;
    } catch (error) {
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
      const response = await fetch(`${this.baseUrl}/vendors/${vendorId}/commission/history`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data: CommissionResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération de l\'historique');
      }

      return data.data || [];
    } catch (error) {
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