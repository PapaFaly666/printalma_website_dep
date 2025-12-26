import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { DashboardData } from '../types/dashboard';

/**
 * Service pour récupérer les données du dashboard admin
 */
export const dashboardService = {
  /**
   * Récupère les données du dashboard superadmin
   * @returns {Promise<DashboardData>} Les données du dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ADMIN.DASHBOARD}`, {
        method: 'GET',
        headers: {
          ...API_CONFIG.HEADERS,
        },
        credentials: 'include', // Important pour inclure les cookies d'authentification
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: DashboardData = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard:', error);
      throw error;
    }
  },
};
