// Service de polling intelligent pour les mises à jour de statut de paiement
import { paymentWebhookService } from './paymentWebhookService';
import { paymentStatusService } from './paymentStatusService';

export interface PollingConfig {
  interval: number; // Intervalle initial en millisecondes
  maxAttempts: number; // Nombre maximum de tentatives
  backoffMultiplier: number; // Multiplicateur pour l'augmentation de l'intervalle
  onStatusChange?: (order: any) => void; // Callback appelé quand le statut change
  onComplete?: (order: any) => void; // Callback appelé quand le polling se termine
  onError?: (error: Error) => void; // Callback appelé en cas d'erreur
}

export class PaymentPollingService {
  private static instance: PaymentPollingService;
  private activePollers = new Map<number, {
    timeoutId: NodeJS.Timeout;
    attempts: number;
    config: PollingConfig;
  }>();

  private constructor() {}

  static getInstance(): PaymentPollingService {
    if (!PaymentPollingService.instance) {
      PaymentPollingService.instance = new PaymentPollingService();
    }
    return PaymentPollingService.instance;
  }

  /**
   * Démarre le polling pour une commande avec configuration personnalisée
   */
  startPolling(
    orderId: number,
    config: Partial<PollingConfig> = {}
  ): void {
    // Configuration par défaut
    const defaultConfig: PollingConfig = {
      interval: 3000, // 3 secondes
      maxAttempts: 60, // 3 minutes au total
      backoffMultiplier: 1.2, // Augmentation de 20% à chaque tentative
    };

    const finalConfig: PollingConfig = { ...defaultConfig, ...config };

    // Vérifier si un polling est déjà actif pour cette commande
    if (this.activePollers.has(orderId)) {
      console.warn(`⚠️ [Polling] Un polling est déjà actif pour la commande ${orderId}`);
      return;
    }

    console.log(`🔄 [Polling] Démarrage du polling pour la commande ${orderId}`, {
      interval: finalConfig.interval,
      maxAttempts: finalConfig.maxAttempts,
    });

    // Initialiser le polling
    this.activePollers.set(orderId, {
      timeoutId: null as any,
      attempts: 0,
      config: finalConfig,
    });

    // Démarrer immédiatement la première vérification
    this.poll(orderId);
  }

  /**
   * Effectue une vérification du statut
   */
  private async poll(orderId: number): Promise<void> {
    const pollerData = this.activePollers.get(orderId);
    if (!pollerData) {
      console.warn(`⚠️ [Polling] Aucun poller trouvé pour la commande ${orderId}`);
      return;
    }

    const { attempts, config } = pollerData;
    pollerData.attempts++;

    console.log(`🔍 [Polling] Vérification ${pollerData.attempts}/${config.maxAttempts} pour la commande ${orderId}`);

    try {
      // Vérifier le statut de la commande
      const response = await paymentWebhookService.verifyOrderStatus(orderId);

      if (response.success && response.order) {
        const order = response.order;
        const currentStatus = order.paymentStatus;

        console.log(`📊 [Polling] Statut actuel: ${currentStatus}`);

        // Appeler le callback onStatusChange si fourni
        if (config.onStatusChange) {
          config.onStatusChange(order);
        }

        // Vérifier si le paiement est dans un état final
        const finalStatuses = ['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];
        if (finalStatuses.includes(currentStatus)) {
          console.log(`✅ [Polling] Statut final atteint: ${currentStatus}`);

          // Appeler le callback onComplete
          if (config.onComplete) {
            config.onComplete(order);
          }

          // Arrêter le polling
          this.stopPolling(orderId);
          return;
        }

        // Si le statut est toujours en attente, continuer le polling
        if (currentStatus === 'PENDING' || currentStatus === 'PROCESSING') {
          this.scheduleNextPoll(orderId);
        }
      } else {
        console.error(`❌ [Polling] Erreur lors de la vérification: ${response.message}`);
        this.scheduleNextPoll(orderId);
      }
    } catch (error: any) {
      console.error(`❌ [Polling] Exception lors de la vérification:`, error);

      // Appeler le callback onError si fourni
      if (config.onError) {
        config.onError(error);
      }

      // Continuer le polling malgré l'erreur
      this.scheduleNextPoll(orderId);
    }
  }

  /**
   * Planifie la prochaine vérification avec backoff exponentiel
   */
  private scheduleNextPoll(orderId: number): void {
    const pollerData = this.activePollers.get(orderId);
    if (!pollerData) return;

    const { attempts, config } = pollerData;

    // Vérifier si on a atteint le nombre maximum de tentatives
    if (attempts >= config.maxAttempts) {
      console.warn(`⚠️ [Polling] Nombre maximum de tentatives atteint pour la commande ${orderId}`);

      // Nettoyer le localStorage si nécessaire
      const pendingPayment = paymentStatusService.getPendingPayment();
      if (pendingPayment && pendingPayment.orderId === orderId) {
        console.log(`🗑️ [Polling] Nettoyage du paiement en attente`);
        paymentStatusService.clearPendingPayment();
      }

      this.stopPolling(orderId);
      return;
    }

    // Calculer le prochain intervalle avec backoff exponentiel
    const baseInterval = config.interval;
    const backoffFactor = Math.pow(config.backoffMultiplier, attempts - 1);
    const nextInterval = Math.min(baseInterval * backoffFactor, 30000); // Maximum 30 secondes

    console.log(`⏰ [Polling] Prochaine vérification dans ${Math.round(nextInterval / 1000)}s`);

    // Planifier la prochaine vérification
    const timeoutId = setTimeout(() => {
      this.poll(orderId);
    }, nextInterval);

    pollerData.timeoutId = timeoutId;
  }

  /**
   * Arrête le polling pour une commande
   */
  stopPolling(orderId: number): void {
    const pollerData = this.activePollers.get(orderId);
    if (!pollerData) {
      console.warn(`⚠️ [Polling] Aucun polling actif pour la commande ${orderId}`);
      return;
    }

    console.log(`🛑 [Polling] Arrêt du polling pour la commande ${orderId}`);

    // Annuler le timeout
    if (pollerData.timeoutId) {
      clearTimeout(pollerData.timeoutId);
    }

    // Supprimer le poller de la map
    this.activePollers.delete(orderId);
  }

  /**
   * Arrête tous les pollings actifs
   */
  stopAllPolling(): void {
    console.log(`🛑 [Polling] Arrêt de tous les pollings (${this.activePollers.size} actifs)`);

    this.activePollers.forEach((pollerData, orderId) => {
      if (pollerData.timeoutId) {
        clearTimeout(pollerData.timeoutId);
      }
    });

    this.activePollers.clear();
  }

  /**
   * Vérifie si un polling est actif pour une commande
   */
  isPolling(orderId: number): boolean {
    return this.activePollers.has(orderId);
  }

  /**
   * Obtient les statistiques d'un polling actif
   */
  getPollingStats(orderId: number): {
    isActive: boolean;
    attempts?: number;
    maxAttempts?: number;
    progress?: number;
  } {
    const pollerData = this.activePollers.get(orderId);

    if (!pollerData) {
      return { isActive: false };
    }

    const progress = (pollerData.attempts / pollerData.config.maxAttempts) * 100;

    return {
      isActive: true,
      attempts: pollerData.attempts,
      maxAttempts: pollerData.config.maxAttempts,
      progress: Math.round(progress),
    };
  }

  /**
   * Obtient la liste de toutes les commandes en cours de polling
   */
  getActivePollings(): number[] {
    return Array.from(this.activePollers.keys());
  }
}

// Exporter l'instance singleton
export const paymentPollingService = PaymentPollingService.getInstance();
