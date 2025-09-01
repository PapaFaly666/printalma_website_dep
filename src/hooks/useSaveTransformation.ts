import { useCallback } from 'react';
import { vendorProductService } from '../services/vendorProductService';
import DesignPositionService from '../services/DesignPositionService';

interface SaveTransformationParams {
  baseProductId: number; // ID du produit admin
  designId: number; // ID du design
  position: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
}

export const useSaveTransformation = () => {
  /**
   * Crée une "transformation" (prototype) côté backend.
   * Le backend auto-détecte le mode TRANSFORMATION selon les règles :
   *   • nom auto-généré (regex)
   *   • prix & stock par défaut
   *   • position non-standard
   */
  const save = useCallback(async ({ baseProductId, designId, position }: SaveTransformationParams) => {
    // Nom et description auto-générés (description courte pour ne pas être bloqué)
    const AUTO_NAME = 'Produit auto-généré pour positionnement design'; // ⬅️ Nom auto-généré OK
    const TEMP_DESCRIPTION = ''; // description vide pour éviter le blocage backend

    // Garantir position non-standard pour déclencher le mode TRANSFORMATION
    const safePosition = { ...position };
    if (
      safePosition.x === 0 &&
      safePosition.y === 0 &&
      (safePosition.scale ?? 1) === 1 &&
      (safePosition.rotation ?? 0) === 0
    ) {
      safePosition.y = 1; // forcer une légère différence
    }

    // Construire et envoyer le payload
    const response = await vendorProductService.createVendorProduct({
      baseProductId,
      designId,
      vendorName: AUTO_NAME,
      vendorDescription: TEMP_DESCRIPTION,
      vendorPrice: 25000, // prix par défaut (centimes CFA)
      vendorStock: 100,   // stock par défaut
      selectedColors: [],
      selectedSizes: [],
      finalImagesBase64: {}, // Images vides pour mode TRANSFORMATION
      productStructure: {
        adminProduct: {
          id: baseProductId,
          name: 'AdminProduct',
          price: 0,
          images: { colorVariations: [] },
          sizes: []
        },
        designApplication: {
          designBase64: '', // vide (backend connaît déjà designId)
          positioning: 'CENTER',
          scale: 1
        }
      },
      designPosition: safePosition,
      // Ne pas activer bypassValidation – on laisse le backend basculer en TRANSFORMATION
    });

    // Sauvegarde locale de la position pour continuité UX
    // Note: vendorId = 1 par défaut pour le mode transformation
    const positionWithRotation = {
      ...safePosition,
      rotation: safePosition.rotation ?? 0
    };
    DesignPositionService.savePosition(1, baseProductId, designId, positionWithRotation);

    return response; // { status: 'TRANSFORMATION', transformationId, ... }
  }, []);

  return save;
}; 