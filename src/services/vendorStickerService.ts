// Service pour la gestion des produits stickers vendeur
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Types pour les stickers
export type StickerType = 'autocollant' | 'pare-chocs';
export type StickerSurface = 'blanc-mat' | 'transparent';

/**
 * StickerListItem - Type pour la réponse de l'API GET /vendor/stickers
 * Correspond exactement à la structure retournée par le backend
 */
export interface StickerListItem {
  id: number;
  name: string;
  // Image générée avec bordures par le backend
  stickerImage: string;
  // Design original (fallback)
  designPreview: string;
  size: string;
  finish: string;
  price: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT' | 'REJECTED';
  saleCount: number;
  viewCount: number;
  createdAt: string;
}

export interface StickerProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING';

  // Configuration du sticker
  size: {
    id: string;
    name: string;
    width: number;
    height: number;
  };
  finish: string;
  shape: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';

  // Image générée avec bordures par le backend (Sharp)
  imageUrl?: string;
  cloudinaryPublicId?: string;

  // Design associé
  designId: number;
  design?: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
  };

  // Métadonnées
  sku?: string;
  finalPrice: number;
  createdAt: string;
  updatedAt?: string;
  vendorId: number;

  // Informations vendeur
  vendor?: {
    id: number;
    fullName: string;
    shop_name?: string;
    email: string;
  };
}

export interface CreateStickerProductPayload {
  // Design source
  designId: number;

  // Informations produit
  name: string;
  description?: string;

  // Taille du sticker
  size: {
    id?: string;
    width: number;  // en cm
    height: number; // en cm
  };

  // Finition
  finish: string; // matte, glossy, transparent, holographic, metallic

  // Forme
  shape: 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT';

  // Prix et stock
  price: number;
  stockQuantity: number;

  // Configuration de génération (optionnel)
  stickerType?: StickerType; // autocollant | pare-chocs
  borderColor?: string; // white, glossy-white, matte-white, transparent
}

export interface StickerProductsResponse {
  success: boolean;
  data: {
    stickers: StickerListItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface CreateStickerProductResponse {
  success: boolean;
  message: string;
  productId: number;
  data: StickerProduct;
}

// Headers pour authentification par cookies
function getRequestHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Options de requête avec authentification par cookies
function getRequestOptions(method: string = 'GET', body?: any): RequestInit {
  const options: RequestInit = {
    method,
    headers: getRequestHeaders(),
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

class VendorStickerService {
  private baseUrl = `${API_BASE_URL}/vendor/stickers`;

  /**
   * Créer un nouveau produit sticker
   * POST /vendor/stickers
   */
  async createStickerProduct(payload: CreateStickerProductPayload): Promise<CreateStickerProductResponse> {
    try {
      console.log('🎨 === CRÉATION PRODUIT STICKER ===');
      console.log('📋 Payload:', payload);

      // Validation
      if (!payload.designId) {
        throw new Error('designId est requis');
      }

      if (!payload.stickerType) {
        throw new Error('stickerType est requis');
      }

      if (!payload.name) {
        throw new Error('name est requis');
      }

      if (!payload.price || payload.price <= 0) {
        throw new Error('price doit être positif');
      }

      const response = await fetch(this.baseUrl, {
        ...getRequestOptions('POST', payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Produit sticker créé:', result);

      return result;
    } catch (error) {
      console.error('❌ Error creating sticker product:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les produits stickers du vendeur
   * GET /vendor/stickers
   */
  async getStickerProducts(params?: {
    limit?: number;
    offset?: number;
    status?: 'all' | 'published' | 'draft' | 'pending';
    search?: string;
  }): Promise<StickerProductsResponse> {
    try {
      console.log('📡 === CHARGEMENT PRODUITS STICKERS ===');

      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.status && params.status !== 'all') {
        queryParams.append('status', params.status.toUpperCase());
      }
      if (params?.search) queryParams.append('search', params.search);

      const endpoint = `${this.baseUrl}${queryParams.toString() ? `?${queryParams}` : ''}`;
      console.log('🔗 URL API:', endpoint);

      const response = await fetch(endpoint, getRequestOptions('GET'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Produits stickers chargés:', result);

      return result;
    } catch (error) {
      console.error('❌ Error fetching sticker products:', error);
      throw error;
    }
  }

  /**
   * Obtenir un produit sticker par ID
   * GET /vendor/stickers/:id
   */
  async getStickerProduct(id: number): Promise<StickerProduct> {
    try {
      console.log(`📋 === CHARGEMENT PRODUIT STICKER ${id} ===`);

      const response = await fetch(`${this.baseUrl}/${id}`, {
        ...getRequestOptions('GET'),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Produit sticker chargé:', result);

      return result.success ? result.data : result;
    } catch (error) {
      console.error(`❌ Error fetching sticker product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour un produit sticker
   * PUT /vendor/stickers/:id
   */
  async updateStickerProduct(id: number, updates: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    stickerSize?: string;
    status?: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  }): Promise<StickerProduct> {
    try {
      console.log(`🔧 === MISE À JOUR PRODUIT STICKER ${id} ===`);
      console.log('📝 Modifications:', updates);

      const response = await fetch(`${this.baseUrl}/${id}`, {
        ...getRequestOptions('PUT', updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Produit sticker mis à jour:', result);

      return result.success ? result.data : result;
    } catch (error) {
      console.error(`❌ Error updating sticker product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un produit sticker
   * DELETE /vendor/stickers/:id
   */
  async deleteStickerProduct(id: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ === SUPPRESSION PRODUIT STICKER ${id} ===`);

      const response = await fetch(`${this.baseUrl}/${id}`, {
        ...getRequestOptions('DELETE'),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Produit sticker supprimé');

      return result;
    } catch (error) {
      console.error(`❌ Error deleting sticker product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Publier un produit sticker (DRAFT → PUBLISHED)
   * PUT /vendor/stickers/:id/publish
   */
  async publishStickerProduct(id: number): Promise<{
    success: boolean;
    message: string;
    product: StickerProduct;
  }> {
    try {
      console.log(`🚀 === PUBLICATION PRODUIT STICKER ${id} ===`);

      const response = await fetch(`${this.baseUrl}/${id}/publish`, {
        ...getRequestOptions('PUT'),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Produit sticker publié:', result);

      return result;
    } catch (error) {
      console.error(`❌ Error publishing sticker product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculer le prix d'un sticker en fonction de ses paramètres
   */
  calculateStickerPrice(
    stickerType: StickerType,
    designPrice: number = 0,
    stickerSize?: string
  ): number {
    // Prix de base selon le type
    const basePrice = stickerType === 'autocollant' ? 2000 : 4500; // Prix en FCFA

    // Ajustement selon la taille (optionnel)
    let sizeMultiplier = 1.0;
    if (stickerSize) {
      const [widthStr] = stickerSize.split(' x ');
      const width = parseInt(widthStr);

      if (width > 100) {
        sizeMultiplier = 1.5; // +50% pour grande taille
      } else if (width > 150) {
        sizeMultiplier = 2.0; // +100% pour très grande taille
      }
    }

    // Prix total = (base × multiplicateur taille) + design
    const totalPrice = Math.round((basePrice * sizeMultiplier) + (designPrice || 0));

    console.log('💰 Calcul prix sticker:', {
      type: stickerType,
      basePrice,
      sizeMultiplier,
      designPrice,
      totalPrice
    });

    return totalPrice;
  }

  /**
   * Obtenir les tailles disponibles pour les stickers
   */
  getAvailableSizes(stickerType: StickerType): string[] {
    if (stickerType === 'autocollant') {
      return [
        '83 mm x 100 mm',
        '100 mm x 120 mm',
        '120 mm x 144 mm',
        '150 mm x 180 mm'
      ];
    } else {
      // pare-chocs
      return [
        '100 mm x 300 mm',
        '120 mm x 360 mm',
        '150 mm x 450 mm'
      ];
    }
  }

  /**
   * Obtenir les couleurs de bordure disponibles pour les autocollants
   */
  getAvailableBorderColors(): Array<{ value: string; label: string; preview: string }> {
    return [
      { value: 'transparent', label: 'Sans bordure', preview: 'transparent' },
      { value: 'white', label: 'Bordure blanche', preview: '#FFFFFF' },
      { value: 'glossy-white', label: 'Bordure blanche brillante', preview: '#FFFFFF' }
    ];
  }

  /**
   * Obtenir les surfaces disponibles
   */
  getAvailableSurfaces(): Array<{ value: StickerSurface; label: string; description: string }> {
    return [
      {
        value: 'blanc-mat',
        label: 'Blanc mat',
        description: 'Surface blanche opaque avec finition mate'
      },
      {
        value: 'transparent',
        label: 'Transparent',
        description: 'Surface transparente, seul le design est visible'
      }
    ];
  }
}

export const vendorStickerService = new VendorStickerService();
export default vendorStickerService;
