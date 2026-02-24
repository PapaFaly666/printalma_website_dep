import { API_CONFIG } from '../config/api';
import { apiClient } from '../lib/api';

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

export interface OrangePaymentStatusResponse {
  success: boolean;
  message: string;
  orderNumber?: string;
  paymentStatus?: string;
  transactionId?: string;
  paymentMethod?: string;
  totalAmount?: number;
  orderStatus?: string;
  shouldRedirect?: boolean;
  redirectUrl?: string;
}

export interface OrangeMoneyStoredData {
  qrCode: string;
  deepLinks: {
    MAXIT: string;
    OM: string;
  };
  reference: string;
  orderNumber: string;
  totalAmount: number;
  timestamp: number;
}

export class OrangeMoneyService {
  private static readonly STORAGE_KEY = 'orangeMoneyPayment';
  private static readonly MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Génère un QR Code et des deeplinks Orange Money pour un paiement
   */
  static async createPayment(request: OrangePaymentRequest): Promise<OrangePaymentResponse> {
    try {
      console.log('🍊 [Orange Money] Création du paiement:', request.orderNumber);

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

      const data = await response.json();
      console.log('✅ [Orange Money] Paiement créé avec succès');

      return data;
    } catch (error: any) {
      console.error('❌ [Orange Money] Erreur création paiement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement Orange Money
   */
  static async checkPaymentStatus(orderNumber: string): Promise<OrangePaymentStatusResponse> {
    try {
      console.log(`🔍 [Orange Money] Vérification statut pour: ${orderNumber}`);

      const response = await apiClient.get<OrangePaymentStatusResponse>(
        `/orange-money/payment-status/${orderNumber}`
      );

      console.log(`📊 [Orange Money] Statut récupéré:`, response.data.paymentStatus);

      return response.data;
    } catch (error: any) {
      console.error('❌ [Orange Money] Erreur vérification statut:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la vérification du statut',
      };
    }
  }

  /**
   * Polling du statut de paiement avec tentatives multiples
   */
  static async pollPaymentStatus(
    orderNumber: string,
    maxAttempts: number = 180,
    intervalMs: number = 1000,
    onStatusUpdate?: (status: OrangePaymentStatusResponse) => void
  ): Promise<OrangePaymentStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      console.log(`🔄 [Orange Money] Tentative ${attempts + 1}/${maxAttempts}`);

      const result = await this.checkPaymentStatus(orderNumber);

      // Notifier le callback si fourni
      if (onStatusUpdate) {
        onStatusUpdate(result);
      }

      // Si le paiement est finalisé (succès ou échec), retourner le résultat
      if (
        result.paymentStatus === 'PAID' ||
        result.paymentStatus === 'FAILED' ||
        result.paymentStatus === 'CANCELLED'
      ) {
        console.log('✅ [Orange Money] Statut final:', result.paymentStatus);
        return result;
      }

      // Sinon, attendre avant la prochaine tentative
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // Si toutes les tentatives ont échoué, retourner un statut d'échec
    console.warn('⚠️ [Orange Money] Nombre maximum de tentatives atteint');
    return {
      success: false,
      message: 'Le délai de paiement a expiré. Veuillez réessayer.',
      paymentStatus: 'FAILED',
    };
  }

  /**
   * Sauvegarder les informations de paiement Orange Money dans localStorage
   */
  static savePaymentData(data: OrangeMoneyStoredData): void {
    try {
      const dataWithTimestamp = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataWithTimestamp));
      console.log('💾 [Orange Money] Données sauvegardées dans localStorage');
    } catch (error) {
      console.error('❌ [Orange Money] Erreur sauvegarde localStorage:', error);
    }
  }

  /**
   * Récupérer les informations de paiement Orange Money depuis localStorage
   */
  static getPaymentData(): OrangeMoneyStoredData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const parsed: OrangeMoneyStoredData = JSON.parse(data);

      // Vérifier si les données ne sont pas trop anciennes (30 minutes)
      const isExpired = Date.now() - parsed.timestamp > this.MAX_AGE_MS;
      if (isExpired) {
        console.warn('⚠️ [Orange Money] Données expirées');
        this.clearPaymentData();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('❌ [Orange Money] Erreur récupération localStorage:', error);
      return null;
    }
  }

  /**
   * Effacer les informations de paiement Orange Money
   */
  static clearPaymentData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ [Orange Money] Données supprimées du localStorage');
    } catch (error) {
      console.error('❌ [Orange Money] Erreur suppression localStorage:', error);
    }
  }

  /**
   * Annuler un paiement Orange Money
   */
  static async cancelPayment(orderNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🚫 [Orange Money] Annulation du paiement pour: ${orderNumber}`);

      const response = await apiClient.post<{ success: boolean; message: string }>(
        `/orange-money/cancel-payment/${orderNumber}`,
        {}
      );

      console.log('✅ [Orange Money] Paiement annulé');
      return response.data;
    } catch (error: any) {
      console.error('❌ [Orange Money] Erreur annulation:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'annulation',
      };
    }
  }

  /**
   * Vérifie si l'utilisateur est sur mobile
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Obtenir un message utilisateur convivial basé sur le statut
   */
  static getStatusMessage(status: string): string {
    switch (status) {
      case 'PAID':
        return '✅ Paiement réussi ! Votre commande a été confirmée.';
      case 'PENDING':
        return '⏳ Paiement en attente. Scannez le QR code ou utilisez l\'application Orange Money.';
      case 'FAILED':
        return '❌ Le paiement a échoué. Veuillez réessayer.';
      case 'CANCELLED':
        return '🚫 Le paiement a été annulé.';
      default:
        return '❓ Statut du paiement inconnu.';
    }
  }

  /**
   * Obtenir la couleur d'affichage basée sur le statut
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'PAID':
        return 'green';
      case 'PENDING':
        return 'orange';
      case 'FAILED':
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Obtenir l'icône basée sur le statut
   */
  static getStatusIcon(status: string): string {
    switch (status) {
      case 'PAID':
        return '✅';
      case 'PENDING':
        return '⏳';
      case 'FAILED':
        return '❌';
      case 'CANCELLED':
        return '🚫';
      default:
        return '❓';
    }
  }
}
