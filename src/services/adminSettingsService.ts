import { API_CONFIG, API_ENDPOINTS } from '../config/api';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  changedAt: string;
}

export interface AdminProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profile_photo_url?: string;
  created_at: string;
  last_login_at?: string;
  customRole?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    permissions: Array<{
      id: number;
      key: string;
      name: string;
      module: string;
      description: string;
    }>;
  };
}

export interface AdminStatsResponse {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeProducts: number;
}

export interface AppSettingsResponse {
  appName: string;
  contactEmail: string;
  supportEmail: string;
  contactPhone: string;
  companyAddress: string;
  websiteUrl: string;
  vendorRegistrationEnabled: boolean;
  emailNotificationsEnabled: boolean;
  defaultVendorCommission: number;
  minWithdrawalAmount: number;
  currency: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt?: string;
  updatedBy?: number;
}

export class AdminSettingsService {
  private baseUrl = API_CONFIG.BASE_URL;

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async parseError(res: Response): Promise<Error> {
    try {
      const data = await res.json();
      return new Error(data.message || `Erreur HTTP ${res.status}`);
    } catch {
      return new Error(`Erreur HTTP ${res.status}`);
    }
  }

  /**
   * Changer le mot de passe de l'administrateur connecté
   */
  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.ADMIN.SETTINGS_CHANGE_PASSWORD}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  /**
   * Récupérer le profil de l'administrateur connecté
   */
  async getProfile(): Promise<AdminProfileResponse> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.ADMIN.SETTINGS_PROFILE}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  /**
   * Récupérer les statistiques du dashboard admin
   */
  async getStats(): Promise<AdminStatsResponse> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.ADMIN.SETTINGS_STATS}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  /**
   * Récupérer les paramètres de l'application
   */
  async getAppSettings(): Promise<AppSettingsResponse> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.ADMIN.SETTINGS_APP}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  /**
   * Mettre à jour les paramètres de l'application
   */
  async updateAppSettings(data: Partial<AppSettingsResponse>): Promise<AppSettingsResponse> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.ADMIN.SETTINGS_APP}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }
}

// Instance singleton
export const adminSettingsService = new AdminSettingsService();
