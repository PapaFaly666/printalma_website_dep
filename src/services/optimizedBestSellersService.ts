import axios, { AxiosResponse } from 'axios';

// Types pour l'API optimisée
export interface OptimizedBestSellersOptions {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  limit?: number;
  offset?: number;
  vendorId?: number;
  categoryId?: number;
  minSales?: number;
  includeImages?: boolean;
  sortBy?: 'sales' | 'revenue' | 'popularity' | 'recent';
  sortOrder?: 'asc' | 'desc';
}

export interface OptimizedBestSellerProduct {
  id: number;
  vendorProductId: number;
  name: string;
  description?: string;
  price: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  uniqueCustomers: number;
  conversionRate: number;
  popularityScore: number;
  trendingScore: number;
  firstSaleDate: string;
  lastSaleDate: string;
  rank: number;
  vendor: {
    id: number;
    name: string;
    shopName?: string;
    profilePhotoUrl?: string;
    businessName?: string;
  };
  baseProduct: {
    id: number;
    name: string;
    categories: string[];
    genre: string;
  };
  design?: {
    id: number;
    name?: string;
    cloudinaryUrl?: string;
    width?: number;
    height?: number;
  };
  images?: {
    mainImage: string;
    thumbnails: string[];
    designPreview?: string;
  };
  performance: {
    salesGrowth: number;
    revenueGrowth: number;
    viewsToSalesRatio: number;
    averageOrderValue: number;
  };
}

export interface OptimizedBestSellersResponse {
  success: boolean;
  data: OptimizedBestSellerProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    totalPages: number;
    currentPage: number;
  };
  stats: {
    totalBestSellers: number;
    totalRevenue: number;
    averageOrderValue: number;
    periodAnalyzed: string;
    topCategories: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
    topVendors: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
    performanceMetrics: {
      totalViews: number;
      conversionRate: number;
      averageRating: number;
    };
  };
  cacheInfo?: {
    cached: boolean;
    cacheAge: number;
    lastUpdated: string;
  };
  meta: {
    executionTime: number;
    dataSource: 'cache' | 'database' | 'precomputed';
    queryComplexity: 'simple' | 'medium' | 'complex';
    totalExecutionTime: number;
    requestTimestamp: string;
    apiVersion: string;
    optimizationLevel: string;
  };
}

export interface QuickStatsResponse {
  success: boolean;
  data: {
    allTime: {
      totalProducts: number;
      totalRevenue: number;
      topProduct: string;
      topVendor: string;
    };
    thisMonth: {
      totalProducts: number;
      totalRevenue: number;
      topProduct: string;
      topVendor: string;
    };
    thisWeek: {
      totalProducts: number;
      totalRevenue: number;
      topProduct: string;
      topVendor: string;
    };
    today: {
      totalProducts: number;
      totalRevenue: number;
      topProduct: string;
      topVendor: string;
    };
  };
  meta: {
    executionTime: number;
    dataSource: string;
    requestTimestamp: string;
  };
}

/**
 * 🚀 Service API Optimisé pour les Meilleures Ventes
 */
export class OptimizedBestSellersService {
  private baseUrl = 'https://printalma-back-dep.onrender.com/optimized-best-sellers';
  
  /**
   * 🏆 Récupérer les meilleures ventes optimisées
   */
  async getBestSellers(options: OptimizedBestSellersOptions = {}): Promise<OptimizedBestSellersResponse> {
    const params = new URLSearchParams();
    
    // Construire les paramètres
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const url = `${this.baseUrl}?${params.toString()}`;
    
    try {
      const response: AxiosResponse<OptimizedBestSellersResponse> = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          // Optionnel: contrôle du cache
          // 'X-Cache-Control': 'refresh'
        }
      });
      
      console.log(`✅ Best sellers récupérés en ${response.data.meta.executionTime}ms (source: ${response.data.meta.dataSource})`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération best sellers optimisés:', error);
      
      // Fallback vers l'API normale
      console.log('🔄 Tentative de fallback vers l\'API normale...');
      try {
        const fallbackResponse = await axios.get('https://printalma-back-dep.onrender.com/api/best-sellers', {
          params: options
        });
        
        if (fallbackResponse.data.success) {
          // Adapter la réponse au format optimisé
          return this.adaptToOptimizedFormat(fallbackResponse.data);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback échoué:', fallbackError);
      }
      
      throw error;
    }
  }
  
  /**
   * ⚡ Statistiques rapides
   */
  async getQuickStats(): Promise<QuickStatsResponse> {
    try {
      const response: AxiosResponse<QuickStatsResponse> = await axios.get(`${this.baseUrl}/quick-stats`);
      
      console.log(`📊 Stats rapides générées en ${response.data.meta.executionTime}ms`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur stats rapides:', error);
      
      // Fallback : générer des stats basiques
      return this.generateFallbackStats();
    }
  }
  
  /**
   * 👤 Focus vendeur
   */
  async getVendorFocus(
    vendorId: number,
    period: OptimizedBestSellersOptions['period'] = 'all',
    limit = 20
  ): Promise<OptimizedBestSellersResponse> {
    try {
      const response: AxiosResponse<OptimizedBestSellersResponse> = await axios.get(
        `${this.baseUrl}/vendor/${vendorId}?period=${period}&limit=${limit}`
      );
      
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur focus vendeur ${vendorId}:`, error);
      
      // Fallback : utiliser l'API normale avec filtre vendeur
      return this.getBestSellers({ vendorId, period, limit });
    }
  }
  
  /**
   * 🔄 Rafraîchir le cache
   */
  async refreshCache(): Promise<{ success: boolean; message: string; totalProductsProcessed: number }> {
    try {
      const response = await axios.get(`${this.baseUrl}/refresh-cache`);
      
      console.log(`🔄 Cache rafraîchi: ${response.data.totalProductsProcessed} produits traités`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur rafraîchissement cache:', error);
      
      // Fallback : retourner un succès simulé
      return {
        success: false,
        message: 'Erreur lors du rafraîchissement du cache',
        totalProductsProcessed: 0
      };
    }
  }
  
  /**
   * 🔄 Adapter la réponse normale au format optimisé
   */
  private adaptToOptimizedFormat(normalResponse: any): OptimizedBestSellersResponse {
    return {
      success: normalResponse.success,
      data: normalResponse.data?.map((item: any, index: number) => ({
        id: item.id,
        vendorProductId: item.id,
        name: item.name,
        description: item.description,
        price: item.price || 0,
        totalQuantitySold: item.totalQuantitySold || 0,
        totalRevenue: item.totalRevenue || 0,
        averageUnitPrice: item.averageUnitPrice || item.price || 0,
        uniqueCustomers: item.uniqueCustomers || 0,
        conversionRate: 0, // Non disponible dans l'API normale
        popularityScore: 0,
        trendingScore: 0,
        firstSaleDate: item.firstSaleDate || new Date().toISOString(),
        lastSaleDate: item.lastSaleDate || new Date().toISOString(),
        rank: item.rank || index + 1,
        vendor: {
          id: item.vendor?.id || 0,
          name: item.vendor?.name || 'Vendeur inconnu',
          shopName: item.vendor?.shopName,
          profilePhotoUrl: item.vendor?.profilePhotoUrl,
          businessName: item.vendor?.name
        },
        baseProduct: {
          id: item.baseProduct?.id || 0,
          name: item.baseProduct?.name || 'Produit',
          categories: item.baseProduct?.categories || [],
          genre: 'default'
        },
        design: item.design,
        images: {
          mainImage: item.mainImage || '',
          thumbnails: [],
          designPreview: item.design?.cloudinaryUrl
        },
        performance: {
          salesGrowth: 0,
          revenueGrowth: 0,
          viewsToSalesRatio: 0,
          averageOrderValue: item.averageUnitPrice || 0
        }
      })) || [],
      pagination: normalResponse.pagination || {
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
        totalPages: 0,
        currentPage: 1
      },
      stats: {
        totalBestSellers: normalResponse.stats?.totalBestSellers || 0,
        totalRevenue: normalResponse.stats?.totalRevenue || 0,
        averageOrderValue: normalResponse.stats?.averageOrderValue || 0,
        periodAnalyzed: normalResponse.stats?.periodAnalyzed || 'Période inconnue',
        topCategories: [],
        topVendors: [],
        performanceMetrics: {
          totalViews: 0,
          conversionRate: 0,
          averageRating: 0
        }
      },
      cacheInfo: normalResponse.cacheInfo,
      meta: {
        executionTime: 0,
        dataSource: 'cache',
        queryComplexity: 'simple',
        totalExecutionTime: 0,
        requestTimestamp: new Date().toISOString(),
        apiVersion: '1.0.0',
        optimizationLevel: 'fallback'
      }
    };
  }
  
  /**
   * 📊 Générer des stats de fallback
   */
  private async generateFallbackStats(): Promise<QuickStatsResponse> {
    return {
      success: true,
      data: {
        allTime: {
          totalProducts: 0,
          totalRevenue: 0,
          topProduct: 'Non disponible',
          topVendor: 'Non disponible'
        },
        thisMonth: {
          totalProducts: 0,
          totalRevenue: 0,
          topProduct: 'Non disponible',
          topVendor: 'Non disponible'
        },
        thisWeek: {
          totalProducts: 0,
          totalRevenue: 0,
          topProduct: 'Non disponible',
          topVendor: 'Non disponible'
        },
        today: {
          totalProducts: 0,
          totalRevenue: 0,
          topProduct: 'Non disponible',
          topVendor: 'Non disponible'
        }
      },
      meta: {
        executionTime: 0,
        dataSource: 'fallback',
        requestTimestamp: new Date().toISOString()
      }
    };
  }
}

// Instance singleton
export const optimizedBestSellersService = new OptimizedBestSellersService(); 