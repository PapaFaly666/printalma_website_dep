// Service de gestion des webhooks PayDunya et des mises à jour de statut
import { apiClient } from '../lib/api';
import { PaymentStatus, determinePaymentStatus, type PaymentStatusResponse } from '../types/payment';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface WebhookData {
  invoice_token: string;
  status: string;
  transaction_id?: string;
  amount_paid?: number;
  response_code?: string;
  response_text?: string;
  error_code?: string;
  cancel_reason?: string;
}

export interface OrderStatusResponse {
  success: boolean;
  message: string;
  order?: any;
}

export class PaymentWebhookService {
  private static instance: PaymentWebhookService;
  private webhookListenerActive = false;

  private constructor() {}

  static getInstance(): PaymentWebhookService {
    if (!PaymentWebhookService.instance) {
      PaymentWebhookService.instance = new PaymentWebhookService();
    }
    return PaymentWebhookService.instance;
  }

  /**
   * Traiter un webhook PayDunya
   */
  async processPaydunyaWebhook(webhookData: WebhookData): Promise<OrderStatusResponse> {
    try {
      console.log('📥 [Webhook] Traitement du webhook PayDunya:', webhookData);

      const response = await apiClient.post<OrderStatusResponse>(
        '/paydunya/webhook',
        webhookData
      );

      console.log('✅ [Webhook] Webhook traité avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Webhook] Erreur traitement webhook:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors du traitement du webhook',
      };
    }
  }

  /**
   * Vérifier le statut d'une commande via son ID
   */
  async verifyOrderStatus(orderId: number): Promise<OrderStatusResponse> {
    try {
      console.log(`🔍 [Webhook] Vérification du statut de la commande ${orderId}`);

      const response = await apiClient.get<OrderStatusResponse>(
        `/orders/${orderId}`
      );

      console.log('📊 [Webhook] Statut de la commande:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Webhook] Erreur vérification statut:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la vérification du statut',
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement via le token PayDunya
   */
  async verifyPaymentByToken(token: string): Promise<PaymentStatusResponse> {
    try {
      console.log(`🔍 [Webhook] Vérification du paiement avec token: ${token}`);

      const response = await apiClient.get<PaymentStatusResponse>(
        `/paydunya/status/${token}`
      );

      console.log('📊 [Webhook] Statut du paiement:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Webhook] Erreur vérification paiement:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la vérification du paiement',
      };
    }
  }

  /**
   * Forcer le succès d'un paiement (TEST UNIQUEMENT)
   */
  async forcePaymentSuccess(orderId: number): Promise<OrderStatusResponse> {
    if (import.meta.env.VITE_ENV === 'production') {
      console.warn('⚠️ [Webhook] Impossible de forcer le succès en production');
      return {
        success: false,
        message: 'Fonctionnalité non disponible en production',
      };
    }

    try {
      console.log(`🔧 [Webhook] Forçage du succès pour la commande ${orderId}`);

      const response = await apiClient.post<OrderStatusResponse>(
        `/orders/${orderId}/force-success`,
        {}
      );

      console.log('✅ [Webhook] Paiement forcé avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Webhook] Erreur forçage paiement:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors du forçage du paiement',
      };
    }
  }

  /**
   * Démarrer l'écoute des webhooks (mode développement)
   * En production, les webhooks sont gérés par le backend
   */
  startWebhookListener(): void {
    if (this.webhookListenerActive) {
      console.log('⚠️ [Webhook] Listener déjà actif');
      return;
    }

    console.log('🎧 [Webhook] Démarrage du listener de webhooks...');
    this.webhookListenerActive = true;

    // En mode développement, on peut simuler l'écoute des événements
    if (import.meta.env.VITE_ENV !== 'production') {
      // Créer un EventSource pour écouter les Server-Sent Events (SSE) du backend
      // Le backend peut envoyer des événements SSE pour notifier le frontend
      this.setupSSEConnection();
    }
  }

  /**
   * Arrêter l'écoute des webhooks
   */
  stopWebhookListener(): void {
    console.log('🛑 [Webhook] Arrêt du listener de webhooks');
    this.webhookListenerActive = false;
  }

  /**
   * Configuration de la connexion SSE pour les événements temps réel
   */
  private setupSSEConnection(): void {
    try {
      const eventSource = new EventSource(`${API_BASE_URL}/events/payments`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 [SSE] Événement reçu:', data);

          // Émettre un événement personnalisé pour les composants React
          window.dispatchEvent(new CustomEvent('payment-status-update', {
            detail: data
          }));
        } catch (error) {
          console.error('❌ [SSE] Erreur parsing événement:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ [SSE] Erreur connexion SSE:', error);
        eventSource.close();
      };

      // Nettoyer la connexion lors de la fermeture
      window.addEventListener('beforeunload', () => {
        eventSource.close();
      });
    } catch (error) {
      console.error('❌ [SSE] Impossible de créer la connexion SSE:', error);
    }
  }

  /**
   * Récupérer toutes les commandes en attente de paiement
   */
  async getPendingOrders(): Promise<OrderStatusResponse> {
    try {
      const response = await apiClient.get<OrderStatusResponse>(
        '/orders/pending-payments'
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ [Webhook] Erreur récupération commandes en attente:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la récupération des commandes',
      };
    }
  }

  /**
   * Synchroniser le statut d'une commande avec PayDunya
   */
  async syncOrderStatusWithPaydunya(orderId: number, token: string): Promise<OrderStatusResponse> {
    try {
      console.log(`🔄 [Webhook] Synchronisation du statut pour la commande ${orderId}`);

      // 1. Vérifier le statut sur PayDunya
      const paymentStatus = await this.verifyPaymentByToken(token);

      if (!paymentStatus.success || !paymentStatus.data) {
        throw new Error('Impossible de vérifier le statut sur PayDunya');
      }

      // 2. Déterminer le nouveau statut
      const newStatus = determinePaymentStatus(paymentStatus.data.response_code || '99');

      // 3. Mettre à jour la commande
      const response = await apiClient.patch<OrderStatusResponse>(
        `/orders/${orderId}/payment-status`,
        {
          payment_status: newStatus,
          transaction_id: paymentStatus.data.transaction_id,
          response_code: paymentStatus.data.response_code,
          response_text: paymentStatus.data.response_text,
        }
      );

      console.log('✅ [Webhook] Statut synchronisé:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Webhook] Erreur synchronisation:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de la synchronisation',
      };
    }
  }
}

// Exporter l'instance singleton
export const paymentWebhookService = PaymentWebhookService.getInstance();
