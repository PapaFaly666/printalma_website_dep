// Service API pour le système de validation en cascade design → produits

import { PostValidationAction, VendorProduct, CascadeValidationResponse } from '../types/cascadeValidation';

// Détermination dynamique de l'URL de l'API (compatible Vite et CRA)
let API_BASE: string;

if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
  API_BASE = import.meta.env.VITE_API_URL as string;
} else if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
  API_BASE = process.env.REACT_APP_API_URL as string;
} else {
  API_BASE = 'https://printalma-back-dep.onrender.com';
}

// Assurer qu'aucune barre oblique finale n'est présente
if (API_BASE.endsWith('/')) {
  API_BASE = API_BASE.slice(0, -1);
}

export class CascadeValidationService {
  // Configuration pour toutes les requêtes avec credentials: 'include'
  private getRequestConfig(additionalConfig: any = {}): any {
    return {
      credentials: 'include', // ⭐ ESSENTIEL pour l'authentification par cookies
      headers: {
        'Content-Type': 'application/json',
        ...additionalConfig.headers
      },
      ...additionalConfig
    };
  }

  // Vendeur: Mettre à jour l'action post-validation
  async updatePostValidationAction(
    productId: number, 
    action: PostValidationAction
  ): Promise<CascadeValidationResponse> {
    try {
      const response = await fetch(
        `${API_BASE}/vendor/products/${productId}/post-validation-action`,
        this.getRequestConfig({
          method: 'PUT',
          body: JSON.stringify({ postValidationAction: action })
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vendeur: Publier manuellement un produit validé
  async publishValidatedProduct(productId: number): Promise<CascadeValidationResponse> {
    try {
      const response = await fetch(
        `${API_BASE}/vendor/products/${productId}/publish`,
        this.getRequestConfig({
          method: 'PUT',
          body: JSON.stringify({})
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Valider un design (déclenche cascade)
  async validateDesign(
    designId: number, 
    action: 'VALIDATE' | 'REJECT', 
    rejectionReason?: string
  ): Promise<CascadeValidationResponse> {
    try {
      const response = await fetch(
        `${API_BASE}/designs/${designId}/validate`,
        this.getRequestConfig({
          method: 'PUT',
          body: JSON.stringify({ action, rejectionReason })
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Récupérer les produits vendeur avec support des paramètres
  async getVendorProducts(params?: Record<string, any>): Promise<VendorProduct[]> {
    try {
      let url = `${API_BASE}/vendor/products`;
      
      // Ajouter les paramètres à l'URL si fournis
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        url += `?${searchParams.toString()}`;
      }

      const response = await fetch(url, this.getRequestConfig());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let products = data.products !== undefined ? data.products : data;
      // Normaliser: si le backend renvoie un objet clé-valeur, on le transforme en tableau
      if (products && !Array.isArray(products) && typeof products === 'object') {
        products = Object.values(products);
      }
      // S'assurer qu'on a bien un tableau
      if (!Array.isArray(products)) {
        products = [];
      }
      // Filtrer les entrées non conformes (ex: métadonnées, booléens, chaînes)
      products = (products as any[]).filter((item) => {
        return item && typeof item === 'object' && 'id' in item && 'status' in item;
      });
      return products as VendorProduct[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Récupérer les produits en attente
  async getPendingProducts(): Promise<VendorProduct[]> {
    try {
      const response = await fetch(
        `${API_BASE}/vendor-product-validation/pending`,
        this.getRequestConfig()
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Créer un produit avec action post-validation
  async createProductWithAction(productData: {
    vendorName: string;
    vendorDescription: string;
    vendorPrice: number;
    designCloudinaryUrl: string;
    postValidationAction: PostValidationAction;
  }): Promise<CascadeValidationResponse> {
    try {
      const response = await fetch(
        `${API_BASE}/vendor-product-validation/create`,
        this.getRequestConfig({
          method: 'POST',
          body: JSON.stringify(productData)
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Vérifier l'état d'un produit spécifique (pour debug et actualisation)
  async checkProductState(productId: number): Promise<VendorProduct | null> {
    try {
      const products = await this.getVendorProducts();
      return products.find(p => p.id === productId) || null;
    } catch (error) {
      console.error('Erreur vérification état produit:', error);
      return null;
    }
  }

  // Actualiser tous les produits (pour détecter les changements de cascade)
  async refreshAllProducts(): Promise<VendorProduct[]> {
    try {
      console.log('🔄 Actualisation des produits pour détecter les changements de cascade...');
      return await this.getVendorProducts();
    } catch (error) {
      console.error('Erreur actualisation produits:', error);
      throw error;
    }
  }

  // Vérifier si un produit peut être publié manuellement
  canPublishManually(product: VendorProduct): boolean {
    return product.status === 'DRAFT' && product.isValidated;
  }

  // Vérifier si un produit peut être modifié
  canModifyProduct(product: VendorProduct): boolean {
    return product.status === 'DRAFT' || (product.status === 'PENDING' && !product.isValidated);
  }

  // Obtenir le statut d'affichage pour un produit
  getDisplayStatus(product: VendorProduct): {
    text: string;
    color: string;
    icon: string;
  } {
    if (product.status === 'PUBLISHED') {
      return { 
        text: 'Publié', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      };
    }
    
    if (product.status === 'DRAFT' && product.isValidated) {
      return { 
        text: 'Validé - Prêt à publier', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🎯'
      };
    }
    
    if (product.status === 'PENDING') {
      const actionText = product.postValidationAction === PostValidationAction.AUTO_PUBLISH
        ? 'Publication automatique'
        : 'Publication manuelle';
      return { 
        text: `En attente - ${actionText}`, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳'
      };
    }
    
    return { 
      text: 'Brouillon', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '📝'
    };
  }

  // Obtenir des statistiques sur les produits (pour dashboard)
  getProductStats(products: VendorProduct[]): {
    total: number;
    pending: number;
    published: number;
    validatedDrafts: number;
    autoPublishPending: number;
    manualPublishPending: number;
  } {
    const stats = {
      total: products.length,
      pending: 0,
      published: 0,
      validatedDrafts: 0,
      autoPublishPending: 0,
      manualPublishPending: 0
    };

    products.forEach(product => {
      if (product.status === 'PUBLISHED') {
        stats.published++;
      } else if (product.status === 'DRAFT' && product.isValidated) {
        stats.validatedDrafts++;
      } else if (product.status === 'PENDING') {
        stats.pending++;
        if (product.postValidationAction === PostValidationAction.AUTO_PUBLISH) {
          stats.autoPublishPending++;
        } else {
          stats.manualPublishPending++;
        }
      }
    });

    return stats;
  }

  private handleError(error: any): Error {
    console.error('🚨 CascadeValidationService Error:', error);
    
    // Gestion spécifique des erreurs de credentials
    if (error.message?.includes('credentials')) {
      console.error('⚠️ Erreur d\'authentification - Vérifiez que vous êtes connecté');
      return new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
    }

    const message = error.message || 'Une erreur est survenue lors de la validation en cascade';
    return new Error(message);
  }

  // ========= MÉTHODES STATIQUES DE COMPATIBILITÉ ========= //
  private static _instance = new CascadeValidationService();

  /**
   * Liste des produits vendeur (compatible ancienne signature)
   */
  static async listVendorProducts(filters?: Record<string, any>): Promise<{ products: VendorProduct[] }> {
    const params = filters || {};
    const products = await this._instance.getVendorProducts(params);
    return { products };
  }

  /**
   * Mettre à jour l'action post-validation (statique)
   */
  static async updatePostValidationAction(productId: number, action: PostValidationAction) {
    return await this._instance.updatePostValidationAction(productId, action);
  }

  /**
   * Publier un brouillon validé (statique - ancienne nomenclature)
   */
  static async publishValidatedDraft(productId: number) {
    return await this._instance.publishValidatedProduct(productId);
  }

  /**
   * Créer un produit avec action post-validation (statique)
   */
  static async createProductWithAction(productData: any) {
    return await this._instance.createProductWithAction(productData);
  }

  /**
   * Peut-on publier manuellement ? (statique)
   */
  static canPublishManually(product: VendorProduct): boolean {
    return this._instance.canPublishManually(product);
  }

  /**
   * Peut-on modifier le produit ? (statique)
   */
  static canModifyProduct(product: VendorProduct): boolean {
    return this._instance.canModifyProduct(product);
  }

  /**
   * Obtenir l'affichage statut (statique)
   */
  static getDisplayStatus(product: VendorProduct) {
    return this._instance.getDisplayStatus(product);
  }

  /**
   * Obtenir les statistiques (statique)
   */
  static getProductStats(products: VendorProduct[]) {
    return this._instance.getProductStats(products);
  }

  /**
   * Actualiser tous les produits (statique)
   */
  static async refreshAllProducts() {
    return await this._instance.refreshAllProducts();
  }
}

export const cascadeValidationService = new CascadeValidationService();

// Export par défaut pour compatibilité
export default CascadeValidationService; 