import { apiGet, apiPost, apiDelete } from '../utils/apiHelpers';

// Types pour les thèmes
export interface Theme {
  id: number;
  name: string;
  description: string;
  coverImage: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
  category: string;
  featured: boolean;
  products?: Array<{
    id: number;
    name: string;
    price: number;
    status: string;
  }>;
}

export interface ThemeFilters {
  status?: 'active' | 'inactive' | 'all';
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  featured?: boolean;
}

export interface ThemesResponse {
  success: boolean;
  data: Theme[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ThemeResponse {
  success: boolean;
  data: Theme;
}

class ThemeService {
  private baseURL = 'https://printalma-back-dep.onrender.com';

  // Récupérer tous les thèmes avec filtres optionnels
  async getThemes(filters: ThemeFilters = {}): Promise<ThemesResponse> {
    const params = new URLSearchParams();
    
    // Ajouter les filtres
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }
    if (filters.featured !== undefined) {
      params.append('featured', filters.featured.toString());
    }

    const url = `${this.baseURL}/themes${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('🎨 ThemeService - URL:', url);
    
    try {
      const result: any = await apiGet(url);
      console.log('🎨 ThemeService - Résultat brut:', result);

      if (result?.error) {
        console.error('🎨 ThemeService - Erreur:', result.error);
        throw new Error(result.error);
      }

      // Normaliser différents formats de réponses possibles
      if (result?.success && Array.isArray(result?.data)) {
        console.log('🎨 ThemeService - Données valides:', result.data.length, 'thèmes');
        const normalized: ThemesResponse = {
          success: true,
          data: result.data,
          pagination: result.pagination
        };
        return normalized;
      }

      if (result?.data?.data && Array.isArray(result.data.data)) {
        console.log('🎨 ThemeService - Structure alternative détectée:', result.data.data.length, 'thèmes');
        const normalized: ThemesResponse = {
          success: true,
          data: result.data.data,
          pagination: result.data.pagination
        };
        return normalized;
      }

      if (result?.data && result.data.success === false) {
        console.log('🎨 ThemeService - Aucun thème trouvé');
        const normalized: ThemesResponse = {
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false
          }
        };
        return normalized;
      }

      console.error('🎨 ThemeService - Structure de réponse invalide:', result);
      throw new Error('Structure de réponse invalide');
    } catch (error) {
      console.error('🎨 ThemeService - Exception:', error);
      throw error;
    }
  }

  // Récupérer un thème par ID
  async getTheme(id: number): Promise<ThemeResponse> {
    const result: any = await apiGet(`${this.baseURL}/themes/${id}`);

    if (result?.error) {
      throw new Error(result.error);
    }

    if (result?.success && result?.data) {
      return { success: true, data: result.data };
    }

    // Parfois l'API renvoie directement l'objet thème
    if (result && typeof result === 'object' && 'id' in result) {
      return { success: true, data: result as Theme };
    }

    throw new Error('Structure de réponse invalide');
  }

  // Créer un nouveau thème
  async createTheme(formData: FormData): Promise<ThemeResponse> {
    const result: any = await apiPost(`${this.baseURL}/themes`, formData);

    if (result?.error) {
      throw new Error(result.error);
    }

    if (result?.success && result?.data) {
      return { success: true, data: result.data };
    }

    return { success: true, data: result as Theme };
  }

  // Modifier un thème
  async updateTheme(id: number, formData: FormData): Promise<ThemeResponse> {
    const result: any = await apiPost(`${this.baseURL}/themes/${id}`, formData, { method: 'PUT' });

    if (result?.error) {
      throw new Error(result.error);
    }

    if (result?.success && result?.data) {
      return { success: true, data: result.data };
    }

    return { success: true, data: result as Theme };
  }

  // Supprimer un thème
  async deleteTheme(id: number): Promise<void> {
    const result = await apiDelete(`${this.baseURL}/themes/${id}`);

    if (result.error) {
      throw new Error(result.error);
    }
  }
}

export default new ThemeService(); 