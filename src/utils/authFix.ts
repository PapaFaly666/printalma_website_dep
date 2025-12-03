/**
 * Utilitaire pour corriger les problèmes d'authentification cross-domain
 * Normalise la structure des données d'authentification
 */

export interface AuthSession {
  timestamp?: number;
  user?: any;
  isAuthenticated?: boolean;
  token?: string;
  jwt?: string;
  accessToken?: string;
  access_token?: string;
  auth_token?: string;
  bearerToken?: string;
  jwtToken?: string;
}

/**
 * Extrait le token JWT de l'objet de session
 */
export const extractTokenFromAuthSession = (authSession: AuthSession): string | null => {
  if (!authSession) return null;

  // D'abord, chercher les clés de token standards
  const standardKeys = ['token', 'jwt', 'accessToken', 'access_token', 'auth_token', 'bearerToken', 'jwtToken'];

  for (const key of standardKeys) {
    if (authSession[key]) {
      console.log(`✅ Token trouvé avec la clé '${key}':`, authSession[key]?.substring(0, 20) + '...');
      return authSession[key];
    }
  }

  // Si pas trouvé, chercher dans l'objet user
  if (authSession.user && typeof authSession.user === 'object') {
    const userKeys = Object.keys(authSession.user);

    for (const key of userKeys) {
      if (key.toLowerCase().includes('token')) {
        console.log(`✅ Token trouvé dans user.${key}:`, authSession.user[key]?.substring(0, 20) + '...');
        return authSession.user[key];
      }
    }

    // Chercher aussi dans les sous-propriétés
    for (const key of userKeys) {
      const value = authSession.user[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const subKeys = Object.keys(value);
        for (const subKey of subKeys) {
          if (subKey.toLowerCase().includes('token')) {
            console.log(`✅ Token trouvé dans user.${key}.${subKey}:`, value[subKey]?.substring(0, 20) + '...');
            return value[subKey];
          }
        }
      }
    }
  }

  // Chercher recursivement dans toutes les propriétés
  const searchRecursively = (obj: any, path: string = ''): string | null => {
    if (!obj || typeof obj !== 'object') return null;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Si la clé ou la valeur contient "token" et la valeur est une string non vide
      if (
        (key.toLowerCase().includes('token') || currentPath.toLowerCase().includes('token')) &&
        typeof value === 'string' &&
        value.length > 10
      ) {
        console.log(`✅ Token trouvé recursivement dans '${currentPath}':`, value.substring(0, 20) + '...');
        return value;
      }

      // Continuer la recherche récursive
      if (typeof value === 'object' && !Array.isArray(value)) {
        const result = searchRecursively(value, currentPath);
        if (result) return result;
      }
    }

    return null;
  };

  const recursiveToken = searchRecursively(authSession);
  if (recursiveToken) {
    console.log(`✅ Token trouvé recursivement:`, recursiveToken.substring(0, 20) + '...');
    return recursiveToken;
  }

  console.warn('❌ Aucun token JWT trouvé dans l\'objet de session');
  console.log('🔍 Structure de l\'objet de session:', JSON.stringify(authSession, null, 2));
  return null;
};

/**
 * Normalise et sauvegarde l'objet de session avec le token
 */
export const normalizeAuthSession = (authSession: AuthSession): void => {
  if (!authSession) return;

  // Extraire le token
  const token = extractTokenFromAuthSession(authSession);

  if (token) {
    // Ajouter le token dans toutes les positions possibles
    const normalizedSession = {
      ...authSession,
      token,        // Standard
      jwt: token,    // Alternative
      accessToken: token,  // Alternative
      access_token: token, // Alternative
      auth_token: token,    // Alternative
      bearerToken: token,  // Alternative
      jwtToken: token     // Alternative
    };

    // Sauvegarder l'objet normalisé
    localStorage.setItem('auth_session', JSON.stringify(normalizedSession));

    // Sauvegarder aussi dans des clés séparées pour compatibilité
    localStorage.setItem('token', token);
    localStorage.setItem('jwt', token);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('access_token', token);

    console.log('🔧 Session d\'authentification normalisée');
    console.log('📦 Token sauvegardé dans', Object.keys(normalizedSession).filter(k => normalizedSession[k] === token).length, 'endroits');
  } else {
    console.warn('⚠️ Impossible de normaliser la session - aucun token trouvé');
  }
};

/**
 * Récupère le token depuis plusieurs sources
 */
export const getTokenFromAllSources = (): string | null => {
  // 1. Clés localStorage directes
  const localStorageKeys = ['token', 'jwt', 'auth_token', 'accessToken', 'access_token', 'bearerToken', 'jwtToken'];
  for (const key of localStorageKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`✅ Token trouvé dans localStorage.${key}:`, value.substring(0, 20) + '...');
      return value;
    }
  }

  // 2. Clés sessionStorage directes
  const sessionStorageKeys = ['token', 'jwt', 'auth_token', 'accessToken', 'access_token', 'bearerToken', 'jwtToken'];
  for (const key of sessionStorageKeys) {
    const value = sessionStorage.getItem(key);
    if (value) {
      console.log(`✅ Token trouvé dans sessionStorage.${key}:`, value.substring(0, 20) + '...');
      return value;
    }
  }

  // 3. Objet auth_session
  try {
    const authSession = localStorage.getItem('auth_session');
    if (authSession) {
      const parsed = JSON.parse(authSession) as AuthSession;
      const sessionToken = extractTokenFromAuthSession(parsed);
      if (sessionToken) {
        console.log(`✅ Token trouvé dans auth_session:`, sessionToken.substring(0, 20) + '...');
        return sessionToken;
      }
    }
  } catch (e) {
    console.warn('⚠️ Erreur parsing auth_session:', e);
  }

  // 4. Cookies (dernière option)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name && value && (name.includes('token') || name.includes('jwt'))) {
      console.log(`✅ Token trouvé dans les cookies:`, value.substring(0, 20) + '...');
      return value;
    }
  }

  console.log('❌ Aucun token trouvé dans aucune source');
  return null;
};