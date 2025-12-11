/**
 * SOLUTION COMPLÈTE POUR CORRIGER L'ERREUR "UNAUTHORIZED"
 *
 * Ce fichier contient le code corrigé à utiliser dans votre frontend
 * pour résoudre l'erreur Unauthorized sur /paydunya/payment
 *
 * IMPORTANT: Le backend fonctionne correctement sans authentification !
 * Le problème vient de l'intercepteur Axios qui ajoute automatiquement
 * le token JWT même pour les endpoints publics.
 */

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

// ✅ Liste des endpoints qui ne nécessitent PAS d'authentification
const PUBLIC_ENDPOINTS = [
  '/paydunya/payment',        // ⭐ IMPORTANT: Endpoint de paiement
  '/paydunya/status/',
  '/paydunya/test-config',
  '/paydunya/callback',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

/**
 * Vérifie si une URL correspond à un endpoint public
 */
const isPublicEndpoint = (url: string = ''): boolean => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

/**
 * Client API principal avec gestion des endpoints publics
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

/**
 * Intercepteur de requête - Ajoute le token JWT sauf pour les endpoints publics
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';

    console.log(`[API] 📤 ${config.method?.toUpperCase()} ${url}`);

    // ✅ NE PAS ajouter le token pour les endpoints publics
    if (isPublicEndpoint(url)) {
      console.log('[API] 🔓 Endpoint public - Pas de token ajouté');
      return config;
    }

    // ✅ Ajouter le token pour les endpoints protégés
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] 🔐 Token JWT ajouté');
    } else {
      console.log('[API] ⚠️ Pas de token disponible');
    }

    return config;
  },
  (error) => {
    console.error('[API] ❌ Erreur de requête:', error);
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponse - Gère les erreurs
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    console.error(`[API] ❌ ${status} ${url}`, error.response?.data);

    // ✅ Rediriger vers login SEULEMENT pour les endpoints protégés
    if (status === 401) {
      if (!isPublicEndpoint(url)) {
        console.log('[API] 🔒 Token invalide - Redirection vers login');
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      } else {
        console.error('[API] ⚠️ Erreur 401 sur endpoint public - Vérifier le backend');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ============================================================================
// EXPORTS POUR LES TESTS
// ============================================================================

/**
 * Test 1: Vérifier que l'endpoint est accessible sans token
 */
export const testPayDunyaEndpoint = async () => {
  console.log('🧪 Test: Endpoint PayDunya sans authentification');

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/paydunya/test-config`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Backend PayDunya opérationnel');
      return true;
    } else {
      console.error('❌ Backend PayDunya non configuré');
      return false;
    }
  } catch (error) {
    console.error('❌ Impossible de contacter le backend:', error);
    return false;
  }
};

/**
 * Test 2: Vérifier que l'intercepteur fonctionne correctement
 */
export const testInterceptor = () => {
  console.log('🧪 Test: Vérification de l\'intercepteur');

  // Tester avec un endpoint public
  const publicUrl = '/paydunya/payment';
  const isPublic = isPublicEndpoint(publicUrl);

  if (isPublic) {
    console.log('✅ Endpoint PayDunya détecté comme public');
    return true;
  } else {
    console.error('❌ Endpoint PayDunya non détecté comme public');
    return false;
  }
};

/**
 * Test 3: Vérifier la configuration CORS
 */
export const testCORS = async () => {
  console.log('🧪 Test: Configuration CORS');

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/paydunya/test-config`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5174',
      },
    });

    if (response.ok) {
      console.log('✅ CORS configuré correctement');
      return true;
    } else {
      console.error('❌ Erreur CORS:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur CORS:', error);
    return false;
  }
};