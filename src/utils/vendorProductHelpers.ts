import { resolveVendorProductId as unifiedResolver } from '../helpers/vendorIdResolvers';

/**
 * 🔄 LEGACY: Helper getVendorProductId (compatibilité)
 * ⚠️ Utilisez resolveVendorProductId() pour le nouveau code
 */
export function getVendorProductId(product: any): number | undefined {
  if (!product) return undefined;

  // 0. Si product est directement un nombre, le retourner
  if (typeof product === 'number' && product > 0) {
    return product;
  }

  // 1. Architecture V2 : objet imbriqué
  if (product.vendorProduct?.id) return product.vendorProduct.id;

  // 2. Champ à plat
  if (product.vendorProductId) return product.vendorProductId;

  // 3. Produit déjà vendor
  if (product.id && ['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status)) {
    return product.id;
  }

  // Mode conception admin → pas d'ID vendor
  return undefined;
}

/**
 * ✅ NOUVEAU: Helper unifié qui utilise la logique du guide
 * Remplace progressivement getVendorProductId
 */
export function resolveVendorProductId(
  anyIdOrObject: unknown, 
  vendorProducts: any[] = []
): number | null {
  const isValidInput = (val: unknown): val is number | { id: number; baseProductId?: number } => {
    if (typeof val === 'number') return true;
    if (val && typeof val === 'object' && 'id' in (val as any) && typeof (val as any).id === 'number') {
      return true;
    }
    return false;
  };

  return isValidInput(anyIdOrObject) 
    ? unifiedResolver(anyIdOrObject, vendorProducts)
    : null;
}

export function debugProductIds(p: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Gérer le cas où p est un nombre
  if (typeof p === 'number') {
    console.log('🔍 Product ID Debug (numérique):', p);
    return;
  }
  
  const legacyId = getVendorProductId(p);
  const unifiedId = resolveVendorProductId(p, []);
  
  console.log('🔍 Product ID Debug', {
    productId: p?.id,
    vendorProductId: p?.vendorProductId,
    vendorProduct: p?.vendorProduct,
    status: p?.status,
    name: p?.name,
    legacyCalculatedId: legacyId,
    unifiedCalculatedId: unifiedId,
    idsMatch: legacyId === unifiedId
  });
}

/**
 * ✅ NOUVEAU: Migration helper pour l'ancien code
 * Aide à identifier les endroits qui ont besoin de mise à jour
 */
export function migrateToUnifiedResolver(
  product: any,
  vendorProducts: any[] = []
): { legacy: number | undefined; unified: number | null; needsMigration: boolean } {
  const legacy = getVendorProductId(product);
  const unified = resolveVendorProductId(product, vendorProducts);
  
  const needsMigration = legacy !== unified;
  
  if (needsMigration && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Migration needed:', {
      product: product?.id,
      legacy,
      unified,
      vendorProductsCount: vendorProducts.length
    });
  }
  
  return { legacy, unified, needsMigration };
}

// Optionnel : si vous voulez un alias explicite de l'ancienne fonction, dé-commentez la ligne suivante
// export { getVendorProductId as legacyGetVendorProductId }; 