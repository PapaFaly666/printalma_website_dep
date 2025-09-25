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
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: VendorStatsResponse = await response.json();

      if (!result.success) {
        throw new Error('API returned success: false');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      throw error;
    }
  }
};