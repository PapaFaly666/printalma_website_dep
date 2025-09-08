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
   * Méthode CORRIGÉE pour récupérer le token - Compatible avec fixe.md
   */
  private getAuthToken(): string {
    // Option 1: Token direct dans localStorage (variations courantes)
    let token = localStorage.getItem('adminToken') || 
                localStorage.getItem('authToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('accessToken');

    // Option 1-bis: Session sérialisée (ex: auth_session)
    if (!token) {
      const authSession = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session');
      const extracted = this.tryExtractTokenFromAuthSession(authSession);
      if (extracted) token = extracted;
    }
    
    // Option 2: Token dans sessionStorage
    if (!token) {
      token = sessionStorage.getItem('adminToken') || 
              sessionStorage.getItem('authToken') ||
              sessionStorage.getItem('token') ||
              sessionStorage.getItem('accessToken');
    }

    // Option 3: Token dans un cookie (si vous utilisez des cookies)
    if (!token) {
      token = this.getCookieValue('adminToken') || 
              this.getCookieValue('authToken') ||
              this.getCookieValue('token') ||
              this.getCookieValue('accessToken') ||
              // Variations NextAuth / session custom
              this.getCookieValue('auth_session') ||
              this.getCookieValue('next-auth.session-token') ||
              this.getCookieValue('__Secure-next-auth.session-token');

      // Si cookie auth_session est JSON, tenter d'extraire
      if (!token) {
        const rawSession = this.getCookieValue('auth_session');
        const extracted = this.tryExtractTokenFromAuthSession(rawSession);
        if (extracted) token = extracted;
      }
    }

    // Option 4: Token depuis un store global (Redux/Zustand/etc.)
    if (!token && (window as any).store) {
      const state = (window as any).store.getState();
      token = state?.auth?.token || state?.user?.token || state?.auth?.accessToken;
    }

    // Option 5: Token depuis React Context (si accessible globalement)
    if (!token && (window as any).authContext) {
      token = (window as any).authContext.token;
    }

    if (!token) {
      console.warn('🚨 Aucun token d\'authentification trouvé');
      console.log('🔍 Recherche effectuée dans:', {
        localStorage: Object.keys(localStorage).filter(key => key.includes('token') || key.includes('auth')),
        sessionStorage: Object.keys(sessionStorage).filter(key => key.includes('token') || key.includes('auth')),
        cookies: document.cookie
      });
      throw new Error('Token d\'authentification requis');
    }

    // Vérifier si le token n'est pas expiré (optionnel)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('🚨 Token expiré:', new Date(payload.exp * 1000));
        throw new Error('Session expirée - Veuillez vous reconnecter');
      }
      
      // Vérifier le rôle admin
      if (payload.role && !['ADMIN', 'SUPERADMIN'].includes(payload.role)) {
        console.warn('🚨 Permissions insuffisantes:', payload.role);
        throw new Error('Permissions administrateur requises');
      }

      console.log('✅ Token valide trouvé pour:', payload.role || 'utilisateur');
    } catch (e) {
      if (e instanceof Error && (e.message.includes('Session expirée') || e.message.includes('Permissions'))) {
        throw e; // Re-lancer les erreurs importantes
      }
      console.warn('⚠️ Impossible de valider le token JWT:', e);
      // Continuer avec le token même si la validation échoue (token peut-être dans un autre format)
    }

    return token;
  }

  /**
   * Tente d'extraire un token utilisable à partir d'une session sérialisée
   * ex: valeur de `auth_session` dans le storage/cookies.
   */
  private tryExtractTokenFromAuthSession(raw: string | null | undefined): string | null {
    if (!raw) return null;
    // Si la chaîne ressemble déjà à un JWT (xxx.yyy.zzz)
    if (raw.split('.').length === 3) {
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      // Essayer différentes propriétés courantes
      const direct = parsed?.token || parsed?.jwt || parsed?.accessToken || parsed?.authToken || parsed?.sessionToken;
      if (typeof direct === 'string') return direct;
      // Structures imbriquées fréquentes
      const nested = parsed?.user?.token || parsed?.user?.accessToken || parsed?.data?.accessToken || parsed?.data?.token;
      if (typeof nested === 'string') return nested;
      // Certains stockent la session sous { value: '{"accessToken":"..."}' }
      if (typeof parsed?.value === 'string') {
        return this.tryExtractTokenFromAuthSession(parsed.value);
      }
    } catch {
      // Non JSON, rien à faire
    }
    return null;
  }

  /**
   * Utilitaire pour lire les cookies
   */
  private getCookieValue(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  }

  /**
   * Gestion des erreurs d'authentification
   */
  private handleAuthError(): void {
    console.warn('🚨 Erreur d\'authentification - nettoyage et redirection');
    
    // Nettoyer tous les tokens potentiels
    const tokenKeys = ['adminToken', 'authToken', 'token', 'accessToken'];
    tokenKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Nettoyer les cookies (si possible)
    document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Rediriger vers la page de login (seulement si pas déjà sur la page de login)
    if (window.location.pathname !== '/login' && !window.location.pathname.includes('auth')) {
      console.log('🔄 Redirection vers login...');
      window.location.href = '/login';
    }
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
   * Gestion centralisée des erreurs API - CORRIGÉE avec authentification
   */
  private async handleApiError(response: Response): Promise<never> {
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