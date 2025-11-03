import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';

interface PaymentDetails {
  orderId: number;
  orderNumber: string;
  token: string;
  totalAmount: number;
  timestamp: number;
}

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    // Récupérer les détails du paiement depuis localStorage
    const pendingPayment = localStorage.getItem('paydunyaPendingPayment');

    if (pendingPayment) {
      try {
        const details = JSON.parse(pendingPayment);
        setPaymentDetails(details);
      } catch (err) {
        console.error('Erreur parsing paydunyaPendingPayment:', err);
      }
    }
  }, []);

  const handleRetry = () => {
    // Retourner au formulaire de commande pour réessayer
    navigate('/order-form');
  };

  const handleBackHome = () => {
    // Nettoyer le localStorage et retourner à l'accueil
    localStorage.removeItem('paydunyaPendingPayment');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Icône d'annulation */}
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-orange-600" />
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Paiement annulé
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Vous avez annulé le paiement. Votre commande n'a pas été confirmée.
        </p>

        {/* Détails de la commande (si disponibles) */}
        {paymentDetails && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-yellow-900 mb-4">
              Informations de la commande
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">Numéro:</span>
                <span className="font-semibold text-yellow-900">{paymentDetails.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Montant:</span>
                <span className="font-semibold text-yellow-900">
                  {(paymentDetails.totalAmount / 100).toLocaleString('fr-FR')} XOF
                </span>
              </div>
            </div>
            <p className="text-xs text-yellow-700 mt-4">
              Cette commande est toujours en attente. Vous pouvez réessayer le paiement à tout moment.
            </p>
          </div>
        )}

        {/* Informations complémentaires */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Que faire ensuite ?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Vous pouvez réessayer le paiement immédiatement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Vérifiez votre solde ou changez de méthode de paiement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Contactez notre support si vous rencontrez des difficultés</span>
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer le paiement
          </button>

          <button
            onClick={() => navigate('/personnalisation')}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Modifier ma commande
          </button>

          <button
            onClick={handleBackHome}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">Besoin d'aide ?</p>
          <a
            href="mailto:support@printalma.com"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Contactez notre support
          </a>
        </div>

        {/* Note de pied de page */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Paiement sécurisé par PayDunya
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
