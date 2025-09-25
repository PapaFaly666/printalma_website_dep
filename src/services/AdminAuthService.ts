// Service d'authentification pour les administrateurs
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data?: {
    admin: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
    token?: string; // Pour debug - pas utilisé avec les cookies HTTP
  };
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export class AdminAuthService {
  private baseUrl = '/api';

  /**
   * Connexion admin avec email/password
   */
  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    console.log('🔑 Tentative de connexion admin pour:', credentials.email);

    try {
      const response = await fetch(`${this.baseUrl}/admin/login`, {
        method: 'POST',
        credentials: 'include', // Important pour recevoir les cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📦 Login response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('🔥 Erreur lors de la connexion admin:', error);
      throw error;
    }
  }

  /**
   * Déconnexion admin
   */
  async logout(): Promise<void> {
    console.log('🚪 Déconnexion admin...');

    try {
      const response = await fetch(`${this.baseUrl}/admin/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Logout response status:', response.status);

      if (!response.ok && response.status !== 401) {
        // 401 peut être normal si déjà déconnecté
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Déconnexion admin réussie');
    } catch (error) {
      console.error('🔥 Erreur lors de la déconnexion admin:', error);
      throw error;
    }
  }

  /**
   * Vérifier si l'admin est connecté
   */
  async checkAuthStatus(): Promise<AdminUser | null> {
    console.log('🔍 Vérification du statut d\'authentification admin...');

    try {
      const response = await fetch(`${this.baseUrl}/admin/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Auth check response status:', response.status);

      if (response.status === 401) {
        console.log('🔐 Admin non authentifié');
        return null;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('👤 Admin authentifié:', data);

      // Structure attendue: { success: true, data: { admin: {...} } }
      if (data.success && data.data?.admin) {
        return data.data.admin;
      }

      // Structure alternative directe
      if (data.id && data.email) {
        return data;
      }

      throw new Error('Format de réponse inattendu pour les données admin');

    } catch (error) {
      console.error('🔥 Erreur lors de la vérification auth admin:', error);
      return null;
    }
  }

  /**
   * Récupérer les informations de l'admin connecté
   */
  async getCurrentAdmin(): Promise<AdminUser> {
    const admin = await this.checkAuthStatus();
    if (!admin) {
      throw new Error('Admin non authentifié');
    }
    return admin;
  }
}

// Instance singleton
export const adminAuthService = new AdminAuthService();