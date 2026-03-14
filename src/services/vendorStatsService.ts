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

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  orders: number;
  productRevenue?: number;
  designRevenue?: number;
  designUsages?: number;
}

export interface AnnualRevenueStats {
  currentYearRevenue: number;
  previousYearRevenue: number;
  yearOverYearGrowth: number;
  monthlyData: number[];
}

export interface MonthlyRevenueStats {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  monthOverMonthGrowth: number;
  weeklyData: number[];
}

export interface RevenueStats {
  annual: AnnualRevenueStats;
  monthly: MonthlyRevenueStats;
}

export interface MonthlyRevenueResponse {
  success: boolean;
  data: MonthlyRevenueData[];
}

export interface RevenueStatsResponse {
  success: boolean;
  message: string;
  data: RevenueStats;
}

export interface VendorStatsResponse {
  success: boolean;
  data: VendorStatsData;
}

export const vendorStatsService = {
  getRevenueStats: async (): Promise<RevenueStats> => {
    try {
      console.log('🔄 [vendorStatsService] Récupération des statistiques de revenus avec pourcentages');

      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/stats/revenue`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('📡 [vendorStatsService] Revenue stats response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RevenueStatsResponse = await response.json();

      console.log('📊 [vendorStatsService] Statistiques de revenus reçues:', result);

      if (!result.success) {
        throw new Error('API returned success: false');
      }

      console.log('✅ [vendorStatsService] Statistiques de revenus récupérées avec succès');

      return result.data;
    } catch (error) {
      console.error('❌ [vendorStatsService] Erreur lors de la récupération des statistiques de revenus:', error);
      throw error;
    }
  },

  getMonthlyRevenue: async (months: number = 7): Promise<MonthlyRevenueData[]> => {
    try {
      console.log(`🔄 [vendorStatsService] Récupération des revenus mensuels (${months} mois)`);

      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/stats/monthly-revenue?months=${months}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('📡 [vendorStatsService] Monthly revenue response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MonthlyRevenueResponse = await response.json();

      console.log('📊 [vendorStatsService] Données mensuelles reçues:', result);

      if (!result.success) {
        throw new Error('API returned success: false');
      }

      console.log('✅ [vendorStatsService] Revenus mensuels récupérés avec succès');

      return result.data;
    } catch (error) {
      console.error('❌ [vendorStatsService] Erreur lors de la récupération des revenus mensuels:', error);
      throw error;
    }
  },

  trackShopClick: async (vendorId: number): Promise<void> => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/public/vendors/${vendorId}/click`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Silently ignore tracking errors
      console.warn('[vendorStatsService] Erreur tracking click boutique:', error);
    }
  },

  getShopClicksHistory: async (days: number = 7): Promise<{ date: string; clicks: number }[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/stats/shop-clicks?days=${days}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('API returned success: false');
      }

      return result.data;
    } catch (error) {
      console.warn('[vendorStatsService] Erreur récupération historique clics boutique:', error);
      return [];
    }
  },

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