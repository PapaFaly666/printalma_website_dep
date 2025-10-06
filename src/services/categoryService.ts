// src/services/categoryService.ts

import axios from 'axios';
import {
  Category,
  CreateCategoryDto,
  CreateCategoryStructureDto,
  CreateStructureResponse
} from '../types/category.types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

class CategoryService {
  /**
   * Créer une catégorie simple
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      const response = await axios.post(`${API_BASE}/categories`, data, {
        withCredentials: true
      });
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.data?.error === 'DUPLICATE_CATEGORY') {
        throw new Error(`La catégorie "${data.name}" existe déjà`);
      }
      throw error;
    }
  }

  /**
   * Créer une structure complète (RECOMMANDÉ)
   */
  async createStructure(data: CreateCategoryStructureDto): Promise<CreateStructureResponse> {
    const response = await axios.post(`${API_BASE}/categories/structure`, data, {
      withCredentials: true
    });
    return response.data;
  }

  /**
   * Récupérer toutes les catégories (liste plate)
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_BASE}/categories`, {
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Récupérer la hiérarchie complète (arbre)
   */
  async getCategoryHierarchy(): Promise<Category[]> {
    try {
      const response = await axios.get(`${API_BASE}/categories/hierarchy`, {
        withCredentials: true
      });
      return response.data.data || response.data;
    } catch (error: any) {
      // Fallback sur /categories si /hierarchy n'existe pas
      if (error.response?.status === 404) {
        console.warn('Endpoint /categories/hierarchy not found, using /categories instead');
        return this.getAllCategories();
      }
      throw error;
    }
  }

  /**
   * Récupérer une catégorie par ID
   */
  async getCategoryById(id: number): Promise<Category> {
    const response = await axios.get(`${API_BASE}/categories/${id}`, {
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Vérifier si une catégorie existe
   */
  async checkDuplicate(name: string, parentId?: number): Promise<{
    exists: boolean;
    category: Category | null;
  }> {
    try {
      const params = new URLSearchParams({ name });
      if (parentId !== undefined && parentId !== null) {
        params.append('parentId', parentId.toString());
      }

      const response = await axios.get(
        `${API_BASE}/categories/check-duplicate?${params}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return { exists: false, category: null };
    }
  }

  /**
   * Mettre à jour une catégorie
   */
  async updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<Category> {
    const response = await axios.put(`${API_BASE}/categories/${id}`, data, {
      withCredentials: true
    });
    return response.data.data || response.data;
  }

  /**
   * Supprimer une catégorie
   */
  async deleteCategory(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/categories/${id}`, {
      withCredentials: true
    });
  }
}

export default new CategoryService();
