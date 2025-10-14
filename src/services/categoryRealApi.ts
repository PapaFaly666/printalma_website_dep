// src/services/categoryRealApi.ts
// Service API basé sur la documentation cate.md avec les vrais endpoints backend

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

// ===========================
// Types selon cate.md
// ===========================

export interface CreateCategoryDto {
  name: string;
  description?: string;
  displayOrder?: number;
  coverImageUrl?: string;
  coverImagePublicId?: string;
}

export interface CreateSubCategoryDto {
  name: string;
  description?: string;
  categoryId: number; // ID de la catégorie parente (REQUIS)
  displayOrder?: number;
}

export interface CreateVariationDto {
  name: string;
  description?: string;
  subCategoryId: number; // ID de la sous-catégorie parente (REQUIS)
  displayOrder?: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subCategories?: SubCategoryResponse[];
}

export interface SubCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  variations?: VariationResponse[];
}

export interface VariationResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  subCategoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subCategory?: {
    id: number;
    name: string;
    slug: string;
    categoryId: number;
    category?: {
      id: number;
      name: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CategoryHierarchy {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  subCategories: SubCategoryHierarchy[];
}

export interface SubCategoryHierarchy {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  displayOrder: number;
  isActive: boolean;
  variations: VariationHierarchy[];
}

export interface VariationHierarchy {
  id: number;
  name: string;
  slug: string;
  subCategoryId: number;
  displayOrder: number;
  isActive: boolean;
}

// ===========================
// Service API
// ===========================

class CategoryRealApi {
  // ==================
  // Categories (Niveau 0)
  // ==================

  /**
   * Lister toutes les catégories
   * GET /categories
   */
  async getCategories(): Promise<CategoryResponse[]> {
    const response = await axios.get(
      `${API_BASE}/categories`,
      { withCredentials: true }
    );

    // Gérer les deux formats de réponse
    if (response.data.success && response.data.data) {
      // Format: { success: true, data: [...] }
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      // Format: [...] (tableau direct)
      return response.data;
    } else {
      console.error('Format de réponse inattendu:', response.data);
      return [];
    }
  }

  /**
   * Récupérer une catégorie par ID
   * GET /categories/:id
   */
  async getCategoryById(id: number): Promise<CategoryResponse> {
    const response = await axios.get<ApiResponse<CategoryResponse>>(
      `${API_BASE}/categories/${id}`,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Récupérer la hiérarchie complète
   * GET /categories/hierarchy
   */
  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    const response = await axios.get<ApiResponse<CategoryHierarchy[]>>(
      `${API_BASE}/categories/hierarchy`,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Créer une catégorie principale (niveau 0)
   * POST /categories
   */
  async createCategory(data: CreateCategoryDto): Promise<CategoryResponse> {
    const response = await axios.post<ApiResponse<CategoryResponse>>(
      `${API_BASE}/categories`,
      data,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Mettre à jour une catégorie
   * PATCH /categories/:id
   */
  async updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<CategoryResponse> {
    const response = await axios.patch<ApiResponse<CategoryResponse>>(
      `${API_BASE}/categories/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Supprimer une catégorie
   * DELETE /categories/:id
   */
  async deleteCategory(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/categories/${id}`, {
      withCredentials: true
    });
  }

  // ==================
  // SubCategories (Niveau 1)
  // ==================

  /**
   * Lister toutes les sous-catégories (optionnel: filtrer par categoryId)
   * GET /sub-categories?categoryId=X
   */
  async getSubCategories(categoryId?: number): Promise<SubCategoryResponse[]> {
    const url = categoryId
      ? `${API_BASE}/sub-categories?categoryId=${categoryId}`
      : `${API_BASE}/sub-categories`;

    const response = await axios.get(url, { withCredentials: true });

    // Gérer les deux formats de réponse
    if (response.data.success && response.data.data) {
      // Format: { success: true, data: [...] }
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      // Format: [...] (tableau direct)
      return response.data;
    } else {
      console.error('Format de réponse inattendu:', response.data);
      return [];
    }
  }

  /**
   * Récupérer une sous-catégorie par ID
   * GET /sub-categories/:id
   */
  async getSubCategoryById(id: number): Promise<SubCategoryResponse> {
    const response = await axios.get<ApiResponse<SubCategoryResponse>>(
      `${API_BASE}/sub-categories/${id}`,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Créer une sous-catégorie (niveau 1)
   * POST /sub-categories
   */
  async createSubCategory(data: CreateSubCategoryDto): Promise<SubCategoryResponse> {
    const response = await axios.post<ApiResponse<SubCategoryResponse>>(
      `${API_BASE}/sub-categories`,
      data,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Mettre à jour une sous-catégorie
   * PATCH /sub-categories/:id
   */
  async updateSubCategory(id: number, data: Partial<CreateSubCategoryDto>): Promise<SubCategoryResponse> {
    const response = await axios.patch<ApiResponse<SubCategoryResponse>>(
      `${API_BASE}/sub-categories/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Supprimer une sous-catégorie
   * DELETE /sub-categories/:id
   */
  async deleteSubCategory(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/sub-categories/${id}`, {
      withCredentials: true
    });
  }

  // ==================
  // Variations (Niveau 2)
  // ==================

  /**
   * Lister toutes les variations (optionnel: filtrer par subCategoryId)
   * GET /variations?subCategoryId=X
   */
  async getVariations(subCategoryId?: number): Promise<VariationResponse[]> {
    const url = subCategoryId
      ? `${API_BASE}/variations?subCategoryId=${subCategoryId}`
      : `${API_BASE}/variations`;

    const response = await axios.get(url, { withCredentials: true });

    // Gérer les deux formats de réponse
    if (response.data.success && response.data.data) {
      // Format: { success: true, data: [...] }
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      // Format: [...] (tableau direct)
      return response.data;
    } else {
      console.error('Format de réponse inattendu:', response.data);
      return [];
    }
  }

  /**
   * Récupérer une variation par ID
   * GET /variations/:id
   */
  async getVariationById(id: number): Promise<VariationResponse> {
    const response = await axios.get<ApiResponse<VariationResponse>>(
      `${API_BASE}/variations/${id}`,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Créer une variation (niveau 2)
   * POST /variations
   */
  async createVariation(data: CreateVariationDto): Promise<VariationResponse> {
    const response = await axios.post<ApiResponse<VariationResponse>>(
      `${API_BASE}/variations`,
      data,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Mettre à jour une variation
   * PATCH /variations/:id
   */
  async updateVariation(id: number, data: Partial<CreateVariationDto>): Promise<VariationResponse> {
    const response = await axios.patch<ApiResponse<VariationResponse>>(
      `${API_BASE}/variations/${id}`,
      data,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Supprimer une variation
   * DELETE /variations/:id
   */
  async deleteVariation(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/variations/${id}`, {
      withCredentials: true
    });
  }

  // ==================
  // Helpers
  // ==================

  /**
   * Créer une structure complète en utilisant les 3 endpoints séparés
   * (Alternative à /categories/structure)
   */
  async createCompleteStructure(params: {
    categoryName: string;
    categoryDescription?: string;
    subCategoryName?: string;
    subCategoryDescription?: string;
    variations?: string[];
  }): Promise<{
    category: CategoryResponse;
    subCategory?: SubCategoryResponse;
    variations: VariationResponse[];
  }> {
    // 1. Créer la catégorie principale
    const category = await this.createCategory({
      name: params.categoryName,
      description: params.categoryDescription,
      displayOrder: 0
    });

    let subCategory: SubCategoryResponse | undefined;
    const variations: VariationResponse[] = [];

    // 2. Créer la sous-catégorie si fournie
    if (params.subCategoryName) {
      subCategory = await this.createSubCategory({
        name: params.subCategoryName,
        description: params.subCategoryDescription,
        categoryId: category.id,
        displayOrder: 0
      });

      // 3. Créer les variations si fournies
      if (params.variations && params.variations.length > 0) {
        for (let i = 0; i < params.variations.length; i++) {
          const variation = await this.createVariation({
            name: params.variations[i],
            subCategoryId: subCategory.id,
            displayOrder: i
          });
          variations.push(variation);
        }
      }
    }

    return { category, subCategory, variations };
  }
}

export default new CategoryRealApi();
