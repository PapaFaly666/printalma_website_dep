import { API_CONFIG } from '../config/api';

export interface AdminVendorUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  vendeur_type?: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  phone?: string;
  country?: string;
  address?: string;
  shop_name?: string;
  status?: boolean;
  must_change_password?: boolean;
}

export class AdminVendorService {
  private baseUrl = `${API_CONFIG.BASE_URL}/auth/admin/vendors`;

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async getList(params?: { page?: number; limit?: number; status?: boolean; vendeur_type?: string; search?: string; }): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v));
      });
    }
    const res = await fetch(`${this.baseUrl}${query.toString() ? `?${query}` : ''}`, {
      headers: {
        ...this.getAuthHeaders()
      },
      credentials: 'include'
    });
    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  async getOne(vendorId: number): Promise<any> {
    const res = await fetch(`${this.baseUrl}/${vendorId}`, {
      headers: {
        ...this.getAuthHeaders()
      },
      credentials: 'include'
    });
    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  async update(vendorId: number, data: AdminVendorUpdateData, profilePhoto?: File | null): Promise<any> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
      }
    });
    if (profilePhoto) {
      formData.append('profilePhoto', profilePhoto);
    }
    const res = await fetch(`${this.baseUrl}/${vendorId}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders()
      },
      body: formData,
      credentials: 'include'
    });
    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  private async parseError(res: Response) {
    try {
      const data = await res.json();
      return new Error(data?.message || `HTTP ${res.status}`);
    } catch {
      return new Error(`HTTP ${res.status}`);
    }
  }
}

export const adminVendorService = new AdminVendorService();


