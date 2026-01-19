// Service pour la gestion des stickers publics (côté client)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Types pour les stickers publics
export type StickerType = 'autocollant' | 'pare-chocs';
export type StickerSurface = 'blanc-mat' | 'transparent';

/**
 * PublicSticker - Type pour la réponse de l'API GET /vendor/stickers/:id
 */
export interface PublicSticker {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  // Image générée avec bordures par le backend
  imageUrl: string;
  // Design source
  design: {
    id: number;
    name: string;
    imageUrl: string;
    thumbnailUrl?: string;
    category?: number;
  };
  // Configuration
  configuration: {
    size: {
      width: number;
      height: number;
    };
    finish: string;
    shape: string;
  };
  // Prix
  pricing: {
    basePrice: number;
    finishMultiplier: number;
    finalPrice: number;
    currency: string;
  };
  // Stock
  stock: {
    quantity: number;
    minimumOrder: number;
  };
  status: string;
  stats: {
    viewCount: number;
    saleCount: number;
  };
  vendor: {
    id: number;
    shopName: string;
  };
  createdAt?: string;
  publishedAt?: string;

  // Propriétés calculées pour compatibilité
  size?: string; // Format: "10x15cm"
  finish?: string;
  shape?: string;
  price?: number;
  minimumOrder?: number;
  viewCount?: number;
  saleCount?: number;
}

export interface PublicStickersResponse {
  success: boolean;
  data: {
    stickers: PublicSticker[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface PublicStickersQueryParams {
  search?: string;
  vendorId?: number;
  size?: string;
  finish?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Headers pour requêtes API
function getRequestHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Options de requête
function getRequestOptions(method: string = 'GET', body?: any): RequestInit {
  const options: RequestInit = {
    method,
    headers: getRequestHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

class PublicStickerService {
  private baseUrl = `${API_BASE_URL}/public/stickers`;

  /**
   * Obtenir tous les stickers publiés
   * GET /public/stickers
   */
  async getPublicStickers(params?: PublicStickersQueryParams): Promise<PublicStickersResponse> {
    try {
      console.log('📡 === CHARGEMENT STICKERS PUBLICS ===');

      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.vendorId) queryParams.append('vendorId', params.vendorId.toString());
      if (params?.size) queryParams.append('size', params.size);
      if (params?.finish) queryParams.append('finish', params.finish);
      if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `${this.baseUrl}${queryParams.toString() ? `?${queryParams}` : ''}`;
      console.log('🔗 URL API:', endpoint);

      const response = await fetch(endpoint, getRequestOptions('GET'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Stickers publics chargés:', result);

      return result;
    } catch (error) {
      console.error('❌ Error fetching public stickers:', error);
      throw error;
    }
  }

  /**
   * Obtenir un sticker par ID
   * GET /public/stickers/:id
   */
  async getPublicSticker(id: number): Promise<{ success: boolean; data: PublicSticker }> {
    try {
      console.log(`📋 === CHARGEMENT STICKER PUBLIC ${id} ===`);

      // Utiliser l'endpoint public
      const response = await fetch(`${this.baseUrl}/${id}`, getRequestOptions('GET'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Sticker public chargé (réponse brute):', result);

      // Normaliser les données pour compatibilité avec l'ancien format
      if (result.success && result.data) {
        const sticker = result.data;

        // Ajouter les propriétés calculées pour compatibilité
        sticker.size = `${sticker.configuration.size.width}x${sticker.configuration.size.height}cm`;
        sticker.finish = sticker.configuration.finish;
        sticker.shape = sticker.configuration.shape;
        sticker.price = sticker.pricing.finalPrice;
        sticker.minimumOrder = sticker.stock.minimumOrder;
        sticker.viewCount = sticker.stats.viewCount;
        sticker.saleCount = sticker.stats.saleCount;

        console.log('✅ Sticker normalisé:', {
          id: sticker.id,
          name: sticker.name,
          size: sticker.size,
          price: sticker.price,
          minimumOrder: sticker.minimumOrder
        });
      }

      return result;
    } catch (error) {
      console.error(`❌ Error fetching public sticker ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les configurations disponibles
   * GET /public/stickers/configurations
   */
  async getConfigurations(): Promise<{
    success: boolean;
    data: {
      shapes: Array<{ id: string; name: string; description: string }>;
      stickerTypes: Array<{ id: string; name: string; description: string }>;
      borderColors: Array<{ id: string; name: string; description: string }>;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/configurations`, getRequestOptions('GET'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching configurations:', error);
      throw error;
    }
  }

  /**
   * Convertir un PublicSticker en format compatible avec VendorProduct
   * Cela permet d'afficher les stickers dans la même grille que les produits traditionnels
   */
  convertToVendorProduct(sticker: PublicSticker): any {
    // Extraire les valeurs depuis la nouvelle structure
    const price = sticker.pricing?.finalPrice || sticker.price || 0;
    const saleCount = sticker.stats?.saleCount || sticker.saleCount || 0;
    const viewCount = sticker.stats?.viewCount || sticker.viewCount || 0;
    const finish = sticker.configuration?.finish || sticker.finish || 'glossy';
    const shape = sticker.configuration?.shape || sticker.shape || 'SQUARE';
    const size = sticker.size || `${sticker.configuration?.size?.width || 10}x${sticker.configuration?.size?.height || 10}cm`;

    return {
      id: sticker.id,
      vendorName: sticker.name,
      price: price,
      status: sticker.status || 'PUBLISHED',
      bestSeller: {
        isBestSeller: saleCount > 10,
        salesCount: saleCount,
        totalRevenue: saleCount * price,
      },
      adminProduct: {
        id: sticker.id,
        name: sticker.name,
        description: sticker.description || '',
        price: price,
        colorVariations: [], // Les stickers n'ont pas de variations de couleur
        sizes: [],
      },
      designApplication: {
        hasDesign: true,
        designUrl: sticker.design?.imageUrl || sticker.imageUrl,
        positioning: 'CENTER',
        scale: 1.0,
        mode: 'PRESERVED',
      },
      designDelimitations: [],
      design: {
        id: sticker.design?.id || sticker.id,
        name: sticker.design?.name || sticker.name,
        description: sticker.description || '',
        imageUrl: sticker.design?.imageUrl || sticker.imageUrl,
        tags: ['sticker'],
        isValidated: true,
      },
      designPositions: [],
      designTransforms: [],
      vendor: {
        id: sticker.vendor?.id || 0,
        fullName: sticker.vendor?.shopName || 'Vendeur',
        shop_name: sticker.vendor?.shopName || '',
        profile_photo_url: null,
      },
      images: {
        adminReferences: [],
        total: 1,
        primaryImageUrl: sticker.imageUrl,
      },
      selectedSizes: [],
      selectedColors: [],
      designId: sticker.design?.id || null,
      // Marquer comme sticker pour différenciation
      isSticker: true,
      stickerType: 'autocollant',
      stickerFinish: finish,
      stickerShape: shape,
      stickerSize: size,
    };
  }
}

export const publicStickerService = new PublicStickerService();
export default publicStickerService;
