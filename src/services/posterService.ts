import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface CreatePosterDto {
  designId: number;
  name: string;
  description?: string;
  formatId: string;
  width: number;
  height: number;
  finish: 'MAT' | 'GLOSSY' | 'CANVAS' | 'FINE_ART';
  frame: 'NO_FRAME' | 'BLACK_FRAME' | 'WHITE_FRAME' | 'WOOD_FRAME' | 'GOLD_FRAME';
  price: number;
  stockQuantity: number;
}

export interface UpdatePosterDto extends Partial<CreatePosterDto> {
  id: number;
}

export interface PosterProduct {
  id: number;
  vendorId: number;
  designId: number;
  name: string;
  description: string | null;
  sku: string;
  formatId: string;
  width: number;
  height: number;
  finish: 'MAT' | 'GLOSSY' | 'CANVAS' | 'FINE_ART';
  frame: 'NO_FRAME' | 'BLACK_FRAME' | 'WHITE_FRAME' | 'WOOD_FRAME' | 'GOLD_FRAME';
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  finalPrice: number;
  stockQuantity: number;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  design?: any;
  vendor?: any;
}

class PosterService {
  /**
   * Obtenir le token d'authentification
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Créer les headers avec authentification
   */
  private getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Créer un nouveau poster
   * POST /vendor/posters
   */
  async createPoster(data: CreatePosterDto): Promise<PosterProduct> {
    try {
      console.log('📦 Création poster:', data);

      const response = await axios.post(
        `${API_BASE}/vendor/posters`,
        data,
        { headers: this.getHeaders() }
      );

      console.log('✅ Poster créé:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('❌ Erreur création poster:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Erreur lors de la création du poster'
      );
    }
  }

  /**
   * Récupérer tous les posters du vendeur
   * GET /vendor/posters
   */
  async getVendorPosters(): Promise<PosterProduct[]> {
    try {
      console.log('📥 Chargement des posters vendeur...');

      const response = await axios.get(
        `${API_BASE}/vendor/posters`,
        { headers: this.getHeaders() }
      );

      const posters = response.data.data || response.data;
      console.log(`✅ ${posters.length} posters chargés`);
      return posters;
    } catch (error: any) {
      console.error('❌ Erreur chargement posters:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Erreur lors du chargement des posters'
      );
    }
  }

  /**
   * Récupérer un poster spécifique
   * GET /vendor/posters/:id
   */
  async getPosterById(id: number): Promise<PosterProduct> {
    try {
      console.log(`📥 Chargement poster ${id}...`);

      const response = await axios.get(
        `${API_BASE}/vendor/posters/${id}`,
        { headers: this.getHeaders() }
      );

      console.log('✅ Poster chargé:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`❌ Erreur chargement poster ${id}:`, error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Poster non trouvé'
      );
    }
  }

  /**
   * Mettre à jour un poster
   * PATCH /vendor/posters/:id
   */
  async updatePoster(id: number, data: Partial<CreatePosterDto>): Promise<PosterProduct> {
    try {
      console.log(`🔄 Mise à jour poster ${id}:`, data);

      const response = await axios.patch(
        `${API_BASE}/vendor/posters/${id}`,
        data,
        { headers: this.getHeaders() }
      );

      console.log('✅ Poster mis à jour:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`❌ Erreur mise à jour poster ${id}:`, error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Erreur lors de la mise à jour du poster'
      );
    }
  }

  /**
   * Supprimer un poster
   * DELETE /vendor/posters/:id
   */
  async deletePoster(id: number): Promise<void> {
    try {
      console.log(`🗑️ Suppression poster ${id}...`);

      await axios.delete(
        `${API_BASE}/vendor/posters/${id}`,
        { headers: this.getHeaders() }
      );

      console.log('✅ Poster supprimé');
    } catch (error: any) {
      console.error(`❌ Erreur suppression poster ${id}:`, error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Erreur lors de la suppression du poster'
      );
    }
  }

  /**
   * Récupérer les posters publics (marketplace)
   * GET /public/posters
   */
  async getPublicPosters(params?: {
    limit?: number;
    offset?: number;
    format?: string;
    finish?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<{ data: PosterProduct[]; total: number }> {
    try {
      console.log('📥 Chargement posters publics...', params);

      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.format) queryParams.append('format', params.format);
      if (params?.finish) queryParams.append('finish', params.finish);
      if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params?.search) queryParams.append('search', params.search);

      const response = await axios.get(
        `${API_BASE}/public/posters?${queryParams.toString()}`
      );

      const result = response.data;
      console.log(`✅ ${result.total || result.data?.length || 0} posters publics chargés`);

      return {
        data: result.data || result,
        total: result.total || result.data?.length || 0
      };
    } catch (error: any) {
      console.error('❌ Erreur chargement posters publics:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Erreur lors du chargement des posters'
      );
    }
  }

  /**
   * Récupérer un poster public
   * GET /public/posters/:id
   */
  async getPublicPosterById(id: number): Promise<PosterProduct> {
    try {
      console.log(`📥 Chargement poster public ${id}...`);

      const response = await axios.get(
        `${API_BASE}/public/posters/${id}`
      );

      console.log('✅ Poster public chargé:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`❌ Erreur chargement poster public ${id}:`, error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Poster non trouvé'
      );
    }
  }
}

export default new PosterService();
