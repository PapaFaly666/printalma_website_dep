/**
 * Service de protection des catégories contre la suppression accidentelle
 * Basé sur la documentation CATEGORY_PROTECTION_VISUAL.md
 */

const getBackendUrl = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;
    }
    if (typeof window !== 'undefined' && (window as any).BACKEND_URL) {
      return (window as any).BACKEND_URL;
    }
  } catch (e) {
    console.log('⚠️ Erreur récupération variable environnement:', e);
  }
  return 'https://printalma-back-dep.onrender.com';
};

const BACKEND_URL = getBackendUrl();

export interface CanDeleteResponse {
  success: boolean;
  data: {
    canDelete: boolean;
    categoryId?: number;
    subCategoryId?: number;
    variationId?: number;
    categoryName?: string;
    subCategoryName?: string;
    variationName?: string;
    blockers: {
      directProducts?: number;
      subCategoryProducts?: number;
      variationProducts?: number;
      productsCount?: number;
      total?: number;
    };
    message: string;
  };
}

export interface DeletionError {
  statusCode: number;
  message: string;
  error: string;
  code: 'CategoryInUse' | 'SubCategoryInUse' | 'VariationInUse';
  details: {
    categoryId?: number;
    subCategoryId?: number;
    variationId?: number;
    categoryName?: string;
    subCategoryName?: string;
    variationName?: string;
    directProductsCount?: number;
    subCategoryProductsCount?: number;
    variationProductsCount?: number;
    productsCount?: number;
    suggestedAction: string;
  };
}

class CategoryProtectionService {
  /**
   * Vérifie si une catégorie peut être supprimée
   */
  async canDeleteCategory(categoryId: number): Promise<CanDeleteResponse> {
    const response = await fetch(`${BACKEND_URL}/categories/${categoryId}/can-delete`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Vérifie si une sous-catégorie peut être supprimée
   */
  async canDeleteSubCategory(subCategoryId: number): Promise<CanDeleteResponse> {
    const response = await fetch(`${BACKEND_URL}/categories/subcategory/${subCategoryId}/can-delete`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Vérifie si une variation peut être supprimée
   */
  async canDeleteVariation(variationId: number): Promise<CanDeleteResponse> {
    const response = await fetch(`${BACKEND_URL}/categories/variation/${variationId}/can-delete`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Supprime une catégorie (avec protection intégrée côté backend)
   */
  async deleteCategory(categoryId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error: DeletionError = await response.json();
      throw error;
    }

    return await response.json();
  }

  /**
   * Supprime une sous-catégorie (avec protection intégrée côté backend)
   */
  async deleteSubCategory(subCategoryId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/categories/subcategory/${subCategoryId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error: DeletionError = await response.json();
      throw error;
    }

    return await response.json();
  }

  /**
   * Supprime une variation (avec protection intégrée côté backend)
   */
  async deleteVariation(variationId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/categories/variation/${variationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error: DeletionError = await response.json();
      throw error;
    }

    return await response.json();
  }

  /**
   * Migre les produits d'une catégorie vers une autre
   */
  async migrateProducts(fromCategoryId: number, toCategoryId: number): Promise<{ success: boolean; message: string; count: number }> {
    const response = await fetch(`${BACKEND_URL}/products/migrate-category`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromCategoryId,
        toCategoryId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la migration');
    }

    return await response.json();
  }

  /**
   * Récupère toutes les catégories disponibles
   */
  async getAllCategories(): Promise<any[]> {
    const response = await fetch(`${BACKEND_URL}/categories`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des catégories');
    }

    return await response.json();
  }
}

export const categoryProtectionService = new CategoryProtectionService();
