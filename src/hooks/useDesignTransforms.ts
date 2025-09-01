import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debugProductIds } from '../utils/vendorProductHelpers';
import { resolveVendorProductId, resolveVendorDesignId } from '../helpers/vendorIdResolvers';
import { designPositionManager, DesignPosition } from '../utils/designPositionManager';
import { MigrationHelper } from '../utils/migrationHelper';
// 🆕 INTÉGRATION LOCALSTORAGE
import { designPositionService } from '../services/DesignPositionService';
import { useAuth } from '../contexts/AuthContext';
// 🆕 NOUVEAU : Import du service pour sauvegarder au backend
import { vendorProductService } from '../services/vendorProductService';

// Types pour les transformations (V2)
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  // 🆕 Propriétés optionnelles pour les dimensions intrinsèques du design
  designWidth?: number;
  designHeight?: number;
  designScale?: number;
}

// Types pour les transformations
export interface DesignTransform extends Transform {}

// Hook principal pour gérer les transformations avec localStorage
export function useDesignTransforms(product: any, designUrl?: string, vendorProducts?: any[], vendorDesigns?: any[]) {
  const [transformStates, setTransformStates] = useState<Record<number, Transform>>({});
  const [isolatedPosition, setIsolatedPosition] = useState<DesignPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conception, setConception] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);

  // 🆕 NOUVEAU : Hook d'authentification pour récupérer l'ID vendeur
  const { user } = useAuth();
  const vendorId = user?.id || 0;

  const loadedRef = useRef(false);
  const productIdRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadParamsRef = useRef<string>('');
  const loadingRef = useRef(false);
  const designIdRef = useRef<number | null>(null);
  // 🆕 NOUVEAU : Refs pour localStorage
  const localStorageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔧 OPTIMISATION : Mémoriser les IDs pour éviter les recalculs
  const productIds = useMemo(() => {
    const vpId = resolveVendorProductId(product, vendorProducts);

    // Essayer de déterminer le vrai designId :
    const designCandidate = typeof product === 'object' && product ? { id: product.designId, imageUrl: designUrl } : { id: undefined, imageUrl: designUrl };
    const resolvedDesignId = resolveVendorDesignId(designCandidate, vendorDesigns || []);

    const designId = resolvedDesignId || product?.designId || 1;
    
    // Un vendorProductId est toujours ≥ 60 ;
    const validProductId = vpId && vpId >= 60 ? vpId : null;

    // 🆕 NOUVEAU : Récupérer baseProductId pour localStorage
    const baseProductId = typeof product === 'number' ? product : (product?.id || product?.baseProductId || 1);

    console.log('🔍 Product IDs resolved:', { 
      originalProduct: product, 
      resolvedVpId: vpId, 
      validProductId, 
      baseProductId, // 🆕 NOUVEAU
      designId,
      vendorProductsCount: vendorProducts?.length || 0
    });

    return { vpId, designId, validProductId, baseProductId };
  }, [product, vendorProducts, designUrl, vendorDesigns]);

  // 🔧 OPTIMISATION : Mémoriser les paramètres de chargement
  const loadParams = useMemo(() => {
    return JSON.stringify({
      productId: productIds.validProductId,
      baseProductId: productIds.baseProductId,
      designId: productIds.designId,
      designUrl: designUrl || 'no-url',
      vendorId
    });
  }, [productIds.validProductId, productIds.baseProductId, productIds.designId, designUrl, vendorId]);

  // 🆕 NOUVEAU : Fonction pour sauvegarder en localStorage avec debounce
  const saveToLocalStorage = useCallback(async (position: Transform) => {
    if (!vendorId || !productIds.baseProductId || !productIds.designId) {
      console.log('❌ Sauvegarde localStorage impossible: paramètres manquants', {
        vendorId,
        baseProductId: productIds.baseProductId,
        designId: productIds.designId
      });
      return;
    }

    // Clear previous timeout
    if (localStorageTimeoutRef.current) {
      clearTimeout(localStorageTimeoutRef.current);
    }

    setIsSaving(true);

    // Debounce de 300ms
    localStorageTimeoutRef.current = setTimeout(async () => {
      try {
        // 🆕 CORRECTION : Utiliser designScale comme scale pour localStorage aussi
        const finalScale = position.designScale || position.scale || 1;
        
        const positionData = {
          x: position.x,
          y: position.y,
          scale: finalScale, // ✅ Utiliser designScale au lieu de scale traditionnel
          rotation: position.rotation,
          // 🆕 Nouvelles propriétés pour les dimensions intrinsèques du design
          designWidth: position.designWidth,
          designHeight: position.designHeight,
          designScale: position.designScale,
          timestamp: Date.now()
        };

        console.log('💾 SAUVEGARDE LOCALSTORAGE:', {
          vendorId,
          baseProductId: productIds.baseProductId,
          designId: productIds.designId,
          position: positionData
        });
        
        // 🆕 DÉBOGUE : Afficher les valeurs de scale
        console.log('🔍 localStorage Scale debug:', {
          traditionalScale: position.scale,
          designScale: position.designScale,
          finalScale,
          finalData: positionData
        });

        await designPositionService.savePosition(
          vendorId,
          productIds.baseProductId,
          productIds.designId,
          positionData
        );

        setLastSaveTime(Date.now());
        console.log('✅ Position sauvegardée en localStorage');
      } catch (error) {
        console.error('❌ Erreur sauvegarde localStorage:', error);
        setError('Erreur lors de la sauvegarde en localStorage');
      } finally {
        setIsSaving(false);
      }
    }, 300);
  }, [vendorId, productIds.baseProductId, productIds.designId]);

  // 🆕 NOUVEAU : Fonction pour sauvegarder au backend avec les dimensions
  const saveToBackend = useCallback(async (position: Transform): Promise<void> => {
    if (!vendorId || !productIds.validProductId || !productIds.designId) {
      console.warn('❌ Sauvegarde backend impossible: paramètres manquants', {
        vendorId,
        validProductId: productIds.validProductId,
        designId: productIds.designId,
      });
      return;
    }

    try {
      setIsSaving(true);

      // Préparer l'objet position en s'assurant que toutes les clés sont présentes
      const backendPosition = {
        x: position.x,
        y: position.y,
        scale: position.designScale || position.scale || 1,
        rotation: position.rotation ?? 0,
        designWidth: position.designWidth,
        designHeight: position.designHeight,
      };

      console.log('🌐 Sauvegarde au backend:', {
        vendorProductId: productIds.validProductId,
        designId: productIds.designId,
        position: backendPosition,
      });

      await vendorProductService.saveDesignPosition(
        productIds.validProductId,
        productIds.designId,
        backendPosition
      );

      setLastSaveTime(Date.now());
      console.log('✅ Position sauvegardée au backend avec dimensions');
    } catch (error) {
      console.error('❌ Erreur sauvegarde backend:', error);
      setError('Erreur lors de la sauvegarde au backend');
    } finally {
      setIsSaving(false);
    }
  }, [vendorId, productIds.validProductId, productIds.designId]);

  // 🆕 NOUVEAU : Fonction pour charger depuis localStorage
  const loadFromLocalStorage = useCallback(async () => {
    if (!vendorId || !productIds.baseProductId || !productIds.designId) {
      console.log('❌ Chargement localStorage impossible: paramètres manquants');
      return null;
    }

    try {
      const savedPosition = await designPositionService.loadPosition(
        vendorId,
        productIds.baseProductId,
        productIds.designId
      );

      if (savedPosition) {
        console.log('📥 Position chargée depuis localStorage:', savedPosition);
        return {
          x: savedPosition.position.x,
          y: savedPosition.position.y,
          scale: savedPosition.position.scale,
          rotation: savedPosition.position.rotation,
          // 🆕 Nouvelles propriétés pour les dimensions intrinsèques du design
          designWidth: savedPosition.position.designWidth,
          designHeight: savedPosition.position.designHeight,
          designScale: savedPosition.position.designScale,
        };
      }
    } catch (error) {
      console.log('ℹ️ Pas de position sauvegardée en localStorage:', error);
    }

    return null;
  }, [vendorId, productIds.baseProductId, productIds.designId]);

  // Fonction pour obtenir une transformation par index
  const getTransform = useCallback((index: number): Transform => {
    // Pour l'index 0 (design principal), utiliser la position isolée combinée avec l'état local
    if (index === 0 && productIds.validProductId && isolatedPosition) {
      const localState = transformStates[index] || {};
      return {
        x: isolatedPosition.x,
        y: isolatedPosition.y,
        scale: isolatedPosition.scale || 1,
        rotation: isolatedPosition.rotation || 0,
        // 🆕 Inclure les nouvelles propriétés depuis l'état local
        designWidth: (localState as any)?.designWidth || 0,
        designHeight: (localState as any)?.designHeight || 0,
        designScale: (localState as any)?.designScale || 1,
      };
    }
    
    // Pour les autres index, utiliser l'état local
    return transformStates[index] || { 
      x: 0, 
      y: 0, 
      scale: 1, 
      rotation: 0,
      // 🆕 Inclure les propriétés de dimensions du design dans les valeurs par défaut
      designWidth: undefined,
      designHeight: undefined,
      designScale: undefined,
    };
  }, [transformStates, isolatedPosition, productIds.validProductId]);

  // Fonction pour mettre à jour une transformation
  const updateTransform = useCallback(async (index: number, updates: Partial<Transform>) => {
    console.log('🎯 UPDATE TRANSFORM:', { index, updates, validProductId: productIds.validProductId });

    // 1️⃣ Mise à jour OPTIMISTE immédiate pour le design principal
    if (index === 0) {
      const currentTransform = getTransform(index);
      const newTransform = { ...currentTransform, ...updates };
      
      // 🔍 DEBUG : Vérifier les propriétés designWidth et designHeight
      console.log('🔍 DEBUG Transform Properties:', {
        currentTransform: {
          x: currentTransform.x,
          y: currentTransform.y,
          scale: currentTransform.scale,
          rotation: currentTransform.rotation,
          designWidth: currentTransform.designWidth,
          designHeight: currentTransform.designHeight,
          designScale: currentTransform.designScale
        },
        updates: {
          x: updates.x,
          y: updates.y,
          scale: updates.scale,
          rotation: updates.rotation,
          designWidth: updates.designWidth,
          designHeight: updates.designHeight,
          designScale: updates.designScale
        },
        newTransform: {
          x: newTransform.x,
          y: newTransform.y,
          scale: newTransform.scale,
          rotation: newTransform.rotation,
          designWidth: newTransform.designWidth,
          designHeight: newTransform.designHeight,
          designScale: newTransform.designScale
        }
      });
      
      // 🆕 NOUVEAU : Sauvegarder directement en localStorage
      console.log('💾 SAUVEGARDE LOCALSTORAGE DIRECTE');
      await saveToLocalStorage(newTransform);
      
      // 🆕 NOUVEAU : Sauvegarder aussi au backend avec les dimensions
      if (productIds.validProductId && productIds.designId) {
        console.log('🌐 SAUVEGARDE BACKEND AVEC DIMENSIONS');
        await saveToBackend(newTransform);
      }
      
      // Mettre à jour l'état local aussi
      setTransformStates(prev => ({
        ...prev,
        [index]: newTransform
      }));

      // Si on a un validProductId, mettre à jour la position isolée aussi
      if (productIds.validProductId) {
        // 🆕 CORRECTION : Utiliser designScale comme scale pour la sauvegarde
        const finalScale = newTransform.designScale || newTransform.scale || 1;
        
        const newPosition: DesignPosition = {
          x: newTransform.x,
          y: newTransform.y,
          scale: finalScale, // ✅ Utiliser designScale au lieu de scale traditionnel
          rotation: newTransform.rotation,
          // 🆕 AJOUT : Inclure les dimensions du design
          design_width: newTransform.designWidth,
          design_height: newTransform.designHeight,
          design_scale: newTransform.designScale,
          constraints: { adaptive: true, area: 'design-placement' }
        };
        
        console.log('🔍 Position isolée - Scale utilisé:', { 
          designScale: newTransform.designScale, 
          traditionalScale: newTransform.scale,
          finalScale
        });
        
        console.log('🔍 DEBUG newPosition avec dimensions:', {
          x: newPosition.x,
          y: newPosition.y,
          scale: newPosition.scale,
          rotation: newPosition.rotation,
          design_width: newPosition.design_width,
          design_height: newPosition.design_height,
          design_scale: newPosition.design_scale
        });
        
        setIsolatedPosition(newPosition);
      }
      
      return;
    }

    // 2️⃣ Pour l'index 0 avec vendorProductId valide : utiliser l'API V2 directe
    if (index === 0 && productIds.validProductId && productIds.validProductId >= 60) {
      console.log('✅ UTILISANT API V2 DIRECTE');
      
      const currentTransform = getTransform(index);
      const newTransform = { ...currentTransform, ...updates };
      
      // 🆕 CORRECTION : Utiliser designScale comme scale pour la sauvegarde
      const finalScale = newTransform.designScale || newTransform.scale || 1;
      
      const newPosition = {
        x: newTransform.x,
        y: newTransform.y,
        scale: finalScale, // ✅ Utiliser designScale au lieu de scale traditionnel
        rotation: newTransform.rotation,
        // 🆕 AJOUT : Inclure les dimensions du design
        design_width: newTransform.designWidth,
        design_height: newTransform.designHeight,
        design_scale: newTransform.designScale,
        constraints: { adaptive: true, area: 'design-placement' }
      } as DesignPosition;
      
      console.log('💾 SAUVEGARDE POSITION V2:', newPosition);
      console.log('🔍 Scale utilisé:', { 
        designScale: newTransform.designScale, 
        traditionalScale: newTransform.scale,
        finalScale
      });
      
      // Mise à jour optimiste
      setIsolatedPosition(newPosition);
      setIsSaving(true);
      
      // Sauvegarde avec délai via l'API V2
      designPositionManager.savePositionDelayed(productIds.validProductId, productIds.designId, newPosition, 1000)
        .then(() => {
          console.log('✅ Sauvegarde V2 terminée');
        })
        .catch((error) => {
          console.error('❌ Erreur sauvegarde V2:', error);
          setError('Erreur sauvegarde position V2');
        })
        .finally(() => {
          setIsSaving(false);
        });
      
      return;
    }

    console.log('🔄 UTILISANT SYSTÈME LOCALSTORAGE');
    
    // 🆕 NOUVEAU : Pour tous les autres cas, utiliser localStorage
    const currentTransform = getTransform(index);
    const newTransform = { ...currentTransform, ...updates };
    
    // Mettre à jour l'état local
    setTransformStates(prev => ({
      ...prev,
      [index]: newTransform
    }));

    // Sauvegarder en localStorage avec debounce
    await saveToLocalStorage(newTransform);
  }, [getTransform, productIds.validProductId, productIds.baseProductId, productIds.designId, saveToLocalStorage, saveToBackend]);

  // Fonction pour réinitialiser toutes les transformations
  const resetTransforms = useCallback(async () => {
    const defaultTransform: Transform = { 
      x: 0, 
      y: 0, 
      scale: 1, 
      rotation: 0,
      // 🆕 Réinitialiser aussi les nouvelles propriétés de dimensions
      designWidth: undefined,
      designHeight: undefined,
      designScale: undefined,
    };
    
    // Réinitialiser le design principal via l'isolation
    if (productIds.validProductId && isolatedPosition) {
      const defaultPosition: DesignPosition = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        // 🆕 AJOUT : Réinitialiser les dimensions du design
        design_width: undefined,
        design_height: undefined,
        design_scale: undefined,
        constraints: { adaptive: true }
      };
      
      setIsolatedPosition(defaultPosition);
      try {
        await designPositionManager.savePosition(productIds.validProductId, productIds.designId, defaultPosition);
      } catch (error) {
        console.error('Erreur reset position isolée:', error);
      }
    }
    
    // 🆕 NOUVEAU : Réinitialiser également le localStorage
    try {
      await saveToLocalStorage(defaultTransform);
    } catch (error) {
      console.error('Erreur reset localStorage:', error);
    }
    
    // Réinitialiser l'état local
    setTransformStates({});

    console.log('🔄 Transformations réinitialisées');
  }, [productIds.validProductId, productIds.designId, isolatedPosition, saveToLocalStorage]);

  // ✅ V2: Fonction pour sauvegarder immédiatement (API directe uniquement)
  const saveNow = useCallback(async () => {
    if (!productIds.validProductId || !productIds.designId) {
      // 🆕 NOUVEAU : Si pas de validProductId, sauvegarder en localStorage
      const currentTransform = getTransform(0);
      await saveToLocalStorage(currentTransform);
      return;
    }

    setIsSaving(true);
    try {
      // Sauvegarder uniquement la position isolée via l'API V2
      if (isolatedPosition) {
        await designPositionManager.savePosition(productIds.validProductId, productIds.designId, isolatedPosition);
        console.log('✅ Position V2 sauvegardée immédiatement');
      }
      
      // 🆕 NOUVEAU : Sauvegarder aussi au backend avec les dimensions
      const currentTransform = getTransform(0);
      await saveToBackend(currentTransform);
      console.log('✅ Position sauvegardée au backend avec dimensions');
      
      setLastSaveTime(Date.now());
    } catch (err: any) {
      console.error('❌ Erreur sauvegarde V2:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [productIds.validProductId, productIds.designId, isolatedPosition, saveToLocalStorage, saveToBackend, getTransform]);

  // 🔧 FONCTION DE CHARGEMENT OPTIMISÉE
  const loadSavedTransforms = useCallback(async () => {
    if (!product) return;
    
    // 🛡️ PRÉVENTION BOUCLE INFINIE
    if (loadingRef.current) {
      console.log('⏳ Chargement déjà en cours, ignoré');
      return;
    }
    
    // 🔧 OPTIMISATION : Éviter les rechargements inutiles
    if (loadParams === lastLoadParamsRef.current && loadedRef.current) {
      console.log('🔄 Chargement ignoré - paramètres identiques');
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // 🔧 CORRECTION : Gérer le cas où product est un nombre
      let productObject = product;
      if (typeof product === 'number') {
        productObject = { id: product, vendorProductId: product };
      }
      
      console.log('📥 Chargement pour produit:', productIds.validProductId || productIds.baseProductId);
      
      // Charger position isolée si productId valide
      if (productIds.validProductId && productIds.validProductId > 0) {
        try {
          const position = await designPositionManager.getPosition(productIds.validProductId, productIds.designId);
          setIsolatedPosition(position);
          console.log('🎯 Position isolée chargée:', position);
        } catch (posError) {
          console.log('ℹ️ Pas de position isolée sauvegardée');
          setIsolatedPosition(null);
        }
      }
      
      // 🆕 NOUVEAU : Charger depuis localStorage
      const localStoragePosition = await loadFromLocalStorage();
      if (localStoragePosition) {
        setTransformStates(prev => ({
          ...prev,
          0: localStoragePosition
        }));
        console.log('🎯 Position chargée depuis localStorage:', localStoragePosition);
      }
      
      console.log('✅ Chargement terminé');
      
    } catch (err: any) {
      console.error('⚠️ Erreur chargement:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
      loadedRef.current = true;
      productIdRef.current = productIds.validProductId;
      lastLoadParamsRef.current = loadParams;
      loadingRef.current = false;
    }
  }, [product, designUrl, productIds.validProductId, productIds.baseProductId, productIds.designId, loadParams, loadFromLocalStorage]);

  // 🔧 CHARGEMENT INITIAL OPTIMISÉ
  useEffect(() => {
    const idsReady = (productIds.validProductId || productIds.baseProductId) && productIds.designId && vendorId;
    if (!idsReady) return;

    // Déterminer si nous devons recharger :
    const productChanged = productIds.validProductId !== productIdRef.current;
    const designChanged = productIds.designId !== designIdRef.current;

    if (productChanged || designChanged) {
      if (designChanged) {
        // Remise à zéro pour forcer re-migration avec le bon designId
        setIsolatedPosition(null);
        setTransformStates({});
      }

      const initializeWithMigration = async () => {
        // Lancer la migration automatique une seule fois
        if (!MigrationHelper.hasMigrationRun()) {
          try {
            await MigrationHelper.migrateExistingPositions();
          } catch (error) {
            console.error('❌ Erreur migration:', error);
          }
        }

        // Puis charger les données normalement
        await loadSavedTransforms();
      };

      initializeWithMigration();
    }

    // Mettre à jour les refs
    productIdRef.current = productIds.validProductId;
    designIdRef.current = productIds.designId;
  }, [productIds.validProductId, productIds.baseProductId, productIds.designId, vendorId, loadSavedTransforms]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (localStorageTimeoutRef.current) {
        clearTimeout(localStorageTimeoutRef.current);
      }
    };
  }, []);

  // Fonctions pour l'isolation
  const savePositionNow = useCallback(async (position: DesignPosition) => {
    if (!productIds.validProductId) {
      // 🆕 NOUVEAU : Sauvegarder en localStorage si pas de validProductId
      // 🆕 CORRECTION : Récupérer designScale depuis l'état local
      const currentTransform = getTransform(0);
      const finalScale = currentTransform.designScale || position.scale || 1;
      
      await saveToLocalStorage({
        x: position.x,
        y: position.y,
        scale: finalScale, // ✅ Utiliser designScale depuis l'état local
        rotation: position.rotation || 0,
        designWidth: currentTransform.designWidth,
        designHeight: currentTransform.designHeight,
        designScale: currentTransform.designScale,
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await designPositionManager.savePosition(productIds.validProductId, productIds.designId, position);
      setIsolatedPosition(position);
    } catch (error) {
      console.error('Erreur sauvegarde position:', error);
      setError('Erreur sauvegarde position');
    } finally {
      setIsSaving(false);
    }
  }, [productIds.validProductId, productIds.designId, saveToLocalStorage]);

  const deletePosition = useCallback(async () => {
    if (!productIds.validProductId) {
      // 🆕 NOUVEAU : Supprimer du localStorage si pas de validProductId
      try {
        await designPositionService.deletePosition(vendorId, productIds.baseProductId, productIds.designId);
        setTransformStates(prev => {
          const newState = { ...prev };
          delete newState[0];
          return newState;
        });
      } catch (error) {
        console.error('Erreur suppression localStorage:', error);
      }
      return;
    }
    
    try {
      await designPositionManager.deletePosition(productIds.validProductId, productIds.designId);
      setIsolatedPosition(null);
    } catch (error) {
      console.error('Erreur suppression position:', error);
    }
  }, [productIds.validProductId, productIds.baseProductId, productIds.designId, vendorId]);

  // 🆕 Fonction de diagnostic
  const runDiagnostic = useCallback(async () => {
    if (!productIds.validProductId) {
      console.log('❌ Diagnostic impossible: validProductId non défini');
      console.log('📊 Diagnostic localStorage:', {
        vendorId,
        baseProductId: productIds.baseProductId,
        designId: productIds.designId,
        hasLocalStorage: !!localStorage.getItem(`design_position_${vendorId}_${productIds.baseProductId}_${productIds.designId}`)
      });
      return;
    }
    
    await designPositionManager.showDiagnosticInfo(productIds.validProductId, productIds.designId);
  }, [productIds.validProductId, productIds.baseProductId, productIds.designId, vendorId]);

  return {
    transformStates,
    isLoading,
    error,
    conception,
    isSaving,
    lastSaveTime,
    getTransform,
    updateTransform,
    resetTransforms,
    saveNow,
    reload: loadSavedTransforms,
    // Données du système d'isolation
    positioning: {
      position: isolatedPosition,
      hasPosition: !!isolatedPosition || !!transformStates[0],
      isOptimistic: false,
      savePosition: savePositionNow,
      savePositionDelayed: (position: DesignPosition) => {
        setIsolatedPosition(position);
        if (productIds.validProductId) {
          designPositionManager.savePositionDelayed(productIds.validProductId, productIds.designId, position);
        } else {
          // 🆕 NOUVEAU : Sauvegarder en localStorage
          // 🆕 CORRECTION : Récupérer designScale depuis l'état local
          const currentTransform = getTransform(0);
          const finalScale = currentTransform.designScale || position.scale || 1;
          
          const transformToSave = {
            x: position.x,
            y: position.y,
            scale: finalScale, // ✅ Utiliser designScale depuis l'état local
            rotation: position.rotation || 0,
            designWidth: currentTransform.designWidth,
            designHeight: currentTransform.designHeight,
            designScale: currentTransform.designScale,
          };
          
          saveToLocalStorage(transformToSave);
          
          // 🆕 NOUVEAU : Sauvegarder aussi au backend avec les dimensions si on a un validProductId
          if (productIds.validProductId && productIds.designId) {
            saveToBackend(transformToSave);
          }
        }
      },
      deletePosition
    },
    // 🆕 Fonctions de diagnostic
    diagnostic: {
      runDiagnostic,
      clearMappings: () => designPositionManager.clearMappings(),
      showInfo: () => runDiagnostic()
    }
  };
} 