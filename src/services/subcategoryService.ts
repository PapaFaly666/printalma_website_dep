// src/services/subcategoryService.ts
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface CreateSubCategoryData {
  name: string;
  description?: string;
  categoryId: number;
  level: number;
}

export interface SubCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number;
  level: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVariationData {
  name: string;
  parentId: number;
  level: number;
}

export interface VariationResponse {
  id: number;
  name: string;
  slug: string;
  parentId: number;
  level: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BatchVariationsResponse {
  created: VariationResponse[];
  skipped: string[];
  duplicates: Array<{ name: string; reason: string }>;
}

class SubCategoryService {
  /**
   * Créer une sous-catégorie
   */
  async createSubCategory(data: CreateSubCategoryData): Promise<SubCategoryResponse> {
    try {
      const response = await fetch(`${API_BASE}/categories/subcategory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        // Gérer les différents types d'erreurs
        if (response.status === 400) {
          const errorMessage = Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'Données invalides';
          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error(result.message || 'La catégorie parente n\'existe pas');
        } else if (response.status === 409) {
          throw new Error(result.message || 'Une sous-catégorie avec ce nom existe déjà');
        } else {
          throw new Error(result.message || 'Erreur lors de la création de la sous-catégorie');
        }
      }

      return result.data;
    } catch (error) {
      console.error('Erreur lors de la création de la sous-catégorie:', error);
      throw error;
    }
  }

  /**
   * Créer une variation individuelle
   */
  async createVariation(data: CreateVariationData): Promise<VariationResponse> {
    try {
      const response = await fetch(`${API_BASE}/categories/variation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const errorMessage = Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'Données invalides';
          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error(result.message || 'La sous-catégorie parente n\'existe pas');
        } else if (response.status === 409) {
          throw new Error(result.message || 'Une variation avec ce nom existe déjà');
        } else {
          throw new Error(result.message || 'Erreur lors de la création de la variation');
        }
      }

      return result.data;
    } catch (error) {
      console.error('Erreur lors de la création de la variation:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs variations en lot
   */
  async createVariationsBatch(variations: CreateVariationData[]): Promise<BatchVariationsResponse> {
    try {
      const response = await fetch(`${API_BASE}/categories/variations/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ variations })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const errorMessage = Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message || 'Données invalides';
          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error(result.message || 'La sous-catégorie parente n\'existe pas');
        } else {
          throw new Error(result.message || 'Erreur lors de la création des variations');
        }
      }

      return result.data;
    } catch (error) {
      console.error('Erreur lors de la création des variations:', error);
      throw error;
    }
  }

  /**
   * Helper pour créer une sous-catégorie avec gestion des erreurs et notifications
   */
  async createSubCategoryWithNotification(
    data: CreateSubCategoryData,
    onSuccess?: (subcategory: SubCategoryResponse) => void,
    onError?: (error: Error) => void
  ): Promise<SubCategoryResponse | null> {
    try {
      const subcategory = await this.createSubCategory(data);

      // Notification de succès
      toast.success('Sous-catégorie créée avec succès');

      // Callback de succès
      if (onSuccess) {
        onSuccess(subcategory);
      }

      return subcategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      // Notification d'erreur
      toast.error(errorMessage);

      // Callback d'erreur
      if (onError) {
        onError(error as Error);
      }

      return null;
    }
  }

  /**
   * Helper pour créer plusieurs variations avec gestion des erreurs et notifications
   */
  async createVariationsBatchWithNotification(
    variations: CreateVariationData[],
    onSuccess?: (result: BatchVariationsResponse) => void,
    onError?: (error: Error) => void
  ): Promise<BatchVariationsResponse | null> {
    try {
      const result = await this.createVariationsBatch(variations);

      // Notifications détaillées
      if (result.created.length > 0) {
        toast.success(`${result.created.length} variation(s) créée(s) avec succès`);
      }

      if (result.skipped.length > 0) {
        toast.warning(`${result.skipped.length} variation(s) ignorée(s)`);
      }

      // Callback de succès
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      // Notification d'erreur
      toast.error(errorMessage);

      // Callback d'erreur
      if (onError) {
        onError(error as Error);
      }

      return null;
    }
  }
}

export default new SubCategoryService();