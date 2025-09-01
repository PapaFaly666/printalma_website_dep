import { API_CONFIG } from '../config/api';

export interface AutoValidationResult {
  success: boolean;
  message: string;
  data: {
    updatedProducts: VendorProductAutoValidated[];
  };
}

export interface VendorProductAutoValidated {
  id: number;
  name: string;
  isValidated: boolean;
  vendorId: number;
  status: 'PUBLISHED' | 'DRAFT';
  postValidationAction: 'AUTO_PUBLISH' | 'TO_DRAFT';
}

export interface AutoValidationStats {
  success: boolean;
  data: {
    autoValidated: number;      // Produits auto-validés (validatedBy = -1)
    manualValidated: number;    // Produits validés manuellement
    pending: number;            // Produits en attente
    totalValidated: number;     // Total validés
  };
}

export interface DesignValidationResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    isValidated: boolean;
    autoValidation?: {
      updatedProducts: VendorProductAutoValidated[];
      count: number;
    };
  };
}

export interface VendorProductStatus {
  id: number;
  name: string;
  isValidated: boolean;
  validatedBy: number | null;
  isAutoValidated: boolean; // validatedBy === -1
  canBeAutoValidated: boolean; // Design validé mais produit pas encore
  designStatus: {
    id: number;
    name: string;
    isValidated: boolean;
    isPublished: boolean;
  };
}

class AutoValidationService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * 🎯 PRIORITÉ 1: Auto-valider les produits d'un design spécifique
   */
  async autoValidateProductsForDesign(designId: number): Promise<AutoValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/designs/${designId}/auto-validate-products`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur auto-validation design:', error);
      throw error;
    }
  }

  /**
   * Auto-validation globale de tous les produits éligibles
   */
  async autoValidateAllProducts(): Promise<AutoValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/vendor-products/auto-validate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur auto-validation globale:', error);
      throw error;
    }
  }

  /**
   * Auto-valider un VendorProduct spécifique
   */
  async autoValidateProduct(productId: number): Promise<AutoValidationResult> {
    const response = await fetch(`${this.baseUrl}/admin/vendor-products/${productId}/auto-validate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Valider un design avec auto-validation automatique
   */
  async validateDesign(
    designId: number, 
    action: 'VALIDATE' | 'REJECT', 
    rejectionReason?: string
  ): Promise<DesignValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/designs/${designId}/validate`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur validation design:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques d'auto-validation
   */
  async getAutoValidationStats(): Promise<AutoValidationStats> {
    const response = await fetch(`${this.baseUrl}/admin/stats/auto-validation`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const autoValidationService = new AutoValidationService();
export default autoValidationService;