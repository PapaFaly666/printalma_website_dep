import { API_CONFIG } from '../config/api';

/**
 * Service hybride d'authentification pour corriger le probleme 401
 * Utilise les cookies par defaut, puis fallback vers le header Authorization
 */
export class HybridAuthService {
  private token: string | null = null;

  constructor() {
    // Recuperer le token depuis localStorage si disponible
    this.loadTokenFromStorage();
  }

  /**
   * Charge le token depuis localStorage (fallback)
   */
  public loadTokenFromStorage(): void {
    try {
      const authSession = localStorage.getItem('auth_session');
      console.log('🔍 Recherche du token dans localStorage...', authSession ? 'session trouvee' : 'aucune session');

      if (authSession) {
        const data = JSON.parse(authSession);
        console.log('📦 Donnees de session parsees:', {
          hasToken: !!data.token,
          hasJwt: !!data.jwt,
          hasUser: !!data.user,
          isAuthenticated: data.isAuthenticated
        });

        if (data.token || data.jwt) {
          this.token = data.token || data.jwt;
          console.log('🔑 Token charge depuis localStorage:', this.token ? `${this.token.substring(0, 20)}...` : 'vide');
        } else {
          console.info('ℹ️ Aucun token JWT dans la session localStorage - authentification par cookies HTTP');
          console.log('🍪 Mode authentification: Cookies HTTP-only (securise)');
        }
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger le token depuis localStorage:', error);
    }
  }

  /**
   * Sauvegarde le token dans localStorage pour le fallback
   */
  private saveTokenToStorage(token: string): void {
    try {
      const authSession = localStorage.getItem('auth_session');
      const existingData = authSession ? JSON.parse(authSession) : {};
      existingData.token = token;
      existingData.timestamp = Date.now();
      localStorage.setItem('auth_session', JSON.stringify(existingData));
      console.log('💾 Token sauvegarde dans localStorage');
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le token dans localStorage:', error);
    }
  }

  /**
   * prepare les headers pour une requete avec authentification hybride
   */
  public getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    // Ajouter le header Authorization si on a un token
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('🔒 Utilisation du header Authorization (fallback)');
    }

    return headers;
  }

  /**
   * Effectue une requete avec authentification hybride
   * Essaie d'abord avec les cookies, puis avec le header Authorization si 401
   */
  public async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    console.log('🔄 Requete authentifiee hybride vers:', url);
    console.log('🔑 Token disponible:', !!this.token);

    // Premiere tentative: avec cookies uniquement (comportement existant)
    try {
      console.log('🍪 Tentative n°1: Authentification par cookies');
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      console.log('📡 Reponse tentative n°1:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      // Extraire le token de la reponse si succes
      if (response.ok) {
        return response;
      }

      // Si erreur 401, essayer avec le header Authorization
      if (response.status === 401) {
        console.log('🚨 Erreur 401 detectee');

        if (this.token) {
          console.log('🔑 Token disponible, tentative avec Authorization header');
          console.log('🔑 Token utilise:', this.token.substring(0, 20) + '...');

          // Deuxieme tentative: avec Authorization header
          const authResponse = await fetch(url, {
            ...options,
            credentials: 'include', // Garder les cookies au cas ou
            headers: this.getAuthHeaders(options.headers as Record<string, string>)
          });

          console.log('📡 Reponse tentative n°2:', {
            status: authResponse.status,
            ok: authResponse.ok,
            statusText: authResponse.statusText
          });

          if (authResponse.ok) {
            console.log('✅ Succes avec Authorization header!');
            return authResponse;
          } else {
            console.log('❌ Echec meme avec Authorization header');

            // Essayer d'obtenir plus de details sur l'erreur
            try {
              const errorData = await authResponse.json();
              console.log('📄 Details erreur:', errorData);
            } catch (e) {
              console.log('📄 Impossible de parser l\'erreur');
            }
          }
        } else {
          console.log('❌ Aucun token disponible pour le fallback');
        }

        // Retourner la reponse 401 si le fallback n'a pas fonctionne
        return response;
      }

      // Autre erreur que 401, retourner la reponse originale
      return response;

    } catch (error) {
      console.error('❌ Erreur reseau lors de la requete authentifiee:', error);

      // En cas d'erreur reseau, essayer avec le token si disponible
      if (this.token) {
        console.log('🔑 Erreur reseau, tentative avec Authorization header');
        try {
          const fallbackResponse = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: this.getAuthHeaders(options.headers as Record<string, string>)
          });

          if (fallbackResponse.ok) {
            console.log('✅ Succes fallback avec Authorization header');
            return fallbackResponse;
          }
        } catch (fallbackError) {
          console.error('❌ Echec du fallback:', fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Definit manuellement le token (utile apres login)
   */
  public setToken(token: string): void {
    this.token = token;
    this.saveTokenToStorage(token);
    console.log('🔑 Token defini manuellement');
  }

  /**
   * Supprime le token stocke
   */
  public clearToken(): void {
    this.token = null;
    try {
      const authSession = localStorage.getItem('auth_session');
      if (authSession) {
        const data = JSON.parse(authSession);
        delete data.token;
        delete data.jwt;
        localStorage.setItem('auth_session', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('⚠️ Impossible de nettoyer le token:', error);
    }
    console.log('🗑️ Token supprime');
  }

  /**
   * Verifie si on a un token disponible
   */
  public hasToken(): boolean {
    return !!this.token;
  }

  /**
   * Recupere le token actuel
   */
  public getToken(): string | null {
    return this.token;
  }
}

// Exporter une instance singleton
export const hybridAuthService = new HybridAuthService();