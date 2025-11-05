// Composant de suivi de paiement avec polling automatique
import React from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { usePaymentPolling } from '../../hooks/usePaymentPolling';
import { PaymentStatus } from '../../types/payment';
import { paymentStatusService } from '../../services/paymentStatusService';

interface PaymentTrackerProps {
  orderId: number;
  onPaymentSuccess?: (order: any) => void;
  onPaymentFailure?: (order: any) => void;
  onPaymentCancelled?: (order: any) => void;
  autoStart?: boolean;
  showDetails?: boolean;
}

export function PaymentTracker({
  orderId,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentCancelled,
  autoStart = true,
  showDetails = true,
}: PaymentTrackerProps) {
  const {
    order,
    isPolling,
    error,
    attempts,
    maxAttempts,
    progress,
    startPolling,
    stopPolling,
    retryPolling,
  } = usePaymentPolling({
    orderId,
    autoStart,
    onSuccess: onPaymentSuccess,
    onFailure: onPaymentFailure,
    onCancelled: onPaymentCancelled,
  });

  // Formater le montant
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Obtenir l'icône selon le statut
  const getStatusIcon = () => {
    if (!order) {
      return <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />;
    }

    switch (order.paymentStatus) {
      case PaymentStatus.PAID:
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.INSUFFICIENT_FUNDS:
        return <XCircle className="w-6 h-6 text-red-600" />;
      case PaymentStatus.CANCELLED:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
      case PaymentStatus.PROCESSING:
      case PaymentStatus.PENDING:
        return <Clock className="w-6 h-6 text-orange-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800 border-green-200';
      case PaymentStatus.FAILED:
      case PaymentStatus.INSUFFICIENT_FUNDS:
        return 'bg-red-100 text-red-800 border-red-200';
      case PaymentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case PaymentStatus.PROCESSING:
      case PaymentStatus.PENDING:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir le message selon le statut
  const getStatusMessage = (): string => {
    if (!order) return 'Chargement...';
    return paymentStatusService.getStatusMessage(order.paymentStatus as PaymentStatus);
  };

  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-700">Chargement des informations de paiement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header avec statut */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">Statut du Paiement</h3>
            <p className="text-sm text-gray-600">{getStatusMessage()}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadgeColor(order.paymentStatus)}`}>
          {order.paymentStatus}
        </span>
      </div>

      {/* Détails de la commande */}
      {showDetails && (
        <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Commande:</span>
            <span className="text-sm font-semibold text-gray-900">{order.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Montant:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatAmount(order.totalAmount)}
            </span>
          </div>

          {order.transactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Transaction:</span>
              <span className="text-xs font-mono text-gray-900 bg-white px-2 py-1 rounded">
                {order.transactionId}
              </span>
            </div>
          )}

          {order.lastPaymentAttemptAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dernière tentative:</span>
              <span className="text-xs text-gray-500">
                {new Date(order.lastPaymentAttemptAt).toLocaleString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Barre de progression du polling */}
      {isPolling && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Vérification automatique</span>
            <span className="text-xs text-gray-500">
              {attempts}/{maxAttempts} tentatives
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions pour l'utilisateur */}
      {order.paymentStatus === PaymentStatus.PENDING && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 Instructions:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Effectuez le paiement sur la page PayDunya</li>
                <li>• Le statut sera mis à jour automatiquement</li>
                <li>• Vous pouvez aussi rafraîchir manuellement</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isPolling && (order.paymentStatus === PaymentStatus.PENDING || order.paymentStatus === PaymentStatus.PROCESSING) && (
          <button
            onClick={startPolling}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Vérifier le statut
          </button>
        )}

        {isPolling && (
          <button
            onClick={stopPolling}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Arrêter la vérification
          </button>
        )}

        {error && (
          <button
            onClick={retryPolling}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        )}
      </div>

      {/* Actions pour le développement */}
      {import.meta.env.VITE_ENV !== 'production' && order.paymentStatus === PaymentStatus.PENDING && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">🧪 Actions de test (développement):</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const { paymentWebhookService } = await import('../../services/paymentWebhookService');
                await paymentWebhookService.forcePaymentSuccess(orderId);
                retryPolling();
              }}
              className="flex-1 text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Forcer le succès
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
