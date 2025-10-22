/**
 * 🚨 Service de gestion des erreurs vendeur avec diagnostic précis
 * Basé sur VENDOR_ACCOUNT_STATUS_GUIDE.md
 */

interface DiagnosisResult {
  error?: string;
  accessLevel?: string;
  message: string;
  action: string;
  httpStatus?: number;
  userId?: number;
  userEmail?: string;
}

interface RecommendedAction {
  type: string;
  title: string;
  message: string;
  primaryAction?: string;
  primaryUrl?: string;
  secondaryAction?: string;
  secondaryUrl?: string;
  showReactivationForm: boolean;
  userId?: number;
  userEmail?: string;
}

class VendorErrorHandler {
  private apiUrl: string;

  constructor(apiUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com') {
    this.apiUrl = apiUrl;
  }

  /**
   * 🔍 Diagnostiquer le problème d'accès
   */
  async diagnoseAccessError(): Promise<DiagnosisResult> {
    try {
      const response = await fetch(`${this.apiUrl}/vendor/account/status-check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token JWT invalide ou expiré
        return {
          error: 'SESSION_EXPIRED',
          message: 'Votre session a expiré. Veuillez vous reconnecter.',
          action: 'REDIRECT_TO_LOGIN',
          httpStatus: 401
        };
      }

      if (response.ok) {
        const data = await response.json();
        return data.data; // Contient accessLevel, message, action
      }

      // Autre erreur
      throw new Error(`HTTP ${response.status}`);

    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);

      // Si même le diagnostic échoue, c'est probablement un problème de réseau/session
      return {
        error: 'SESSION_EXPIRED',
        message: 'Impossible de vérifier votre statut. Veuillez vous reconnecter.',
        action: 'REDIRECT_TO_LOGIN',
        httpStatus: 401
      };
    }
  }

  /**
   * 🎯 Gérer les erreurs d'accès automatiquement
   */
  async handleAccessError(originalError: any): Promise<RecommendedAction> {
    console.log('🚨 Erreur d\'accès détectée:', originalError);

    // Diagnostiquer le problème
    const diagnosis = await this.diagnoseAccessError();
    console.log('🔍 Diagnostic:', diagnosis);

    // Retourner l'action recommandée
    return this.getRecommendedAction(diagnosis);
  }

  /**
   * 📋 Déterminer l'action à prendre
   */
  getRecommendedAction(diagnosis: DiagnosisResult): RecommendedAction {
    switch (diagnosis.accessLevel || diagnosis.error) {
      case 'SESSION_EXPIRED':
        return {
          type: 'REDIRECT_TO_LOGIN',
          title: 'Session expirée',
          message: diagnosis.message,
          primaryAction: 'Se reconnecter',
          primaryUrl: '/login',
          showReactivationForm: false
        };

      case 'ACCOUNT_DEACTIVATED':
        return {
          type: 'SHOW_REACTIVATION_FORM',
          title: 'Compte désactivé',
          message: diagnosis.message,
          primaryAction: 'Réactiver mon compte',
          secondaryAction: 'Se déconnecter',
          secondaryUrl: '/auth/logout',
          showReactivationForm: true,
          userId: diagnosis.userId,
          userEmail: diagnosis.userEmail
        };

      case 'INSUFFICIENT_ROLE':
        return {
          type: 'CONTACT_ADMIN',
          title: 'Accès non autorisé',
          message: diagnosis.message,
          primaryAction: 'Contacter le support',
          primaryUrl: '/contact',
          showReactivationForm: false
        };

      case 'CAN_ACCESS':
        return {
          type: 'CONTINUE',
          title: 'Accès autorisé',
          message: 'Votre compte fonctionne normalement.',
          showReactivationForm: false
        };

      default:
        return {
          type: 'UNKNOWN_ERROR',
          title: 'Erreur inconnue',
          message: 'Une erreur inattendue s\'est produite.',
          primaryAction: 'Rafraîchir la page',
          showReactivationForm: false
        };
    }
  }

  /**
   * 🔄 Intercepteur pour les appels API
   */
  async interceptApiCall<T>(apiCallFunction: () => Promise<T>): Promise<T> {
    try {
      return await apiCallFunction();
    } catch (error: any) {
      // Si c'est une erreur 401/403, diagnostiquer
      if (error.status === 401 || error.status === 403) {
        const action = await this.handleAccessError(error);

        // Retourner l'erreur avec l'action recommandée
        throw {
          ...error,
          vendorAction: action
        };
      }

      // Autres erreurs passent tel quel
      throw error;
    }
  }
}

// Instance globale
export const vendorErrorHandler = new VendorErrorHandler();
export default VendorErrorHandler;