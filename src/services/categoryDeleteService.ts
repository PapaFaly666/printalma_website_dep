// src/services/categoryDeleteService.ts
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface DeleteCategoryResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    categoryId?: number;
    subCategoryId?: number;
    variationId?: number;
    productsCount: number;
  };
}

/**
 * Détermine le type d'un élément de catégorie basé sur sa structure
 */
export function determineCategoryElementType(element: any): 'category' | 'subcategory' | 'variation' {
  // Vérifier les champs spécifiques à chaque type

  // Catégorie principale : a subCategories et products
  if (element.subCategories !== undefined && element.products !== undefined) {
    return 'category';
  }

  // Sous-catégorie : a variations et category
  if (element.variations !== undefined && element.category !== undefined) {
    return 'subcategory';
  }

  // Variation : a subCategory
  if (element.subCategory !== undefined) {
    return 'variation';
  }

  // Fallback basé sur l'ID et la structure des données
  if (element.categoryId && !element.subCategoryId) {
    return 'subcategory';
  }

  if (element.subCategoryId) {
    return 'variation';
  }

  if (element.subCategories) {
    return 'category';
  }

  // Par défaut, considérer comme catégorie
  return 'category';
}

/**
 * Supprime un élément de catégorie (catégorie, sous-catégorie ou variation)
 */
class CategoryDeleteService {
  private getEndpoint(type: string, id: number): string {
    const endpoints = {
      category: `/categories/${id}`,
      subcategory: `/sub-categories/${id}`,
      variation: `/variations/${id}`
    };

    const endpoint = endpoints[type as keyof typeof endpoints];
    if (!endpoint) {
      throw new Error(`Type d'élément non supporté: ${type}`);
    }

    return endpoint;
  }

  /**
   * Supprime un élément de catégorie
   */
  async deleteCategoryElement(type: string, id: number): Promise<DeleteCategoryResult> {
    try {
      const endpoint = this.getEndpoint(type, id);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.status === 204) {
        return { success: true, message: 'Élément supprimé avec succès' };
      }

      const error = await response.json();

      if (response.status === 404) {
        return {
          success: false,
          error: `Élément non trouvé: ${error.message}`,
          message: "L'élément que vous essayez de supprimer n'existe pas."
        };
      }

      if (response.status === 409) {
        return {
          success: false,
          error: error.error,
          message: error.message,
          details: error.details
        };
      }

      return {
        success: false,
        error: `Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`
      };

    } catch (error) {
      console.error(`Erreur lors de la suppression ${type} ${id}:`, error);
      return {
        success: false,
        error: 'Erreur réseau ou serveur indisponible'
      };
    }
  }

  /**
   * Supprime un élément avec gestion des notifications
   */
  async deleteWithNotification(
    type: string,
    id: number,
    elementName: string,
    onSuccess?: () => void,
    onError?: (result: DeleteCategoryResult) => void
  ): Promise<DeleteCategoryResult | null> {
    try {
      const result = await this.deleteCategoryElement(type, id);

      if (result.success) {
        const typeLabels = {
          category: 'Catégorie',
          subcategory: 'Sous-catégorie',
          variation: 'Variation'
        };

        toast.success(`${typeLabels[type as keyof typeof typeLabels]} "${elementName}" supprimée avec succès`);

        if (onSuccess) {
          onSuccess();
        }

        return result;
      } else {
        // Afficher un message d'erreur approprié
        if (result.details?.productsCount && result.details.productsCount > 0) {
          toast.error(result.message || "Impossible de supprimer: des produits sont associés", {
            description: `${result.details.productsCount} produit(s) utilise(nt) cet élément`,
            duration: 5000
          });
        } else {
          toast.error(result.message || result.error || 'Erreur lors de la suppression');
        }

        if (onError) {
          onError(result);
        }

        return result;
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');

      return {
        success: false,
        error: 'Erreur inconnue lors de la suppression'
      };
    }
  }

  /**
   * Vérifie si un élément peut être supprimé (sans produits associés)
   */
  async canDeleteElement(type: string, id: number): Promise<{ canDelete: boolean; productsCount?: number; error?: string }> {
    try {
      const result = await this.deleteCategoryElement(type, id);

      if (result.success) {
        return { canDelete: true, productsCount: 0 };
      }

      if (result.details?.productsCount !== undefined) {
        return {
          canDelete: false,
          productsCount: result.details.productsCount,
          error: result.message
        };
      }

      return { canDelete: false, error: result.message || result.error };

    } catch (error) {
      return { canDelete: false, error: 'Erreur lors de la vérification' };
    }
  }
}

export default new CategoryDeleteService();