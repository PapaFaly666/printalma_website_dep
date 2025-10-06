import { API_CONFIG } from '../config/api';

export type VendorAccountStatusResponse = {
  success: boolean;
  message?: string;
  data: {
    isActive?: boolean;
    status?: boolean;
    id?: number;
    [key: string]: any;
  };
};

export type VendorAccountInfoResponse = {
  success: boolean;
  message?: string;
  data: any;
};

class VendorAccountService {
  constructor(private readonly baseUrl: string = API_CONFIG.BASE_URL) {}

  async patchStatus(status: boolean, reason: string = ''): Promise<VendorAccountStatusResponse> {
    const res = await fetch(`${this.baseUrl}/vendor/account/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json?.message || `Erreur ${res.status}`) as any;
      err.status = res.status;
      err.code = json?.error || undefined;
      err.data = json;
      throw err;
    }
    return json;
  }

  async deactivateAccount(reason: string = ''): Promise<VendorAccountStatusResponse> {
    return this.patchStatus(false, reason);
  }

  async reactivateAccount(reason: string = ''): Promise<VendorAccountStatusResponse> {
    return this.patchStatus(true, reason);
  }

  async getAccountInfo(): Promise<VendorAccountInfoResponse> {
    const res = await fetch(`${this.baseUrl}/vendor/account/info`, { credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.message || `Erreur ${res.status}`);
    }
    return json;
  }

  async getAccountStatus(): Promise<VendorAccountStatusResponse> {
    const res = await fetch(`${this.baseUrl}/vendor/account/status`, { credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.message || `Erreur ${res.status}`);
    }
    return json;
  }
}

export const vendorAccountService = new VendorAccountService();


