// Hook personnalisé pour le système de validation en cascade V3

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  PostValidationAction, 
  VendorProduct, 
  ProductFilters, 
  CascadeValidationStats,
  Design,
  VendorPublishDto,
  VendorPublishResponseDto
} from '../types/cascadeValidation';
import { cascadeValidationService } from '../services/cascadeValidationService';

export interface UseCascadeValidationReturn {
  // État
  loading: boolean;
  products: VendorProduct[];
  error: string | null;
  
  // Actions produits
  updatePostValidationAction: (productId: number, action: PostValidationAction) => Promise<VendorProduct | null>;
  publishValidatedProduct: (productId: number) => Promise<VendorProduct | null>;
  createVendorProduct: (productData: VendorPublishDto) => Promise<VendorPublishResponseDto | null>;
  refreshProducts: () => Promise<void>;
  
  // Filtres
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  
  // Statistiques
  stats: CascadeValidationStats | null;
  loadStats: () => Promise<void>;
}

export const useCascadeValidation = (initialFilters?: ProductFilters): UseCascadeValidationReturn => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters || {});
  const [stats, setStats] = useState<CascadeValidationStats | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await cascadeValidationService.getVendorProducts(filters);
      const fetchedProducts: VendorProduct[] = Array.isArray(fetched) ? fetched : [];
      console.log('🔄 Produits récupérés V3:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      console.error('❌ Erreur fetchProducts V3:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updatePostValidationAction = useCallback(async (
    productId: number, 
    action: PostValidationAction
  ): Promise<VendorProduct | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 V3: Mise à jour action post-validation pour produit ${productId}:`, action);
      
      const updateResponse = await cascadeValidationService.updatePostValidationAction(
        productId, 
        action
      );
      const updatedProduct: VendorProduct = (updateResponse as any).product || (updateResponse as any).data || (updateResponse as any);
      
      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? updatedProduct
          : p
      ));

      console.log('✅ V3: Action post-validation mise à jour avec succès');
      toast.success('Action post-validation modifiée avec succès');
      return updatedProduct;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      toast.error(err.message || 'Erreur lors de la mise à jour');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishValidatedProduct = useCallback(async (productId: number): Promise<VendorProduct | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🚀 V3: Publication du produit ${productId}...`);
      
      const publishResponse = await cascadeValidationService.publishValidatedProduct(productId);
      const publishedProduct: VendorProduct = (publishResponse as any).product || (publishResponse as any).data || (publishResponse as any);
      
      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? publishedProduct
          : p
      ));

      console.log('✅ V3: Produit publié avec succès');
      toast.success('Produit publié avec succès');
      return publishedProduct;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication');
      toast.error(err.message || 'Erreur lors de la publication');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVendorProduct = useCallback(async (productData: VendorPublishDto): Promise<VendorPublishResponseDto | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 V3: Création produit vendeur...', productData);
      
      // Certaines versions du service n'exposent pas createVendorProduct → fallback createProductWithAction
      let result: any;
      if ((cascadeValidationService as any).createVendorProduct) {
        result = await (cascadeValidationService as any).createVendorProduct(productData);
      } else {
        const action = productData.postValidationAction ?? PostValidationAction.TO_DRAFT;
        const payload = {
          vendorName: productData.vendorName,
          vendorDescription: productData.vendorDescription || '',
          vendorPrice: productData.vendorPrice,
          designCloudinaryUrl: (productData as any).designUrl || (productData as any).designCloudinaryUrl || '',
          postValidationAction: action,
          productStructure: productData.productStructure
        };
        result = await cascadeValidationService.createProductWithAction(payload);
      }
      
      console.log('✅ V3: Produit créé:', result);
      toast.success(`Produit créé avec succès${result.needsValidation ? ' - En attente de validation' : ''}`);
      
      // Recharger les produits
      await fetchProducts();
      
      return result;
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      console.error('❌ V3: Erreur createVendorProduct:', message);
      toast.error(message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction utilitaire pour récupérer des statistiques détaillées via le service
  const getProductStats = useCallback(() => {
    return cascadeValidationService.getProductStats(products);
  }, [products]);

  // Actualiser un produit spécifique (pour vérifier cascade)
  const refreshProduct = useCallback(async (productId: number) => {
    try {
      console.log(`🔄 V3: Actualisation du produit ${productId}...`);
      
      const updatedProduct = await cascadeValidationService.checkProductState(productId);
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? updatedProduct : p
        ));
        console.log('✅ V3: Produit actualisé:', updatedProduct);
      }
    } catch (error) {
      console.error('❌ V3: Erreur actualisation produit:', error);
    }
  }, []);

  // Actualiser tous les produits
  const refreshAllProducts = useCallback(async () => {
    console.log('🔄 V3: Actualisation complète des produits...');
    await fetchProducts();
  }, [fetchProducts]);

  const loadStats = useCallback(async (): Promise<void> => {
    try {
      // getValidationStats peut ne pas exister → calculer à partir des produits si nécessaire
      if ((cascadeValidationService as any).getValidationStats) {
        const statsData = await (cascadeValidationService as any).getValidationStats();
        setStats(statsData);
      } else {
        const s = cascadeValidationService.getProductStats(products);
        setStats({
          total: s.total,
          pending: s.pending,
          published: s.published,
          readyToPublish: s.validatedDrafts,
          totalProducts: s.total,
          pendingProducts: s.pending,
          publishedProducts: s.published,
          draftProducts: s.validatedDrafts,
          validatedProducts: s.validatedDrafts
        });
      }
      console.log('📊 V3: Statistiques chargées');
    } catch (err: any) {
      console.error('❌ V3: Erreur chargement stats:', err);
    }
  }, []);

  // Auto-refresh avec intervalle configurable
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('⏰ V3: Auto-refresh des produits (cascade detection)...');
      refreshAllProducts();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh, refreshAllProducts]);

  // Charger au montage
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Debug: Logger les changements d'état
  useEffect(() => {
    if (products.length > 0) {
      const stats = getProductStats();
      console.log('📊 V3: Statistiques produits:', stats);
    }
  }, [products, getProductStats]);

  return {
    loading,
    products,
    error,
    updatePostValidationAction,
    publishValidatedProduct,
    createVendorProduct,
    refreshProducts: refreshAllProducts,
    filters,
    setFilters,
    stats,
    loadStats
  };
};

// Hook pour les notifications en temps réel (WebSocket) - V3
export const useCascadeNotifications = (onProductUpdate?: (productIds: number[]) => void) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Simuler WebSocket pour l'instant
    // Dans une vraie implémentation, vous utiliseriez socket.io
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cascade-notification-v3') {
        const notification = JSON.parse(e.newValue || '{}');
        setNotifications(prev => [...prev, notification]);
        
        if (onProductUpdate && notification.productIds) {
          onProductUpdate(notification.productIds);
        }
        
        // Afficher toast selon le type
        switch (notification.type) {
          case 'PRODUCTS_AUTO_PUBLISHED':
            toast.success(`🚀 ${notification.productIds.length} produit(s) publié(s) automatiquement`);
            break;
          case 'PRODUCTS_VALIDATED_TO_DRAFT':
            toast.success(`📝 ${notification.productIds.length} produit(s) validé(s) en brouillon`);
            break;
          case 'PRODUCT_MANUALLY_PUBLISHED':
            toast.success('🎉 Produit publié manuellement');
            break;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [onProductUpdate]);

  return { notifications };
};

// Hook pour les admins - V3
export const useAdminCascadeValidation = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      if ((cascadeValidationService as any).getValidationStats) {
        const s = await (cascadeValidationService as any).getValidationStats();
        setStats(s);
      }
      console.log('📊 V3 Admin: Statistiques chargées');
    } catch (err: any) {
      console.error('❌ V3 Admin: Erreur chargement stats:', err);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await cascadeValidationService.getPendingProducts();
      const items: VendorProduct[] = Array.isArray(response) ? response : (response?.products || []);
      setPendingProducts(items);
      console.log('📋 V3 Admin: Produits en attente chargés:', items.length);
    } catch (err: any) {
      console.error('❌ V3 Admin: Erreur chargement produits en attente:', err);
      toast.error('Erreur lors du chargement des produits en attente');
    } finally {
      setLoading(false);
    }
  }, []);

  const validateDesign = useCallback(async (designId: number, action: 'VALIDATE' | 'REJECT', rejectionReason?: string) => {
    setLoading(true);
    try {
      console.log(`🎨 V3 Admin: Validation design ${designId} avec action: ${action}`);
      
      await cascadeValidationService.validateDesign(designId, action, rejectionReason);
      
      if (action === 'VALIDATE') {
        toast.success('🌊 Design validé ! Cascade appliquée sur tous les produits');
      } else {
        toast.success('❌ Design rejeté');
      }
      
      // Recharger les données
      await Promise.all([loadStats(), loadPendingProducts()]);
      
    } catch (err: any) {
      console.error('❌ V3 Admin: Erreur validation design:', err);
      toast.error(err.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadPendingProducts]);

  return {
    loading,
    stats,
    pendingProducts,
    loadStats,
    loadPendingProducts,
    validateDesign
  };
};

export default useCascadeValidation; 