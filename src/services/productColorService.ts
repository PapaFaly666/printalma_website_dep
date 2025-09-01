import { ColorInProductDto } from '../types/order';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

export class ProductColorService {
  private baseURL = API_BASE_URL;

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les couleurs disponibles d'un produit
   * @param productId ID du produit
   * @returns Array des couleurs avec leurs images
   */
  async getProductColors(productId: number): Promise<ColorInProductDto[]> {
    try {
      const response = await this.apiCall<{ colors: ColorInProductDto[] }>(`/products/${productId}`);
      return response.data.colors || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des couleurs:', error);
      return [];
    }
  }

  /**
   * Valider qu'une couleur existe pour un produit donné
   * @param productId ID du produit
   * @param colorId ID de la couleur
   * @returns boolean
   */
  async validateColorForProduct(productId: number, colorId: number): Promise<boolean> {
    try {
      const colors = await this.getProductColors(productId);
      return colors.some(color => color.id === colorId);
    } catch (error) {
      console.error('Erreur lors de la validation de couleur:', error);
      return false;
    }
  }

  /**
   * Obtenir les informations d'une couleur spécifique
   * @param productId ID du produit
   * @param colorId ID de la couleur
   * @returns ColorInProductDto ou null
   */
  async getColorById(productId: number, colorId: number): Promise<ColorInProductDto | null> {
    try {
      const colors = await this.getProductColors(productId);
      return colors.find(color => color.id === colorId) || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la couleur:', error);
      return null;
    }
  }

  /**
   * Rechercher une couleur par nom dans un produit
   * @param productId ID du produit
   * @param colorName Nom de la couleur
   * @returns ColorInProductDto ou null
   */
  async findColorByName(productId: number, colorName: string): Promise<ColorInProductDto | null> {
    try {
      const colors = await this.getProductColors(productId);
      return colors.find(color => 
        color.name.toLowerCase() === colorName.toLowerCase() ||
        color.hexCode?.toLowerCase() === colorName.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Erreur lors de la recherche de couleur par nom:', error);
      return null;
    }
  }

  /**
   * Obtenir la première couleur disponible d'un produit
   * @param productId ID du produit
   * @returns ColorInProductDto ou null
   */
  async getDefaultColor(productId: number): Promise<ColorInProductDto | null> {
    try {
      const colors = await this.getProductColors(productId);
      return colors.length > 0 ? colors[0] : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la couleur par défaut:', error);
      return null;
    }
  }
}

// Export singleton instance
export const productColorService = new ProductColorService(); 