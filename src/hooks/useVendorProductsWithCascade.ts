import { useState, useEffect, useCallback } from 'react';
import { useVendorProducts } from './useVendorProducts';
import { CascadeValidationService } from '../services/cascadeValidationService';
import { vendorProductService } from '../services/vendorProductService';
import { VendorProduct as CascadeVendorProduct, PostValidationAction } from '../types/cascadeValidation';
import { toast } from 'sonner';

export const useVendorProductsWithCascade = () => {
  const {
    products: legacyProducts,
    loading,
    error,
    refetch,
    stats
  } = useVendorProducts();
  
  const [cascadeProducts, setCascadeProducts] = useState<CascadeVendorProduct[]>([]);
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const [cascadeError, setCascadeError] = useState<string | null>(null);

  // Récupérer les produits avec cascade validation
  const fetchCascadeProducts = useCallback(async () => {
    setCascadeLoading(true);
    setCascadeError(null);
    
    try {
      const result = await CascadeValidationService.listVendorProducts();
      // Certaines implémentations backend renvoient { products: [...] }
      const productsArray = Array.isArray(result)
        ? result
        : (Array.isArray((result as any)?.products) ? (result as any).products : []);

      setCascadeProducts(productsArray);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des produits cascade:', error);
      setCascadeError('Erreur lors du chargement des produits cascade');
    } finally {
      setCascadeLoading(false);
    }
  }, []);

  // Publier un produit validé manuellement
  const publishValidatedDraft = useCallback(async (productId: number) => {
    try {
      await CascadeValidationService.publishValidatedDraft(productId);
      toast.success('Produit publié avec succès !');
      
      // Mettre à jour les produits cascade
      await fetchCascadeProducts();
      
      // Rafraîchir aussi les produits legacy
      await refetch();
      
    } catch (error) {
      console.error('❌ Erreur lors de la publication:', error);
      toast.error('Erreur lors de la publication du produit');
      throw error;
    }
  }, [fetchCascadeProducts, refetch]);

  // Modifier l'action post-validation
  const updatePostValidationAction = useCallback(async (productId: number, action: PostValidationAction) => {
    try {
      await CascadeValidationService.updatePostValidationAction(productId, action);
      toast.success('Action post-validation modifiée avec succès !');
      
      // Mettre à jour les produits cascade
      await fetchCascadeProducts();
      
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification de l\'action');
      throw error;
    }
  }, [fetchCascadeProducts]);

  // Créer un produit avec cascade validation
  const createProductWithCascade = useCallback(async (payload: {
    vendorName: string;
    vendorPrice: number;
    designCloudinaryUrl: string;
    postValidationAction: PostValidationAction;
    productStructure: any;
  }) => {
    try {
      const result = await vendorProductService.createVendorProduct({
        ...payload,
        baseProductId: payload.productStructure.adminProduct?.id || 1,
        selectedColors: [],
        selectedSizes: [],
        finalImagesBase64: {}
      });
      toast.success('Produit créé avec succès !');
      
      // Rafraîchir les produits
      await fetchCascadeProducts();
      await refetch();
      
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      toast.error('Erreur lors de la création du produit');
      throw error;
    }
  }, [fetchCascadeProducts, refetch]);

  // Transformer les produits legacy en format cascade pour l'affichage unifié
  const transformLegacyToCascade = useCallback((legacyProduct: any): CascadeVendorProduct => {
    return {
      id: legacyProduct.id,
      name: legacyProduct.name || legacyProduct.vendorName || 'Produit sans nom',
      vendorName: legacyProduct.name || legacyProduct.vendorName || 'Produit sans nom',
      vendorDescription: legacyProduct.description || legacyProduct.vendorDescription || '',
      vendorPrice: legacyProduct.vendorPrice || legacyProduct.price || 0,
      vendorStock: legacyProduct.vendorStock || 0,
      status: legacyProduct.status || 'DRAFT',
      isValidated: legacyProduct.isValidated || false,
      postValidationAction: PostValidationAction.AUTO_PUBLISH, // Valeur par défaut pour les anciens produits
      validatedAt: legacyProduct.validatedAt,
      publishedAt: legacyProduct.publishedAt,
      rejectionReason: legacyProduct.rejectionReason,
      designCloudinaryUrl: legacyProduct.designUrl || legacyProduct.designCloudinaryUrl,
      // productStructure: legacyProduct.productStructure || {},
      createdAt: legacyProduct.createdAt || new Date().toISOString(),
      updatedAt: legacyProduct.updatedAt || new Date().toISOString()
    };
  }, []);

  // Combiner les produits legacy et cascade pour l'affichage
  const allProducts = useCallback(() => {
    const legacyAsCascade = legacyProducts.map(transformLegacyToCascade);
    return [...cascadeProducts, ...legacyAsCascade];
  }, [legacyProducts, cascadeProducts, transformLegacyToCascade]);

  // Rafraîchir tous les produits
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchCascadeProducts(),
      refetch()
    ]);
  }, [fetchCascadeProducts, refetch]);

  // Charger les produits cascade au montage
  useEffect(() => {
    fetchCascadeProducts();
  }, [fetchCascadeProducts]);

  return {
    // Produits combinés
    products: allProducts(),
    
    // États de chargement
    loading: loading || cascadeLoading,
    error: error || cascadeError,
    
    // Produits séparés
    legacyProducts,
    cascadeProducts,
    
    // Actions
    publishValidatedDraft,
    updatePostValidationAction,
    createProductWithCascade,
    refreshAll,
    
    // Actions legacy
    refetch,
    
    // Statistiques
    stats,
    
    // Utilitaires
    canPublishManually: CascadeValidationService.canPublishManually,
    canModifyProduct: CascadeValidationService.canModifyProduct,
    getProductDisplayStatus: CascadeValidationService.getDisplayStatus
  };
}; 
 