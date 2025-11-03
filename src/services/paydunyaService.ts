import { PAYDUNYA_CONFIG, type PayDunyaPaymentRequest, type PayDunyaPaymentResponse, type PayDunyaPaymentStatus } from '../config/paydunyaConfig';
import { apiClient } from '../lib/api';

// Service PayDunya - Appelle le backend (pas PayDunya directement)
export class PayDunyaService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = PAYDUNYA_CONFIG.API_BASE_URL;
  }

  // Obtenir le token d'authentification depuis localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }

  // Obtenir les headers pour les requêtes API
  private getHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Créer une commande avec paiement PayDunya
  async createOrderWithPayment(orderRequest: {
    shippingDetails: {
      name: string;
      street: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
    };
    phoneNumber: string;
    notes?: string;
    orderItems: Array<{
      productId: number;
      quantity: number;
      size?: string;
      colorId?: number;
    }>;
    paymentMethod: 'PAYDUNYA' | 'CASH';
    initiatePayment: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      id: number;
      orderNumber: string;
      totalAmount: number;
      status: string;
      payment?: {
        token: string;
        redirect_url: string;
      };
    };
  }> {
    try {
      console.log('🚀 [PayDunya] Création de commande avec paiement:', orderRequest);

      const response = await fetch(`${this.backendUrl}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...orderRequest,
          paymentMethod: 'PAYDUNYA',
          initiatePayment: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [PayDunya] Commande créée:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [PayDunya] Erreur lors de la création de commande:', error);
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }
  }

  // Initier un paiement PayDunya
  async initiatePayment(paymentRequest: PayDunyaPaymentRequest): Promise<PayDunyaPaymentResponse> {
    try {
      console.log('🚀 [PayDunya] Initialisation du paiement:', paymentRequest);

      // Enrichir la requête avec les URLs de callback
      const enhancedPaymentRequest = {
        ...paymentRequest,
        actions: {
          callback_url: PAYDUNYA_CONFIG.CALLBACK_URL,
          return_url: PAYDUNYA_CONFIG.RETURN_URL,
          cancel_url: PAYDUNYA_CONFIG.CANCEL_URL,
          ...paymentRequest.actions
        }
      };

      console.log('🔗 [PayDunya] URLs configurées:', {
        callback_url: PAYDUNYA_CONFIG.CALLBACK_URL,
        return_url: PAYDUNYA_CONFIG.RETURN_URL,
        cancel_url: PAYDUNYA_CONFIG.CANCEL_URL,
        mode: PAYDUNYA_CONFIG.MODE
      });

      // ✅ Utiliser apiClient avec gestion automatique des endpoints publics
      const response = await apiClient.post('/paydunya/payment', enhancedPaymentRequest);

      const data = response.data;
      console.log('✅ [PayDunya] Paiement initialisé:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [PayDunya] Erreur lors de l\'initialisation du paiement:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'initialisation du paiement';

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  // Vérifier le statut d'un paiement PayDunya
  async checkPaymentStatus(token: string): Promise<PayDunyaPaymentStatus> {
    try {
      console.log('🔍 [PayDunya] Vérification du statut pour token:', token);

      // ✅ Utiliser apiClient avec gestion automatique des endpoints publics
      const response = await apiClient.get(`/paydunya/status/${token}`);

      const data = response.data;
      console.log('📡 [PayDunya] Statut du paiement:', data);

      return {
        success: data.success,
        status: data.data?.status || 'pending',
        payment: data.data?.payment,
        customer: data.data?.customer,
        invoice: data.data?.invoice,
      };
    } catch (error: any) {
      console.error('❌ [PayDunya] Erreur vérification statut:', error);
      return {
        success: false,
        status: 'failed',
      };
    }
  }

  // Obtenir les méthodes de paiement disponibles PayDunya
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
        id: 'orange_money',
        name: 'Orange Money',
        icon: '🍊',
        iconUrl: 'https://play-lh.googleusercontent.com/Fq_i12wS7k8o1iLQhI4AqRdC9Qa6sKq3mT0dK9fL1pW4gNj2kRq8hV7zXy5cBw3',
        type: 'mobile_money',
        description: 'Paiement instantané par Orange Money',
        countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CD'],
      },
      {
        id: 'wave',
        name: 'Wave',
        icon: '🌊',
        iconUrl: 'https://play-lh.googleusercontent.com/7sM_4LdQh7wL6kF9mJ2nN8pK3qR5tY7uV9wX2zA4cB6dE8fG0hJ2kL4mN6oP8qR',
        type: 'mobile_money',
        description: 'Paiement instantané par compte Wave',
        countries: ['SN', 'CI', 'BF', 'ML', 'TG', 'BJ', 'UG', 'KE'],
      },
      {
        id: 'mtn_money',
        name: 'MTN Mobile Money',
        icon: '📱',
        iconUrl: 'https://play-lh.googleusercontent.com/2kM4wT6vY8zX1bC3dE5fG7hJ9kL2mN4pQ6rS8tU0vW2xY4zA6cB8dE0fG2hJ',
        type: 'mobile_money',
        description: 'Paiement par MTN Mobile Money',
        countries: ['CI', 'CM', 'CG', 'UG', 'Rwanda', 'Zambia', 'Ghana', 'Benin'],
      },
      {
        id: 'moov_money',
        name: 'Moov Money',
        icon: '💜',
        iconUrl: 'https://play-lh.googleusercontent.com/9nM1oT5wX2yV0bD4eF6hH8iK0mN3pQ5rS7tU9vW1xY3zA5cB7dE9fG1hJ3kM5o',
        type: 'mobile_money',
        description: 'Paiement par Moov Money',
        countries: ['CI', 'TG', 'BF', 'Benin', 'CAR', 'Congo'],
      },
      {
        id: 'carte_bancaire',
        name: 'Carte Bancaire',
        icon: '💳',
        type: 'credit_card',
        description: 'Paiement par Visa, Mastercard, American Express',
        countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CD', 'CM', 'GA'],
      },
      {
        id: 'paydunya_wallet',
        name: 'PayDunya Wallet',
        icon: '💰',
        type: 'credit_card',
        description: 'Paiement via portefeuille PayDunya',
        countries: ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CD'],
      },
    ];
  }

  // Obtenir les taux de frais PayDunya
  getPaymentFees(): { method: string; rate: number; fixed_fee: number; description: string }[] {
    return [
      {
        method: 'mobile_money',
        rate: 0.02,
        fixed_fee: 100, // 2% + 100 FCFA
        description: 'Orange Money, Wave, MTN Money, Moov Money'
      },
      {
        method: 'credit_card',
        rate: 0.029,
        fixed_fee: 150, // 2.9% + 150 FCFA
        description: 'Cartes bancaires Visa, Mastercard, etc.'
      },
      {
        method: 'bank_transfer',
        rate: 0.015,
        fixed_fee: 200, // 1.5% + 200 FCFA
        description: 'Virement bancaire'
      },
    ];
  }

  // Calculer les frais de transaction
  calculateFees(amount: number, method: string): number {
    const feeInfo = this.getPaymentFees().find(fee => fee.method === method);
    if (!feeInfo) return 0;

    return Math.round((amount * feeInfo.rate) + feeInfo.fixed_fee);
  }

  // Obtenir le montant total avec frais
  getTotalWithFees(amount: number, method: string): number {
    const fees = this.calculateFees(amount, method);
    return amount + fees;
  }

  // Valider la configuration PayDunya
  validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    config: any;
  } {
    const errors: string[] = [];

    if (!PAYDUNYA_CONFIG.MASTER_KEY) {
      errors.push('La clé MASTER_KEY est requise');
    }

    if (!PAYDUNYA_CONFIG.PRIVATE_KEY) {
      errors.push('La clé PRIVATE_KEY est requise');
    }

    if (!PAYDUNYA_CONFIG.PUBLIC_KEY) {
      errors.push('La clé PUBLIC_KEY est requise');
    }

    if (!PAYDUNYA_CONFIG.TOKEN) {
      errors.push('Le TOKEN est requis');
    }

    const config = PAYDUNYA_CONFIG.getConfigSummary();

    return {
      isValid: errors.length === 0,
      errors,
      config,
    };
  }

  // Tester la connexion à l'API PayDunya via le backend
  async testConfiguration(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      // ✅ Utiliser apiClient avec gestion automatique des endpoints publics
      const response = await apiClient.get('/paydunya/test-config');

      const data = response.data;
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du test de configuration';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Demander un remboursement (admin seulement)
  async requestRefund(paymentToken: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${this.backendUrl}/paydunya/refund`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          token: paymentToken,
          reason: reason || 'Remboursement demandé par le client',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [PayDunya] Demande de remboursement:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [PayDunya] Erreur lors de la demande de remboursement:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la demande de remboursement',
      };
    }
  }
}

// Exporter l'instance du service
export const paydunyaService = new PayDunyaService();

// Exporter les types
export type { PayDunyaPaymentRequest, PayDunyaPaymentResponse, PayDunyaPaymentStatus };