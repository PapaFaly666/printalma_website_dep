import { useState, useEffect, useCallback, useMemo } from 'react';
import { VendorProduct, PostValidationAction } from '../types/cascadeValidation';
import { cascadeValidationService } from '../services/cascadeValidationService';
import { vendorProductService } from '../services/vendorProductService';
import { toast } from 'sonner';

export interface VendorProductsWithDeduplication {
  products: VendorProduct[];
  loading: boolean;
  error: string | null;
  stats: {
    totalProducts: number;
    publishedProducts: number;
    draftProducts: number;
    pendingProducts: number;
    validatedDrafts: number;
    autoPublishPending: number;
    manualPublishPending: number;
  };
  loadProducts: (filters?: Record<string, any>) => Promise<void>;
  publishDraft: (productId: number) => Promise<{ success: boolean; message: string }>;
  createProduct: (productData: any) => Promise<any>;
  updatePostValidationAction: (productId: number, action: PostValidationAction) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

export const useVendorProductsWithDeduplication = (): VendorProductsWithDeduplication => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!products.length) {
      return {
        totalProducts: 0,
        publishedProducts: 0,
        draftProducts: 0,
        pendingProducts: 0,
        validatedDrafts: 0,
        autoPublishPending: 0,
        manualPublishPending: 0
      };
    }

    return {
      totalProducts: products.length,
      publishedProducts: products.filter(p => p.status === 'PUBLISHED').length,
      draftProducts: products.filter(p => p.status === 'DRAFT').length,
      pendingProducts: products.filter(p => p.status === 'PENDING').length,
      validatedDrafts: products.filter(p => p.status === 'DRAFT' && p.isValidated).length,
      autoPublishPending: products.filter(p => 
        p.status === 'PENDING' && p.postValidationAction === PostValidationAction.AUTO_PUBLISH
      ).length,
      manualPublishPending: products.filter(p => 
        p.status === 'PENDING' && p.postValidationAction === PostValidationAction.TO_DRAFT
      ).length
    };
  }, [products]);

  // Charger les produits
  const loadProducts = useCallback(async (filters: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Chargement des produits vendeur...');
      const fetchedProducts = await cascadeValidationService.getVendorProducts(filters);
      setProducts(fetchedProducts);
      console.log('✅ Produits chargés:', fetchedProducts.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
      setError(errorMessage);
      console.error('❌ Erreur chargement produits:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Publier un brouillon validé
  const publishDraft = useCallback(async (productId: number) => {
    try {
      console.log('📤 Publication du brouillon:', productId);
      
      // Vérifier le statut du produit avant publication
      const productToPublish = products.find(p => p.id === productId);
      const isValidated = productToPublish?.isValidated || false;
      
      if (!isValidated) {
        console.log('⚠️ Publication d\'un brouillon non validé');
      }
      
      const updatedProduct = await cascadeValidationService.publishValidatedProduct(productId);
      
      // Mettre à jour le produit dans la liste
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, status: 'PUBLISHED', publishedAt: new Date().toISOString() }
          : p
      ));
      
      if (isValidated) {
        toast.success('✅ Brouillon validé publié avec succès !');
      } else {
        toast.success('✅ Brouillon publié avec succès !', {
          description: 'Attention : ce produit n\'était pas encore validé par l\'admin'
        });
      }
      
      return { success: true, message: 'Produit publié avec succès' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la publication';
      toast.error(`❌ ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }, [products]);

  // Créer un produit avec gestion de la déduplication
  const createProduct = useCallback(async (productData: any) => {
    try {
      console.log('🆕 Création du produit avec déduplication...');
      const result = await vendorProductService.createVendorProduct(productData);
      
      // Gestion des notifications de déduplication
      if ((result as any).isDesignReused) {
        toast.success(
          `✅ Produit créé avec design existant réutilisé (ID: ${(result as any).designId})`,
          { duration: 7000 }
        );
        console.log('♻️ Design réutilisé - déduplication réussie');
      } else {
        toast.success('✅ Produit créé avec nouveau design');
        console.log('🆕 Nouveau design créé');
      }
      
      // Informer sur l'action post-validation
      if (productData.postValidationAction === PostValidationAction.TO_DRAFT) {
        toast.info('ℹ️ Produit sera en brouillon après validation admin', { duration: 6000 });
      } else {
        toast.info('ℹ️ Produit sera publié automatiquement après validation admin', { duration: 6000 });
      }
      
      // Recharger la liste des produits
      await loadProducts();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du produit';
      toast.error(`❌ ${errorMessage}`);
      throw err;
    }
  }, [loadProducts]);

  // Mettre à jour l'action post-validation
  const updatePostValidationAction = useCallback(async (productId: number, action: PostValidationAction) => {
    try {
      console.log('🔄 Mise à jour action post-validation:', { productId, action });
      const updatedProduct = await cascadeValidationService.updatePostValidationAction(productId, action);
      
      // Mettre à jour le produit dans la liste
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, postValidationAction: action }
          : p
      ));
      
      const actionText = action === PostValidationAction.AUTO_PUBLISH
        ? 'Publication automatique'
        : 'Publication manuelle';
      
      toast.success(`✅ Action mise à jour: ${actionText}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      toast.error(`❌ ${errorMessage}`);
      throw err;
    }
  }, []);

  // Actualiser les produits (détecte les changements de cascade)
  const refreshProducts = useCallback(async () => {
    try {
      console.log('🔄 Actualisation pour détecter les changements de cascade...');
      const refreshedProducts = await cascadeValidationService.refreshAllProducts();
      
      // Comparer avec les anciens produits pour détecter les changements
      const oldProductsMap = new Map(products.map(p => [p.id, p]));
      const cascadeChanges = refreshedProducts.filter(newProduct => {
        const oldProduct = oldProductsMap.get(newProduct.id);
        return oldProduct && (
          oldProduct.status !== newProduct.status ||
          oldProduct.isValidated !== newProduct.isValidated
        );
      });
      
      if (cascadeChanges.length > 0) {
        toast.info(`🔄 ${cascadeChanges.length} produit(s) mis à jour par validation cascade`, { duration: 6000 });
        console.log('🔄 Changements détectés par cascade:', cascadeChanges);
      }
      
      setProducts(refreshedProducts);
    } catch (err) {
      console.error('❌ Erreur actualisation:', err);
    }
  }, [products]);

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(refreshProducts, 30000);
    return () => clearInterval(interval);
  }, [refreshProducts]);

  // Chargement initial
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    stats,
    loadProducts,
    publishDraft,
    createProduct,
    updatePostValidationAction,
    refreshProducts
  };
}; 
 
 
 
 
 