import { useState, useEffect } from 'react';
import { PostValidationAction } from '../types/cascadeValidation';
import { cascadeValidationService } from '../services/cascadeValidationService';
import { toast } from 'sonner';

export const useCascadeValidationIntegrated = () => {
  const [postValidationAction, setPostValidationAction] = useState<PostValidationAction>(
    PostValidationAction.AUTO_PUBLISH
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    validatedDrafts: 0,
    autoPublishPending: 0,
    manualPublishPending: 0
  });

  // Mettre à jour l'action post-validation d'un produit
  const updatePostValidationAction = async (productId: number, action: PostValidationAction) => {
    setIsUpdating(true);
    try {
      const response = await cascadeValidationService.updatePostValidationAction(productId, action);
      if (response.success) {
        toast.success('Action post-validation mise à jour');
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur mise à jour action:', error);
      toast.error(error?.message || 'Erreur lors de la mise à jour');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Publier un produit validé
  const publishValidatedProduct = async (productId: number) => {
    try {
      const response = await cascadeValidationService.publishValidatedProduct(productId);
      if (response.success) {
        toast.success('Produit publié avec succès !');
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la publication');
      }
    } catch (error: any) {
      console.error('Erreur publication:', error);
      toast.error(error?.message || 'Erreur lors de la publication');
      throw error;
    }
  };

  // Récupérer les produits avec statistiques
  const getProductsWithStats = async () => {
    try {
      const products = await cascadeValidationService.getVendorProducts();
      const productStats = cascadeValidationService.getProductStats(products);
      setStats(productStats);
      return products;
    } catch (error: any) {
      console.error('Erreur récupération produits:', error);
      toast.error(error?.message || 'Erreur lors du chargement des produits');
      throw error;
    }
  };

  // Vérifier si un produit peut être publié manuellement
  const canPublishManually = (product: any): boolean => {
    return cascadeValidationService.canPublishManually(product);
  };

  // Vérifier si un produit peut être modifié
  const canModifyProduct = (product: any): boolean => {
    return cascadeValidationService.canModifyProduct(product);
  };

  // Obtenir le statut d'affichage pour un produit
  const getDisplayStatus = (product: any) => {
    return cascadeValidationService.getDisplayStatus(product);
  };

  // Actualiser les produits pour détecter les changements de cascade
  const refreshProducts = async () => {
    try {
      return await cascadeValidationService.refreshAllProducts();
    } catch (error: any) {
      console.error('Erreur actualisation:', error);
      toast.error(error?.message || 'Erreur lors de l\'actualisation');
      throw error;
    }
  };

  // Créer un produit avec action post-validation
  const createProductWithAction = async (productData: {
    vendorName: string;
    vendorDescription: string;
    vendorPrice: number;
    designCloudinaryUrl: string;
    postValidationAction: PostValidationAction;
  }) => {
    try {
      const response = await cascadeValidationService.createProductWithAction(productData);
      if (response.success) {
        toast.success('Produit créé avec succès !');
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('Erreur création produit:', error);
      toast.error(error?.message || 'Erreur lors de la création du produit');
      throw error;
    }
  };

  return {
    // État
    postValidationAction,
    setPostValidationAction,
    isUpdating,
    stats,
    
    // Actions
    updatePostValidationAction,
    publishValidatedProduct,
    getProductsWithStats,
    canPublishManually,
    canModifyProduct,
    getDisplayStatus,
    refreshProducts,
    createProductWithAction,
  };
}; 