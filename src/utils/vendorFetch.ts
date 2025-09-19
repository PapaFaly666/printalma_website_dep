/**
 * 🔄 Wrapper pour fetch avec gestion automatique des erreurs vendeur
 * Basé sur VENDOR_ACCOUNT_STATUS_GUIDE.md
 */

import { vendorErrorHandler } from '../services/vendorErrorHandler';

interface VendorFetchOptions extends RequestInit {
  // Options personnalisées pour vendorFetch
}

interface VendorError extends Error {
  status?: number;
  data?: any;
  vendorDiagnosis?: any;
}

/**
 * Wrapper pour fetch avec gestion automatique des erreurs vendeur
 */
export const vendorFetch = async (url: string, options: VendorFetchOptions = {}): Promise<Response> => {
  try {
    // Appel API normal avec credentials inclus par défaut
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });

    // Si succès, retourner tel quel
    if (response.ok) {
      return response;
    }

    // Si erreur 401/403, diagnostiquer
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));

      // Diagnostiquer le problème
      const diagnosis = await vendorErrorHandler.handleAccessError({
        status: response.status,
        data: errorData
      });

      // Créer une erreur enrichie
      const enrichedError: VendorError = new Error(`HTTP ${response.status}`);
      enrichedError.status = response.status;
      enrichedError.data = errorData;
      enrichedError.vendorDiagnosis = diagnosis;

      throw enrichedError;
    }

    // Autres erreurs HTTP
    const errorData = await response.json().catch(() => ({}));
    const error: VendorError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = errorData;
    throw error;

  } catch (error: any) {
    // Si l'erreur a déjà un diagnostic, la rethrow
    if (error.vendorDiagnosis) {
      throw error;
    }

    // Si c'est une erreur réseau ou autre, diagnostiquer quand même
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      try {
        const diagnosis = await vendorErrorHandler.handleAccessError(error);
        error.vendorDiagnosis = diagnosis;
      } catch (diagError) {
        // Si le diagnostic échoue aussi, on garde l'erreur originale
        console.warn('Diagnostic impossible:', diagError);
      }
    }

    throw error;
  }
};

/**
 * Helper pour les appels API JSON avec gestion d'erreur automatique
 */
export const vendorApiCall = async <T = any>(
  url: string,
  options: VendorFetchOptions = {}
): Promise<T> => {
  const response = await vendorFetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  return response.json();
};

/**
 * Wrapper spécifique pour les endpoints vendeur avec base URL
 */
export const vendorApi = {
  get: <T = any>(endpoint: string): Promise<T> => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
    return vendorApiCall(`${baseUrl}${endpoint}`, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any): Promise<T> => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
    return vendorApiCall(`${baseUrl}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  patch: <T = any>(endpoint: string, data?: any): Promise<T> => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
    return vendorApiCall(`${baseUrl}${endpoint}`, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  delete: <T = any>(endpoint: string): Promise<T> => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
    return vendorApiCall(`${baseUrl}${endpoint}`, { method: 'DELETE' });
  }
};

export default vendorFetch;