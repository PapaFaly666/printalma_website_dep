export function resolveVendorProductId(
  product: { id: number; baseProductId?: number } | number | null | undefined,
  vendorProducts: { id: number; baseProductId: number }[] = []
): number | null {
  if (!product) return null;

  // Si product est un nombre, le traiter comme id brut
  if (typeof product === 'number') {
    const num = product;
    // Si l'id est manifestement un baseProductId (<60) et qu'il n'existe pas
    // encore dans vendorProducts, on considère qu'il n'est pas résolu.
    if (num < 60) {
      const maybeVendor = vendorProducts.find(vp => vp.id === num);
      if (!maybeVendor) return null;
    }
    const byId = vendorProducts.find(vp => vp.id === num);
    if (byId) return byId.id;
    const byBase = vendorProducts.find(vp => vp.baseProductId === num);
    if (byBase) return byBase.id;
    // Si nous n'avons aucune donnée vendorProducts, mieux vaut retourner null pour
    // éviter d'envoyer un baseProductId (ex: 2) aux endpoints vendeur ➜ 404.
    if (!vendorProducts || vendorProducts.length === 0) {
      return null;
    }
    // Aucun mapping trouvé dans vendorProducts → renvoyer null (id non résolu)
    return null;
  }

  // 1) L'ID est déjà un vendorProduct.id appartenant au vendeur
  if (vendorProducts.some(vp => vp.id === product.id && vp.id >= 60)) return product.id;

  // 2) ID reçu = baseProductId ➜ on cherche le vendorProduct correspondant
  const match = vendorProducts.find(vp => vp.baseProductId === product.id);
  if (match) return match.id;

  // 3) Produit contient baseProductId ➜ on cherche également
  if (product.baseProductId) {
    const baseMatch = vendorProducts.find(vp => vp.baseProductId === product.baseProductId);
    if (baseMatch) return baseMatch.id;
  }

  return null;
}

export function resolveVendorDesignId(
  design: { id?: number | null; imageUrl?: string | null } | null | undefined,
  vendorDesigns: { id: number; imageUrl?: string | null }[] = []
): number | null {
  if (!vendorDesigns.length) return design?.id ?? null;

  // 1) L'ID existe déjà chez le vendeur
  if (design?.id && vendorDesigns.some(d => d.id === design.id)) return design.id;

  // 2) Cherche par imageUrl (cas migration)
  if (design?.imageUrl) {
    // a) Vérifier correspondance exacte
    let match = vendorDesigns.find(d => d.imageUrl === design.imageUrl);
    if (match) return match.id;

    // b) Vérifier correspondance sur le « publicId » (fin d'URL après le dernier '/')
    const getBasename = (url?: string | null) => url ? url.split('/').pop() : undefined;
    const candidateBase = getBasename(design.imageUrl);
    if (candidateBase) {
      match = vendorDesigns.find(d => getBasename(d.imageUrl) === candidateBase);
      if (match) return match.id;
    }

    // c) Log debug seulement en mode développement Vite
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      console.warn('⚠️ resolveVendorDesignId: Aucune correspondance trouvée pour imageUrl', {
        imageUrl: design.imageUrl,
        candidateBase,
        vendorDesignsCount: vendorDesigns.length
      });
    }
  }

  // 3) Si un seul design ➜ on l'utilise
  if (vendorDesigns.length === 1) return vendorDesigns[0].id;

  return design?.id ?? null;
} 