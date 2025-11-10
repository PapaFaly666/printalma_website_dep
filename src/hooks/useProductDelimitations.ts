import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

interface VendorProductResponse {
  success: boolean;
  data: {
    id: number;
    adminProduct?: {
      colorVariations: Array<{
        id: number;
        name: string;
        colorCode: string;
        images: Array<{
          id: number;
          url: string;
          viewType: string;
          delimitations: DelimitationData[];
        }>;
      }>;
    };
  };
}

/**
 * Hook pour récupérer les délimitations d'un produit vendeur
 * Utile pour les commandes qui n'ont pas de délimitations sauvegardées
 */
export const useProductDelimitations = (vendorProductId?: number, colorCode?: string) => {
  const [delimitation, setDelimitation] = useState<DelimitationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 [useProductDelimitations] Hook appelé avec:', { vendorProductId, colorCode });

  console.log('🎯 [useProductDelimitations] Avant useEffect');

  useEffect(() => {
    console.log('🎯 [useProductDelimitations] useEffect exécuté DÉBUT avec:', { vendorProductId, colorCode });

    if (!vendorProductId) {
      console.log('⚠️ [useProductDelimitations] Pas de vendorProductId, abandon');
      setDelimitation(null);
      return;
    }

    const fetchDelimitations = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 [useProductDelimitations] Récupération du produit vendeur:', vendorProductId);

        const response = await fetch(`${API_BASE_URL}/vendor-products/${vendorProductId}/public`);

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result: VendorProductResponse = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Produit non trouvé');
        }

        console.log('✅ [useProductDelimitations] Produit récupéré:', result.data);

        // Extraire les délimitations depuis adminProduct
        if (result.data.adminProduct?.colorVariations) {
          // Chercher la variation de couleur correspondante
          const colorVariation = colorCode
            ? result.data.adminProduct.colorVariations.find(cv => cv.colorCode === colorCode)
            : result.data.adminProduct.colorVariations[0]; // Prendre la première si pas de colorCode

          console.log('🎨 [useProductDelimitations] Variation de couleur trouvée:', colorVariation);

          if (colorVariation?.images && colorVariation.images.length > 0) {
            // Prendre l'image Front ou la première
            const mockupImage = colorVariation.images.find(img => img.viewType === 'Front')
              || colorVariation.images[0];

            console.log('🖼️ [useProductDelimitations] Image mockup:', mockupImage);

            if (mockupImage?.delimitations && mockupImage.delimitations.length > 0) {
              const firstDelimitation = mockupImage.delimitations[0];
              console.log('📐 [useProductDelimitations] Délimitation trouvée:', firstDelimitation);
              setDelimitation(firstDelimitation);
            } else {
              console.warn('⚠️ [useProductDelimitations] Pas de délimitations trouvées');
              setDelimitation(null);
            }
          } else {
            console.warn('⚠️ [useProductDelimitations] Pas d\'images trouvées');
            setDelimitation(null);
          }
        } else {
          console.warn('⚠️ [useProductDelimitations] Pas de adminProduct.colorVariations');
          setDelimitation(null);
        }
      } catch (err) {
        console.error('❌ [useProductDelimitations] Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setDelimitation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDelimitations();
  }, [vendorProductId, colorCode]);

  return { delimitation, loading, error };
};

export default useProductDelimitations;
