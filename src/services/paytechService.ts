// import { api } from '../config/api'; // Pas nécessaire pour PayTech, nous utilisons fetch directement

// Configuration PayTech
const PAYTECH_CONFIG = {
  // URL de l'API PayTech (à remplacer par les vraies URLs en production)
  API_BASE_URL: import.meta.env.PROD
    ? 'https://api.paytech.sn'
    : 'https://api-sandbox.paytech.sn',

  // Clés API (à remplacer par les vraies clés)
  API_KEY: import.meta.env.VITE_PAYTECH_API_KEY || 'test_api_key',
  API_SECRET: import.meta.env.VITE_PAYTECH_API_SECRET || 'test_api_secret',

  // URLs de retour et notification
  RETURN_URL: `${window.location.origin}/payment/return`,
  NOTIFY_URL: `${window.location.origin}/payment/notify`,
  CANCEL_URL: `${window.location.origin}/payment/cancel`,
};

// Types pour PayTech
export interface PayTechPaymentRequest {
  item_name: string;
  item_price: number;
  currency: string; // 'XOF' pour FCFA
  ref_command: string; // Référence unique de commande
  command_name: string; // Nom de la commande
  env: 'test' | 'prod'; // Environnement
  ipn_url: string; // URL de notification
  success_url: string; // URL de succès
  cancel_url: string; // URL d'annulation
  custom_field?: string; // Champ personnalisé (JSON string)
}

export interface PayTechPaymentResponse {
  success: boolean;
  token?: string;
  payment_url?: string;
  error?: string;
  message?: string;
}

export interface PayTechNotification {
  ref_command: string;
  token: string;
  api_key_id: number;
  api_secret_id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  custom_field?: string;
}

export interface PayTechTransaction {
  ref_command: string;
  token: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  customer_info?: {
    name: string;
    email: string;
    phone: string;
  };
}

// Service PayTech
export class PayTechService {
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = PAYTECH_CONFIG.API_KEY;
    this.apiSecret = PAYTECH_CONFIG.API_SECRET;
  }

  // Générer une référence de commande unique
  private generateRefCommand(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    return `CMD_${timestamp}_${random}`;
  }

  // Calculer la signature sécurisée (nécessaire pour l'API PayTech)
  private calculateSignature(paymentData: PayTechPaymentRequest): string {
    // La signature est calculée selon la documentation PayTech
    // C'est un hash SHA256 des paramètres triés par ordre alphabétique
    const sortedKeys = Object.keys(paymentData).sort();
    const stringToHash = sortedKeys
      .map(key => `${key}=${paymentData[key as keyof PayTechPaymentRequest]}`)
      .join('&');

    // En production, utilisez une vraie fonction de hash SHA256
    // Pour l'instant, nous simulons
    return btoa(stringToHash + this.apiSecret);
  }

  // Initier un paiement PayTech
  async initiatePayment(paymentRequest: Omit<PayTechPaymentRequest, 'ref_command' | 'env' | 'ipn_url' | 'success_url' | 'cancel_url'>): Promise<PayTechPaymentResponse> {
    try {
      const refCommand = this.generateRefCommand();

      const payload: PayTechPaymentRequest = {
        ...paymentRequest,
        ref_command: refCommand,
        env: PAYTECH_CONFIG.API_KEY.includes('test') ? 'test' : 'prod',
        ipn_url: PAYTECH_CONFIG.NOTIFY_URL,
        success_url: PAYTECH_CONFIG.RETURN_URL + '?status=success',
        cancel_url: PAYTECH_CONFIG.CANCEL_URL + '?status=cancel',
      };

      // En production, faire un vrai appel API
      // Pour le développement, nous simulons la réponse
      if (import.meta.env.DEV) {
        return this.simulatePaymentResponse(payload);
      }

      // Appel API réel en production
      const response = await fetch(`${PAYTECH_CONFIG.API_BASE_URL}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': this.apiKey,
          'API_SECRET': this.apiSecret,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          token: data.token,
          payment_url: data.payment_url,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Erreur lors de l\'initialisation du paiement',
        };
      }
    } catch (error) {
      console.error('Erreur PayTech:', error);
      return {
        success: false,
        error: 'Erreur technique lors de l\'initialisation du paiement',
      };
    }
  }

  // Simuler une réponse PayTech (pour le développement)
  private async simulatePaymentResponse(paymentRequest: PayTechPaymentRequest): Promise<PayTechPaymentResponse> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));

    const token = `paytech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentUrl = `https://payment.paytech.sn/pay/${token}`;

    return {
      success: true,
      token,
      payment_url: paymentUrl,
      message: 'Paiement initialisé avec succès',
    };
  }

  // Vérifier le statut d'une transaction
  async verifyTransaction(token: string): Promise<{ success: boolean; status: string; transaction?: PayTechTransaction }> {
    try {
      if (import.meta.env.DEV) {
        // Simulation en développement
        return this.simulateTransactionVerification(token);
      }

      // Appel API réel en production
      const response = await fetch(`${PAYTECH_CONFIG.API_BASE_URL}/transaction/${token}`, {
        method: 'GET',
        headers: {
          'API_KEY': this.apiKey,
          'API_SECRET': this.apiSecret,
        },
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          status: data.status,
          transaction: data.transaction,
        };
      } else {
        return {
          success: false,
          status: 'failed',
        };
      }
    } catch (error) {
      console.error('Erreur vérification transaction:', error);
      return {
        success: false,
        status: 'failed',
      };
    }
  }

  // Simuler la vérification de transaction
  private async simulateTransactionVerification(token: string): Promise<{ success: boolean; status: string; transaction?: PayTechTransaction }> {
    // Simuler un délai de vérification
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simuler un paiement réussi
    const transaction: PayTechTransaction = {
      ref_command: `CMD_${Date.now()}`,
      token,
      amount: 10000, // 10 000 FCFA
      currency: 'XOF',
      status: 'success',
      payment_method: 'mobile_money', // Peut être 'mobile_money', 'credit_card', etc.
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      status: 'success',
      transaction,
    };
  }

  // Traiter la notification IPN (Instant Payment Notification)
  processNotification(notificationData: any): PayTechNotification | null {
    try {
      // Vérifier la signature pour valider l'authenticité
      const expectedSignature = this.calculateSignature(notificationData);
      const receivedSignature = notificationData.signature;

      if (expectedSignature !== receivedSignature) {
        console.error('Signature invalide - notification ignorée');
        return null;
      }

      return {
        ref_command: notificationData.ref_command,
        token: notificationData.token,
        api_key_id: notificationData.api_key_id,
        api_secret_id: notificationData.api_secret_id,
        transaction_id: notificationData.transaction_id,
        amount: notificationData.amount,
        currency: notificationData.currency,
        status: notificationData.status,
        custom_field: notificationData.custom_field,
      };
    } catch (error) {
      console.error('Erreur traitement notification:', error);
      return null;
    }
  }

  // Obtenir les méthodes de paiement disponibles
  getAvailablePaymentMethods(): Array<{
    id: string;
    name: string;
    icon: string;
    iconUrl?: string;
    type: 'mobile_money' | 'credit_card' | 'bank_transfer';
    description: string;
    countries: string[];
  }> {
    return [
      {
        id: 'wave',
        name: 'Wave',
        icon: '🌊',
        iconUrl: 'https://business221.com/wp-content/uploads/2025/07/wave-photo.png',
        type: 'mobile_money',
        description: 'Paiement instantané par compte Wave',
        countries: ['SN'],
      },
      {
        id: 'orange_money',
        name: 'Orange Money',
        icon: '🍊',
        iconUrl: 'https://yop.l-frii.com/wp-content/uploads/2022/12/Orange-Money-recrute-pour-ce-poste-28-Decembre-2022-1024x683.png',
        type: 'mobile_money',
        description: 'Paiement par Orange Money',
        countries: ['SN'],
      },
      {
        id: 'free_money',
        name: 'Free Money',
        icon: '📱',
        iconUrl: 'https://www.leral.net/photo/art/grande/37799395-33255723.jpg?v=1569937186',
        type: 'mobile_money',
        description: 'Paiement par Free Money',
        countries: ['SN'],
      },
      {
        id: 'carte_bancaire',
        name: 'Carte Bancaire',
        icon: '💳',
        type: 'credit_card',
        description: 'Paiement par Visa, Mastercard, etc.',
        countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'TG'],
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '💰',
        type: 'credit_card',
        description: 'Paiement sécurisé par PayPal',
        countries: ['SN'],
      },
    ];
  }

  // Obtenir les taux de frais
  getPaymentFees(): { method: string; rate: number; fixed_fee: number }[] {
    return [
      { method: 'mobile_money', rate: 0.015, fixed_fee: 50 }, // 1.5% + 50 FCFA
      { method: 'credit_card', rate: 0.025, fixed_fee: 100 }, // 2.5% + 100 FCFA
      { method: 'bank_transfer', rate: 0.01, fixed_fee: 200 }, // 1% + 200 FCFA
    ];
  }

  // Calculer les frais de transaction
  calculateFees(amount: number, method: string): number {
    const feeInfo = this.getPaymentFees().find(fee => fee.method === method);
    if (!feeInfo) return 0;

    return Math.round((amount * feeInfo.rate) + feeInfo.fixed_fee);
  }
}

// Exporter l'instance du service
export const paytechService = new PayTechService();