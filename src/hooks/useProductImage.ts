import { useMemo } from 'react';

// Types basés sur la nouvelle structure API backend
interface ColorVariationImage {
  id: number;
  url: string;
  view: string;
  source: 'vendor' | 'base';
}

interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: ColorVariationImage[];
  hasIssue?: boolean;
}

interface VendorProduct {
  id: number;
  vendorName: string;
  selectedColors?: Array<{ id: number; name: string; colorCode: string }>;
  colorVariations?: ColorVariation[];
  images: {
    primaryImageUrl?: string;
    colorImages?: Array<{ cloudinaryUrl: string; colorName?: string }>;
  };
}

interface ProductImageResult {
  url: string;
  colorName?: string;
  source: 'colorVariations' | 'legacy' | 'default';
  hasIssue?: boolean;
}

/**
 * Hook personnalisé pour gérer les images de produits de manière robuste
 * Compatible avec la nouvelle structure API backend (colorVariations enrichies)
 */
export const useProductImage = (product: VendorProduct): ProductImageResult => {
  return useMemo(() => {
    // 🆕 PRIORITÉ 1: Utiliser les colorVariations enrichies (nouvelle structure backend)
    const firstVariation = product.colorVariations?.[0];
    if (firstVariation?.images?.[0]?.url) {
      return {
        url: firstVariation.images[0].url,
        colorName: firstVariation.name,
        source: 'colorVariations',
        hasIssue: firstVariation.hasIssue
      };
    }

    // 🔄 FALLBACK 1: Structure legacy avec selectedColors + colorImages
    const firstColor = product.selectedColors?.[0];
    if (firstColor) {
      const matchingImage = product.images.colorImages?.find(
        img => img.colorName?.toLowerCase() === firstColor.name?.toLowerCase()
      );
      if (matchingImage?.cloudinaryUrl) {
        return {
          url: matchingImage.cloudinaryUrl,
          colorName: firstColor.name,
          source: 'legacy'
        };
      }
    }

    // 🔄 FALLBACK 2: Image principale de l'API
    if (product.images.primaryImageUrl) {
      return {
        url: product.images.primaryImageUrl,
        source: 'default'
      };
    }

    // 🔄 FALLBACK FINAL: Image placeholder
    return {
      url: '/images/placeholder.jpg',
      source: 'default'
    };
  }, [product]);
};

/**
 * Hook simplifié pour récupérer uniquement l'URL
 */
export const useProductImageUrl = (product: VendorProduct): string => {
  const imageResult = useProductImage(product);
  return imageResult.url;
};

/**
 * Fonction utilitaire pour extraire l'URL d'image (usage dans les composants)
 */
export const getProductImageUrl = (product: VendorProduct): string => {
  // 🆕 Priorité aux colorVariations (nouvelle structure)
  if (product.colorVariations?.[0]?.images?.[0]?.url) {
    return product.colorVariations[0].images[0].url;
  }
  
  // 🔄 Fallback sur selectedColors + colorImages
  const firstColor = product.selectedColors?.[0];
  if (firstColor) {
    const matchingImage = product.images.colorImages?.find(
      img => img.colorName?.toLowerCase() === firstColor.name?.toLowerCase()
    );
    if (matchingImage?.cloudinaryUrl) {
      return matchingImage.cloudinaryUrl;
    }
  }
  
  // 🔄 Fallback sur image principale
  if (product.images?.primaryImageUrl) {
    return product.images.primaryImageUrl;
  }
  
  // 🔄 Fallback final
  return '/images/placeholder.jpg';
}; 