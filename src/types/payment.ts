// Types pour la gestion des paiements PayDunya

export enum PaymentStatus {
  PENDING = 'PENDING',           // En attente
  PROCESSING = 'PROCESSING',     // En traitement
  PAID = 'PAID',                 // Payé avec succès
  FAILED = 'FAILED',             // Échoué
  CANCELLED = 'CANCELLED',       // Annulé par l'utilisateur
  REFUNDED = 'REFUNDED',         // Remboursé
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS'  // Fonds insuffisants
}

export enum PaymentMethod {
  PAYDUNYA = 'PAYDUNYA',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  OTHER = 'OTHER'
}

export interface PaymentData {
  token: string;
  redirect_url?: string;
  payment_url?: string;
  mode?: 'test' | 'live';
  transaction_id?: string;
  response_code?: string;
  response_text?: string;
}

export interface PaymentResult {
  success: boolean;
  status: PaymentStatus;
  token?: string;
  redirect_url?: string;
  payment_url?: string;
  message: string;
  transaction_id?: string;
  failure_reason?: string;
  failure_category?: string;
  response_code?: string;
  response_text?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    response_code: string;
    response_text: string;
    payment_status?: string;
    transaction_id?: string;
    amount?: number;
    currency?: string;
    customer?: {
      name: string;
      email?: string;
      phone?: string;
    };
    invoice?: {
      token: string;
      url: string;
      total_amount: number;
    };
  };
}

export interface PendingPaymentInfo {
  orderId: number;
  orderNumber: string;
  token: string;
  totalAmount: number;
  timestamp: number;
}

// Helper function pour déterminer le statut basé sur le code de réponse PayDunya
export function determinePaymentStatus(responseCode: string): PaymentStatus {
  switch (responseCode) {
    case '00':
      return PaymentStatus.PAID;
    case '01':
    case '02':
      return PaymentStatus.PROCESSING;
    case '03':
      return PaymentStatus.INSUFFICIENT_FUNDS;
    case '04':
      return PaymentStatus.CANCELLED;
    default:
      return PaymentStatus.FAILED;
  }
}

// Helper function pour générer l'URL de paiement PayDunya
export function generatePaydunyaUrl(token: string, mode: 'test' | 'live' = 'test'): string {
  const baseUrl = mode === 'live'
    ? 'https://paydunya.com/checkout/invoice'
    : 'https://paydunya.com/sandbox-checkout/invoice';

  return `${baseUrl}/${token}`;
}

// Helper function pour vérifier si les données de paiement sont complètes
export function validatePaymentData(paymentData: any): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!paymentData) {
    missingFields.push('payment data object');
    return { isValid: false, missingFields };
  }

  if (!paymentData.token) {
    missingFields.push('token');
  }

  // Au moins une URL doit être présente
  if (!paymentData.redirect_url && !paymentData.payment_url) {
    missingFields.push('redirect_url or payment_url');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// Types pour les URLs de configuration
export interface PaymentUrls {
  SUCCESS: string;
  CANCEL: string;
  CALLBACK: string;
}
