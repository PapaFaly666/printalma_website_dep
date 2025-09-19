/**
 * 🔄 Service de réactivation de compte vendeur
 * Basé sur VENDOR_ACCOUNT_STATUS_GUIDE.md
 */

interface ReactivationResult {
  success: boolean;
  message: string;
  data?: {
    id: number;
    status: boolean;
    statusChangedAt: string;
  };
}

class VendorReactivationService {
  private apiUrl: string;

  constructor(apiUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com') {
    this.apiUrl = apiUrl;
  }

  /**
   * 🟢 Réactiver le compte vendeur
   */
  async reactivateAccount(reason = 'Réactivation depuis l\'interface'): Promise<ReactivationResult> {
    try {
      console.log('🔄 Tentative de réactivation...', { reason });

      const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: true,
          reason: reason
        })
      });

      console.log('📡 Réponse réactivation:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur réactivation:', { status: response.status, errorData });
        throw new Error(`Erreur ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ Compte réactivé avec succès:', result);
      return result;

    } catch (error) {
      console.error('❌ Erreur réactivation:', error);
      throw error;
    }
  }

  /**
   * 🔴 Désactiver le compte vendeur
   */
  async deactivateAccount(reason = 'Désactivation depuis l\'interface'): Promise<ReactivationResult> {
    try {
      console.log('🔄 Tentative de désactivation...', { reason });

      const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: false,
          reason: reason
        })
      });

      console.log('📡 Réponse désactivation:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur désactivation:', { status: response.status, errorData });
        throw new Error(`Erreur ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ Compte désactivé avec succès:', result);
      return result;

    } catch (error) {
      console.error('❌ Erreur désactivation:', error);
      throw error;
    }
  }

  /**
   * 📊 Vérifier le statut du compte
   * Utilise l'endpoint /auth/profile comme fallback si /vendor/account/info n'existe pas
   */
  async checkAccountStatus(): Promise<{
    isActive: boolean;
    lastStatusChange?: string;
    reason?: string;
  }> {
    try {
      // Essayer d'abord l'endpoint spécialisé
      const response = await fetch(`${this.apiUrl}/vendor/account/info`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        return {
          isActive: result.data?.status ?? true,
          lastStatusChange: result.data?.statusChangedAt,
          reason: result.data?.lastStatusReason
        };
      }

      // Fallback sur /auth/profile si l'endpoint spécialisé n'existe pas
      console.warn('📡 Endpoint /vendor/account/info non disponible, utilisation de /auth/profile');
      const profileResponse = await fetch(`${this.apiUrl}/auth/profile`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!profileResponse.ok) {
        throw new Error(`HTTP ${profileResponse.status}`);
      }

      const profileResult = await profileResponse.json();
      return {
        isActive: profileResult.data?.is_active ?? profileResult.data?.status ?? true,
        lastStatusChange: undefined,
        reason: undefined
      };

    } catch (error) {
      console.error('❌ Erreur vérification statut:', error);
      // Par défaut, considérer le compte comme actif en cas d'erreur
      return { isActive: true };
    }
  }
}

// Instance globale
export const vendorReactivation = new VendorReactivationService();
export default VendorReactivationService;