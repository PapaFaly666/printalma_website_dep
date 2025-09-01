// Service de validation des produits administrateur
import { PaginatedResponse, ProductWithValidation, ValidationResponse } from '../types/validation';

export class ProductValidationService {
  private baseUrl = '/api/products';

  private getFetchOptions(): RequestInit {
    return {
      credentials: 'include', // 🍪 Inclure les cookies pour l'authentification
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Vendeur : Soumettre un produit admin pour validation
  async submitForValidation(productId: number): Promise<any> {
    const response = await fetch(`/api/vendor/products/${productId}/submit-for-validation`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Vous devez être connecté');
      if (response.status === 404) throw new Error('Produit non trouvé');
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Données invalides pour la soumission');
      }
      throw new Error('Erreur lors de la soumission');
    }

    return response.json();
  }

  // Admin : Récupérer les produits en attente
  async getPendingProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<ProductWithValidation>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value.toString());
    });

    const response = await fetch(`${this.baseUrl}/admin/pending?${searchParams}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error('Accès réservé aux administrateurs');
      throw new Error('Erreur lors du chargement');
    }

    return response.json();
  }

  // Admin : Valider ou rejeter un produit admin
  async validateProduct(
    productId: number,
    approved: boolean,
    rejectionReason?: string
  ): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/${productId}/validate`, {
      ...this.getFetchOptions(),
      method: 'POST',
      body: JSON.stringify({
        approved,
        ...(rejectionReason && { rejectionReason })
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la validation');
    }

    return response.json();
  }
}

export const productValidationService = new ProductValidationService(); 