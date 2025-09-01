import { useState, useEffect, useCallback } from 'react';
import { cascadeValidationService } from '../services/cascadeValidationService';
import { VendorProduct, PostValidationAction } from '../types/cascadeValidation';

export const useCascadeValidation = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les produits
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des produits vendeur...');
      
      const data = await cascadeValidationService.getVendorProducts();
      console.log('📦 Produits récupérés:', data.length);
      
      setProducts(data);
    } catch (err: any) {
      console.error('❌ Erreur chargement produits:', err);
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour l'action post-validation
  const updatePostValidationAction = useCallback(async (
    productId: number, 
    action: PostValidationAction
  ) => {
    const result = await cascadeValidationService.updatePostValidationAction(productId, action);
    
    if (result.success) {
      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, postValidationAction: action }
          : p
      ));
    }
    
    return result;
  }, []);

  // Publier un produit validé
  const publishProduct = useCallback(async (productId: number) => {
    const result = await cascadeValidationService.publishValidatedProduct(productId);
    
    if (result.success) {
      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, status: 'PUBLISHED' as any }
          : p
      ));
    }
    
    return result;
  }, []);

  // Actualiser un produit spécifique (pour vérifier cascade)
  const refreshProduct = useCallback(async (productId: number) => {
    try {
      const updatedProduct = await cascadeValidationService.checkProductState(productId);
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? updatedProduct : p
        ));
      }
    } catch (error) {
      console.error('Erreur actualisation produit:', error);
    }
  }, []);

  // Actualiser tous les produits
  const refreshAllProducts = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  // Charger au montage
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    updatePostValidationAction,
    publishProduct,
    refreshProduct,
    refreshAllProducts
  };
}; 