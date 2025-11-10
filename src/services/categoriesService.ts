import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface Category {
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
  _count?: {
    subCategories: number;
    products: number;
  };
}

class CategoriesService {
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getActiveCategories(): Promise<Category[]> {
    try {
      const response = await axios.get(`${API_BASE}/categories?isActive=true`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw error;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await axios.get(`${API_BASE}/categories/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;