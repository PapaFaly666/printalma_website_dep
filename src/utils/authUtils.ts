// Utilitaires pour la gestion de l'authentification et des tokens JWT

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export class AuthManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';
  private static readonly USER_TOKEN_KEY = 'userToken';

  // Stocker les tokens d'authentification
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);

    if (tokens.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    if (tokens.expiresIn) {
      const expiryTime = Date.now() + (tokens.expiresIn * 1000);
      localStorage.setItem('token_expiry', expiryTime.toString());
    }
  }

  // Obtenir le token d'accès
  static getAccessToken(): string | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY) ||
                  localStorage.getItem(this.USER_TOKEN_KEY);

    // Vérifier si le token n'est pas expiré
    if (token && this.isTokenExpired()) {
      this.clearTokens();
      return null;
    }

    return token;
  }

  // Obtenir le token de rafraîchissement
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Stocker les informations utilisateur
  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Obtenir les informations utilisateur
  static getUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture des informations utilisateur:', error);
    }
    return null;
  }

  // Vérifier si l'utilisateur est authentifié
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Vérifier si le token est expiré
  static isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem('token_expiry');
    if (expiryTime) {
      return Date.now() > parseInt(expiryTime, 10);
    }
    return false;
  }

  // Vérifier si le token est proche de l'expiration (dans les 5 prochaines minutes)
  static isTokenExpiringSoon(): boolean {
    const expiryTime = localStorage.getItem('token_expiry');
    if (expiryTime) {
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes en millisecondes
      return Date.now() > (parseInt(expiryTime, 10) - fiveMinutes);
    }
    return false;
  }

  // Décoder le token JWT (sans vérification de signature)
  static decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  // Obtenir les informations depuis le token JWT
  static getTokenInfo(): any {
    const token = this.getAccessToken();
    if (token) {
      return this.decodeToken(token);
    }
    return null;
  }

  // Obtenir le rôle de l'utilisateur
  static getUserRole(): string | null {
    const user = this.getUser();
    const tokenInfo = this.getTokenInfo();

    return user?.role || tokenInfo?.role || null;
  }

  // Vérifier si l'utilisateur est admin
  static isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'ADMIN' || role === 'admin';
  }

  // Vérifier si l'utilisateur est vendeur
  static isVendor(): boolean {
    const role = this.getUserRole();
    return role === 'VENDEUR' || role === 'vendor' || role === 'VENDOR';
  }

  // Vérifier si l'utilisateur est client
  static isCustomer(): boolean {
    const role = this.getUserRole();
    return role === 'CLIENT' || role === 'client' || role === 'CUSTOMER';
  }

  // Vérifier si l'email de l'utilisateur est vérifié
  static isEmailVerified(): boolean {
    const user = this.getUser();
    const tokenInfo = this.getTokenInfo();

    return user?.isVerified || tokenInfo?.isVerified || false;
  }

  // Rafraîchir le token (à implémenter avec l'API)
  static async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      // Appel à l'API de rafraîchissement
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data);
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
    }

    return false;
  }

  // Effacer tous les tokens et informations utilisateur
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem('token_expiry');
  }

  // Effacer uniquement les tokens (garder les infos utilisateur)
  static clearAuthTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem('token_expiry');
  }

  // Préparer les en-têtes d'authentification pour les requêtes API
  static getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Obtenir les informations complètes pour les requêtes API
  static getAuthContext(): {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    headers: HeadersInit;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      token: this.getAccessToken(),
      user: this.getUser(),
      headers: this.getAuthHeaders()
    };
  }

  // Initialiser l'authentification depuis les paramètres URL (pour OAuth/callbacks)
  static initializeFromUrlParams(params: URLSearchParams): boolean {
    const accessToken = params.get('accessToken') || params.get('token');
    const refreshToken = params.get('refreshToken');
    const expiresIn = params.get('expiresIn');

    if (accessToken) {
      this.setTokens({
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresIn: expiresIn ? parseInt(expiresIn, 10) : undefined
      });
      return true;
    }

    return false;
  }

  // Gérer la déconnexion
  static logout(): void {
    // Appeler l'API de déconnexion si nécessaire
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: this.getAuthHeaders()
    }).catch(() => {
      // Ignorer les erreurs lors de la déconnexion
    });

    // Effacer les données locales
    this.clearTokens();

    // Rediriger vers la page de connexion
    window.location.href = '/login';
  }
}

// Fonctions utilitaires pour faciliter l'utilisation
export const getToken = () => AuthManager.getAccessToken();
export const getUser = () => AuthManager.getUser();
export const isAuthenticated = () => AuthManager.isAuthenticated();
export const isAdmin = () => AuthManager.isAdmin();
export const isVendor = () => AuthManager.isVendor();
export const isCustomer = () => AuthManager.isCustomer();
export const getAuthHeaders = () => AuthManager.getAuthHeaders();
export const logout = () => AuthManager.logout();

export default AuthManager;