// Hook React pour le polling intelligent des statuts de paiement
import { useState, useEffect, useCallback, useRef } from 'react';
import { paymentPollingService, type PollingConfig } from '../services/paymentPollingService';
import { paymentStatusService } from '../services/paymentStatusService';
import { PaymentStatus } from '../types/payment';

export interface UsePaymentPollingOptions {
  orderId: number;
  autoStart?: boolean; // Démarrer automatiquement le polling
  onSuccess?: (order: any) => void; // Callback quand le paiement réussit
  onFailure?: (order: any) => void; // Callback quand le paiement échoue
  onCancelled?: (order: any) => void; // Callback quand le paiement est annulé
  pollingConfig?: Partial<PollingConfig>; // Configuration personnalisée du polling
}

export interface UsePaymentPollingReturn {
  order: any | null;
  isPolling: boolean;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  progress: number;
  startPolling: () => void;
  stopPolling: () => void;
  retryPolling: () => void;
}

export function usePaymentPolling({
  orderId,
  autoStart = true,
  onSuccess,
  onFailure,
  onCancelled,
  pollingConfig = {},
}: UsePaymentPollingOptions): UsePaymentPollingReturn {
  const [order, setOrder] = useState<any | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(60);
  const [progress, setProgress] = useState(0);

  // Utiliser useRef pour éviter les re-renders inutiles
  const callbacksRef = useRef({ onSuccess, onFailure, onCancelled });

  // Mettre à jour les callbacks
  useEffect(() => {
    callbacksRef.current = { onSuccess, onFailure, onCancelled };
  }, [onSuccess, onFailure, onCancelled]);

  // Callback appelé à chaque changement de statut
  const handleStatusChange = useCallback((updatedOrder: any) => {
    console.log('📊 [usePaymentPolling] Mise à jour du statut:', updatedOrder.paymentStatus);
    setOrder(updatedOrder);

    // Mettre à jour les statistiques
    const stats = paymentPollingService.getPollingStats(orderId);
    if (stats.isActive) {
      setAttempts(stats.attempts || 0);
      setMaxAttempts(stats.maxAttempts || 60);
      setProgress(stats.progress || 0);
    }
  }, [orderId]);

  // Callback appelé quand le polling se termine
  const handleComplete = useCallback((finalOrder: any) => {
    console.log('✅ [usePaymentPolling] Polling terminé:', finalOrder.paymentStatus);
    setOrder(finalOrder);
    setIsPolling(false);

    // Appeler les callbacks appropriés selon le statut
    const { onSuccess, onFailure, onCancelled } = callbacksRef.current;

    switch (finalOrder.paymentStatus) {
      case PaymentStatus.PAID:
        if (onSuccess) {
          onSuccess(finalOrder);
        }
        break;

      case PaymentStatus.FAILED:
      case PaymentStatus.INSUFFICIENT_FUNDS:
        if (onFailure) {
          onFailure(finalOrder);
        }
        break;

      case PaymentStatus.CANCELLED:
        if (onCancelled) {
          onCancelled(finalOrder);
        }
        break;
    }
  }, []);

  // Callback appelé en cas d'erreur
  const handleError = useCallback((err: Error) => {
    console.error('❌ [usePaymentPolling] Erreur:', err);
    setError(err.message);
  }, []);

  // Démarrer le polling
  const startPolling = useCallback(() => {
    if (!orderId) {
      console.warn('⚠️ [usePaymentPolling] OrderId manquant');
      return;
    }

    if (isPolling) {
      console.warn('⚠️ [usePaymentPolling] Polling déjà actif');
      return;
    }

    console.log('🚀 [usePaymentPolling] Démarrage du polling pour la commande', orderId);
    setIsPolling(true);
    setError(null);
    setAttempts(0);
    setProgress(0);

    // Configuration complète du polling
    const config: Partial<PollingConfig> = {
      interval: 3000, // 3 secondes
      maxAttempts: 60, // 3 minutes
      backoffMultiplier: 1.2,
      ...pollingConfig,
      onStatusChange: handleStatusChange,
      onComplete: handleComplete,
      onError: handleError,
    };

    paymentPollingService.startPolling(orderId, config);
  }, [orderId, isPolling, pollingConfig, handleStatusChange, handleComplete, handleError]);

  // Arrêter le polling
  const stopPolling = useCallback(() => {
    console.log('🛑 [usePaymentPolling] Arrêt du polling');
    paymentPollingService.stopPolling(orderId);
    setIsPolling(false);
  }, [orderId]);

  // Réessayer le polling
  const retryPolling = useCallback(() => {
    console.log('🔄 [usePaymentPolling] Réessai du polling');
    stopPolling();
    setTimeout(() => {
      startPolling();
    }, 500);
  }, [stopPolling, startPolling]);

  // Démarrage automatique si autoStart est true
  useEffect(() => {
    if (autoStart && orderId) {
      startPolling();
    }

    // Nettoyer le polling au démontage du composant
    return () => {
      if (orderId && paymentPollingService.isPolling(orderId)) {
        console.log('🧹 [usePaymentPolling] Nettoyage du polling au démontage');
        paymentPollingService.stopPolling(orderId);
      }
    };
  }, []); // Dépendances vides pour exécuter seulement au montage/démontage

  // Synchroniser l'état isPolling avec le service
  useEffect(() => {
    const checkPollingStatus = () => {
      const isActive = paymentPollingService.isPolling(orderId);
      if (isActive !== isPolling) {
        setIsPolling(isActive);
      }
    };

    // Vérifier toutes les secondes
    const interval = setInterval(checkPollingStatus, 1000);

    return () => clearInterval(interval);
  }, [orderId, isPolling]);

  return {
    order,
    isPolling,
    error,
    attempts,
    maxAttempts,
    progress,
    startPolling,
    stopPolling,
    retryPolling,
  };
}
