import { useState, useEffect, useRef, useCallback } from 'react';
import { designTransformsStorage, DesignTransform } from '../services/designTransformsStorage';
import { loadDesignTransforms, saveDesignTransforms } from '../services/designTransformsAPI';

export interface UseDesignTransformsOptions {
  vendorProductId: number;
  designUrl: string;
  enabled?: boolean;
  autoSaveDelay?: number; // Délai avant auto-sauvegarde (défaut: 3000ms)
}

export function useDesignTransformsOptimized({
  vendorProductId,
  designUrl,
  enabled = true,
  autoSaveDelay = 3000
}: UseDesignTransformsOptions) {
  const [transforms, setTransforms] = useState<Record<string, DesignTransform>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  // 🚨 VALIDATION DES PARAMÈTRES
  const isValidParams = useCallback(() => {
    const valid = vendorProductId && vendorProductId > 0 && designUrl && designUrl.trim() !== '';
    console.log('🔍 Validation des paramètres:', {
      vendorProductId,
      designUrl: designUrl ? designUrl.substring(0, 50) + '...' : 'undefined',
      valid,
      enabled
    });
    return valid;
  }, [vendorProductId, designUrl, enabled]);

  /**
   * Chargement initial depuis localStorage puis backend
   */
  const loadInitialData = useCallback(async () => {
    console.log('🔄 === DÉBUT CHARGEMENT INITIAL ===');
    console.log('État initial:', {
      enabled,
      isInitialized: isInitializedRef.current,
      vendorProductId,
      designUrl: designUrl ? designUrl.substring(0, 50) + '...' : 'undefined'
    });

    // 🚨 VÉRIFICATION PRÉLIMINAIRE
    if (!enabled) {
      console.log('❌ Hook désactivé, arrêt du chargement');
      setIsLoading(false);
      return;
    }

    if (isInitializedRef.current) {
      console.log('❌ Déjà initialisé, arrêt du chargement');
      return;
    }

    if (!isValidParams()) {
      console.log('❌ Paramètres invalides, arrêt du chargement');
      setError('Paramètres invalides pour le chargement des transformations');
      setIsLoading(false);
      isInitializedRef.current = true;
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📱 Tentative chargement localStorage...');
      
      // 1. Charger depuis localStorage immédiatement (UX fluide)
      const localState = designTransformsStorage.loadFromLocal(vendorProductId, designUrl);
      if (localState && Object.keys(localState.transforms).length > 0) {
        setTransforms(localState.transforms);
        setIsDirty(localState.isDirty);
        console.log('✅ Transforms chargés depuis localStorage:', Object.keys(localState.transforms).length, 'items');
      } else {
        console.log('ℹ️ Aucun transform en localStorage');
      }
      
      // 2. Charger depuis backend en arrière-plan (avec timeout)
      console.log('☁️ Tentative chargement backend...');
      try {
        const backendPromise = loadDesignTransforms(vendorProductId, designUrl);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backend timeout')), 5000)
        );
        
        const backendData = await Promise.race([backendPromise, timeoutPromise]);
        
        if (backendData && (backendData as any).transforms) {
          const backendTransforms = (backendData as any).transforms;
          const backendTime = (backendData as any).lastModified || 0;
          
          // Comparer les timestamps pour décider quelle version utiliser
          const localTime = localState?.lastModified || 0;
          
          console.log('📊 Comparaison versions:', { backendTime, localTime });
          
          if (backendTime > localTime) {
            // Backend plus récent, l'utiliser
            setTransforms(backendTransforms);
            setIsDirty(false);
            designTransformsStorage.saveToLocal(vendorProductId, designUrl, backendTransforms);
            designTransformsStorage.markAsSaved(vendorProductId, designUrl);
            console.log('✅ Transforms mis à jour depuis backend');
          } else if (localState?.isDirty) {
            // Local plus récent et dirty, programmer une sauvegarde
            scheduleAutoSave();
            console.log('📤 Transforms locaux plus récents, sauvegarde programmée');
          }
        } else {
          console.log('ℹ️ Pas de données backend valides');
        }
      } catch (backendError: any) {
        // Gestion gracieuse de l'erreur 403 et autres erreurs backend
        if (backendError?.response?.status === 403) {
          console.log('ℹ️ Erreur 403 - Mode conception admin product, utilisation localStorage');
        } else if (backendError.message === 'Backend timeout') {
          console.log('⏰ Timeout backend - Utilisation localStorage uniquement');
        } else {
          console.warn('⚠️ Backend indisponible, utilisation localStorage:', backendError.message);
        }
        // Continuer avec localStorage, le backend sera synchronisé plus tard
      }
      
    } catch (error: any) {
      console.error('❌ Erreur chargement initial:', error);
      setError('Erreur lors du chargement des transformations');
    } finally {
      console.log('🏁 Fin chargement initial - setIsLoading(false)');
      setIsLoading(false);
      isInitializedRef.current = true;
    }
  }, [vendorProductId, designUrl, enabled, isValidParams]);

  /**
   * Sauvegarde automatique différée
   */
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!isDirty) return;
      
      console.log('🔄 Déclenchement auto-sauvegarde...');
      setIsSaving(true);
      designTransformsStorage.markAsLoading(vendorProductId, designUrl, true);
      
      try {
        await saveDesignTransforms({
          productId: vendorProductId,
          designUrl,
          transforms,
          lastModified: Date.now()
        });
        
        designTransformsStorage.markAsSaved(vendorProductId, designUrl);
        setIsDirty(false);
        lastSaveRef.current = Date.now();
        console.log('✅ Auto-sauvegarde réussie');
        
        // Émettre événement pour notifications
        window.dispatchEvent(new CustomEvent('transform:saved'));
        
      } catch (error: any) {
        console.error('❌ Erreur auto-sauvegarde:', error);
        // Garder en localStorage pour retry plus tard
        
        // Ne pas considérer 403 comme une vraie erreur
        if (error?.response?.status !== 403) {
          setError('Erreur de sauvegarde automatique');
          window.dispatchEvent(new CustomEvent('transform:error'));
        }
      } finally {
        setIsSaving(false);
        designTransformsStorage.markAsLoading(vendorProductId, designUrl, false);
      }
    }, autoSaveDelay);
  }, [vendorProductId, designUrl, transforms, isDirty, autoSaveDelay]);

  /**
   * Mettre à jour un transform (sauvegarde localStorage immédiate)
   */
  const updateTransform = useCallback((index: string, transform: DesignTransform) => {
    if (!isValidParams()) {
      console.warn('⚠️ Tentative updateTransform avec paramètres invalides');
      return;
    }

    const newTransforms = {
      ...transforms,
      [index]: transform
    };
    
    setTransforms(newTransforms);
    setIsDirty(true);
    
    // Sauvegarde immédiate en localStorage
    designTransformsStorage.saveToLocal(vendorProductId, designUrl, newTransforms);
    
    // Programmer auto-sauvegarde backend
    scheduleAutoSave();
    
    console.log(`🎨 Transform ${index} mis à jour localement`);
  }, [transforms, vendorProductId, designUrl, scheduleAutoSave, isValidParams]);

  /**
   * Sauvegarde manuelle (validation vendeur)
   */
  const saveManually = useCallback(async () => {
    if (!isDirty || isSaving || !isValidParams()) return;
    
    console.log('💾 Sauvegarde manuelle démarrée...');
    setIsSaving(true);
    setError(null);
    designTransformsStorage.markAsLoading(vendorProductId, designUrl, true);
    
    try {
      await saveDesignTransforms({
        productId: vendorProductId,
        designUrl,
        transforms,
        lastModified: Date.now()
      });
      
      designTransformsStorage.markAsSaved(vendorProductId, designUrl);
      setIsDirty(false);
      lastSaveRef.current = Date.now();
      
      // Annuler l'auto-sauvegarde programmée
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      
      console.log('✅ Sauvegarde manuelle réussie');
      window.dispatchEvent(new CustomEvent('transform:saved'));
      return true;
      
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde manuelle:', error);
      
      // Gestion spéciale de l'erreur 403
      if (error?.response?.status === 403) {
        setError('Mode conception - Sauvegarde locale uniquement');
      } else {
        setError('Erreur lors de la sauvegarde');
        window.dispatchEvent(new CustomEvent('transform:error'));
      }
      return false;
    } finally {
      setIsSaving(false);
      designTransformsStorage.markAsLoading(vendorProductId, designUrl, false);
    }
  }, [vendorProductId, designUrl, transforms, isDirty, isSaving, isValidParams]);

  /**
   * Réinitialiser aux valeurs backend
   */
  const resetToBackend = useCallback(async () => {
    if (!isValidParams()) return;
    
    setIsLoading(true);
    try {
      const backendData = await loadDesignTransforms(vendorProductId, designUrl);
      if (backendData) {
        setTransforms((backendData as any).transforms || {});
        setIsDirty(false);
        designTransformsStorage.saveToLocal(vendorProductId, designUrl, (backendData as any).transforms || {});
        designTransformsStorage.markAsSaved(vendorProductId, designUrl);
        
        // Annuler auto-sauvegarde en cours
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
          autoSaveTimeoutRef.current = null;
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setError('Mode conception - Reset non disponible');
      } else {
        setError('Erreur lors du reset');
      }
    } finally {
      setIsLoading(false);
    }
  }, [vendorProductId, designUrl, isValidParams]);

  /**
   * Obtenir un transform spécifique
   */
  const getTransform = useCallback((index: string): DesignTransform | undefined => {
    return transforms[index];
  }, [transforms]);

  // 🚨 EFFET DE CHARGEMENT INITIAL AVEC TIMEOUT DE SÉCURITÉ
  useEffect(() => {
    console.log('🔄 useEffect loadInitialData déclenché');
    
    // Timeout de sécurité pour éviter le chargement infini
    const safetyTimeout = setTimeout(() => {
      if (isLoading && !isInitializedRef.current) {
        console.log('🚨 TIMEOUT DE SÉCURITÉ - Arrêt forcé du chargement');
        setIsLoading(false);
        setError('Timeout: Chargement trop long');
        isInitializedRef.current = true;
      }
    }, 10000); // 10 secondes max

    loadInitialData().finally(() => {
      clearTimeout(safetyTimeout);
    });

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [loadInitialData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // 🚨 LOG D'ÉTAT POUR DEBUG
  useEffect(() => {
    console.log('📊 État du hook:', {
      isLoading,
      isInitialized: isInitializedRef.current,
      transformsCount: Object.keys(transforms).length,
      isDirty,
      isSaving,
      error,
      vendorProductId,
      designUrlLength: designUrl?.length || 0
    });
  }, [isLoading, transforms, isDirty, isSaving, error, vendorProductId, designUrl]);

  return {
    // État
    transforms,
    isLoading,
    isDirty,
    isSaving,
    error,
    
    // Actions
    updateTransform,
    saveManually,
    resetToBackend,
    getTransform,
    
    // Métadonnées
    lastSave: lastSaveRef.current,
    hasUnsavedChanges: isDirty,
    isInitialized: isInitializedRef.current
  };
} 