import { useState, useEffect } from 'react';
import { loadDesignTransforms } from '../services/designTransforms';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const useSavedDesignTransforms = (productId: number, designUrl: string) => {
  const [transforms, setTransforms] = useState<Record<number, Transform> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !designUrl) {
      setLoading(false);
      setTransforms(null);
      return;
    }

    const loadTransforms = async () => {
      console.log(`🔍 Chargement transformations pour produit ${productId}...`);
      setLoading(true);
      setError(null);

      try {
        // 1. Tentative backend d'abord
        const backendData = await loadDesignTransforms(productId, designUrl);
        if (backendData?.transforms && Object.keys(backendData.transforms).length > 0) {
          setTransforms(backendData.transforms);
          console.log(`✅ Transformations backend trouvées pour produit ${productId}:`, backendData.transforms);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        // Erreur 403 = normal pour admin products en phase conception
        if (err?.response?.status === 403) {
          console.log(`ℹ️ Erreur 403 pour produit ${productId} - Mode conception admin`);
        } else {
          console.warn(`⚠️ Erreur backend pour produit ${productId}:`, err.message);
          setError(err.message);
        }
      }

      try {
        // 2. Fallback localStorage
        const key = `design_transforms_${productId}_${btoa(designUrl)}`;
        const localData = localStorage.getItem(key);
        
        if (localData) {
          const parsed = JSON.parse(localData);
          const savedTransforms = parsed.transforms || parsed;
          
          if (savedTransforms && Object.keys(savedTransforms).length > 0) {
            setTransforms(savedTransforms);
            console.log(`✅ Transformations localStorage trouvées pour produit ${productId}:`, savedTransforms);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Erreur localStorage pour produit ${productId}:`, err);
      }

      // 3. Aucune transformation trouvée
      console.log(`ℹ️ Aucune transformation pour produit ${productId}`);
      setTransforms(null);
      setLoading(false);
    };

    loadTransforms();
  }, [productId, designUrl]);

  return { 
    transforms, 
    loading, 
    error,
    hasTransforms: transforms && Object.keys(transforms).length > 0
  };
}; 