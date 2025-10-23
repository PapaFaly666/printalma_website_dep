import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    slug: string;
    description: string;
    displayOrder: number;
    coverImageUrl: string | null;
    coverImagePublicId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  _count: {
    variations: number;
    products: number;
  };
}

class SubCategoriesService {
  async getAllSubCategories(): Promise<SubCategory[]> {
    try {
      const response = await axios.get(`${API_BASE}/sub-categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      throw error;
    }
  }

  async getSubCategoriesByCategory(categoryId: number): Promise<SubCategory[]> {
    try {
      const response = await axios.get(`${API_BASE}/sub-categories?categoryId=${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-categories by category:', error);
      throw error;
    }
  }

  async getSubCategoryBySlug(slug: string): Promise<SubCategory | null> {
    try {
      const response = await axios.get(`${API_BASE}/sub-categories/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-category by slug:', error);
      return null;
    }
  }
}

export const subCategoriesService = new SubCategoriesService();
export default subCategoriesService;