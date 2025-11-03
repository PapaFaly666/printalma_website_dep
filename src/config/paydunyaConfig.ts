// Configuration PayDunya pour le développement et la production
// Basée sur la documentation officielle PayDunya

// Fonction pour détecter si nous sommes en développement local
const isLocalDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '0.0.0.0';
};

// Configuration des URLs PayDunya selon l'environnement
export const PAYDUNYA_CONFIG = {
  // Configuration API PayDunya
  get API_BASE_URL(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:3004';
  },

  // URLs de callback pour PayDunya
  get CALLBACK_URL(): string {
    if (isLocalDevelopment()) {
      // En développement local, utiliser l'URL locale
      return `${this.API_BASE_URL}/paydunya/callback`;
    } else {
      // En production, utiliser le domaine réel
      return `${window.location.origin}/api/paydunya/callback`;
    }
  },

  get RETURN_URL(): string {
    if (isLocalDevelopment()) {
      return `${window.location.origin}/payment/success`;
    } else {
      return `${window.location.origin}/payment/success`;
    }
  },

  get CANCEL_URL(): string {
    if (isLocalDevelopment()) {
      return `${window.location.origin}/payment/cancel`;
    } else {
      return `${window.location.origin}/payment/cancel`;
    }
  },

  // Configuration pour le frontend
  FRONTEND_SUCCESS_URL: `${window.location.origin}/payment/success`,
  FRONTEND_CANCEL_URL: `${window.location.origin}/payment/cancel`,

  // Mode d'environnement PayDunya
  MODE: import.meta.env.VITE_PAYDUNYA_MODE || 'test', // 'test' ou 'live'

  // Clés API (chargées depuis les variables d'environnement)
  get MASTER_KEY(): string {
    return import.meta.env.VITE_PAYDUNYA_MASTER_KEY || '';
  },

  get PRIVATE_KEY(): string {
    return import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY || '';
  },

  get PUBLIC_KEY(): string {
    return import.meta.env.VITE_PAYDUNYA_PUBLIC_KEY || '';
  },

  get TOKEN(): string {
    return import.meta.env.VITE_PAYDUNYA_TOKEN || '';
  },

  // Validation de la configuration
  isConfigured(): boolean {
    return !!(this.MASTER_KEY && this.PRIVATE_KEY && this.PUBLIC_KEY && this.TOKEN);
  },

  // Obtenir la configuration complète pour le debug
  getConfigSummary() {
    return {
      mode: this.MODE,
      hasMasterKey: !!this.MASTER_KEY,
      hasPrivateKey: !!this.PRIVATE_KEY,
      hasPublicKey: !!this.PUBLIC_KEY,
      hasToken: !!this.TOKEN,
      isConfigured: this.isConfigured(),
      apiBaseUrl: this.API_BASE_URL,
      callbackUrl: this.CALLBACK_URL,
      returnUrl: this.RETURN_URL,
      cancelUrl: this.CANCEL_URL,
    };
  }
};

// Types pour les paiements PayDunya
export interface PayDunyaInvoiceData {
  total_amount: number;
  description: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  taxes?: Array<{
    name: string;
    amount: number;
  }>;
}

export interface PayDunyaCustomerData {
  name: string;
  email?: string;
  phone: string;
  address?: {
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string;
  };
}

export interface PayDunyaStoreData {
  name: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
  contact_url?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface PayDunyaCustomData {
  [key: string]: any;
}

export interface PayDunyaActionsData {
  callback_url?: string;
  return_url?: string;
  cancel_url?: string;
}

export interface PayDunyaPaymentRequest {
  invoice: PayDunyaInvoiceData;
  store: PayDunyaStoreData;
  customer: PayDunyaCustomerData;
  custom_data?: PayDunyaCustomData;
  actions?: PayDunyaActionsData;
}

export interface PayDunyaPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    redirect_url: string;
    invoice?: {
      token: string;
      total_amount: number;
      status: string;
    };
  };
  error?: string;
}

export interface PayDunyaPaymentStatus {
  success: boolean;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  payment?: {
    token: string;
    status: string;
    method: string;
    provider: string;
    amount: number;
    fees: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  invoice?: {
    token: string;
    total_amount: number;
    description: string;
    status: string;
    items: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  };
}

// Instructions de configuration
export const PAYDUNYA_INSTRUCTIONS = {
  environment: `
# Configuration PayDunya requise dans votre .env.local:

# Mode de paiement (test/live)
VITE_PAYDUNYA_MODE=test

# Clés API PayDunya (obtenues depuis votre dashboard PayDunya)
VITE_PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"
VITE_PAYDUNYA_PRIVATE_KEY="test_private_uImFqxfqokHqbqHI4PXJ24huucO"
VITE_PAYDUNYA_PUBLIC_KEY="test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt"
VITE_PAYDUNYA_TOKEN="BuVS3uuAKsg9bYyGcT9B"

# URLs de callback (optionnelles - valeurs par défaut utilisées)
VITE_PAYDUNYA_CALLBACK_URL="http://localhost:3004/paydunya/callback"
VITE_PAYDUNYA_RETURN_URL="http://localhost:3001/payment/success"
VITE_PAYDUNYA_CANCEL_URL="http://localhost:3001/payment/cancel"
`,

  testing: `
# Tester la configuration PayDunya:
curl http://localhost:3004/paydunya/test-config

# Tester l'initialisation de paiement:
curl -X POST http://localhost:3004/paydunya/payment \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice": {
      "total_amount": 1000,
      "description": "Test Order #001"
    },
    "store": {
      "name": "Test Store"
    },
    "customer": {
      "name": "Test User",
      "phone": "+221701234567"
    }
  }'
`,

  production: `
# Pour passer en production:
# 1. Mettre à jour VITE_PAYDUNYA_MODE=live
# 2. Utiliser les clés API live de PayDunya
# 3. Configurer les URLs HTTPS dans le dashboard PayDunya
# 4. Ajouter le webhook: https://votre-domaine.com/api/paydunya/callback
`
};

export default PAYDUNYA_CONFIG;