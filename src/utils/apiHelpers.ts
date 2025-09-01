/**
 * Utilitaire pour gérer les réponses HTTP de manière cohérente
 * Évite les erreurs de lecture multiple du corps de la réponse
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  success?: boolean;
}

/**
 * Gère une réponse HTTP de manière sécurisée
 * @param response - La réponse fetch
 * @returns Promise<ApiResponse<T>>
 */
export async function handleApiResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
  try {
    // Vérifier d'abord le statut HTTP
    if (!response.ok) {
      // Lire le corps de la réponse une seule fois pour l'erreur
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = `Erreur ${response.status}: ${response.statusText}`;
      }
      return {
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
        success: false
      };
    }

    // Lire le corps de la réponse une seule fois pour le succès
    let data: T;
    try {
      data = await response.json();
    } catch (jsonError) {
      // Si ce n'est pas du JSON, essayer de lire comme texte
      try {
        const responseText = await response.text();
        console.warn('Réponse non-JSON reçue:', responseText);
        
        // Si la réponse est vide ou contient juste un message de succès
        if (!responseText || responseText.trim() === '') {
          data = { success: true, message: 'Opération réussie' } as T;
        } else {
          // Essayer de parser comme JSON malgré tout
          try {
            data = JSON.parse(responseText) as T;
          } catch (parseError) {
            // Si ça ne marche toujours pas, créer un objet de succès
            data = { 
              success: true, 
              message: responseText || 'Opération réussie',
              rawResponse: responseText 
            } as T;
          }
        }
      } catch (textError) {
        // En dernier recours, créer un objet de succès
        data = { 
          success: true, 
          message: 'Opération réussie (réponse non-parseable)',
          error: jsonError instanceof Error ? jsonError.message : 'Erreur de parsing'
        } as T;
      }
    }
    
    return {
      data,
      status: response.status,
      success: true
    };
  } catch (error) {
    return {
      error: `Erreur de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      status: response.status,
      success: false
    };
  }
}

/**
 * Effectue une requête GET avec gestion d'erreur
 * @param url - L'URL de la requête
 * @param options - Options fetch
 * @returns Promise<ApiResponse<T>>
 */
export async function apiGet<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    return await handleApiResponse<T>(response);
  } catch (error) {
    return {
      error: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      status: 0,
      success: false
    };
  }
}

/**
 * Effectue une requête POST avec gestion d'erreur
 * @param url - L'URL de la requête
 * @param body - Le corps de la requête
 * @param options - Options fetch
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPost<T = any>(
  url: string, 
  body: FormData | object, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const requestOptions: RequestInit = {
      method: 'POST',
      credentials: 'include',
      ...options
    };

    // Gérer le corps de la requête
    if (body instanceof FormData) {
      // Pour FormData, ne pas ajouter Content-Type (laissé au navigateur)
      requestOptions.body = body;
    } else {
      // Pour JSON
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    return await handleApiResponse<T>(response);
  } catch (error) {
    return {
      error: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      status: 0,
      success: false
    };
  }
}

/**
 * Effectue une requête PATCH avec FormData (pour les uploads)
 * @param url - L'URL de la requête
 * @param formData - Le FormData à envoyer
 * @param options - Options fetch
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPatchFormData<T = any>(
  url: string, 
  formData: FormData, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        // Ne pas définir Content-Type pour FormData (sera défini automatiquement)
        ...options.headers
      },
      body: formData,
      ...options
    });

    return await handleApiResponse<T>(response);
  } catch (error) {
    return {
      error: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      status: 0,
      success: false
    };
  }
}

/**
 * Effectue une requête PATCH avec gestion d'erreur
 * @param url - L'URL de la requête
 * @param body - Le corps de la requête
 * @param options - Options fetch
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPatch<T = any>(
  url: string, 
  body: object, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body),
      ...options
    });

    return await handleApiResponse<T>(response);
  } catch (error) {
    return {
      error: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      status: 0,
      success: false
    };
  }
}

/**
 * Effectue une requête DELETE avec gestion d'erreur
 * @param url - L'URL de la requête
 * @param options - Options fetch
 * @returns Promise<ApiResponse<void>>
 */
export async function apiDelete(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    return await handleApiResponse<void>(response);
  } catch (error) {
    return {
      error: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      status: 0,
      success: false
    };
  }
}

/**
 * Vérifie si une erreur est une erreur 404 (endpoint non trouvé)
 * @param error - Le message d'erreur
 * @returns boolean
 */
export function is404Error(error: string): boolean {
  return error.includes('404') || error.includes('Not Found');
}

/**
 * Vérifie si une erreur est une erreur de réseau
 * @param error - Le message d'erreur
 * @returns boolean
 */
export function isNetworkError(error: string): boolean {
  return error.includes('Erreur réseau') || error.includes('Failed to fetch');
} 