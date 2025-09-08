import { API_CONFIG } from '../config/api';
import axios from 'axios';

// Types basés sur la documentation price.md
export interface ProductPriceData {
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  stock?: number;
  categories: string[];
  colorVariations?: any[];
  [key: string]: any; // Autres propriétés du produit
}

export interface PriceValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ProductResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class ProductPriceService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api`;

  // Client axios centralisé
  private api = axios.create({
    baseURL: this.baseUrl,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Intercepteur pour gestion automatique des erreurs d'auth
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('🚨 Session expirée - redirection vers login');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Créer un produit avec prix suggéré
   */
  async createProduct(productData: ProductPriceData): Promise<any> {
    try {
      // Validation des prix avant envoi
      if (productData.suggestedPrice && productData.suggestedPrice < 0) {
        throw new Error('Le prix suggéré doit être positif');
      }

      const { data } = await this.api.post<ProductResponse>('/products', productData);
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création du produit');
      }

      console.log('✅ Produit créé avec prix suggéré:', {
        name: productData.name,
        price: productData.price,
        suggestedPrice: productData.suggestedPrice
      });

      return data.data;
    } catch (error: any) {
      console.error('❌ Erreur création produit:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un produit avec prix suggéré
   */
  async updateProduct(productId: number, updateData: Partial<ProductPriceData>): Promise<any> {
    try {
      const { data } = await this.api.put<ProductResponse>(`/products/${productId}`, updateData);
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour du produit');
      }

      console.log('✅ Produit mis à jour avec prix suggéré:', {
        id: productId,
        price: updateData.price,
        suggestedPrice: updateData.suggestedPrice
      });

      return data.data;
    } catch (error: any) {
      console.error('❌ Erreur mise à jour produit:', error);
      throw error;
    }
  }

  /**
   * Récupérer un produit avec son prix suggéré
   */
  async getProduct(productId: number): Promise<any> {
    try {
      const { data } = await this.api.get<ProductResponse>(`/products/${productId}`);
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du produit');
      }

      return data.data;
    } catch (error: any) {
      console.error('❌ Erreur récupération produit:', error);
      throw error;
    }
  }

  /**
   * Calculer un prix suggéré automatique basé sur les coûts
   */
  calculateSuggestedPrice(baseCost: number, margin: number = 0.4): number {
    if (!baseCost || baseCost <= 0) return 0;
    
    const suggestedPrice = baseCost * (1 + margin);
    // Arrondir aux centaines pour les prix en FCFA
    return Math.ceil(suggestedPrice / 100) * 100;
  }

  /**
   * Calculer le prix suggéré basé sur des critères avancés
   */
  calculateAdvancedSuggestedPrice(criteria: {
    baseCost: number;
    quality: 'standard' | 'premium' | 'luxury';
    complexity: 'simple' | 'medium' | 'complex';
    marketPosition: 'budget' | 'mid-range' | 'premium';
  }): number {
    if (!criteria.baseCost || criteria.baseCost <= 0) return 0;

    let margin = 0.3; // Marge de base 30%

    // Ajustement selon la qualité
    switch (criteria.quality) {
      case 'standard':
        margin += 0.1;
        break;
      case 'premium':
        margin += 0.3;
        break;
      case 'luxury':
        margin += 0.6;
        break;
    }

    // Ajustement selon la complexité
    switch (criteria.complexity) {
      case 'simple':
        margin += 0.05;
        break;
      case 'medium':
        margin += 0.15;
        break;
      case 'complex':
        margin += 0.25;
        break;
    }

    // Ajustement selon le positionnement marché
    switch (criteria.marketPosition) {
      case 'budget':
        margin -= 0.05;
        break;
      case 'mid-range':
        margin += 0.05;
        break;
      case 'premium':
        margin += 0.2;
        break;
    }

    const suggestedPrice = criteria.baseCost * (1 + Math.max(margin, 0.1));
    return Math.ceil(suggestedPrice / 100) * 100;
  }

  /**
   * Valider la cohérence des prix
   */
  validatePrices(price: number, suggestedPrice?: number): PriceValidationResult {
    const errors: string[] = [];
    
    if (!price || price <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }
    
    if (suggestedPrice !== undefined && suggestedPrice < 0) {
      errors.push('Le prix suggéré ne peut pas être négatif');
    }
    
    if (price < 100) {
      errors.push('Le prix minimum recommandé est de 100 FCFA');
    }
    
    if (suggestedPrice && price > suggestedPrice * 1.8) {
      errors.push('Le prix semble très éloigné du prix suggéré (écart > 80%)');
    }
    
    if (suggestedPrice && price < suggestedPrice * 0.5) {
      errors.push('Le prix est très en dessous du prix suggéré (écart > 50%)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formater un prix en FCFA
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  /**
   * Calculer la différence entre prix réel et suggéré
   */
  getPriceDifference(price: number, suggestedPrice: number): {
    absolute: number;
    percentage: number;
    formatted: {
      absolute: string;
      percentage: string;
    };
  } {
    const absolute = price - suggestedPrice;
    const percentage = (absolute / suggestedPrice) * 100;

    return {
      absolute,
      percentage,
      formatted: {
        absolute: this.formatPrice(Math.abs(absolute)),
        percentage: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`
      }
    };
  }

  /**
   * Générer des suggestions de prix basées sur des catégories
   */
  generateCategorySuggestions(baseCost: number, category: string): number[] {
    const basePrice = this.calculateSuggestedPrice(baseCost);
    
    const multipliers = {
      't-shirt': [1.0, 1.2, 1.4],
      'polo': [1.1, 1.3, 1.5],
      'sweat': [1.2, 1.4, 1.6],
      'pantalon': [1.3, 1.5, 1.8],
      'robe': [1.4, 1.6, 1.9],
      'accessoire': [0.8, 1.0, 1.2],
      'default': [1.0, 1.2, 1.4]
    };

    const categoryKey = category.toLowerCase();
    const factors = multipliers[categoryKey as keyof typeof multipliers] || multipliers.default;

    return factors.map(factor => Math.ceil((basePrice * factor) / 100) * 100);
  }

  /**
   * Obtenir des statistiques de prix pour l'admin
   */
  async getPriceStatistics(): Promise<{
    averageSuggestedPrice: number;
    averageRealPrice: number;
    averageDifference: number;
    totalProducts: number;
    productsWithSuggestedPrice: number;
  }> {
    try {
      const { data } = await this.api.get('/admin/price-statistics');
      return data.data;
    } catch (error: any) {
      console.warn('❌ Impossible de récupérer les statistiques de prix:', error.message);
      return {
        averageSuggestedPrice: 0,
        averageRealPrice: 0,
        averageDifference: 0,
        totalProducts: 0,
        productsWithSuggestedPrice: 0
      };
    }
  }
}

// Singleton pour utilisation dans toute l'app
export const productPriceService = new ProductPriceService();
export default productPriceService;