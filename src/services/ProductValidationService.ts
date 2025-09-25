// Service de validation des produits administrateur
import { PaginatedResponse, ProductWithValidation, ValidationResponse } from '../types/validation';
import { API_CONFIG } from '../config/api';

export class AdminValidationService {
  private baseUrl = '/api'; // Use proxy for API calls

  private getFetchOptions(): RequestInit {
    return {
      credentials: 'include', // Important pour inclure les cookies HTTP
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    };
  }

  async getProductsValidation(filters: {
    page?: number;
    limit?: number;
    productType?: 'ALL' | 'WIZARD' | 'TRADITIONAL';
    vendor?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
  } = {}): Promise<any> {
    const {
      page = 1,
      limit = 20,
      productType = 'ALL',
      vendor = '',
      status = 'ALL' // ✅ Par défaut récupérer TOUS les produits selon la documentation
    } = filters;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // N'ajouter les paramètres que s'ils ne sont pas les valeurs par défaut
    if (productType && productType !== 'ALL') params.append('productType', productType);
    if (status && status !== 'ALL') params.append('status', status);
    if (vendor) params.append('vendor', vendor);

    const endpoint = `/api/admin/products/validation?${params}`;
    console.log('🔗 Calling endpoint:', endpoint);
    console.log('🔗 Fetch options:', this.getFetchOptions());

    try {
      const response = await fetch(endpoint, this.getFetchOptions());

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response body:', errorText);

        if (response.status === 401) throw new Error('Token expiré - reconnexion requise');
        if (response.status === 403) throw new Error('Droits administrateur requis');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Data received in service:', data);
      return data;
    } catch (error) {
      console.error('🔥 Service error:', error);
      throw error;
    }
  }

  async validateProduct(productId: number, approved: boolean, rejectionReason?: string): Promise<any> {
    console.log('🔗 Validating product:', { productId, approved, rejectionReason });

    const response = await fetch(`/api/admin/products/${productId}/validate`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        approved,
        rejectionReason
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export class ProductValidationService extends AdminValidationService {
  // private baseUrl = '/api/products' // ✅ Supprimé car hérité de AdminValidationService;

  // ✅ Supprimé getFetchOptions car hérité de AdminValidationService

  // Vendeur : Soumettre un produit admin pour validation
  async submitForValidation(productId: number): Promise<any> {
    const response = await fetch(`/api/vendor/products/${productId}/submit-for-validation`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
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

  // Admin : Récupérer les produits en attente (WIZARD et traditionnels)
  async getPendingProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    productType?: 'ALL' | 'WIZARD' | 'TRADITIONAL';
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value.toString());
    });

    // Utiliser l'endpoint spécifique pour la validation admin
    const url = `/api/admin/products/validation?${searchParams}`;
    console.log('🔗 Requête vers:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });

    console.log('📡 Statut réponse:', response.status);

    if (!response.ok) {
      if (response.status === 403) throw new Error('Accès réservé aux administrateurs');
      throw new Error('Erreur lors du chargement');
    }

    const data = await response.json();
    console.log('📦 Données reçues dans le service:', data);

    return data;
  }

  // Admin : Valider ou rejeter un produit (WIZARD ou traditionnel)
  async validateProduct(
    productId: number,
    approved: boolean,
    rejectionReason?: string
  ): Promise<ValidationResponse> {
    // Utiliser l'endpoint spécifique pour la validation admin selon la doc
    const response = await fetch(`/api/admin/products/${productId}/validate`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
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

export const adminValidationService = new AdminValidationService();
export const productValidationService = new ProductValidationService();