import { useState, useEffect } from 'react';

// 🛒 Service API pour les détails des produits vendeur (Architecture V2)
// Conforme au guide frontend fourni

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Types basés sur la documentation
export interface VendorProductDetail {
  id: number;
  designApplication: {
    designUrl: string;
    positioning: string;
    scale: number;
  };
  adminProduct: {
    id: number;
    name: string;
    description?: string;
    price: number;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string;
        delimitations: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'PIXEL' | 'PERCENT';
        }>;
      }>;
    }>;
    sizes: Array<{
      id: number;
      sizeName: string;
    }>;
  };
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
  designId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// Fonction pour obtenir les headers avec authentification
function getRequestHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Récupérer les détails complets d'un produit vendeur
 * GET /vendor/products/{productId}
 */
export async function fetchVendorProductDetail(vpId: number): Promise<VendorProductDetail> {
  try {
    console.log(`📋 Récupération des détails du produit vendeur ${vpId}`);
    
    const response = await fetch(`${API_BASE_URL}/vendor/products/${vpId}`, {
      method: 'GET',
      headers: getRequestHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Données produit invalides');
    }

    console.log('✅ Détails produit récupérés:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des détails du produit:', error);
    throw error;
  }
}

/**
 * Récupérer la position enregistrée d'un design
 * GET /api/vendor-products/{vpId}/designs/{designId}/position/direct
 */
export async function fetchDesignPosition(vpId: number, designId: number): Promise<DesignPosition | null> {
  try {
    console.log(`📍 Récupération de la position du design ${designId} pour le produit ${vpId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/vendor-products/${vpId}/designs/${designId}/position/direct`, {
      method: 'GET',
      headers: getRequestHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('📍 Aucune position enregistrée trouvée');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.data) {
      console.log('📍 Aucune position enregistrée');
      return null;
    }

    console.log('✅ Position récupérée:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la position:', error);
    // Retourner null plutôt que throw pour permettre un fallback
    return null;
  }
}

/**
 * Sauvegarder la position d'un design
 * PUT /api/vendor-products/{vpId}/designs/{designId}/position/direct
 */
export async function saveDesignPosition(vpId: number, designId: number, position: DesignPosition): Promise<void> {
  try {
    console.log(`💾 Sauvegarde de la position du design ${designId} pour le produit ${vpId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/vendor-products/${vpId}/designs/${designId}/position/direct`, {
      method: 'PUT',
      headers: getRequestHeaders(),
      credentials: 'include',
      body: JSON.stringify(position)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Position sauvegardée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la position:', error);
    throw error;
  }
}

/**
 * Utilitaire pour charger une image et obtenir ses dimensions
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Calculer la position finale du design dans la délimitation
 * selon la documentation fournie
 */
export function calculateDesignPosition(
  delimitation: { x: number; y: number; width: number; height: number; coordinateType: 'PIXEL' | 'PERCENT' },
  savedPosition: DesignPosition | null,
  fallbackScale: number,
  imageWidth: number,
  imageHeight: number
): DesignPosition {
  // Adapter les unités de la délimitation
  const delim = { ...delimitation };
  if (delimitation.coordinateType === 'PERCENT') {
    delim.x = (delimitation.x / 100) * imageWidth;
    delim.y = (delimitation.y / 100) * imageHeight;
    delim.width = (delimitation.width / 100) * imageWidth;
    delim.height = (delimitation.height / 100) * imageHeight;
  }

  // Si position sauvegardée, l'utiliser
  if (savedPosition) {
    return savedPosition;
  }

  // Fallback : centrer dans la délimitation
  const centerX = delim.x + delim.width / 2;
  const centerY = delim.y + delim.height / 2;

  return {
    x: centerX,
    y: centerY,
    scale: fallbackScale,
    rotation: 0
  };
}

/**
 * Hook personnalisé pour gérer les détails et position d'un produit vendeur
 */
export function useVendorProductDetail(vpId: number) {
  console.log(`🔍 useVendorProductDetail appelé avec vpId: ${vpId}`);
  
  const [product, setProduct] = useState<VendorProductDetail | null>(null);
  const [position, setPosition] = useState<DesignPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vpId) {
      console.log(`⚠️ useVendorProductDetail: vpId manquant`);
      return;
    }

    const loadData = async () => {
      console.log(`🔄 useVendorProductDetail: Début chargement pour vpId ${vpId}`);
      setLoading(true);
      try {
        // Charger les détails du produit
        console.log(`📋 useVendorProductDetail: Chargement détails produit ${vpId}`);
        const productDetail = await fetchVendorProductDetail(vpId);
        console.log(`✅ useVendorProductDetail: Produit chargé:`, productDetail);
        setProduct(productDetail);

        // Charger la position du design si disponible
        if (productDetail.designId) {
          console.log(`📍 useVendorProductDetail: Chargement position design ${productDetail.designId}`);
          const designPosition = await fetchDesignPosition(vpId, productDetail.designId);
          console.log(`✅ useVendorProductDetail: Position chargée:`, designPosition);
          setPosition(designPosition);
        } else {
          console.log(`⚠️ useVendorProductDetail: Pas de designId trouvé`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error(`❌ useVendorProductDetail: Erreur:`, err);
        setError(errorMsg);
      } finally {
        console.log(`🏁 useVendorProductDetail: Fin chargement pour vpId ${vpId}`);
        setLoading(false);
      }
    };

    loadData();
  }, [vpId]);

  return { product, position, loading, error };
} 