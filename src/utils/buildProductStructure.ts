import { apiClient } from '@/lib/apiClient';

/**
 * Construit la structure attendue par lʼendpoint /vendor/products
 * à partir dʼun produit admin (baseProduct).
 */
export async function buildProductStructure(baseProductId: number) {
  // 1️⃣ Récupération du produit admin complet
  const { data } = await apiClient.get(`/products/${baseProductId}`, {
    withCredentials: true
  });

  // Structure simplifiée pour éviter les champs inutiles
  const {
    id,
    name,
    description,
    price,
    colorVariations = [],
    sizes = []
  } = data?.data || data || {};

  // 2️⃣ Mapping des variations couleur + images
  const mappedColorVariations = (colorVariations || []).map((cv: any) => ({
    id: cv.id,
    name: cv.name,
    colorCode: cv.colorCode || cv.hexCode || '#FFFFFF',
    images: (cv.images || []).map((img: any) => ({
      id: img.id,
      url: img.url || img.imageUrl || img.src,
      viewType: img.viewType || img.view || 'front'
    }))
  }));

  return {
    adminProduct: {
      id,
      name,
      description,
      price,
      images: {
        colorVariations: mappedColorVariations
      },
      sizes: (sizes || []).map((sz: any) => ({ id: sz.id, sizeName: sz.sizeName || sz.name }))
    },
    designApplication: {
      scale: 0.6,
      positioning: 'CENTER'
    }
  } as const;
} 