import { useState, useEffect, useCallback } from 'react';
import designDuplicateService, { 
  DuplicateCheckResult, 
  DesignPosition, 
  DesignUsage 
} from '../services/designDuplicateService';

export interface ProductDuplicateState {
  [productId: number]: {
    status: DuplicateCheckResult | null;
    isLoading: boolean;
    lastChecked: number | null;
    currentPosition: DesignPosition | null;
  };
}

export const useDesignDuplicateCheck = (designId: number | null, designUrl: string | null) => {
  const [productStates, setProductStates] = useState<ProductDuplicateState>({});
  const [allUsages, setAllUsages] = useState<DesignUsage[]>([]);
  const [isLoadingUsages, setIsLoadingUsages] = useState(false);

  // Charger tous les usages du design une fois
  useEffect(() => {
    if (designId) {
      loadDesignUsages();
    } else {
      setAllUsages([]);
      setProductStates({});
    }
  }, [designId]);

  const loadDesignUsages = async () => {
    if (!designId) return;
    
    setIsLoadingUsages(true);
    try {
      const usages = await designDuplicateService.getDesignUsages(designId);
      setAllUsages(usages);
    } catch (error) {
      console.error('Erreur lors du chargement des usages:', error);
      setAllUsages([]);
    } finally {
      setIsLoadingUsages(false);
    }
  };

  const checkProduct = useCallback(async (
    productId: number,
    position: DesignPosition,
    force: boolean = false
  ) => {
    if (!designId) return;

    const currentState = productStates[productId];
    const now = Date.now();

    // Éviter les vérifications trop fréquentes (sauf si force = true)
    if (!force && currentState?.lastChecked && (now - currentState.lastChecked < 1000)) {
      return;
    }

    // Marquer comme en cours de vérification
    setProductStates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isLoading: true,
        currentPosition: position
      }
    }));

    try {
      // Utiliser la méthode mock pour éviter les appels réseau
      const result = designDuplicateService.mockCheckDesignDuplicate(
        designId,
        productId,
        position,
        allUsages
      );

      setProductStates(prev => ({
        ...prev,
        [productId]: {
          status: result,
          isLoading: false,
          lastChecked: now,
          currentPosition: position
        }
      }));

    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      
      // En cas d'erreur, marquer comme neutre
      setProductStates(prev => ({
        ...prev,
        [productId]: {
          status: {
            status: 'NEUTRAL',
            message: 'Impossible de vérifier les doublons. Vous pouvez procéder.',
            canPublish: true,
            canRepositionAndPublish: true
          },
          isLoading: false,
          lastChecked: now,
          currentPosition: position
        }
      }));
    }
  }, [designId, allUsages, productStates]);

  const checkMultipleProducts = useCallback(async (
    productIds: number[],
    getPosition: (productId: number) => DesignPosition | null
  ) => {
    if (!designId) return;

    // Vérifier tous les produits en parallèle
    const promises = productIds.map(productId => {
      const position = getPosition(productId);
      if (position) {
        return checkProduct(productId, position, true);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  }, [designId, checkProduct]);

  const getProductStatus = useCallback((productId: number): DuplicateCheckResult | null => {
    return productStates[productId]?.status || null;
  }, [productStates]);

  const isProductLoading = useCallback((productId: number): boolean => {
    return productStates[productId]?.isLoading || false;
  }, [productStates]);

  const canPublishProduct = useCallback((productId: number): boolean => {
    const status = getProductStatus(productId);
    return status?.canPublish !== false;
  }, [getProductStatus]);

  const canRepositionProduct = useCallback((productId: number): boolean => {
    const status = getProductStatus(productId);
    return status?.canRepositionAndPublish !== false;
  }, [getProductStatus]);

  const getPositionForProduct = useCallback((productId: number): DesignPosition | null => {
    return productStates[productId]?.currentPosition || null;
  }, [productStates]);

  const recordUsage = useCallback(async (
    productId: number,
    position: DesignPosition,
    colorVariation?: string,
    view?: string
  ) => {
    if (!designId) return;

    try {
      const usage = await designDuplicateService.recordDesignUsage(
        designId,
        productId,
        position,
        colorVariation,
        view
      );

      // Mettre à jour la liste des usages
      setAllUsages(prev => [...prev, usage]);

      // Remettre à jour le statut de ce produit
      await checkProduct(productId, position, true);

      return usage;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'usage:', error);
      throw error;
    }
  }, [designId, checkProduct]);

  const resetProductState = useCallback((productId: number) => {
    setProductStates(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  }, []);

  const resetAllStates = useCallback(() => {
    setProductStates({});
    setAllUsages([]);
  }, []);

  return {
    // États
    productStates,
    allUsages,
    isLoadingUsages,
    
    // Méthodes de vérification
    checkProduct,
    checkMultipleProducts,
    
    // Méthodes de consultation
    getProductStatus,
    isProductLoading,
    canPublishProduct,
    canRepositionProduct,
    getPositionForProduct,
    
    // Méthodes d'action
    recordUsage,
    resetProductState,
    resetAllStates,
    
    // Méthodes utilitaires
    loadDesignUsages
  };
}; 