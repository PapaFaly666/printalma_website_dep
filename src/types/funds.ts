// Types pour la gestion des fonds et appels de fonds

export interface VendorBalance {
  id: number;
  vendorId: number;
  totalEarnings: number;
  availableBalance: number;
  pendingWithdrawals: number;
  lastUpdated: string;
  vendor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface WithdrawalRequest {
  id: number;
  vendorId: number;
  amount: number;
  method: PaymentMethod;
  status: WithdrawalStatus;
  bankDetails?: BankDetails;
  mobileDetails?: MobileMoneyDetails;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
  vendor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  iban?: string;
  swiftCode?: string;
}

export interface MobileMoneyDetails {
  phoneNumber: string;
  accountHolder: string;
  provider: 'WAVE' | 'ORANGE_MONEY';
}

export interface WithdrawalRequestCreate {
  amount: number;
  method: PaymentMethod;
  bankDetails?: BankDetails;
  mobileDetails?: MobileMoneyDetails;
  notes?: string;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fees: number; // Pourcentage
}

// Constantes pour les méthodes de paiement
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'WAVE',
    name: 'Wave',
    icon: '📱',
    description: 'Transfert mobile Wave',
    minAmount: 1000,
    maxAmount: 2000000,
    processingTime: '5-15 minutes',
    fees: 0
  },
  {
    id: 'ORANGE_MONEY',
    name: 'Orange Money',
    icon: '🟠',
    description: 'Transfert mobile Orange Money',
    minAmount: 1000,
    maxAmount: 1500000,
    processingTime: '5-15 minutes',
    fees: 0
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Virement bancaire',
    icon: '🏦',
    description: 'Virement IBAN',
    minAmount: 5000,
    maxAmount: 10000000,
    processingTime: '1-3 jours ouvrables',
    fees: 0
  }
];

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  COMPLETED: 'Terminé',
  REJECTED: 'Rejeté',
  CANCELLED: 'Annulé'
};

export const WITHDRAWAL_STATUS_COLORS: Record<WithdrawalStatus, string> = {
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  PROCESSING: 'text-blue-600 bg-blue-50 border-blue-200',
  COMPLETED: 'text-green-600 bg-green-50 border-green-200',
  REJECTED: 'text-red-600 bg-red-50 border-red-200',
  CANCELLED: 'text-gray-600 bg-gray-50 border-gray-200'
};