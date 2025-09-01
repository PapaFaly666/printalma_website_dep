// hooks/useDesignPosition.ts
import { useState, useEffect } from 'react';
import designPositionService, { DesignPositionData } from '../services/DesignPositionService';

type DesignPosition = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  designWidth?: number;
  designHeight?: number;
  designScale?: number;
};

export const useDesignPosition = (
  designId: number | null,
  baseProductId: number | null,
  vendorId: number | null = null
) => {
  const [position, setPosition] = useState<DesignPosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger depuis localStorage au montage
  useEffect(() => {
    if (designId) {
      try {
        setIsLoading(true);
        const savedPosition = designPositionService.getPosition(
          designId,
          baseProductId ?? undefined,
          vendorId ?? undefined
        );

        if (savedPosition) {
          setPosition(savedPosition.position);
          console.log('✅ Position chargée depuis localStorage:', savedPosition);
        } else {
          console.log('ℹ️ Aucune position sauvegardée, utilisation des valeurs par défaut');
        }

        setError(null);
      } catch (err) {
        console.error('❌ Erreur chargement position:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    }
  }, [designId, baseProductId, vendorId]);

  // Sauvegarder en localStorage
  const savePosition = (newPosition: Partial<DesignPosition>): boolean => {
    try {
      const updatedPosition: DesignPosition = {
        x: newPosition.x ?? position.x,
        y: newPosition.y ?? position.y,
        scale: newPosition.scale ?? position.scale,
        rotation: newPosition.rotation ?? position.rotation,
        designWidth: newPosition.designWidth ?? position.designWidth,
        designHeight: newPosition.designHeight ?? position.designHeight,
        designScale: newPosition.designScale ?? position.designScale
      };

      setPosition(updatedPosition);

      if (designId && baseProductId != null) {
        // Nécessite vendorId pour sauvegarder – si absent, on tente une inférence via getPosition
        let effectiveVendorId = vendorId ?? undefined;
        if (!effectiveVendorId) {
          const existing = designPositionService.getPosition(designId, baseProductId ?? undefined, undefined);
          if (existing?.vendorId) {
            effectiveVendorId = existing.vendorId;
          }
        }
        if (effectiveVendorId != null) {
          designPositionService.savePosition(
            effectiveVendorId,
            baseProductId,
            designId,
            updatedPosition
          );
        }
      }

      setError(null);
      return true;
    } catch (err) {
      console.error('❌ Erreur sauvegarde position:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  };

  // Récupérer la position pour l'API
  const getPositionForApi = (): DesignPositionData | null => {
    if (!designId) return null;

    try {
      return designPositionService.getPosition(designId, baseProductId ?? undefined, vendorId ?? undefined);
    } catch (err) {
      console.error('❌ Erreur récupération position pour API:', err);
      return null;
    }
  };

  // Réinitialiser la position
  const resetPosition = (): boolean => {
    const defaultPosition: DesignPosition = { x: 0, y: 0, scale: 1, rotation: 0 };
    return savePosition(defaultPosition);
  };

  // Supprimer la position du localStorage
  const removePosition = (): boolean => {
    try {
      if (designId && baseProductId != null) {
        let effectiveVendorId = vendorId ?? undefined;
        if (!effectiveVendorId) {
          const existing = designPositionService.getPosition(designId, baseProductId ?? undefined, undefined);
          if (existing?.vendorId) {
            effectiveVendorId = existing.vendorId;
          }
        }
        if (effectiveVendorId != null) {
          designPositionService.deletePosition(effectiveVendorId, baseProductId, designId);
          resetPosition();
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('❌ Erreur suppression position:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  };

  // Mettre à jour une propriété spécifique
  const updatePosition = (property: keyof DesignPosition, value: number): boolean => {
    const newPosition = { ...position, [property]: value };
    return savePosition(newPosition);
  };

  // Déplacer relativement
  const movePosition = (deltaX: number, deltaY: number): boolean => {
    const newPosition = {
      ...position,
      x: position.x + deltaX,
      y: position.y + deltaY
    };
    return savePosition(newPosition);
  };

  return {
    position,
    isLoading,
    error,
    savePosition,
    getPositionForApi,
    resetPosition,
    removePosition,
    updatePosition,
    movePosition
  };
};

// Hook pour gérer plusieurs positions (pour un design sur plusieurs produits)
export const useMultipleDesignPositions = (designId: number | null) => {
  const [positions, setPositions] = useState<Record<string, DesignPositionData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (designId) {
      try {
        setIsLoading(true);
        const drafts = designPositionService.getAllDrafts().filter(d => d.designId === designId);
        const mapped: Record<string, DesignPositionData> = {};
        drafts.forEach(d => {
          const key = `design_position_${d.vendorId}_${d.baseProductId}_${d.designId}`;
          mapped[key] = d;
        });
        setPositions(mapped);
        console.log('✅ Positions multiples chargées:', Object.keys(mapped).length);
      } catch (err) {
        console.error('❌ Erreur chargement positions multiples:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [designId]);

  const savePositionForProduct = (
    baseProductId: number,
    newPosition: Partial<DesignPosition>,
    vendorId: number | null = null
  ): boolean => {
    try {
      if (!designId) return false;

      const existing = designPositionService.getPosition(designId, baseProductId, vendorId ?? undefined);
      const merged: DesignPosition = {
        x: newPosition.x ?? existing?.position.x ?? 0,
        y: newPosition.y ?? existing?.position.y ?? 0,
        scale: newPosition.scale ?? existing?.position.scale ?? 1,
        rotation: newPosition.rotation ?? existing?.position.rotation ?? 0,
        designWidth: newPosition.designWidth ?? existing?.position.designWidth,
        designHeight: newPosition.designHeight ?? existing?.position.designHeight,
        designScale: newPosition.designScale ?? existing?.position.designScale
      };

      const effectiveVendorId = vendorId ?? existing?.vendorId ?? 0;
      designPositionService.savePosition(effectiveVendorId, baseProductId, designId, merged);

      const drafts = designPositionService.getAllDrafts().filter(d => d.designId === designId);
      const mapped: Record<string, DesignPositionData> = {};
      drafts.forEach(d => {
        const key = `design_position_${d.vendorId}_${d.baseProductId}_${d.designId}`;
        mapped[key] = d;
      });
      setPositions(mapped);
      return true;
    } catch (err) {
      console.error('❌ Erreur sauvegarde position produit:', err);
      return false;
    }
  };

  const getPositionForProduct = (baseProductId: number, vendorId: number | null = null): DesignPositionData | null => {
    if (!designId) return null;

    const key = `design_position_${vendorId ?? 0}_${baseProductId}_${designId}`;
    return positions[key] || null;
  };

  return {
    positions,
    isLoading,
    savePositionForProduct,
    getPositionForProduct
  };
};
