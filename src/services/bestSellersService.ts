import axios, { AxiosResponse } from 'axios';
import {
  BestSellersQueryParams,
  BestSellersResponse,
  CacheRefreshResponse,
  BestSellerProduct,
  BestSellersStatsResponse,
  BestSellersTrendsResponse,
  VendorBestSellersResponse
} from '../types/bestSellers';

// 🚀 MISE À JOUR: Nouveaux endpoints selon la documentation API
const API_BASE = 'http://localhost:3000';
const ENDPOINTS = {
  // Endpoints publics
  bestSellers: `${API_BASE}/public/best-sellers`,
  bestSellersStats: `${API_BASE}/best-sellers/stats`,
  bestSellersTrends: `${API_BASE}/best-sellers/trends`,
  vendorBestSellers: `${API_BASE}/best-sellers/vendor`,
  
  // Endpoints admin (nécessitent authentification)
  adminDashboard: `${API_BASE}/admin/best-sellers/dashboard`,
  adminRecalculate: `${API_BASE}/admin/best-sellers/recalculate-all`,
  adminMarkBestSellers: `${API_BASE}/admin/best-sellers/mark-best-sellers`,
  adminCacheStats: `${API_BASE}/admin/best-sellers/cache/stats`,
  adminCacheClear: `${API_BASE}/admin/best-sellers/cache/clear`,
  adminPerformanceReport: `${API_BASE}/admin/best-sellers/reports/performance`
};

/**
 * 🏆 NOUVEAU: Récupère les meilleures ventes selon la nouvelle API
 */
export async function fetchBestSellers(params: BestSellersQueryParams = {}): Promise<BestSellersResponse> {
  try {
    const queryString = new URLSearchParams();
    
    // 📝 Paramètres selon la documentation API
    if (params.period) queryString.append('period', params.period);
    if (params.limit) queryString.append('limit', params.limit.toString());
    if (params.offset) queryString.append('offset', params.offset.toString());
    if (params.vendorId) queryString.append('vendorId', params.vendorId.toString());
    if (params.categoryId) queryString.append('categoryId', params.categoryId.toString());
    if (params.minSales) queryString.append('minSales', params.minSales.toString());
    
    const response: AxiosResponse<BestSellersResponse> = await axios.get(
      `${ENDPOINTS.bestSellers}?${queryString}`
    );
    
    console.log('🏆 [fetchBestSellers] Response:', response.data);
    
    // ✅ CORRECTION: Adapter la structure de réponse de l'API
    const apiResponse = response.data;
    if (apiResponse.success && apiResponse.data) {
      // L'API retourne data.bestSellers, data.pagination, data.stats
      return {
        success: true,
        data: apiResponse.data || [],
        pagination: apiResponse.pagination || {
          total: 0,
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
          hasMore: false
        },
        stats: apiResponse.stats || {
          totalBestSellers: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          periodAnalyzed: 'N/A'
        },
        message: apiResponse.message
      };
    }
    
    return apiResponse;
  } catch (error) {
    console.error('❌ [fetchBestSellers] Error:', error);
    throw error;
  }
}

/**
 * 📊 NOUVEAU: Récupère les statistiques rapides
 */
export async function fetchBestSellersStats(): Promise<BestSellersStatsResponse> {
  try {
    const response: AxiosResponse<BestSellersStatsResponse> = await axios.get(
      ENDPOINTS.bestSellersStats
    );
    
    console.log('📊 [fetchBestSellersStats] Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [fetchBestSellersStats] Error:', error);
    throw error;
  }
}

/**
 * 📈 NOUVEAU: Récupère l'analyse des tendances
 */
export async function fetchBestSellersTrends(): Promise<BestSellersTrendsResponse> {
  try {
    const response: AxiosResponse<BestSellersTrendsResponse> = await axios.get(
      ENDPOINTS.bestSellersTrends
    );
    
    console.log('📈 [fetchBestSellersTrends] Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [fetchBestSellersTrends] Error:', error);
    throw error;
  }
}

/**
 * 🏪 NOUVEAU: Récupère les meilleures ventes d'un vendeur spécifique
 */
export async function fetchVendorBestSellers(
  vendorId: number, 
  params: BestSellersQueryParams = {}
): Promise<VendorBestSellersResponse> {
  try {
    const queryString = new URLSearchParams();
    
    if (params.period) queryString.append('period', params.period);
    if (params.limit) queryString.append('limit', params.limit.toString());
    
    const response: AxiosResponse<VendorBestSellersResponse> = await axios.get(
      `${ENDPOINTS.vendorBestSellers}/${vendorId}?${queryString}`
    );
    
    console.log(`🏪 [fetchVendorBestSellers] Vendor ${vendorId} Response:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`❌ [fetchVendorBestSellers] Vendor ${vendorId} Error:`, error);
    throw error;
  }
}

/**
 * 🔄 MISE À JOUR: Fonction de fallback mise à jour
 */
export async function fetchBestSellersWithFallback(
  params: BestSellersQueryParams = {}
): Promise<{ data: BestSellerProduct[]; error?: string }> {
  try {
    const response = await fetchBestSellers(params);
    
    if (response.success && response.data) {
      // ✅ CORRECTION: response.data est maintenant directement le tableau
      return { data: response.data };
    } else {
      return { 
        data: [], 
        error: 'Erreur lors de la récupération des meilleures ventes' 
      };
    }
  } catch (error) {
    console.error('❌ [fetchBestSellersWithFallback] Error:', error);
    
    // 🔄 Fallback vers l'ancien endpoint si le nouveau ne fonctionne pas
    try {
      console.log('🔄 Tentative de fallback vers ancien endpoint...');
      const fallbackResponse = await axios.get('http://localhost:3000/public/vendor-products');
      
      if (fallbackResponse.data.success) {
        console.log('✅ Fallback réussi!');
        return { data: fallbackResponse.data.data.bestSellers || [] };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback failed:', fallbackError);
    }
    
    return { 
      data: [], 
      error: 'Erreur de connexion au serveur' 
    };
  }
}

// 🔐 FONCTIONS ADMIN (nécessitent authentification)

/**
 * 🎛️ NOUVEAU: Tableau de bord administrateur
 */
export async function fetchAdminDashboard(token: string) {
  try {
    const response = await axios.get(ENDPOINTS.adminDashboard, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎛️ [fetchAdminDashboard] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [fetchAdminDashboard] Error:', error);
    throw error;
  }
}

/**
 * 🔄 NOUVEAU: Recalcul des statistiques
 */
export async function recalculateAllStats(token: string, options = { force: false, notifyOnComplete: true }) {
  try {
    const response = await axios.post(ENDPOINTS.adminRecalculate, options, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔄 [recalculateAllStats] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [recalculateAllStats] Error:', error);
    throw error;
  }
}

/**
 * 🏷️ NOUVEAU: Marquage des meilleurs vendeurs
 */
export async function markBestSellers(
  token: string, 
  criteria = { period: 'month', minSales: 5, limit: 50 }
) {
  try {
    const response = await axios.post(ENDPOINTS.adminMarkBestSellers, criteria, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🏷️ [markBestSellers] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [markBestSellers] Error:', error);
    throw error;
  }
}

/**
 * 📊 NOUVEAU: Statistiques du cache
 */
export async function fetchCacheStats(token: string) {
  try {
    const response = await axios.get(ENDPOINTS.adminCacheStats, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 [fetchCacheStats] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [fetchCacheStats] Error:', error);
    throw error;
  }
}

/**
 * 🗑️ NOUVEAU: Nettoyage du cache
 */
export async function clearCache(token: string) {
  try {
    const response = await axios.post(ENDPOINTS.adminCacheClear, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('🗑️ [clearCache] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [clearCache] Error:', error);
    throw error;
  }
}

/**
 * 📋 NOUVEAU: Rapport de performance
 */
export async function fetchPerformanceReport(
  token: string, 
  params: { period?: string; vendorId?: number } = {}
) {
  try {
    const queryString = new URLSearchParams();
    if (params.period) queryString.append('period', params.period);
    if (params.vendorId) queryString.append('vendorId', params.vendorId.toString());
    
    const response = await axios.get(
      `${ENDPOINTS.adminPerformanceReport}?${queryString}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('📋 [fetchPerformanceReport] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [fetchPerformanceReport] Error:', error);
    throw error;
  }
}

// 🔄 LEGACY: Maintenir la compatibilité avec l'ancien système
export async function refreshBestSellersCache(): Promise<CacheRefreshResponse> {
  try {
    // Essayer le nouvel endpoint admin d'abord
    const token = localStorage.getItem('authToken');
    if (token) {
      const response = await clearCache(token);
      return {
        success: true,
        message: response.data?.message || 'Cache rafraîchi avec succès',
        timestamp: new Date().toISOString()
      };
    }
    
    // Fallback vers l'ancien endpoint
    const response: AxiosResponse<CacheRefreshResponse> = await axios.get(
      'http://localhost:3000/public/vendor-products'
    );
    return response.data;
  } catch (error) {
    console.error('❌ [refreshBestSellersCache] Error:', error);
    throw error;
  }
} 