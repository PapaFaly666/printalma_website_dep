import { API_CONFIG } from '../config/api';

export interface VendorStatsData {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  pendingProducts: number;
  totalValue: number;
  averagePrice: number;
  totalDesigns: number;
  publishedDesigns: number;
  draftDesigns: number;
  pendingDesigns: number;
  validatedDesigns: number;
  yearlyRevenue: number;
  monthlyRevenue: number;
  availableBalance: number;
  pendingAmount: number;
  totalEarnings: number;
  shopViews: number;
  totalOrders: number;
  averageCommissionRate: number;
  memberSince: string;
  lastLoginAt: string;
  memberSinceFormatted: string;
  lastLoginAtFormatted: string;
  architecture: string;
}

export interface VendorStatsResponse {
  success: boolean;
  data: VendorStatsData;
}

export const vendorStatsService = {
  getVendorStats: async (): Promise<VendorStatsData> => {
    try {
      console.log('🔄 [vendorStatsService] Récupération des statistiques depuis:', `${API_CONFIG.BASE_URL}/vendor/stats`);

      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Utiliser les cookies pour l'authentification
      });

      console.log('📡 [vendorStatsService] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: VendorStatsResponse = await response.json();

      console.log('📊 [vendorStatsService] Données reçues:', result);

      if (!result.success) {
        throw new Error('API returned success: false');
      }

      console.log('✅ [vendorStatsService] Statistiques récupérées avec succès:', {
        totalProducts: result.data.totalProducts,
        publishedProducts: result.data.publishedProducts,
        totalDesigns: result.data.totalDesigns,
        validatedDesigns: result.data.validatedDesigns
      });

      return result.data;
    } catch (error) {
      console.error('❌ [vendorStatsService] Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
};