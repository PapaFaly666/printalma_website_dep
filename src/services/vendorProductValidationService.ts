/**
 * Service de Validation et Publication des Produits Vendeur
 * Implémente le nouveau système de brouillon/publication basé sur pub.md
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Headers pour authentification par cookies
function getRequestHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Options de requête avec authentification par cookies
function getRequestOptions(method: string = 'GET', body?: any): RequestInit {
  const options: RequestInit = {
    method,
    headers: getRequestHeaders(),
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

// Interface pour la réponse du nouveau système
export interface SetProductStatusResponse {
  success: boolean;
  message: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING';
  isValidated: boolean;
  canPublish: boolean;
  designValidationStatus: 'validated' | 'pending' | 'rejected';
}

// Interface pour la publication directe
export interface DirectPublishResponse extends SetProductStatusResponse {
  productId: number;
  publishedAt?: string;
}

class VendorProductValidationService {
  private baseUrl = `${API_BASE_URL}/vendor-product-validation`;

  /**
   * 🆕 Mettre en brouillon ou publier directement
   * PUT /vendor-product-validation/set-draft/{productId}
   */
  async setProductStatus(productId: number, isDraft: boolean): Promise<SetProductStatusResponse> {
    try {
      console.log('📝 === DÉFINITION STATUT PRODUIT ===');
      console.log(`Product ID: ${productId}, isDraft: ${isDraft}`);

      const response = await fetch(`${this.baseUrl}/set-draft/${productId}`, {
        ...getRequestOptions('PUT', { isDraft }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Statut produit défini:', result);

      return {
        success: result.success ?? true,
        message: result.message || 'Statut mis à jour',
        status: result.status || (isDraft ? 'DRAFT' : 'PENDING'),
        isValidated: result.isValidated ?? false,
        canPublish: result.canPublish ?? false,
        designValidationStatus: result.designValidationStatus || 'pending'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la définition du statut:', error);
      throw error;
    }
  }

  /**
   * 🆕 Publication directe (raccourci)
   * POST /vendor-product-validation/publish-direct/{productId}
   */
  async publishDirect(productId: number): Promise<DirectPublishResponse> {
    try {
      console.log('🚀 === PUBLICATION DIRECTE ===');
      console.log(`Product ID: ${productId}`);

      const response = await fetch(`${this.baseUrl}/publish-direct/${productId}`, {
        ...getRequestOptions('POST'),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Publication directe réussie:', result);

      return {
        success: result.success ?? true,
        message: result.message || 'Produit publié',
        status: result.status || 'PUBLISHED',
        isValidated: result.isValidated ?? false,
        canPublish: result.canPublish ?? true,
        designValidationStatus: result.designValidationStatus || 'validated',
        productId,
        publishedAt: result.publishedAt
      };
    } catch (error) {
      console.error('❌ Erreur lors de la publication directe:', error);
      throw error;
    }
  }

  /**
   * 🆕 Publier un brouillon existant
   * POST /vendor-product-validation/publish/{productId}
   */
  async publishDraft(productId: number): Promise<DirectPublishResponse> {
    try {
      console.log('📄 === PUBLICATION BROUILLON ===');
      console.log(`Product ID: ${productId}`);

      const response = await fetch(`${this.baseUrl}/publish/${productId}`, {
        ...getRequestOptions('POST'),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Brouillon publié:', result);

      return {
        success: result.success ?? true,
        message: result.message || 'Brouillon publié',
        status: result.status || 'PUBLISHED',
        isValidated: result.isValidated ?? true,
        canPublish: result.canPublish ?? true,
        designValidationStatus: result.designValidationStatus || 'validated',
        productId,
        publishedAt: result.publishedAt
      };
    } catch (error) {
      console.error('❌ Erreur lors de la publication du brouillon:', error);
      throw error;
    }
  }

  /**
   * 🆕 Vérifier si un design est validé
   */
  async checkDesignValidation(designId: number): Promise<{
    isValidated: boolean;
    status: 'validated' | 'pending' | 'rejected';
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/designs/${designId}/validation-status`, {
        ...getRequestOptions('GET'),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        isValidated: result.isValidated ?? false,
        status: result.status || 'pending',
        message: result.message || 'Statut inconnu'
      };
    } catch (error) {
      console.error('❌ Erreur vérification validation design:', error);
      return {
        isValidated: false,
        status: 'pending',
        message: 'Erreur lors de la vérification'
      };
    }
  }

  /**
   * 🆕 Obtenir le statut complet d'un produit
   */
  async getProductStatus(productId: number): Promise<{
    status: 'DRAFT' | 'PUBLISHED' | 'PENDING';
    canPublish: boolean;
    designValidationStatus: 'validated' | 'pending' | 'rejected';
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${productId}`, {
        ...getRequestOptions('GET'),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        status: result.status || 'PENDING',
        canPublish: result.canPublish ?? false,
        designValidationStatus: result.designValidationStatus || 'pending',
        message: result.message || ''
      };
    } catch (error) {
      console.error('❌ Erreur récupération statut produit:', error);
      return {
        status: 'PENDING',
        canPublish: false,
        designValidationStatus: 'pending',
        message: 'Erreur lors de la récupération du statut'
      };
    }
  }
}

export const vendorProductValidationService = new VendorProductValidationService();