// Service pour la vérification et la gestion des statuts de paiement PayDunya
import { apiClient } from '../lib/api';
import {
  PaymentStatus,
  PaymentStatusResponse,
  determinePaymentStatus,
  type PaymentResult,
  type PendingPaymentInfo
} from '../types/payment';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export class PaymentStatusService {
  /**
   * Vérifier le statut d'un paiement PayDunya via le token
   */
  async checkPaymentStatus(token: string): Promise<PaymentResult> {
    try {
      console.log('🔍 [PaymentStatus] Vérification du statut pour token:', token);

      const response = await apiClient.get<PaymentStatusResponse>(
        `/paydunya/status/${token}`
      );

      const data = response.data;
      console.log('📊 [PaymentStatus] Réponse du serveur:', data);

      if (!data.success || !data.data) {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          message: data.message || 'Impossible de vérifier le statut du paiement',
        };
      }

      // IMPORTANT: Le vrai statut du paiement est dans data.data.status (pending, completed, cancelled, etc.)
      // response_code "00" signifie seulement "Transaction Found", pas "Transaction Paid"
      let status: PaymentStatus;

      const paymentStatus = data.data.status?.toLowerCase();

      if (paymentStatus === 'completed' || paymentStatus === 'paid') {
        status = PaymentStatus.PAID;
      } else if (paymentStatus === 'cancelled') {
        status = PaymentStatus.CANCELLED;
      } else if (paymentStatus === 'failed') {
        status = PaymentStatus.FAILED;
      } else if (paymentStatus === 'pending') {
        status = PaymentStatus.PENDING;
      } else {
        // Fallback sur l'ancien système si le statut n'est pas reconnu
        status = data.data.response_code
          ? determinePaymentStatus(data.data.response_code)
          : PaymentStatus.PENDING;
      }

      console.log(`🔍 [PaymentStatus] Statut déterminé: ${status} (depuis data.status: ${paymentStatus})`);

      // Extraire le fail_reason depuis les différents endroits possibles dans la réponse PayDunya
      const failReason = data.data.fail_reason
        || data.data.invoice?.fail_reason
        || data.data.cancel_reason
        || undefined;

      if (failReason) {
        console.warn(`⚠️ [PaymentStatus] Raison d'échec PayDunya: ${failReason}`);
      }

      return {
        success: true,
        status,
        message: data.data.response_text || data.message,
        transaction_id: data.data.transaction_id,
        response_code: data.data.response_code,
        response_text: data.data.response_text,
        failure_reason: failReason,
      };
    } catch (error: any) {
      console.error('❌ [PaymentStatus] Erreur vérification statut:', error);

      return {
        success: false,
        status: PaymentStatus.FAILED,
        message: error.response?.data?.message || error.message || 'Erreur lors de la vérification du paiement',
        failure_reason: error.message,
      };
    }
  }

  /**
   * Polling du statut de paiement avec tentatives multiples
   */
  async pollPaymentStatus(
    token: string,
    maxAttempts: number = 10,
    intervalMs: number = 3000
  ): Promise<PaymentResult> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      console.log(`🔄 [PaymentStatus] Tentative ${attempts + 1}/${maxAttempts}`);

      const result = await this.checkPaymentStatus(token);

      // Si le paiement est finalisé (succès ou échec), retourner le résultat
      if (
        result.status === PaymentStatus.PAID ||
        result.status === PaymentStatus.FAILED ||
        result.status === PaymentStatus.CANCELLED ||
        result.status === PaymentStatus.INSUFFICIENT_FUNDS
      ) {
        console.log('✅ [PaymentStatus] Statut final:', result.status);
        return result;
      }

      // Sinon, attendre avant la prochaine tentative
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`⏳ [PaymentStatus] Attente de ${intervalMs}ms avant la prochaine tentative...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // Si toutes les tentatives ont échoué, retourner un statut en attente
    console.warn('⚠️ [PaymentStatus] Nombre maximum de tentatives atteint');
    return {
      success: false,
      status: PaymentStatus.PENDING,
      message: 'Le statut du paiement est toujours en attente. Veuillez réessayer dans quelques instants.',
    };
  }

  /**
   * Sauvegarder les informations de paiement en attente dans localStorage
   */
  savePendingPayment(paymentInfo: PendingPaymentInfo): void {
    try {
      localStorage.setItem('paydunyaPendingPayment', JSON.stringify(paymentInfo));
      console.log('💾 [PaymentStatus] Informations de paiement sauvegardées:', paymentInfo);
    } catch (error) {
      console.error('❌ [PaymentStatus] Erreur sauvegarde paiement en attente:', error);
    }
  }

  /**
   * Récupérer les informations de paiement en attente depuis localStorage
   */
  getPendingPayment(): PendingPaymentInfo | null {
    try {
      const data = localStorage.getItem('paydunyaPendingPayment');
      if (!data) return null;

      const paymentInfo: PendingPaymentInfo = JSON.parse(data);

      // Vérifier si le paiement n'est pas trop ancien (24 heures)
      const isExpired = Date.now() - paymentInfo.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        console.warn('⚠️ [PaymentStatus] Paiement en attente expiré');
        this.clearPendingPayment();
        return null;
      }

      return paymentInfo;
    } catch (error) {
      console.error('❌ [PaymentStatus] Erreur récupération paiement en attente:', error);
      return null;
    }
  }

  /**
   * Effacer les informations de paiement en attente
   */
  clearPendingPayment(): void {
    try {
      localStorage.removeItem('paydunyaPendingPayment');
      console.log('🗑️ [PaymentStatus] Informations de paiement en attente supprimées');
    } catch (error) {
      console.error('❌ [PaymentStatus] Erreur suppression paiement en attente:', error);
    }
  }

  /**
   * Mettre à jour le statut de paiement d'une commande côté backend
   */
  async updateOrderPaymentStatus(
    orderId: number,
    paymentData: {
      payment_status: string;
      transaction_id?: string;
      payment_failure_reason?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 [PaymentStatus] Mise à jour du statut de paiement:', { orderId, paymentData });

      const response = await apiClient.patch(
        `/orders/${orderId}/payment-status`,
        paymentData
      );

      console.log('✅ [PaymentStatus] Statut de paiement mis à jour:', response.data);
      return {
        success: true,
        message: 'Statut de paiement mis à jour avec succès',
      };
    } catch (error: any) {
      console.error('❌ [PaymentStatus] Erreur mise à jour statut:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la mise à jour du statut',
      };
    }
  }

  /**
   * Obtenir un message utilisateur convivial basé sur le statut
   */
  getStatusMessage(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Paiement réussi ! Votre commande a été confirmée.';
      case PaymentStatus.PROCESSING:
        return 'Votre paiement est en cours de traitement. Veuillez patienter...';
      case PaymentStatus.PENDING:
        return 'Votre paiement est en attente de confirmation.';
      case PaymentStatus.FAILED:
        return 'Le paiement a échoué. Veuillez réessayer.';
      case PaymentStatus.INSUFFICIENT_FUNDS:
        return 'Fonds insuffisants. Veuillez vérifier votre solde et réessayer.';
      case PaymentStatus.CANCELLED:
        return 'Le paiement a été annulé.';
      case PaymentStatus.REFUNDED:
        return 'Le paiement a été remboursé.';
      default:
        return 'Statut du paiement inconnu.';
    }
  }

  /**
   * Obtenir la couleur d'affichage basée sur le statut
   */
  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID:
        return 'green';
      case PaymentStatus.PROCESSING:
      case PaymentStatus.PENDING:
        return 'orange';
      case PaymentStatus.FAILED:
      case PaymentStatus.INSUFFICIENT_FUNDS:
        return 'red';
      case PaymentStatus.CANCELLED:
        return 'gray';
      case PaymentStatus.REFUNDED:
        return 'blue';
      default:
        return 'gray';
    }
  }

  /**
   * Obtenir l'icône basée sur le statut
   */
  getStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID:
        return '✅';
      case PaymentStatus.PROCESSING:
        return '⏳';
      case PaymentStatus.PENDING:
        return '🕐';
      case PaymentStatus.FAILED:
        return '❌';
      case PaymentStatus.INSUFFICIENT_FUNDS:
        return '⚠️';
      case PaymentStatus.CANCELLED:
        return '🚫';
      case PaymentStatus.REFUNDED:
        return '💰';
      default:
        return '❓';
    }
  }
}

// Exporter l'instance du service
export const paymentStatusService = new PaymentStatusService();
