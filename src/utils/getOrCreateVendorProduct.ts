import { apiClient } from '@/lib/apiClient';

/**
 * Retourne le **vendorProductId** associé au `baseProductId` + `designId`.
 * 1️⃣ Cherche dans la liste `/vendor/products`.
 * 2️⃣ Si absent ➜ crée le produit via `POST /vendor/products` (backend V2).
 * La fonction renvoie toujours un ID **≥ 60** (les IDs < 60 sont réservés aux produits admin).
 */
// Cache interne pour éviter les créations multiples concurrentes
const creationCache = new Map<string, Promise<number>>();

export async function getOrCreateVendorProduct(baseProductId: number, designId: number): Promise<number> {
  const cacheKey = `${baseProductId}-${designId}`;
  if (creationCache.has(cacheKey)) {
    return creationCache.get(cacheKey)!;
  }

  const promise = (async () => {
  // 1. Chercher côté backend s'il existe déjà
  try {
    const { data } = await apiClient.get('/vendor/products', {
      params: { limit: 1000 }, // récupère tous les produits du vendeur
      withCredentials: true
    });

    const list = data?.data?.products || data?.products || data?.data || [];
    const existing = list.find((p: any) =>
      p?.adminProduct?.id === baseProductId &&
      p?.designApplication?.designId === designId
    );

    if (existing) {
      console.log('🔍 VendorProduct déjà existant ➜', existing.id);
      return existing.id;
    }
  } catch (err) {
    console.warn('ℹ️ Impossible de récupérer /vendor/products – tentative de création directe');
  }

  // 2. Création du produit vendeur
  console.log('📦 Création vendorProduct (V2) pour baseProductId', baseProductId);

  // Construire la structure admin complète (obligatoire)
  const productStructure = await (await import('./buildProductStructure')).buildProductStructure(baseProductId);

  // Déduire selectedColors / selectedSizes à partir du produit admin
  const derivedColors = (productStructure.adminProduct.images.colorVariations || []).map((cv: any) => ({
    id: cv.id,
    name: cv.name,
    colorCode: cv.colorCode
  }));

  const derivedSizes = (productStructure.adminProduct.sizes || []).map((sz: any) => ({
    id: sz.id,
    sizeName: sz.sizeName
  }));

  const payload: Record<string, any> = {
    baseProductId,
    designId,
    productStructure,

    // Champs vendeur requis
    vendorName: `Produit personnalisé #${baseProductId}`,
    vendorDescription: '', // ⬅️ DESCRIPTION VIDE pour éviter l'erreur auto-générée
    vendorPrice: 19900,
    vendorStock: 0,

    // Sélections dérivées (fallback sur placeholders si vides)
    selectedColors: derivedColors.length ? derivedColors : [{ id: 0, name: 'Par défaut', colorCode: '#FFFFFF' }],
    selectedSizes: derivedSizes.length ? derivedSizes : [{ id: 0, sizeName: 'TU' }]
  };

  const pubRes = await apiClient.post('/vendor/products', payload, { withCredentials: true });

  const newVpId = pubRes.data?.productId || pubRes.data?.data?.productId || pubRes.data?.id;
  if (!newVpId) {
    console.error('❌ /vendor/products nʼa pas retourné productId', pubRes.data);
    throw new Error('productId manquant dans la réponse de /vendor/products');
  }

  console.log('✅ VendorProduct créé ➜', newVpId);
  return newVpId;
  })();

  // Stocker la promesse pour dédupliquer
  creationCache.set(cacheKey, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    // Nettoyage pour éviter mémoire infinie
    creationCache.delete(cacheKey);
  }
} 