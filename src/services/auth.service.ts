import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../config/api';
import {
  LoginRequest,
  LoginResponse,
  AuthCheckResponse,
  ChangePasswordRequest,
  CreateClientRequest,
  CreateClientResponse,
  ListClientsQuery,
  ListClientsResponse,
  ToggleClientStatusResponse,
  VendorsListResponse,
  VendorsStatsResponse,
  User,
  ApiError,
  ExtendedVendorProfileResponse,
  UpdateVendorProfileRequest,
  UpdateVendorProfileResponse,
  VendorStatsByCountryResponse
} from '../types/auth.types';

class AuthService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    // Préparer les headers par défaut seulement si ce n'est pas FormData
    const isFormData = options.body instanceof FormData;
    const defaultHeaders = isFormData ? {} : API_CONFIG.HEADERS;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Requête vers: ${this.baseUrl}${endpoint}`);
        console.log('📝 Options:', { 
          credentials: 'include', 
          method: options.method || 'GET',
          headers: { ...defaultHeaders, ...options.headers }
        });
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          credentials: 'include', // ⭐ Toujours inclure les cookies
          headers: {
            ...defaultHeaders,
            ...options.headers
          }
        });
        
        console.log(`📡 Réponse de ${endpoint}:`, {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });

        if (!response.ok) {
          const error: ApiError = await response.json().catch(() => ({
            statusCode: response.status,
            message: this.getErrorMessage(response.status)
          }));
          throw error;
        }

        return response.json();
      } catch (error) {
        // Si c'est la dernière tentative ou si c'est une erreur non-réseau, on lance l'erreur
        if (attempt === retries || (error as any)?.statusCode) {
          throw error;
        }
        
        // Attendre un peu avant de réessayer (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
    
    throw new Error('Toutes les tentatives de requête ont échoué');
  }

  private getErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case 401: return ERROR_MESSAGES.UNAUTHORIZED;
      case 403: return ERROR_MESSAGES.FORBIDDEN;
      case 404: return ERROR_MESSAGES.NOT_FOUND;
      case 409: return ERROR_MESSAGES.CONFLICT;
      case 422: return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500: return ERROR_MESSAGES.SERVER_ERROR;
      default: return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  /**
   * Connexion utilisateur avec gestion du changement de mot de passe obligatoire
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // 🆕 Sauvegarder les données utilisateur complètes en localStorage
    if ('user' in response && response.user) {
      const authData = {
        timestamp: Date.now(),
        user: response.user,
        isAuthenticated: true
      };
      localStorage.setItem('auth_session', JSON.stringify(authData));
      console.log('💾 Session utilisateur sauvegardée en localStorage');
    }
    
    return response;
  }

  /**
   * Déconnexion - supprime automatiquement les cookies
   */
  async logout(): Promise<{ message: string }> {
    try {
      console.log('🔄 Tentative de déconnexion...');
      
      const response = await this.request<{ message: string }>(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST'
      });
      
      // 🆕 Nettoyer la session localStorage
      localStorage.removeItem('auth_session');
      localStorage.removeItem('auth_fallback');
      console.log('🗑️ Session utilisateur supprimée du localStorage');
      
      console.log('✅ Déconnexion réussie côté serveur:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion côté serveur:', error);
      
      // Même en cas d'erreur serveur, on tente de supprimer manuellement les cookies
      // (au cas où le problème vient du backend)
      try {
        // Tentative de suppression manuelle des cookies côté client
        // Note: Cela ne fonctionne que pour les cookies non-httpOnly
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        console.log('🧹 Tentative de nettoyage manuel des cookies');
      } catch (cookieError) {
        console.warn('⚠️ Impossible de nettoyer manuellement les cookies:', cookieError);
      }
      
      // 🆕 Nettoyer la session localStorage même en cas d'erreur
      localStorage.removeItem('auth_session');
      localStorage.removeItem('auth_fallback');
      console.log('🗑️ Session utilisateur supprimée du localStorage (mode erreur)');
      
      
      // Retourner un message même en cas d'erreur
      return { message: 'Déconnexion effectuée localement (erreur serveur)' };
    }
  }

  /**
   * 🆕 Récupérer la session utilisateur depuis localStorage
   */
  getStoredSession(): { isAuthenticated: boolean; user: any | null } {
    console.log('🔍 Vérification de la session localStorage...');
    
    try {
      const stored = localStorage.getItem('auth_session');
      console.log('📦 Données brutes localStorage:', stored);
      
      if (!stored) {
        console.log('📭 Aucune session stockée trouvée');
        return { isAuthenticated: false, user: null };
      }
      
      const data = JSON.parse(stored);
      console.log('🔄 Données parsées:', data);
      
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
      const age = now - data.timestamp;
      
      console.log(`⏰ Âge de la session: ${Math.round(age / 1000)} secondes (max: ${Math.round(maxAge / 1000)} secondes)`);
      
      if (age > maxAge) {
        console.log('⏰ Session stockée expirée, suppression...');
        localStorage.removeItem('auth_session');
        return { isAuthenticated: false, user: null };
      }
      
      console.log('✅ Session stockée valide trouvée:', data.user);
      console.log('📊 Retour:', { isAuthenticated: data.isAuthenticated, user: data.user });
      return { isAuthenticated: data.isAuthenticated, user: data.user };
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération de la session stockée:', error);
      localStorage.removeItem('auth_session');
      return { isAuthenticated: false, user: null };
    }
  }

  /**
   * Vérification de l'authentification - idéal pour la vérification au chargement
   */
  async checkAuth(): Promise<AuthCheckResponse> {
    return this.request<AuthCheckResponse>(API_ENDPOINTS.AUTH.CHECK);
  }

  /**
   * Changement de mot de passe (pour premier changement obligatoire ou changement volontaire)
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  /**
   * 🆕 NOUVEAU - Changement de mot de passe forcé (pour utilisateurs non authentifiés)
   * Utilisé quand must_change_password = true après login
   */
  async forceChangePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.AUTH.FORCE_CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ 
        userId, 
        currentPassword, 
        newPassword, 
        confirmPassword 
      })
    });
  }

  /**
   * Récupération du profil utilisateur complet
   */
  async getProfile(): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.PROFILE);
  }

  /**
   * Création d'un client (admin uniquement)
   */
  async createClient(clientData: CreateClientRequest): Promise<CreateClientResponse> {
    // Créer FormData pour gérer l'upload de fichier
    const formData = new FormData();
    
    // Ajouter les champs texte
    formData.append('firstName', clientData.firstName);
    formData.append('lastName', clientData.lastName);
    formData.append('email', clientData.email);
    formData.append('vendeur_type', clientData.vendeur_type);
    
    // Ajouter les champs optionnels s'ils existent
    if (clientData.phone) {
      formData.append('phone', clientData.phone);
    }
    if (clientData.country) {
      formData.append('country', clientData.country);
    }
    if (clientData.address) {
      formData.append('address', clientData.address);
    }
    if (clientData.shopName) {
      formData.append('shop_name', clientData.shopName);
    }
    
    // Ajouter la photo de profil si elle existe
    if (clientData.profilePhoto) {
      formData.append('profilePhoto', clientData.profilePhoto);
    }

    return this.request<CreateClientResponse>(API_ENDPOINTS.ADMIN.CREATE_VENDOR_EXTENDED, {
      method: 'POST',
      body: formData,
      // Ne pas définir Content-Type pour FormData - le navigateur le fera automatiquement
      headers: {}
    });
  }

  // ========== ENDPOINTS DISPONIBLES SELON LA DOCUMENTATION ==========

  /**
   * Listing des clients avec filtres et pagination (admin uniquement)
   */
  async listClients(filters: ListClientsQuery = {}): Promise<ListClientsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return this.request<ListClientsResponse>(`${API_ENDPOINTS.ADMIN.LIST_CLIENTS}?${params}`);
  }

  /**
   * Activer/Désactiver un client (admin uniquement)
   */
  async toggleClientStatus(clientId: number): Promise<ToggleClientStatusResponse> {
    return this.request<ToggleClientStatusResponse>(API_ENDPOINTS.ADMIN.TOGGLE_CLIENT_STATUS(clientId), {
      method: 'PUT'
    });
  }

  // ========== NOUVEAUX ENDPOINTS VENDEURS ==========

  /**
   * Récupérer la liste des vendeurs actifs (utilisateur authentifié)
   */
  async listVendors(): Promise<VendorsListResponse> {
    return this.request<VendorsListResponse>(API_ENDPOINTS.AUTH.VENDORS);
  }

  /**
   * Récupérer les statistiques des vendeurs (utilisateur authentifié)
   */
  async getVendorsStats(): Promise<VendorsStatsResponse> {
    return this.request<VendorsStatsResponse>(API_ENDPOINTS.AUTH.VENDORS_STATS);
  }

  // ========== 🆕 NOUVEAUX ENDPOINTS PROFIL VENDEUR ÉTENDU ==========

  /**
   * Récupérer le profil vendeur étendu (vendeur connecté)
   */
  async getExtendedVendorProfile(): Promise<ExtendedVendorProfileResponse> {
    return this.request<ExtendedVendorProfileResponse>(API_ENDPOINTS.AUTH.VENDOR_PROFILE);
  }

  /**
   * Mettre à jour le profil vendeur étendu (vendeur connecté)
   */
  async updateVendorProfile(updateData: UpdateVendorProfileRequest): Promise<UpdateVendorProfileResponse> {
    const formData = new FormData();
    
    // Ajouter les champs optionnels s'ils existent
    if (updateData.phone) {
      formData.append('phone', updateData.phone);
    }
    if (updateData.country) {
      formData.append('country', updateData.country);
    }
    if (updateData.address) {
      formData.append('address', updateData.address);
    }
    if (updateData.shop_name) {
      formData.append('shop_name', updateData.shop_name);
    }
    
    // Ajouter la nouvelle photo si elle existe
    if (updateData.profilePhoto) {
      formData.append('profilePhoto', updateData.profilePhoto);
    }

    return this.request<UpdateVendorProfileResponse>(API_ENDPOINTS.AUTH.UPDATE_VENDOR_PROFILE, {
      method: 'PUT',
      body: formData,
      headers: {}
    });
  }

  /**
   * Récupérer les statistiques des vendeurs par pays (admin uniquement)
   */
  async getVendorStatsByCountry(): Promise<VendorStatsByCountryResponse> {
    return this.request<VendorStatsByCountryResponse>(API_ENDPOINTS.ADMIN.VENDORS_STATS_BY_COUNTRY);
  }

  // ========== MÉTHODES MOCKÉES (endpoints pas encore implémentés) ==========

  /**
   * Obtenir les statistiques des clients (MOCKÉE - endpoint non implémenté)
   */
  async getClientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    recentLogins: number;
  }> {
    // Simulation de données pour l'interface
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          total: 0,
          active: 0,
          inactive: 0,
          byType: {
            DESIGNER: 0,
            INFLUENCEUR: 0,
            ARTISTE: 0
          },
          recentLogins: 0
        });
      }, 500);
    });
  }

  /**
   * Réinitialiser le mot de passe d'un vendeur (admin uniquement)
   * Envoie un email avec un lien sécurisé de réinitialisation
   */
  async resetVendorPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.ADMIN.RESET_VENDOR_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * 🆕 Débloquer manuellement un compte utilisateur (réservé aux admins)
   * Selon la documentation de sécurité PrintAlma
   */
  async unlockUserAccount(userId: number): Promise<{
    message: string;
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      status: 'unlocked' | 'already_unlocked';
    };
    unlockedAt?: string;
  }> {
    return this.request(`/auth/admin/unlock-account/${userId}`, {
      method: 'PUT'
    });
  }

  /**
   * Débloquer un client verrouillé (MOCKÉE - endpoint non implémenté)
   */
  async unlockClient(clientId: number): Promise<{ message: string }> {
    // TODO: Implémenter côté backend
    throw new Error('Fonctionnalité non encore disponible - endpoint à implémenter côté backend');
  }

  /**
   * Gestion globale des erreurs avec actions automatiques
   */
  handleError(error: ApiError): void {
    switch (error.statusCode) {
      case 401:
        // Token expiré ou invalide - redirection automatique
        console.warn('Session expirée, redirection vers la page de connexion');
        window.location.href = '/login';
        break;
      
      case 403:
        // Permissions insuffisantes
        console.error('Accès refusé:', error.message);
        break;
      
      case 409:
        // Conflit (ex: email déjà existant)
        console.error('Conflit:', error.message);
        break;
      
      case 422:
        // Données de validation invalides
        console.error('Données invalides:', error.message);
        break;
      
      default:
        console.error('Erreur API:', error.message);
    }
  }

  /**
   * Wrapper pour les requêtes avec gestion d'erreur automatique
   */
  async safeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    handleError = true
  ): Promise<T | null> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      if (handleError && this.isApiError(error)) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * Type guard pour vérifier si c'est une erreur API
   */
  private isApiError(error: any): error is ApiError {
    return error && typeof error.statusCode === 'number' && typeof error.message === 'string';
  }

  /**
   * Utilitaire pour vérifier les permissions utilisateur
   */
  hasPermission(user: User | null, requiredRoles: string[]): boolean {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(user: User | null): boolean {
    return this.hasPermission(user, ['ADMIN', 'SUPERADMIN']);
  }

  /**
   * Vérifier si l'utilisateur est super admin
   */
  isSuperAdmin(user: User | null): boolean {
    return this.hasPermission(user, ['SUPERADMIN']);
  }

  /**
   * Vérifier si l'utilisateur est vendeur
   */
  isVendeur(user: User | null): boolean {
    return this.hasPermission(user, ['VENDEUR']);
  }

  /**
   * Obtenir le label du type de vendeur
   */
  getVendorTypeLabel(user: User | null): string {
    if (!user?.vendeur_type) return '';
    
    const labels = {
      'DESIGNER': 'Designer',
      'INFLUENCEUR': 'Influenceur',
      'ARTISTE': 'Artiste'
    };
    return labels[user.vendeur_type as keyof typeof labels] || user.vendeur_type;
  }

  /**
   * Obtenir l'icône du type de vendeur
   */
  getVendorTypeIcon(user: User | null): string {
    if (!user?.vendeur_type) return '👤';
    
    const icons = {
      'DESIGNER': '🎨',
      'INFLUENCEUR': '📱',
      'ARTISTE': '🎭'
    };
    return icons[user.vendeur_type as keyof typeof icons] || '👤';
  }

  // ========== 🆕 UTILITAIRES D'EXTRACTION DE MESSAGES DE SÉCURITÉ ==========

  /**
   * 🔍 Extraire le nombre de tentatives restantes du message d'erreur
   */
  extractRemainingAttempts(errorMessage: string): number | null {
    if (!errorMessage) return null;
    
    const match = errorMessage.match(/Il vous reste (\d+) tentative/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * 🔒 Vérifier si le compte est verrouillé selon le message
   */
  isAccountLocked(errorMessage: string): boolean {
    if (!errorMessage) return false;
    return errorMessage.includes('verrouillé') || 
           errorMessage.includes('Temps restant') ||
           errorMessage.includes('temporairement verrouillé');
  }

  /**
   * ⏰ Extraire le temps de verrouillage du message
   */
  extractLockTime(errorMessage: string): string | null {
    if (!errorMessage) return null;
    
    const timeMatch = errorMessage.match(/Temps restant\s*:\s*(.+)/);
    return timeMatch ? timeMatch[1].trim() : null;
  }

  /**
   * ⚠️ Vérifier si c'est la dernière tentative avant verrouillage
   */
  isLastAttempt(errorMessage: string): boolean {
    if (!errorMessage) return false;
    return errorMessage.includes('Dernière tentative') ||
           errorMessage.includes('dernière tentative');
  }

  /**
   * 🛡️ Détecter si le message concerne une protection SUPERADMIN
   */
  isSuperAdminProtection(errorMessage: string): boolean {
    if (!errorMessage) return false;
    return errorMessage.includes('Impossible de modifier le statut') ||
           errorMessage.includes('SUPERADMIN') ||
           errorMessage.includes('protection spéciale');
  }

  /**
   * 🎨 Déterminer le type d'alerte selon le message d'erreur
   */
  getSecurityAlertType(errorMessage: string): 'warning' | 'critical' | 'locked' | 'superadmin' | 'error' {
    if (!errorMessage) return 'error';
    
    if (this.extractRemainingAttempts(errorMessage) !== null) {
      const remaining = this.extractRemainingAttempts(errorMessage);
      if (remaining === 1) return 'critical'; // Dernière tentative
      return 'warning'; // Tentatives restantes
    }
    
    if (this.isAccountLocked(errorMessage)) {
      return 'locked'; // Compte verrouillé
    }
    
    if (this.isSuperAdminProtection(errorMessage)) {
      return 'superadmin'; // Protection SUPERADMIN
    }
    
    return 'error'; // Erreur générique
  }

  /**
   * 📊 Analyser complètement un message d'erreur de sécurité
   */
  analyzeSecurityError(errorMessage: string): {
    message: string;
    type: 'warning' | 'critical' | 'locked' | 'superadmin' | 'error';
    remainingAttempts: number | null;
    isLocked: boolean;
    lockTime: string | null;
    isLastAttempt: boolean;
    isSuperAdminProtection: boolean;
    formattedLockTime?: string;
  } {
    const analysis = {
      message: errorMessage || '',
      type: this.getSecurityAlertType(errorMessage),
      remainingAttempts: this.extractRemainingAttempts(errorMessage),
      isLocked: this.isAccountLocked(errorMessage),
      lockTime: this.extractLockTime(errorMessage),
      isLastAttempt: this.isLastAttempt(errorMessage),
      isSuperAdminProtection: this.isSuperAdminProtection(errorMessage),
      formattedLockTime: undefined as string | undefined
    };

    // Formatter le temps de verrouillage avec icône
    if (analysis.lockTime) {
      analysis.formattedLockTime = `🕒 Temps restant : ${analysis.lockTime}`;
    }

    return analysis;
  }

  /**
   * 🎭 Obtenir l'icône appropriée selon le type d'alerte de sécurité
   */
  getSecurityAlertIcon(type: 'warning' | 'critical' | 'locked' | 'superadmin' | 'error'): string {
    const icons = {
      warning: '⚠️',
      critical: '🚨',
      locked: '🔒',
      superadmin: '🛡️',
      error: '❌'
    };
    return icons[type] || '❌';
  }

  /**
   * 🌈 Obtenir les classes CSS pour le type d'alerte
   */
  getSecurityAlertClasses(type: 'warning' | 'critical' | 'locked' | 'superadmin' | 'error'): string {
    const classes = {
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      critical: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      locked: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
      superadmin: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      error: ''
    };
    return classes[type] || '';
  }

  /**
   * Inscription d'un vendeur (public)
   */
  async registerVendor(vendorData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    vendeur_type: string;
  }): Promise<{ ok: boolean; message: string }> {
    try {
      const data = await this.request<{ message: string }>(API_ENDPOINTS.AUTH.REGISTER_VENDOR, {
        method: 'POST',
        body: JSON.stringify(vendorData)
      });
      return { ok: true, message: data.message };
    } catch (error: any) {
      const msg = error?.message || 'Erreur inconnue';
      return { ok: false, message: msg };
    }
  }
} 

// Instance singleton du service d'authentification
export const authService = new AuthService();
export default authService; 