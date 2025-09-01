/**
 * Utilitaires pour la gestion des cookies
 * Aide à déboguer les problèmes de déconnexion avec cookies HTTP
 */

export class CookieUtils {
  
  /**
   * Affiche tous les cookies actuels (pour débogage)
   */
  static debugCookies() {
    const cookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value };
    }).filter(cookie => cookie.name && cookie.value);
    
    console.log('🍪 Cookies actuels:', cookies);
    return cookies;
  }
  
  /**
   * Tente de supprimer tous les cookies visibles côté client
   * Note: Ne peut pas supprimer les cookies httpOnly
   */
  static clearAllClientCookies() {
    try {
      const cookies = document.cookie.split(";");
      
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        
        // Supprimer pour différents chemins et domaines
        const domains = [
          '', 
          '.localhost', 
          'localhost',
          window.location.hostname
        ];
        
        const paths = ['/', '/auth', '/vendeur', '/admin'];
        
        for (const domain of domains) {
          for (const path of paths) {
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          }
        }
      }
      
      console.log('🧹 Tentative de suppression de tous les cookies côté client');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des cookies:', error);
      return false;
    }
  }
  
  /**
   * Vérifie si des cookies de session persistent
   */
  static checkSessionCookies() {
    const sessionCookies = [
      'access_token',
      'refresh_token', 
      'session',
      'sessionid',
      'auth_token',
      'jwt',
      'token'
    ];
    
    const foundCookies = sessionCookies.filter(cookieName => 
      document.cookie.includes(`${cookieName}=`)
    );
    
    if (foundCookies.length > 0) {
      console.warn('⚠️ Cookies de session détectés après déconnexion:', foundCookies);
      return foundCookies;
    } else {
      console.log('✅ Aucun cookie de session détecté');
      return [];
    }
  }
  
  /**
   * Test de connectivité avec le backend pour vérifier l'état des cookies
   */
  static async testBackendConnection(baseUrl: string = 'https://printalma-back-dep.onrender.com') {
    try {
      console.log('🔄 Test de connectivité backend...');
      
      const response = await fetch(`${baseUrl}/auth/check`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const result = await response.json();
      
      console.log('📡 État de la session backend:', {
        status: response.status,
        isAuthenticated: result.isAuthenticated,
        response: result
      });
      
      return {
        connected: true,
        authenticated: result.isAuthenticated,
        data: result
      };
    } catch (error) {
      console.error('❌ Erreur de connectivité backend:', error);
      return {
        connected: false,
        authenticated: false,
        error
      };
    }
  }
  
  /**
   * Diagnostic complet de déconnexion
   */
  static async debugLogout(baseUrl?: string) {
    console.log('🔍 === DIAGNOSTIC DE DÉCONNEXION ===');
    
    // 1. Vérifier les cookies côté client
    console.log('1️⃣ Cookies côté client:');
    this.debugCookies();
    
    // 2. Vérifier les cookies de session
    console.log('2️⃣ Cookies de session:');
    this.checkSessionCookies();
    
    // 3. Tester la connectivité backend
    console.log('3️⃣ État backend:');
    const backendState = await this.testBackendConnection(baseUrl);
    
    // 4. Résumé
    console.log('4️⃣ Résumé:');
    console.log(`- Backend connecté: ${backendState.connected ? '✅' : '❌'}`);
    console.log(`- Utilisateur authentifié: ${backendState.authenticated ? '❌ PROBLÈME' : '✅'}`);
    
    return {
      clientCookies: this.debugCookies(),
      sessionCookies: this.checkSessionCookies(),
      backendState
    };
  }
}

/**
 * Hook personnalisé pour faciliter le débogage des cookies
 */
export const useCookieDebug = () => {
  const debugLogout = () => CookieUtils.debugLogout();
  const clearCookies = () => CookieUtils.clearAllClientCookies();
  const checkSession = () => CookieUtils.checkSessionCookies();
  
  return {
    debugLogout,
    clearCookies,
    checkSession,
    debugCookies: CookieUtils.debugCookies
  };
}; 