import { API_CONFIG } from '../config/api';

const API_URL = API_CONFIG.BASE_URL;

export interface PaydunyaConfig {
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
    const response = await fetch(`${API_URL}/admin/payment-config/paydunya`, {
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
   * Bascule entre le mode test et live
   */
  static async switchMode(mode: 'test' | 'live'): Promise<any> {
    console.log('🔄 [PaymentConfigService] switchMode - Début');
    console.log('📍 URL:', `${API_URL}/admin/payment-config/switch`);
    console.log('📦 Body:', { provider: 'paydunya', mode });

    const response = await fetch(`${API_URL}/admin/payment-config/switch`, {
      method: 'POST',
      credentials: 'include', // Authentification via cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: 'paydunya', mode })
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
    const response = await fetch(`${API_URL}/admin/payment-config/paydunya`, {
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
}
