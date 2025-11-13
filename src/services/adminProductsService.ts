// src/services/adminProductsService.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface AdminProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  suggestedPrice?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  subCategory?: {
    id: number;
    name: string;
    slug: string;
  };
  colorVariations?: Array<{
    id: number;
    name: string;
    colorCode: string;
    productId: number;
    images: Array<{
      id: number;
      view: string;
      url: string;
      publicId: string;
      naturalWidth: number | null;
      naturalHeight: number | null;
      colorVariationId: number;
    }>;
  }>;
  sizes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductsResponse {
  data: AdminProduct[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

const adminProductsService = {
  // Récupérer tous les produits admin
  getAllProducts: async (): Promise<AdminProductsResponse> => {
    try {
      const response = await axios.get(`${API_BASE}/products`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits admin:', error);
      throw error;
    }
  },

  // Récupérer un produit admin par ID
  getProductById: async (id: number): Promise<AdminProduct> => {
    try {
      const response = await axios.get(`${API_BASE}/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les produits par catégorie
  getProductsByCategory: async (categorySlug: string): Promise<AdminProductsResponse> => {
    try {
      const response = await axios.get(`${API_BASE}/products`, {
        params: { category: categorySlug }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des produits de la catégorie ${categorySlug}:`, error);
      throw error;
    }
  },
};

export default adminProductsService;
