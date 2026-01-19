// src/services/vendorProductsService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface DelimitationData {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name: string;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
  absoluteX: number | null;
  absoluteY: number | null;
  absoluteWidth: number | null;
  absoluteHeight: number | null;
  originalImageWidth: number;
  originalImageHeight: number;
  productImageId: number;
  createdAt: string;
  updatedAt: string;
  referenceWidth: number;
  referenceHeight: number;
}

export interface DesignPosition {
  designId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    constraints: {
      minScale: number;
      maxScale: number;
    };
    designWidth: number;
    designHeight: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VendorProduct {
  id: number;
  vendorName: string;
  price: number;
  status: string;
  bestSeller: {
    isBestSeller: boolean;
    salesCount: number;
    totalRevenue: number;
  };
  adminProduct: {
    id: number;
    name: string;
    description: string;
    price: number;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      productId: number;
      images: Array<{
        id: number;
        url: string;
        viewType: string; // ✅ Changé de "view" à "viewType" pour compatibilité avec SimpleProductPreview
        naturalWidth: number;
        naturalHeight: number;
        delimitations: DelimitationData[];
      }>;
    }>;
    sizes: unknown[];
  };
  designApplication: {
    hasDesign: boolean;
    designUrl: string;
    positioning: string;
    scale: number;
    mode: string;
  };
  designDelimitations: Array<{
    colorName: string;
    colorCode: string;
    imageUrl: string;
    naturalWidth: number;
    naturalHeight: number;
    delimitations: DelimitationData[];
  }>;
  design: {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    tags: string[];
    isValidated: boolean;
  };
  designPositions: DesignPosition[];
  designTransforms: any[];
  vendor: {
    id: number;
    fullName: string;
    shop_name: string;
    profile_photo_url: string | null;
  };
  images: {
    adminReferences: Array<{
      colorName: string;
      colorCode: string;
      adminImageUrl: string;
      imageType: 'base' | 'detail' | 'admin_reference'; // ✅ Type strict pour compatibilité avec SimpleProductPreview
    }>;
    total: number;
    primaryImageUrl: string;
  };
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  designId: number | null; // ✅ Changé à "number | null" pour compatibilité avec SimpleProductPreview
  // ✅ Images finales avec design appliqué (mockup + design inclus)
  finalImages?: Array<{
    id: number;
    colorId: number;
    colorName: string;
    colorCode: string;
    finalImageUrl: string;
    mockupUrl: string;
  }>;
  defaultColorId?: number | null;
}

export interface VendorProductsResponse {
  success: boolean;
  message: string;
  data: VendorProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export type ProductGenre = 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

export interface SearchParams {
  search?: string;
  limit?: number;
  offset?: number;
  genre?: ProductGenre;
  allProducts?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: number;
}

export interface VendorProductDetailResponse {
  success: boolean;
  message: string;
  data: VendorProduct;
}

class VendorProductsService {
  /**
   * Rechercher des produits vendeurs
   * GET /public/vendor-products?search=...
   */
  async searchProducts(params?: SearchParams): Promise<VendorProductsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        queryParams.append('offset', params.offset.toString());
      }
      if (params?.genre) {
        queryParams.append('genre', params.genre);
      }
      if (params?.allProducts !== undefined) {
        queryParams.append('allProducts', params.allProducts.toString());
      }
      if (params?.category) {
        queryParams.append('category', params.category);
      }
      if (params?.minPrice) {
        queryParams.append('minPrice', params.minPrice.toString());
      }
      if (params?.maxPrice) {
        queryParams.append('maxPrice', params.maxPrice.toString());
      }
      if (params?.vendorId) {
        queryParams.append('vendorId', params.vendorId.toString());
      }

      const url = `${API_BASE}/public/vendor-products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🔍 [VendorProducts] Recherche:', url);

      const response = await axios.get(url);

      console.log('✅ [VendorProducts] Résultats:', {
        total: response.data.pagination?.total || 0,
        count: response.data.data?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ [VendorProducts] Erreur:', error);

      // Retourner une structure vide en cas d'erreur
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la recherche',
        data: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      };
    }
  }

  /**
   * Récupérer tous les produits (sans filtre)
   */
  async getAllProducts(limit: number = 20, offset: number = 0): Promise<VendorProductsResponse> {
    return this.searchProducts({ limit, offset });
  }

  /**
   * Rechercher par catégorie
   */
  async searchByCategory(category: string, limit: number = 20, offset: number = 0): Promise<VendorProductsResponse> {
    return this.searchProducts({ search: category, limit, offset });
  }

  /**
   * Récupérer les produits par genre
   * GET /public/vendor-products?genre=...
   */
  async getProductsByGenre(genre: ProductGenre, limit: number = 12, offset: number = 0): Promise<VendorProductsResponse> {
    console.log('🔍 [VendorProducts] Recherche par genre:', genre);
    return this.searchProducts({
      genre,
      limit,
      offset,
      allProducts: true
    });
  }

  /**
   * Récupérer les détails d'un produit spécifique
   * GET /public/vendor-products/:id
   */
  async getProductById(id: number): Promise<VendorProductDetailResponse> {
    try {
      const url = `${API_BASE}/public/vendor-products/${id}`;
      console.log('🔍 [VendorProducts] Récupération détails produit:', url);

      // Ajouter un timeout de 10 secondes pour éviter les chargements infinis
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'accept': 'application/json'
        }
      });

      console.log('✅ [VendorProducts] Détails produit récupérés:', {
        id: response.data.data?.id,
        name: response.data.data?.vendorName,
        hasDesign: response.data.data?.designApplication?.hasDesign,
        status: response.status
      });

      return response.data;
    } catch (error) {
      console.error('❌ [VendorProducts] Erreur lors de la récupération des détails:', {
        error,
        message: error instanceof Error ? error.message : 'Produit non trouvé',
        isAxiosError: axios.isAxiosError(error),
        status: axios.isAxiosError(error) ? error.response?.status : 'N/A',
        url: error instanceof Error ? error.message : ''
      });

      // Gérer les différents types d'erreurs
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return {
            success: false,
            message: 'Timeout: La requête a pris trop de temps',
            data: null as any
          };
        }
        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Produit non trouvé (404)',
            data: null as any
          };
        }
        if (error.response?.status === 500) {
          return {
            success: false,
            message: 'Erreur serveur (500)',
            data: null as any
          };
        }
        return {
          success: false,
          message: `Erreur ${error.response?.status}: ${error.message}`,
          data: null as any
        };
      }

      // Retourner une structure d'erreur générique en cas d'échec
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Produit non trouvé',
        data: null as any
      };
    }
  }
}

export default new VendorProductsService();
