import axios from 'axios';
import { resolveVendorProductId, resolveVendorDesignId } from '../helpers/vendorIdResolvers';

// ✅ Interface conforme au guide
// Représentation simplifiée d'un set de transforms (clé "0" pour V1)
export interface DesignTransform {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  // 🆕 AJOUT : Propriétés pour les dimensions du design
  design_width?: number;
  design_height?: number;
  design_scale?: number;
}

export interface SaveTransformsPayload {
  vendorProductId: number; // ↔ vendorProductId dans le guide
  designUrl: string;       // URL exacte Cloudinary
  transforms: {
    '0': DesignTransform;  // Pour la V1 seule la clé "0" est utilisée
  };
  lastModified: number;    // timestamp (ms)
}

// Instance API avec configuration optimisée
const api = axios.create({
  baseURL: 'https://printalma-back-dep.onrender.com',
  withCredentials: true, // ✅ credentials:'include' pour auth_token
  timeout: 10000,
});

// Intercepteurs de debug
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * 📡 Cycle complet en 4 appels selon le guide
 */

// 1️⃣ Créer / mettre à jour les transforms (conforme au guide)
export async function saveDesignTransforms(
  vendorProductId: number,
  designUrl: string,
  transform: DesignTransform
): Promise<{ success: boolean; data?: any }>;

// ↩️ Surcharge legacy (payload objet)
export async function saveDesignTransforms(
  payload: {
    vendorProductId?: number;
    productId?: number; // alias legacy
    designUrl: string;
    transforms: Record<string, DesignTransform> | DesignTransform;
    lastModified?: number;
  }
): Promise<{ success: boolean; data?: any }>;

// Implémentation unique
export async function saveDesignTransforms(
  arg1: any,
  arg2?: any,
  arg3?: any
): Promise<{ success: boolean; data?: any }> {
  try {
    let vendorProductId: number;
    let designUrl: string;
    let transform: DesignTransform;

    // Détecter la signature utilisée
    if (typeof arg1 === 'number') {
      vendorProductId = arg1;
      designUrl = arg2 as string;
      transform = arg3 as DesignTransform;
    } else {
      const payloadObj = arg1 as {
        vendorProductId?: number;
        productId?: number;
        designUrl: string;
        transforms: any;
      };
      vendorProductId = payloadObj.vendorProductId ?? payloadObj.productId ?? 0;
      designUrl = payloadObj.designUrl;

      // Si transforms est un objet clé/valeur, on prend la première clé
      if (payloadObj.transforms && typeof payloadObj.transforms === 'object') {
        if ('x' in payloadObj.transforms) {
          // transform direct
          transform = payloadObj.transforms as DesignTransform;
        } else {
          const firstKey = Object.keys(payloadObj.transforms)[0];
          transform = payloadObj.transforms[firstKey] as DesignTransform;
        }
      } else {
        transform = { x: 0, y: 0, scale: 1 };
      }
    }

    const payload: any = {
      // Certains backends V2 attendent encore productId au lieu de vendorProductId => on envoie les deux
      vendorProductId,
      productId: vendorProductId,
      designUrl,
      transforms: {
        '0': transform,
      },
      lastModified: Date.now(),
    };

    console.log('🚀 API Request: POST /vendor/design-transforms/save', payload);
    const { data } = await api.post('/vendor/design-transforms/save', payload);

    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Save Error:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

// 2️⃣ Relire pour vérifier
export async function loadDesignTransforms(
  vendorProductId: number,
  _designUrl?: string // 🔧 rétro-compatibilité, ignoré côté backend
): Promise<{ data: any }> {
  try {
    console.log('🚀 API Request: GET /vendor/design-transforms/' + vendorProductId);
    const { data } = await api.get(`/vendor/design-transforms/${vendorProductId}`);

    return { data: data?.data ?? null };
  } catch (error: any) {
    console.error('❌ Load Error:', error.response?.status, error.response?.data || error.message);

    if (error.response?.status === 404) {
      return { data: null };
    }

    throw error;
  }
}

// 3️⃣ Isoler uniquement la position
export async function savePositionDirect(
  vendorProductId: number,
  designId: number,
  position: DesignTransform & { rotation?: number }
): Promise<{ success: boolean }> {
  try {
    console.log(`🚀 API Request: PUT /api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`);
    
    await api.put(`/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`, position);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Position Save Error:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

// 4️⃣ Lire la position isolée
export async function loadPositionDirect(
  vendorProductId: number,
  designId: number
): Promise<{ data: (DesignTransform & { rotation?: number }) | null }> {
  try {
    console.log(`🚀 API Request: GET /api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`);
    
    const { data } = await api.get(`/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`);
    
    return { data: data?.data ?? null };
  } catch (error: any) {
    console.error('❌ Position Load Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return { data: null };
    }
    
    throw error;
  }
}

/**
 * 🔍 Résoudre les IDs automatiquement
 */
export function resolveProductAndDesignIds(
  product: any,
  design: any,
  vendorProducts: any[] = [],
  vendorDesigns: any[] = []
): { vendorProductId: number | null; vendorDesignId: number | null } {
  
  const vendorProductId = resolveVendorProductId(product, vendorProducts);
  const vendorDesignId = resolveVendorDesignId(design, vendorDesigns);
  
  console.log('🔍 ID Resolution:', {
    input: { productId: product?.id, designId: design?.id },
    resolved: { vendorProductId, vendorDesignId },
    vendorProductsCount: vendorProducts.length,
    vendorDesignsCount: vendorDesigns.length
  });
  
  return { vendorProductId, vendorDesignId };
}

/**
 * 🚀 API haut niveau qui gère tout automatiquement
 */
export class DesignTransformsManager {
  private vendorProducts: any[] = [];
  private vendorDesigns: any[] = [];
  
  setVendorData(products: any[], designs: any[] = []) {
    this.vendorProducts = products || [];
    this.vendorDesigns = designs || [];
  }
  
  async saveTransforms(
    product: any,
    design: any,
    transforms: DesignTransform
  ): Promise<{ success: boolean; data?: any }> {
    const { vendorProductId } = this.resolveIds(product, design);
    
    if (!vendorProductId) {
      throw new Error('❌ Impossible de résoudre vendorProductId');
    }
    
    if (!design?.imageUrl) {
      throw new Error('❌ designUrl manquant ou undefined');
    }
    
    return await saveDesignTransforms(vendorProductId, design.imageUrl, transforms);
  }
  
  async loadTransforms(
    product: any,
    design: any
  ): Promise<{ data: any }> {
    const { vendorProductId } = this.resolveIds(product, design);
    
    if (!vendorProductId) {
      throw new Error('❌ Impossible de résoudre vendorProductId');
    }
    
    if (!design?.imageUrl) {
      throw new Error('❌ designUrl manquant ou undefined');
    }
    
    return await loadDesignTransforms(vendorProductId);
  }
  
  async savePosition(
    product: any,
    design: any,
    position: DesignTransform & { rotation?: number }
  ): Promise<{ success: boolean }> {
    const { vendorProductId, vendorDesignId } = this.resolveIds(product, design);
    
    if (!vendorProductId || !vendorDesignId) {
      throw new Error('❌ Impossible de résoudre vendorProductId ou vendorDesignId');
    }
    
    return await savePositionDirect(vendorProductId, vendorDesignId, position);
  }
  
  async loadPosition(
    product: any,
    design: any
  ): Promise<{ data: (DesignTransform & { rotation?: number }) | null }> {
    const { vendorProductId, vendorDesignId } = this.resolveIds(product, design);
    
    if (!vendorProductId || !vendorDesignId) {
      throw new Error('❌ Impossible de résoudre vendorProductId ou vendorDesignId');
    }
    
    return await loadPositionDirect(vendorProductId, vendorDesignId);
  }
  
  private resolveIds(product: any, design: any) {
    return resolveProductAndDesignIds(product, design, this.vendorProducts, this.vendorDesigns);
  }
}

// Instance globale pour usage simple
export const designTransformsManager = new DesignTransformsManager(); 