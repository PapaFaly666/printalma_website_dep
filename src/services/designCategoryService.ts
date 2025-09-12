import { API_CONFIG } from '../config/api';

export interface DesignCategory {
  id: number;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  coverImageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  designCount: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateDesignCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  coverImage?: File | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDesignCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  coverImage?: File | null;
  removeCoverImage?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface DesignCategoriesResponse {
  categories: DesignCategory[];
  total: number;
}

class DesignCategoryService {
  private baseUrl = `${API_CONFIG.BASE_URL}/design-categories`;

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Pour les vendeurs - récupérer les catégories actives
  async getActiveCategories(): Promise<DesignCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/active`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw await this.parseError(response);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des catégories actives:', error);
      throw error;
    }
  }

  // Pour les admins - récupérer toutes les catégories
  async getAllCategories(): Promise<DesignCategoriesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin`, {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw await this.parseError(response);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des catégories admin:', error);
      throw error;
    }
  }

  // Pour les admins - créer une catégorie
  async createCategory(data: CreateDesignCategoryData): Promise<DesignCategory> {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      
      if (data.description) formData.append('description', data.description);
      if (data.icon) formData.append('icon', data.icon);
      if (data.color) formData.append('color', data.color);
      if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
      if (data.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));
      if (data.coverImage) formData.append('coverImage', data.coverImage);

      const response = await fetch(`${this.baseUrl}/admin`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw await this.parseError(response);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  }

  // Pour les admins - modifier une catégorie
  async updateCategory(id: number, data: UpdateDesignCategoryData): Promise<DesignCategory> {
    try {
      const formData = new FormData();
      
      if (data.name) formData.append('name', data.name);
      if (data.description !== undefined) formData.append('description', data.description);
      if (data.icon !== undefined) formData.append('icon', data.icon);
      if (data.color) formData.append('color', data.color);
      if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
      if (data.sortOrder !== undefined) formData.append('sortOrder', String(data.sortOrder));
      if (data.coverImage) formData.append('coverImage', data.coverImage);
      if (data.removeCoverImage) formData.append('removeCoverImage', 'true');

      const response = await fetch(`${this.baseUrl}/admin/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw await this.parseError(response);
      }
      
      return response.json();
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error);
      throw error;
    }
  }

  // Pour les admins - supprimer une catégorie
  async deleteCategory(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw await this.parseError(response);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }
  }

  private async parseError(response: Response): Promise<Error> {
    try {
      const data = await response.json();
      return new Error(data?.message || `HTTP ${response.status}`);
    } catch {
      return new Error(`HTTP ${response.status}`);
    }
  }
}

export const designCategoryService = new DesignCategoryService();
export default designCategoryService;