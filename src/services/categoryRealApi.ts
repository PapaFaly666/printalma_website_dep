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
    try {
      const response = await axios.get(
        `${API_BASE}/categories/hierarchy`,
        { withCredentials: true }
      );

      console.log('🔍 [getCategoryHierarchy] Response brute:', response.data);

      let data: any[] = [];

      // Gérer différents formats de réponse
      // Format 1: { success: true, data: [...] }
      if (response.data?.success && response.data?.data) {
        console.log('✅ Format 1 détecté: { success, data }');
        data = Array.isArray(response.data.data) ? response.data.data : [];
      }
      // Format 2: { data: [...] }
      else if (response.data?.data) {
        console.log('✅ Format 2 détecté: { data }');
        data = Array.isArray(response.data.data) ? response.data.data : [];
      }
      // Format 3: [...] (tableau direct)
      else if (Array.isArray(response.data)) {
        console.log('✅ Format 3 détecté: tableau direct');
        data = response.data;
      }
      // Format inconnu
      else {
        console.warn('⚠️ Format de réponse inconnu:', typeof response.data);
        console.warn('   Contenu:', response.data);
        return [];
      }

      // Vérifier si les données sont déjà hiérarchiques ou plates
      if (data.length > 0) {
        const firstItem = data[0];
        const hasSubCategories = firstItem.subCategories !== undefined;
        const hasChildren = firstItem.children !== undefined;

        if (hasSubCategories || hasChildren) {
          console.log('✅ Données déjà hiérarchiques');
          return data;
        } else {
          console.log('🔨 Données plates détectées, construction de la hiérarchie...');
          return this.buildHierarchyFromFlat(data);
        }
      }

      return data;
    } catch (error: any) {
      console.error('❌ Erreur getCategoryHierarchy:', error);

      // 🔄 FALLBACK: Si /hierarchy n'existe pas, utiliser /categories
      if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint /hierarchy non trouvé, fallback sur /categories');
        try {
          const fallbackResponse = await axios.get(
            `${API_BASE}/categories`,
            { withCredentials: true }
          );

          console.log('🔄 [FALLBACK] Response /categories:', fallbackResponse.data);

          let fallbackData: any[] = [];

          // Même logique de parsing
          if (fallbackResponse.data?.success && fallbackResponse.data?.data) {
            fallbackData = Array.isArray(fallbackResponse.data.data) ? fallbackResponse.data.data : [];
          } else if (fallbackResponse.data?.data) {
            fallbackData = Array.isArray(fallbackResponse.data.data) ? fallbackResponse.data.data : [];
          } else if (Array.isArray(fallbackResponse.data)) {
            fallbackData = fallbackResponse.data;
          }

          // Toujours construire la hiérarchie depuis /categories car c'est une liste plate
          if (fallbackData.length > 0) {
            console.log('🔨 Construction de la hiérarchie depuis /categories...');
            return this.buildHierarchyFromFlat(fallbackData);
          }

          return [];
        } catch (fallbackError) {
          console.error('❌ Erreur fallback /categories:', fallbackError);
          return [];
        }
      }

      return [];
    }
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

  /**
   * 🔧 Helper: Reconstruire la hiérarchie manuellement depuis une liste plate
   * Utile si le backend ne retourne pas encore une structure hiérarchique
   */
  private buildHierarchyFromFlat(flatCategories: any[]): CategoryHierarchy[] {
    console.log('🔨 [buildHierarchyFromFlat] Construction hiérarchie depuis liste plate');

    // Séparer les catégories par niveau
    const level0 = flatCategories.filter(c => c.level === 0 || !c.parentId);
    const level1 = flatCategories.filter(c => c.level === 1 || (c.parentId && c.level !== 2));
    const level2 = flatCategories.filter(c => c.level === 2);

    // Construire la hiérarchie
    const hierarchy: CategoryHierarchy[] = level0.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || this.slugify(cat.name),
      displayOrder: cat.displayOrder || 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      subCategories: level1
        .filter(sub => sub.parentId === cat.id)
        .map(sub => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug || this.slugify(sub.name),
          categoryId: cat.id,
          displayOrder: sub.displayOrder || 0,
          isActive: sub.isActive !== undefined ? sub.isActive : true,
          variations: level2
            .filter(v => v.parentId === sub.id)
            .map(v => ({
              id: v.id,
              name: v.name,
              slug: v.slug || this.slugify(v.name),
              subCategoryId: sub.id,
              displayOrder: v.displayOrder || 0,
              isActive: v.isActive !== undefined ? v.isActive : true
            }))
        }))
    }));

    console.log('✅ Hiérarchie construite:', hierarchy.length, 'catégories racines');
    return hierarchy;
  }

  /**
   * Helper: Générer un slug depuis un nom
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ==================
  // Advanced Features (selon documentation)
  // ==================

  /**
   * Vérifier si une catégorie peut être supprimée
   * GET /categories/:id/can-delete
   */
  async canDeleteCategory(id: number): Promise<{
    canDelete: boolean;
    message: string;
    productCount?: number;
    subCategoryCount?: number;
    blockers?: {
      products?: string[];
      subCategories?: string[];
    };
  }> {
    const response = await axios.get(
      `${API_BASE}/categories/${id}/can-delete`,
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Vérifier si une sous-catégorie peut être supprimée
   * GET /sub-categories/:id/can-delete
   */
  async canDeleteSubCategory(id: number): Promise<{
    canDelete: boolean;
    message: string;
    productCount?: number;
    variationCount?: number;
    blockers?: {
      products?: string[];
      variations?: string[];
    };
  }> {
    const response = await axios.get(
      `${API_BASE}/sub-categories/${id}/can-delete`,
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Vérifier si une variation peut être supprimée
   * GET /variations/:id/can-delete
   */
  async canDeleteVariation(id: number): Promise<{
    canDelete: boolean;
    message: string;
    productCount?: number;
    blockers?: {
      products?: string[];
    };
  }> {
    const response = await axios.get(
      `${API_BASE}/variations/${id}/can-delete`,
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Lister les catégories avec pagination et recherche
   * GET /categories?search=...&isActive=...&includeSubCategories=...&limit=...&offset=...
   */
  async getCategoriesWithPagination(params?: {
    search?: string;
    isActive?: boolean;
    includeSubCategories?: boolean;
    includeVariations?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    items: CategoryResponse[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.includeSubCategories) queryParams.append('includeSubCategories', 'true');
    if (params?.includeVariations) queryParams.append('includeVariations', 'true');
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const response = await axios.get(
      `${API_BASE}/categories?${queryParams.toString()}`,
      { withCredentials: true }
    );
    return response.data.data || response.data;
  }

  /**
   * Lister les sous-catégories avec pagination
   * GET /sub-categories?categoryId=...&search=...&limit=...
   */
  async getSubCategoriesWithPagination(params?: {
    categoryId?: number;
    search?: string;
    isActive?: boolean;
    includeVariations?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    items: SubCategoryResponse[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', String(params.categoryId));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.includeVariations) queryParams.append('includeVariations', 'true');
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const response = await axios.get(
      `${API_BASE}/sub-categories?${queryParams.toString()}`,
      { withCredentials: true }
    );
    return response.data.data || response.data;
  }

  /**
   * Recherche globale dans toute la hiérarchie
   * GET /categories/search/global?q=...&limit=...
   */
  async searchGlobal(query: string, limit: number = 20): Promise<{
    categories: CategoryResponse[];
    subCategories: SubCategoryResponse[];
    variations: VariationResponse[];
    totalResults: number;
  }> {
    const response = await axios.get(
      `${API_BASE}/categories/search/global?q=${encodeURIComponent(query)}&limit=${limit}`,
      { withCredentials: true }
    );
    return response.data.data;
  }

  /**
   * Réordonner plusieurs catégories en lot
   * POST /categories/bulk/reorder
   */
  async bulkReorderCategories(items: Array<{ id: number; displayOrder: number }>): Promise<{
    success: boolean;
    message: string;
    data: { updatedCount: number };
  }> {
    const response = await axios.post(
      `${API_BASE}/categories/bulk/reorder`,
      { items },
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Réordonner plusieurs sous-catégories en lot
   * POST /sub-categories/bulk/reorder
   */
  async bulkReorderSubCategories(items: Array<{ id: number; displayOrder: number }>): Promise<{
    success: boolean;
    message: string;
    data: { updatedCount: number };
  }> {
    const response = await axios.post(
      `${API_BASE}/sub-categories/bulk/reorder`,
      { items },
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Réordonner plusieurs variations en lot
   * POST /variations/bulk/reorder
   */
  async bulkReorderVariations(items: Array<{ id: number; displayOrder: number }>): Promise<{
    success: boolean;
    message: string;
    data: { updatedCount: number };
  }> {
    const response = await axios.post(
      `${API_BASE}/variations/bulk/reorder`,
      { items },
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Activer/Désactiver plusieurs catégories
   * POST /categories/bulk/toggle-status
   */
  async bulkToggleStatusCategories(categoryIds: number[], isActive: boolean): Promise<{
    success: boolean;
    message: string;
    data: { updatedCount: number };
  }> {
    const response = await axios.post(
      `${API_BASE}/categories/bulk/toggle-status`,
      { categoryIds, isActive },
      { withCredentials: true }
    );
    return response.data;
  }

  /**
   * Créer plusieurs variations en lot
   * POST /categories/variations/batch
   */
  async createVariationsBatch(variations: Array<{
    name: string;
    description?: string;
    parentId: number; // subCategoryId
  }>): Promise<{
    success: boolean;
    message: string;
    data: {
      created: VariationResponse[];
      failed: Array<{ name: string; error: string }>;
    };
  }> {
    const response = await axios.post(
      `${API_BASE}/categories/variations/batch`,
      { variations },
      { withCredentials: true }
    );
    return response.data;
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

  /**
   * Helper: Obtenir le chemin complet d'une variation (breadcrumb)
   * Exemple: "Vêtements > T-Shirts > Col V"
   */
  async getVariationPath(variationId: number): Promise<string> {
    const variation = await this.getVariationById(variationId);
    if (!variation.subCategory) {
      return variation.name;
    }

    const subCategory = await this.getSubCategoryById(variation.subCategoryId);
    const category = await this.getCategoryById(subCategory.categoryId);

    return `${category.name} > ${subCategory.name} > ${variation.name}`;
  }

  /**
   * Helper: Obtenir le chemin complet d'une sous-catégorie
   * Exemple: "Vêtements > T-Shirts"
   */
  async getSubCategoryPath(subCategoryId: number): Promise<string> {
    const subCategory = await this.getSubCategoryById(subCategoryId);
    const category = await this.getCategoryById(subCategory.categoryId);

    return `${category.name} > ${subCategory.name}`;
  }
}

export default new CategoryRealApi();
