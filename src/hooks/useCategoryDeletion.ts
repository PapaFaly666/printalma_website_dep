/**
 * Hook personnalisé pour gérer la suppression sécurisée des catégories
 * Basé sur la documentation CATEGORY_PROTECTION_VISUAL.md
 */

import { useState } from 'react';
import { categoryProtectionService, DeletionError } from '../services/categoryProtectionService';

export interface DeletionResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  suggestedAction?: string;
  blockers?: {
    total?: number;
    directProducts?: number;
    subCategoryProducts?: number;
    variationProducts?: number;
    productsCount?: number;
  };
  message?: string;
}

export const useCategoryDeletion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Supprime une catégorie avec protection
   */
  const deleteCategory = async (categoryId: number, skipConfirmation = false): Promise<DeletionResult> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Vérifier si la suppression est possible
      const canDelete = await categoryProtectionService.canDeleteCategory(categoryId);

      if (!canDelete.data.canDelete) {
        // Retourner les informations de blocage sans supprimer
        setLoading(false);
        return {
          success: false,
          blockers: canDelete.data.blockers,
          error: canDelete.data.message,
          suggestedAction: 'Déplacez les produits vers une autre catégorie avant de supprimer celle-ci.'
        };
      }

      // 2. Demander confirmation si nécessaire
      if (!skipConfirmation) {
        const confirmed = window.confirm(
          'Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.'
        );

        if (!confirmed) {
          setLoading(false);
          return { success: false, cancelled: true };
        }
      }

      // 3. Procéder à la suppression
      const result = await categoryProtectionService.deleteCategory(categoryId);

      setLoading(false);
      return { success: true, message: result.message };

    } catch (err) {
      setLoading(false);

      if ((err as DeletionError).code) {
        const deletionError = err as DeletionError;
        setError(deletionError.message);
        return {
          success: false,
          error: deletionError.message,
          suggestedAction: deletionError.details.suggestedAction,
          blockers: {
            directProducts: deletionError.details.directProductsCount,
            total: deletionError.details.directProductsCount || 0
          }
        };
      }

      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Supprime une sous-catégorie avec protection
   */
  const deleteSubCategory = async (subCategoryId: number, skipConfirmation = false): Promise<DeletionResult> => {
    setLoading(true);
    setError(null);

    try {
      const canDelete = await categoryProtectionService.canDeleteSubCategory(subCategoryId);

      if (!canDelete.data.canDelete) {
        setLoading(false);
        return {
          success: false,
          blockers: canDelete.data.blockers,
          error: canDelete.data.message,
          suggestedAction: 'Déplacez les produits vers une autre sous-catégorie avant de la supprimer.'
        };
      }

      if (!skipConfirmation) {
        const confirmed = window.confirm(
          'Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?'
        );

        if (!confirmed) {
          setLoading(false);
          return { success: false, cancelled: true };
        }
      }

      const result = await categoryProtectionService.deleteSubCategory(subCategoryId);

      setLoading(false);
      return { success: true, message: result.message };

    } catch (err) {
      setLoading(false);

      if ((err as DeletionError).code) {
        const deletionError = err as DeletionError;
        setError(deletionError.message);
        return {
          success: false,
          error: deletionError.message,
          suggestedAction: deletionError.details.suggestedAction,
          blockers: {
            directProducts: deletionError.details.directProductsCount,
            total: deletionError.details.directProductsCount || 0
          }
        };
      }

      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Supprime une variation avec protection
   */
  const deleteVariation = async (variationId: number, skipConfirmation = false): Promise<DeletionResult> => {
    setLoading(true);
    setError(null);

    try {
      const canDelete = await categoryProtectionService.canDeleteVariation(variationId);

      if (!canDelete.data.canDelete) {
        setLoading(false);
        return {
          success: false,
          blockers: canDelete.data.blockers,
          error: canDelete.data.message,
          suggestedAction: 'Déplacez les produits vers une autre variation avant de la supprimer.'
        };
      }

      if (!skipConfirmation) {
        const confirmed = window.confirm(
          'Êtes-vous sûr de vouloir supprimer cette variation ?'
        );

        if (!confirmed) {
          setLoading(false);
          return { success: false, cancelled: true };
        }
      }

      const result = await categoryProtectionService.deleteVariation(variationId);

      setLoading(false);
      return { success: true, message: result.message };

    } catch (err) {
      setLoading(false);

      if ((err as DeletionError).code) {
        const deletionError = err as DeletionError;
        setError(deletionError.message);
        return {
          success: false,
          error: deletionError.message,
          suggestedAction: deletionError.details.suggestedAction,
          blockers: {
            productsCount: deletionError.details.productsCount,
            total: deletionError.details.productsCount || 0
          }
        };
      }

      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Vérifie si une catégorie peut être supprimée sans la supprimer
   */
  const checkCanDeleteCategory = async (categoryId: number) => {
    try {
      return await categoryProtectionService.canDeleteCategory(categoryId);
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      return null;
    }
  };

  /**
   * Vérifie si une sous-catégorie peut être supprimée sans la supprimer
   */
  const checkCanDeleteSubCategory = async (subCategoryId: number) => {
    try {
      return await categoryProtectionService.canDeleteSubCategory(subCategoryId);
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      return null;
    }
  };

  /**
   * Vérifie si une variation peut être supprimée sans la supprimer
   */
  const checkCanDeleteVariation = async (variationId: number) => {
    try {
      return await categoryProtectionService.canDeleteVariation(variationId);
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      return null;
    }
  };

  return {
    deleteCategory,
    deleteSubCategory,
    deleteVariation,
    checkCanDeleteCategory,
    checkCanDeleteSubCategory,
    checkCanDeleteVariation,
    loading,
    error
  };
};
