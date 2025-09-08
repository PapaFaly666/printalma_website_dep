// middleware/authMiddleware.ts - Compatible avec fixe.md

/**
 * Utilitaire pour lire les cookies
 */
const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

/**
 * Récupérer le token d'authentification admin - MÉTHODE ROBUSTE
 */
export const getAdminToken = (): string | null => {
  // Option 1: Token dans localStorage (multiple variations)
  let token = localStorage.getItem('adminToken') || 
              localStorage.getItem('authToken') ||
              localStorage.getItem('token') ||
              localStorage.getItem('accessToken');
  
  // Option 2: Token dans sessionStorage  
  if (!token) {
    token = sessionStorage.getItem('adminToken') || 
            sessionStorage.getItem('authToken') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');
  }

  // Option 3: Token dans un cookie
  if (!token) {
    token = getCookieValue('adminToken') || 
            getCookieValue('authToken') ||
            getCookieValue('token') ||
            getCookieValue('accessToken');
  }

  // Option 4: Token depuis un store global
  if (!token && (window as any).store) {
    const state = (window as any).store.getState();
    token = state?.auth?.token || state?.user?.token || state?.auth?.accessToken;
  }

  // Option 5: Token depuis React Context global
  if (!token && (window as any).authContext) {
    token = (window as any).authContext.token;
  }

  return token;
};

/**
 * Vérifier si un token JWT n'est pas expiré
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch (e) {
    // Si on ne peut pas parser le token, on considère qu'il est invalide
    console.warn('⚠️ Token non parsable:', e);
    return true;
  }
};

/**
 * Vérifier si un utilisateur a les permissions admin
 */
export const hasAdminPermissions = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role && ['ADMIN', 'SUPERADMIN'].includes(payload.role);
  } catch (e) {
    console.warn('⚠️ Impossible de vérifier les permissions:', e);
    return false; // Par sécurité, refuser l'accès si on ne peut pas vérifier
  }
};

/**
 * Nettoyer tous les tokens d'authentification
 */
export const clearAllTokens = (): void => {
  const tokenKeys = ['adminToken', 'authToken', 'token', 'accessToken'];
  
  // Nettoyer localStorage
  tokenKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Nettoyer sessionStorage
  tokenKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  // Nettoyer les cookies
  tokenKeys.forEach(key => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
  
  console.log('🧹 Tous les tokens ont été nettoyés');
};

/**
 * Interface pour le résultat de vérification d'authentification
 */
export interface AuthCheckResult {
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
  token?: string;
  error?: string;
  userInfo?: {
    role: string;
    exp: number;
    [key: string]: any;
  };
}

/**
 * Vérification complète de l'authentification admin - FONCTION PRINCIPALE
 */
export const checkAdminAuth = (): AuthCheckResult => {
  try {
    const token = getAdminToken();
    
    if (!token) {
      console.warn('🚨 Aucun token d\'authentification trouvé');
      console.log('🔍 Recherche effectuée dans:', {
        localStorage: Object.keys(localStorage).filter(key => key.includes('token') || key.includes('auth')),
        sessionStorage: Object.keys(sessionStorage).filter(key => key.includes('token') || key.includes('auth')),
        cookies: document.cookie
      });
      
      return {
        isAuthenticated: false,
        hasAdminAccess: false,
        error: 'Token d\'authentification requis'
      };
    }

    // Vérifier si le token est expiré
    if (isTokenExpired(token)) {
      console.warn('🚨 Token expiré');
      clearAllTokens();
      return {
        isAuthenticated: false,
        hasAdminAccess: false,
        error: 'Session expirée - Veuillez vous reconnecter'
      };
    }

    // Vérifier les permissions admin
    if (!hasAdminPermissions(token)) {
      console.warn('🚨 Permissions insuffisantes');
      return {
        isAuthenticated: true,
        hasAdminAccess: false,
        token,
        error: 'Permissions administrateur requises'
      };
    }

    // Extraire les informations utilisateur
    let userInfo;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userInfo = {
        role: payload.role,
        exp: payload.exp,
        userId: payload.sub || payload.id,
        email: payload.email
      };
      console.log('✅ Authentification admin valide pour:', userInfo.role);
    } catch (e) {
      console.warn('⚠️ Impossible d\'extraire les infos utilisateur:', e);
    }

    return {
      isAuthenticated: true,
      hasAdminAccess: true,
      token,
      userInfo
    };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification d\'authentification:', error);
    return {
      isAuthenticated: false,
      hasAdminAccess: false,
      error: error instanceof Error ? error.message : 'Erreur d\'authentification'
    };
  }
};

/**
 * Fonction de vérification rapide (throw error si échec) - Compatible fixe.md
 */
export const requireAdminAuth = (): string => {
  const authResult = checkAdminAuth();
  
  if (!authResult.isAuthenticated || !authResult.hasAdminAccess) {
    throw new Error(authResult.error || 'Authentification requise');
  }
  
  return authResult.token!;
};

/**
 * Redirection vers la page de login
 */
export const redirectToLogin = (reason?: string): void => {
  console.warn('🔄 Redirection vers login:', reason);
  
  // Nettoyer les tokens avant redirection
  clearAllTokens();
  
  // Sauvegarder l'URL actuelle pour redirection après login (optionnel)
  if (!window.location.pathname.includes('login')) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
  }
  
  // Redirection
  if (window.location.pathname !== '/login' && !window.location.pathname.includes('auth')) {
    window.location.href = '/login';
  }
};

/**
 * Hook d'authentification (pour utilisation dans les composants React)
 */
export const useAuthCheck = (): AuthCheckResult => {
  const authResult = checkAdminAuth();
  
  // Auto-redirection si pas authentifié
  if (!authResult.isAuthenticated && !window.location.pathname.includes('login')) {
    redirectToLogin(authResult.error);
  }
  
  return authResult;
};

/**
 * Middleware d'authentification pour les actions (utilisation dans les handlers)
 */
export const withAuth = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      requireAdminAuth();
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('authentification') ||
        error.message.includes('Session expirée') ||
        error.message.includes('Permissions')
      )) {
        redirectToLogin(error.message);
        throw error;
      }
      throw error;
    }
  };
};