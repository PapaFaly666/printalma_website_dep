import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { paymentStatusService } from '../../services/paymentStatusService';
import { PaymentStatus } from '../../types/payment';

interface PaymentStatusHandlerProps {
  onSuccess?: (orderNumber: string) => void;
  onFailure?: (reason: string) => void;
  onCancel?: () => void;
}

const PaymentStatusHandler: React.FC<PaymentStatusHandlerProps> = ({
  onSuccess,
  onFailure,
  onCancel
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de paiement manquant');
      setLoading(false);
      return;
    }

    // Récupérer les informations de paiement en attente
    const pendingPayment = paymentStatusService.getPendingPayment();
    if (pendingPayment) {
      setOrderNumber(pendingPayment.orderNumber);
    }

    checkPaymentStatus();
  }, [token]);

  const checkPaymentStatus = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Utiliser le polling pour vérifier le statut avec plusieurs tentatives
      const result = await paymentStatusService.pollPaymentStatus(token, 10, 3000);

      setStatus(result.status);

      if (result.status === PaymentStatus.PAID) {
        // Paiement réussi
        paymentStatusService.clearPendingPayment();
        if (onSuccess && orderNumber) {
          onSuccess(orderNumber);
        }
      } else if (
        result.status === PaymentStatus.FAILED ||
        result.status === PaymentStatus.INSUFFICIENT_FUNDS
      ) {
        // Paiement échoué
        if (onFailure) {
          onFailure(result.message);
        }
      } else if (result.status === PaymentStatus.CANCELLED) {
        // Paiement annulé
        paymentStatusService.clearPendingPayment();
        if (onCancel) {
          onCancel();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      if (onFailure) {
        onFailure(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    checkPaymentStatus();
  };

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />;
    }

    switch (status) {
      case PaymentStatus.PAID:
        return <CheckCircle2 className="w-16 h-16 text-green-600" />;
      case PaymentStatus.FAILED:
      case PaymentStatus.INSUFFICIENT_FUNDS:
        return <XCircle className="w-16 h-16 text-red-600" />;
      case PaymentStatus.PROCESSING:
      case PaymentStatus.PENDING:
        return <Clock className="w-16 h-16 text-orange-600" />;
      case PaymentStatus.CANCELLED:
        return <AlertCircle className="w-16 h-16 text-gray-600" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-600" />;
    }
  };

  const renderMessage = () => {
    if (error) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">
            Vérification du paiement en cours...
          </h2>
          <p className="text-gray-700">Veuillez patienter pendant que nous vérifions votre paiement.</p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2 className={`text-2xl font-bold mb-2 ${
          status === PaymentStatus.PAID ? 'text-green-600' :
          status === PaymentStatus.FAILED || status === PaymentStatus.INSUFFICIENT_FUNDS ? 'text-red-600' :
          status === PaymentStatus.PROCESSING || status === PaymentStatus.PENDING ? 'text-orange-600' :
          'text-gray-600'
        }`}>
          {paymentStatusService.getStatusMessage(status)}
        </h2>
        {orderNumber && (
          <p className="text-gray-700 mt-2">
            Numéro de commande: <strong>{orderNumber}</strong>
          </p>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (loading) return null;

    if (error) {
      return (
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    if (status === PaymentStatus.PAID) {
      return (
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Voir mes commandes
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    if (status === PaymentStatus.FAILED || status === PaymentStatus.INSUFFICIENT_FUNDS) {
      return (
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => navigate('/checkout')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer le paiement
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    if (status === PaymentStatus.PROCESSING || status === PaymentStatus.PENDING) {
      return (
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Rafraîchir le statut
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center">
          {renderIcon()}
          <div className="mt-6 w-full">
            {renderMessage()}
          </div>
          {renderActions()}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusHandler;
