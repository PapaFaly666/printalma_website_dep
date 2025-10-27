import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  XCircle,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { usePaytech } from '../hooks/usePaytech';
import { formatPrice } from '../utils/priceUtils';

interface PaymentData {
  token: string;
  ref_command: string;
  amount: number;
  item_name: string;
  timestamp: number;
}

const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkStatus, loading: paytechLoading } = usePaytech();

  const [status, setStatus] = useState<'loading' | 'cancelled' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Vérification du statut du paiement...');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  const token = searchParams.get('token');
  const refCommand = searchParams.get('ref_command');

  // Effacer les données de paiement en cours
  useEffect(() => {
    const pendingPayment = localStorage.getItem('pendingPayment');
    if (pendingPayment) {
      try {
        const data = JSON.parse(pendingPayment);
        setPaymentData(data);

        // Supprimer les données temporaires
        localStorage.removeItem('pendingPayment');
      } catch (error) {
        console.error('Erreur lors de la lecture des données de paiement:', error);
      }
    }
  }, []);

  // Vérifier le statut du paiement
  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        if (token) {
          console.log('🔍 [PaymentCancel] Vérification du statut pour token:', token);

          const paymentStatus = await checkStatus(token);

          if (paymentStatus.success) {
            switch (paymentStatus.status) {
              case 'CANCELLED':
              case 'FAILED':
                setStatus('cancelled');
                setMessage('Le paiement a été annulé ou a échoué');
                break;
              case 'PAID':
                // Rediriger vers la page de succès si le paiement est en fait réussi
                navigate(`/payment/success?token=${token}&ref_command=${refCommand}`);
                return;
              case 'PENDING':
                setStatus('cancelled');
                setMessage('Le paiement a été interrompu. Le statut est encore en attente.');
                setShowRetry(true);
                break;
              default:
                setStatus('cancelled');
                setMessage('Le paiement a été annulé');
                setShowRetry(true);
            }
          } else {
            setStatus('cancelled');
            setMessage('Le paiement a été annulé');
          }
        } else {
          // Pas de token - l'utilisateur a probablement fermé la fenêtre de paiement
          setStatus('cancelled');
          setMessage('Le processus de paiement a été interrompu');
          setShowRetry(true);
        }
      } catch (error) {
        console.error('❌ [PaymentCancel] Erreur lors de la vérification:', error);
        setStatus('error');
        setMessage('Erreur lors de la vérification du statut du paiement');
        setShowRetry(true);
      }
    };

    // Délai court pour laisser le temps à l'utilisateur de voir la page
    const timer = setTimeout(() => {
      handlePaymentReturn();
    }, 1000);

    return () => clearTimeout(timer);
  }, [token, refCommand, checkStatus, navigate]);

  // Recommencer le paiement
  const handleRetryPayment = () => {
    // Retourner au formulaire de commande avec les informations préservées
    navigate('/order-form');
  };

  // Vérifier à nouveau le statut
  const handleCheckStatus = () => {
    setStatus('loading');
    setMessage('Nouvelle vérification du statut...');
    setShowRetry(false);

    // Déclencher une nouvelle vérification
    setTimeout(() => {
      if (token) {
        checkStatus(token)
          .then((paymentStatus) => {
            if (paymentStatus.success && paymentStatus.status === 'PAID') {
              navigate(`/payment/success?token=${token}&ref_command=${refCommand}`);
            } else {
              setStatus('cancelled');
              setMessage('Le paiement est toujours annulé ou en attente');
              setShowRetry(true);
            }
          })
          .catch(() => {
            setStatus('error');
            setMessage('Erreur lors de la vérification');
            setShowRetry(true);
          });
      }
    }, 1000);
  };

  if (status === 'loading' || paytechLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Vérification en cours...</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Paiement annulé
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Message d'annulation */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-14 h-14 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">
              {status === 'error' ? 'Erreur de paiement' : 'Paiement annulé'}
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              {message}
            </p>

            {/* Informations de commande si disponibles */}
            {paymentData && (
              <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Détails de la commande
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de commande</p>
                    <p className="font-semibold text-gray-900">{paymentData.ref_command || refCommand || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Produit</p>
                    <p className="font-semibold text-gray-900">{paymentData.item_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant</p>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(paymentData.amount / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(paymentData.timestamp).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={handleRetryPayment}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Recommencer la commande
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour à l'accueil
              </button>
            </div>

            {/* Option de vérification si disponible */}
            {showRetry && token && (
              <div className="flex justify-center">
                <button
                  onClick={handleCheckStatus}
                  className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Vérifier à nouveau le statut du paiement
                </button>
              </div>
            )}
          </div>

          {/* Informations additionnelles */}
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Que s'est-il passé ?
              </h4>
              <div className="text-sm text-orange-800 space-y-1">
                <p>• Le paiement a été annulé avant d'être finalisé</p>
                <p>• Aucun montant n'a été débité de votre compte</p>
                <p>• Vous pouvez recommencer le processus de paiement quand vous le souhaitez</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Moyens de paiement disponibles
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Wave:</strong> Paiement instantané par compte Wave</p>
                <p>• <strong>Orange Money:</strong> Paiement par Orange Money</p>
                <p>• <strong>Free Money:</strong> Paiement par Free Money</p>
                <p>• <strong>Carte Bancaire:</strong> Visa, Mastercard, etc.</p>
                <p>• <strong>PayPal:</strong> Paiement sécurisé PayPal</p>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Besoin d'aide ?</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Si vous rencontrez des difficultés lors du paiement, n'hésitez pas à contacter notre support client</p>
                <p>• Assurez-vous d'avoir une connexion internet stable</p>
                <p>• Vérifiez que vos moyens de paiement sont valides et ont des fonds suffisants</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;