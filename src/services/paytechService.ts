// Configuration pour appeler le backend (pas PayTech directement)
// Le backend gère les clés API de manière sécurisée
const BACKEND_CONFIG = {
  // URL de votre backend NestJS
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3004',

  // URLs de retour (gérées par le frontend)
  SUCCESS_URL: `${window.location.origin}/payment/success`,
  CANCEL_URL: `${window.location.origin}/payment/cancel`,
};

// Types pour l'API Backend (qui appelle PayTech)
export interface CreateOrderRequest {
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
  paymentMethod: 'PAYTECH' | 'CASH';
  initiatePayment: boolean;
}

export interface OrderResponse {
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
}

// Types pour PayTech selon la documentation officielle
export interface PayTechPaymentRequest {
  item_name: string;
  item_price: number;
  currency?: string;
  ref_command?: string;
  command_name: string;
  custom_field?: string;
  env?: 'test' | 'prod';
  success_url?: string;
  cancel_url?: string;
  ipn_url?: string;
  target_payment?: string;
}

export interface PayTechPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    redirect_url: string;
    ref_command: string;
  };
  error?: string;
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

// Service PayTech - Appelle le backend (pas PayTech directement)
export class PayTechService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = BACKEND_CONFIG.API_BASE_URL;
  }

  // Obtenir le token d'authentification depuis localStorage (optionnel)
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  }

  // Créer une commande avec paiement PayTech (pas besoin d'authentification)
  async createOrderWithPayment(orderRequest: CreateOrderRequest): Promise<OrderResponse> {
    try {
      const token = this.getAuthToken();

      console.log('🚀 [PayTech] Création de commande avec paiement (invité):', orderRequest);

      const response = await fetch(`${this.backendUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Token optionnel - les commandes invitées sont autorisées
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(orderRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [PayTech] Commande créée:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [PayTech] Erreur lors de la création de commande:', error);
      throw new Error(error.message || 'Erreur lors de la création de la commande');
    }
  }

  // Initier un paiement PayTech direct (pas besoin d'authentification)
  async initiatePayment(paymentRequest: PayTechPaymentRequest): Promise<PayTechPaymentResponse> {
    try {
      const token = this.getAuthToken();

      console.log('🚀 [PayTech] Initialisation du paiement (invité):', paymentRequest);

      const response = await fetch(`${this.backendUrl}/paytech/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Token optionnel - les paiements invités sont autorisés
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [PayTech] Paiement initialisé:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [PayTech] Erreur lors de l\'initialisation du paiement:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'initialisation du paiement',
        error: error.message,
      };
    }
  }

  // Vérifier le statut d'un paiement via le backend (pas besoin d'authentification)
  async checkPaymentStatus(token: string): Promise<{ success: boolean; status: string; payment_data?: any }> {
    try {
      const authToken = this.getAuthToken();

      console.log('🔍 [PayTech] Vérification du statut pour token:', token);

      const response = await fetch(`${this.backendUrl}/paytech/status/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Token optionnel - vérification des paiements invités autorisée
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 [PayTech] Statut du paiement:', data);

      return {
        success: data.success,
        status: data.data?.status || 'unknown',
        payment_data: data.data,
      };
    } catch (error: any) {
      console.error('❌ [PayTech] Erreur vérification statut:', error);
      return {
        success: false,
        status: 'failed',
      };
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