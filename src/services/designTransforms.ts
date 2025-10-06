// 🔄 MIGRATION vers DesignTransformsAPI unifié
// Ce fichier maintient la compatibilité avec l'ancien code

import { resolveVendorProductId } from '../helpers/vendorIdResolvers';
import { 
  designTransformsManager, 
  saveDesignTransforms as newSaveDesignTransforms,
  loadDesignTransforms as newLoadDesignTransforms
} from './designTransformsAPI';
import type { DesignTransform } from './designTransformsAPI';

// Interface de compatibilité pour l'ancien code
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  // 🆕 Ajout des propriétés de dimensions du design
  designWidth?: number;
  designHeight?: number;
  designScale?: number;
}

/**
 * 🔄 LEGACY: Chargement des transforms (compatibilité)
 * ⚠️ Utilisez designTransformsManager.loadTransforms() pour le nouveau code
 */
export async function loadDesignTransforms(product: any, designUrl?: string) {
  const vendorProductId = resolveVendorProductId(product, []);

  // Fallback localStorage pour le mode conception
  if (!vendorProductId) {
    const key = `design-transforms-${product?.id || 'unknown'}`;
    const saved = localStorage.getItem(key);
    return { transforms: saved ? JSON.parse(saved) : [], conception: true };
  }

  if (!designUrl || designUrl === 'undefined') {
    console.warn('⚠️ designUrl manquant pour loadDesignTransforms');
    return { transforms: [], conception: true };
  }

  try {
    // ✅ Utiliser le nouveau service unifié
    const result = await newLoadDesignTransforms(vendorProductId);
    
    return { 
      transforms: result.data?.transforms || {}, 
      conception: false,
      data: result.data 
    };
  } catch (error: any) {
    console.log('❌ API Error:', error.response?.status, error.response?.data || error.message);
    
    // Si erreur 403, basculer en mode conception
    if (error.response?.status === 403) {
      const key = `design-transforms-${product?.id || 'unknown'}`;
      const saved = localStorage.getItem(key);
      return { transforms: saved ? JSON.parse(saved) : [], conception: true };
    }
    
    throw error;
  }
}

/**
 * 🔄 LEGACY: Sauvegarde des transforms (compatibilité)  
 * ⚠️ Utilisez designTransformsManager.saveTransforms() pour le nouveau code
 */
export async function saveDesignTransforms(product: any, transforms: any, designUrl?: string) {
  const vendorProductId = resolveVendorProductId(product, []);

  // Toujours sauvegarder en localStorage
  const key = `design-transforms-${vendorProductId || product?.id || 'unknown'}`;
  localStorage.setItem(key, JSON.stringify(transforms));

  // Si pas d'ID vendor → seulement local
  if (!vendorProductId) return { success: true, localStorage: true };

  if (!designUrl || designUrl === 'undefined') {
    console.warn('⚠️ designUrl manquant pour saveDesignTransforms');
    return { success: true, localStorage: true };
  }

  try {
    // ✅ Convertir vers le nouveau format (clé "0" non requise ici)
    const positioning = transforms.positioning || transforms || { x: 0, y: 0, scale: 1, rotation: 0 };

    const newTransform: DesignTransform = {
      x: positioning.x ?? 0,
      y: positioning.y ?? 0,
      scale: positioning.scale ?? 1,
      rotation: positioning.rotation ?? 0,
      // 🆕 AJOUT : Inclure les dimensions du design
      design_width: positioning.design_width ?? positioning.designWidth,
      design_height: positioning.design_height ?? positioning.designHeight,
      design_scale: positioning.design_scale ?? positioning.designScale,
    };

    // 🔍 DEBUG : Vérifier les propriétés transmises
    console.log('🔍 DEBUG designTransforms.ts - Transform converti:', {
      original: positioning,
      converted: newTransform,
      hasDesignWidth: newTransform.design_width !== undefined,
      hasDesignHeight: newTransform.design_height !== undefined,
    });

    // ✅ Utiliser le nouveau service unifié
    const result = await newSaveDesignTransforms(vendorProductId, designUrl, newTransform);
    
    return { success: true, data: result.data };
  } catch (error: any) {
    console.log('❌ Save Error:', error.response?.status, error.response?.data || error.message);
    // En cas d'erreur, au moins on a la sauvegarde locale
    return { success: true, localStorage: true, error: error.message };
  }
} 

/**
 * ✅ NOUVEAU: Hook simplifié pour React components
 */
export function useDesignTransforms(vendorProducts: any[] = [], vendorDesigns: any[] = []) {
  // Configurer le manager avec les données vendeur
  designTransformsManager.setVendorData(vendorProducts, vendorDesigns);
  
  return {
    saveTransforms: designTransformsManager.saveTransforms.bind(designTransformsManager),
    loadTransforms: designTransformsManager.loadTransforms.bind(designTransformsManager),
    savePosition: designTransformsManager.savePosition.bind(designTransformsManager),
    loadPosition: designTransformsManager.loadPosition.bind(designTransformsManager)
  };
}

/**
 * ✅ EXPORT: Réexporter le manager pour usage direct
 */
export { designTransformsManager };
export type { DesignTransform }; 