import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export interface OrangePaymentRequest {
  orderId: number;
  amount: number;
  customerName: string;
  customerPhone?: string;
  orderNumber: string;
}

export interface OrangePaymentResponse {
  success: boolean;
  data?: {
    qrCode: string;
    deepLinks: {
      MAXIT: string;
      OM: string;
    };
    validity: number;
    reference: string;
  };
  error?: string;
}

export class OrangeMoneyService {
  /**
   * Génère un QR Code et des deeplinks Orange Money pour un paiement
   */
  static async createPayment(request: OrangePaymentRequest): Promise<OrangePaymentResponse> {
    try {
      const response = await fetch(`${API_URL}/orange-money/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur lors de la création du paiement' }));
        throw new Error(error.message);
      }

      return response.json();
    } catch (error: any) {
      console.error('❌ Erreur création paiement Orange Money:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Vérifie si l'utilisateur est sur mobile
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
