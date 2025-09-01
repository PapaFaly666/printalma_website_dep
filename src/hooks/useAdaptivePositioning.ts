import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface DesignPositioning {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface AdaptivePositioningResponse {
  success: boolean;
  data: {
    positioning: DesignPositioning;
    productType: string;
    description: string;
    presets: Record<string, DesignPositioning>;
  };
  message: string;
}

export const useAdaptivePositioning = (productId: number, designUrl: string) => {
  const [positioning, setPositioning] = useState<DesignPositioning | null>(null);
  const [productType, setProductType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [presets, setPresets] = useState<Record<string, DesignPositioning>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptimalPositioning = async () => {
      if (!productId || !designUrl) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `https://printalma-back-dep.onrender.com/vendor-design-transforms/products/${productId}/design-positioning?designUrl=${encodeURIComponent(designUrl)}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: AdaptivePositioningResponse = await response.json();
        
        if (result.success) {
          const { positioning, productType, description, presets } = result.data;
          setPositioning(positioning);
          setProductType(productType);
          setDescription(description);
          setPresets(presets);
          
          console.log('✅ Positionnement optimal chargé:', {
            productType,
            description,
            positioning,
            presetsCount: Object.keys(presets).length
          });
        } else {
          throw new Error(result.message || 'Erreur lors du chargement du positionnement');
        }
      } catch (error) {
        console.error('❌ Erreur chargement positionnement:', error);
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
        
        // Fallback vers positionnement par défaut
        setPositioning({ x: 50, y: 50, width: 30, height: 30, rotation: 0 });
        setProductType('default');
        setDescription('Position standard (fallback)');
        setPresets({
          center: { x: 50, y: 50, width: 30, height: 30, rotation: 0 },
          small: { x: 50, y: 50, width: 20, height: 20, rotation: 0 },
          large: { x: 50, y: 50, width: 40, height: 40, rotation: 0 }
        });
        
        toast.warning('Utilisation du positionnement par défaut', {
          description: 'Impossible de charger le positionnement optimal pour ce produit.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadOptimalPositioning();
  }, [productId, designUrl]);

  const saveCustomPositioning = async (newPositioning: DesignPositioning) => {
    if (!productId || !designUrl) {
      toast.error('Données manquantes pour sauvegarder le positionnement');
      return false;
    }

    try {
      const response = await fetch(
        `https://printalma-back-dep.onrender.com/vendor-design-transforms/products/${productId}/design-positioning`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            designUrl,
            positioning: newPositioning
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPositioning(newPositioning);
        console.log('✅ Positionnement sauvegardé:', newPositioning);
        
        toast.success('Position sauvegardée !', {
          description: 'Le positionnement a été enregistré pour ce produit.',
          duration: 3000
        });
        
        return true;
      } else {
        throw new Error(result.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde positionnement:', error);
      toast.error('Erreur de sauvegarde', {
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder le positionnement'
      });
      return false;
    }
  };

  const applyPreset = async (presetName: string) => {
    const presetPositioning = presets[presetName];
    if (!presetPositioning) {
      toast.error(`Preset "${presetName}" non trouvé`);
      return false;
    }

    console.log(`🎯 Application du preset "${presetName}":`, presetPositioning);
    const success = await saveCustomPositioning(presetPositioning);
    
    if (success) {
      toast.success(`Preset "${presetName}" appliqué !`, {
        description: `Position ${presetName} appliquée au design.`
      });
    }
    
    return success;
  };

  const loadPresets = async () => {
    if (!productId) return;

    try {
      const response = await fetch(
        `https://printalma-back-dep.onrender.com/vendor-design-transforms/products/${productId}/positioning-presets`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPresets(result.data.presets);
        console.log('✅ Presets chargés:', result.data.presets);
      }
    } catch (error) {
      console.error('❌ Erreur chargement presets:', error);
      // Les presets sont déjà définis dans le fallback
    }
  };

  return {
    positioning,
    productType,
    description,
    presets,
    loading,
    error,
    saveCustomPositioning,
    applyPreset,
    loadPresets
  };
}; 
 
 
 