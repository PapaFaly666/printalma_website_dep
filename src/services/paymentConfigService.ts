import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export interface PaymentConfig {
  id: number;
  provider: string;
  isActive: boolean;
  activeMode: 'test' | 'live';

  // Clés TEST
  testPublicKey: string | null;
  testPrivateKey: string | null;
  testToken: string | null;
  testMasterKey: string | null;

  // Clés LIVE
  livePublicKey: string | null;
  livePrivateKey: string | null;
  liveToken: string | null;
  liveMasterKey: string | null;

  webhookSecret: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

// Alias pour la compatibilité
export type PaydunyaConfig = PaymentConfig;
export type OrangeMoneyConfig = PaymentConfig;

export interface UpdatePaydunyaKeysRequest {
  mode: 'test' | 'live';
  publicKey: string;
  privateKey: string;
  token: string;
  masterKey?: string | null;
}

export class PaymentConfigService {
  /**
   * Récupère la configuration publique de Paydunya (sans les clés sensibles)
   */
  static async getPaydunyaConfig(): Promise<PaydunyaConfig> {
    const response = await fetch(`${API_URL}/payment-config/paydunya`, {
      credentials: 'include' // Inclure les cookies
    });
    if (!response.ok) {
      throw new Error('Configuration non disponible');
    }
    return response.json();
  }

  /**
   * Récupère la configuration complète de Paydunya (admin uniquement)
   * Inclut les clés API test et live
   */
  static async getPaydunyaAdminConfig(): Promise<PaydunyaConfig> {
    const response = await fetch(`${API_URL}/admin/payment-config/PAYDUNYA`, {
      credentials: 'include', // Authentification via cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la récupération de la configuration' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  /**
   * Crée la configuration initiale de Paydunya
   */
  static async createPaydunyaConfig(
    data: UpdatePaydunyaKeysRequest
  ): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'PAYDUNYA',
        isActive: true,
        mode: data.mode,
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        token: data.token,
        masterKey: data.masterKey || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la création de la configuration' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  /**
   * Bascule entre le mode test et live
   */
  static async switchMode(mode: 'test' | 'live'): Promise<any> {
    console.log('🔄 [PaymentConfigService] switchMode - Début');
    console.log('📍 URL:', `${API_URL}/admin/payment-config/switch`);
    console.log('📦 Body:', { provider: 'PAYDUNYA', mode });

    const response = await fetch(`${API_URL}/admin/payment-config/switch`, {
      method: 'POST',
      credentials: 'include', // Authentification via cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'PAYDUNYA', mode })
    });

    console.log('📡 [PaymentConfigService] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('🔒 [PaymentConfigService] 401 Unauthorized - Session expirée');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const error = await response.json().catch(() => ({ message: 'Erreur lors du basculement de mode' }));
      console.error('❌ [PaymentConfigService] Erreur:', error);
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('✅ [PaymentConfigService] switchMode - Succès', data);
    return data;
  }

  /**
   * Met à jour les clés API pour un mode spécifique (test ou live)
   */
  static async updatePaydunyaKeys(
    data: UpdatePaydunyaKeysRequest
  ): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config/PAYDUNYA`, {
      method: 'PATCH',
      credentials: 'include', // Authentification via cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour des clés' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  /**
   * Récupère le statut du paiement à la livraison (endpoint public)
   */
  static async getCodStatus(): Promise<{ isEnabled: boolean }> {
    const response = await fetch(`${API_URL}/payment-config/cash-on-delivery`);
    if (!response.ok) return { isEnabled: true }; // Actif par défaut
    return response.json();
  }

  /**
   * Active ou désactive le paiement à la livraison (admin)
   */
  static async toggleCodStatus(isActive: boolean): Promise<{ isEnabled: boolean }> {
    const response = await fetch(`${API_URL}/admin/payment-config/cash-on-delivery/toggle`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour' }));
      throw new Error(error.message);
    }
    return response.json();
  }

  /**
   * Active ou désactive Paydunya
   */
  static async togglePaydunyaStatus(isActive: boolean): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config/paydunya/toggle`, {
      method: 'POST',
      credentials: 'include', // Authentification via cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors du changement de statut' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  // ================== ORANGE MONEY ==================

  /**
   * Récupère la configuration complète d'Orange Money (admin uniquement)
   */
  static async getOrangeMoneyAdminConfig(): Promise<OrangeMoneyConfig> {
    const response = await fetch(`${API_URL}/admin/payment-config/ORANGE_MONEY`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Configuration Orange Money non disponible' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  /**
   * Crée la configuration initiale d'Orange Money
   */
  static async createOrangeMoneyConfig(data: {
    mode: 'test' | 'live';
    clientId: string;
    clientSecret: string;
    merchantCode: string;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'ORANGE_MONEY',
        isActive: true,
        mode: data.mode,
        publicKey: data.clientId,
        privateKey: data.clientSecret,
        token: data.merchantCode
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la création de la configuration Orange Money' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  /**
   * Met à jour les clés Orange Money pour un mode spécifique
   */
  static async updateOrangeMoneyKeys(data: {
    mode: 'test' | 'live';
    clientId: string;
    clientSecret: string;
    merchantCode: string;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config/ORANGE_MONEY`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: data.mode,
        publicKey: data.clientId,
        privateKey: data.clientSecret,
        token: data.merchantCode
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour des clés Orange Money' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  /**
   * Bascule entre le mode test et live pour Orange Money
   */
  static async switchOrangeMoneyMode(mode: 'test' | 'live'): Promise<any> {
    console.log('🔄 [PaymentConfigService] switchOrangeMoneyMode - Début');
    console.log('📍 URL:', `${API_URL}/admin/payment-config/switch`);
    console.log('📦 Body:', { provider: 'ORANGE_MONEY', mode });

    const response = await fetch(`${API_URL}/admin/payment-config/switch`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'ORANGE_MONEY', mode })
    });

    console.log('📡 [PaymentConfigService] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('🔒 [PaymentConfigService] 401 Unauthorized - Session expirée');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const error = await response.json().catch(() => ({ message: 'Erreur lors du basculement de mode Orange Money' }));
      console.error('❌ [PaymentConfigService] Erreur:', error);
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('✅ [PaymentConfigService] switchOrangeMoneyMode - Succès', data);
    return data;
  }

  /**
   * Active ou désactive Orange Money
   */
  static async toggleOrangeMoneyStatus(isActive: boolean): Promise<any> {
    const response = await fetch(`${API_URL}/admin/payment-config/ORANGE_MONEY`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors du changement de statut Orange Money' }));
      throw new Error(error.message);
    }

    return response.json();
  }
}
