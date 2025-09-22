// Service Frontend — Demandes d'appel de fonds (vendor)
import { API_CONFIG } from '../config/api';

export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';

export interface CreateFundsRequestPayload {
  amount: number;
  description?: string;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
  iban?: string;
  orderIds?: number[];
}

export interface FundsRequest {
  id: number;
  vendorId: number;
  amount: number;
  requestedAmount?: number;
  description?: string | null;
  paymentMethod: PaymentMethod;
  phoneNumber: string;
  status: 'APPROVED' | 'PAID';
  adminNote?: string | null;
  rejectReason?: string | null;
  processedBy?: number | null;
  processedByUser?: { id: number; name?: string } | null;
  processedAt?: string | null;
  availableBalance?: number;
  commissionRate?: number;
  requestDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EarningsResponse {
  success: boolean;
  data: {
    availableAmount: number;
    pendingAmount: number;
    totalEarnings: number;
  };
}

export const fundsRequestService = {
  async getEarnings(): Promise<EarningsResponse> {
    const res = await fetch(`${API_CONFIG.BASE_URL}/vendor/earnings`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur chargement gains');
    return data;
  },

  async create(payload: CreateFundsRequestPayload): Promise<{ success: boolean; message: string; data: FundsRequest }> {
    const res = await fetch(`${API_CONFIG.BASE_URL}/vendor/funds-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur création demande');
    return data;
  },

  async list(params: { page?: number; limit?: number; status?: 'APPROVED' | 'PAID' } = {}): Promise<{ success: boolean; data: { items: FundsRequest[]; total: number; page: number; limit: number } }> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);

    const res = await fetch(`${API_CONFIG.BASE_URL}/vendor/funds-requests?${qs.toString()}`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur chargement demandes');
    return data;
  },

  async getById(id: number): Promise<{ success: boolean; data: FundsRequest }> {
    const res = await fetch(`${API_CONFIG.BASE_URL}/vendor/funds-requests/${id}`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur chargement demande');
    return data;
  }
};


