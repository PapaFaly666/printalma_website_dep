import { API_CONFIG } from '../config/api';

export interface AutoValidationResult {
  updated: Array<{
    id: number;
    name: string;
    vendorId: number;
    isValidated: boolean;
    validatedAt: string;
    validatedBy: number;
  }>;
  message: string;
}

export interface AutoValidationStats {
  autoValidated: number;
  manualValidated: number;
  pending: number;
  totalValidated: number;
}

class AutoValidationService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Auto-valider tous les VendorProducts éligibles
   */
  async autoValidateAll(): Promise<AutoValidationResult> {
    const response = await fetch(`${this.baseUrl}/admin/vendor-products/auto-validate`, {
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