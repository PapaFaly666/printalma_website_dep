import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, Package, ArrowRight } from 'lucide-react';

interface PaymentDetails {
  orderId: number;
  orderNumber: string;
  token: string;
  totalAmount: number;
  timestamp: number;
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'pending' | 'failed'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer les détails du paiement depuis localStorage
    const pendingPayment = localStorage.getItem('paydunyaPendingPayment');

    if (pendingPayment) {
      try {
        const details = JSON.parse(pendingPayment);
        setPaymentDetails(details);
        verifyPayment(details.token);
      } catch (err) {
        console.error('Erreur parsing paydunyaPendingPayment:', err);
        setError('Informations de paiement invalides');
        setVerificationStatus('failed');
      }
    } else {
      setError('Aucune information de paiement trouvée');
      setVerificationStatus('failed');
    }
  }, []);

  const verifyPayment = async (token: string, retryCount = 0) => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 3000; // 3 secondes

    try {
      console.log(`🔍 [PaymentSuccess] Vérification du statut (tentative ${retryCount + 1}/${MAX_RETRIES + 1})...`);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/paydunya/status/${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📡 [PaymentSuccess] Réponse du backend:', result);

      if (result.success && result.data?.status === 'completed') {
        // Paiement confirmé
        setVerificationStatus('success');

        // Nettoyer le localStorage
        localStorage.removeItem('paydunyaPendingPayment');

        console.log('✅ [PaymentSuccess] Paiement confirmé avec succès !');
      } else if (result.data?.status === 'pending' && retryCount < MAX_RETRIES) {
        // Paiement en attente, réessayer
        console.log(`⏳ [PaymentSuccess] Paiement en attente, nouvelle tentative dans ${RETRY_DELAY / 1000}s...`);
        setVerificationStatus('pending');

        setTimeout(() => {
          verifyPayment(token, retryCount + 1);
        }, RETRY_DELAY);
      } else if (result.data?.status === 'failed' || result.data?.status === 'cancelled') {
        // Paiement échoué ou annulé
        setVerificationStatus('failed');
        setError('Le paiement a échoué ou a été annulé');
      } else {
        // Status inconnu ou trop de tentatives
        setVerificationStatus('pending');
        setError('Vérification en cours, veuillez patienter...');
      }
    } catch (err: any) {
      console.error('❌ [PaymentSuccess] Erreur lors de la vérification:', err);

      if (retryCount < MAX_RETRIES) {
        // Réessayer en cas d'erreur réseau
        setTimeout(() => {
          verifyPayment(token, retryCount + 1);
        }, RETRY_DELAY);
      } else {
        setVerificationStatus('failed');
        setError(err.message || 'Erreur lors de la vérification du paiement');
      }
    }
  };

  // Affichage pendant la vérification
  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérification du paiement</h2>
          <p className="text-gray-600">Veuillez patienter pendant que nous confirmons votre paiement...</p>
        </div>
      </div>
    );
  }

  // Affichage paiement en attente
  if (verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement en cours</h2>
          <p className="text-gray-600 mb-6">
            Votre paiement est en cours de traitement. Cela peut prendre quelques instants...
          </p>
          {error && (
            <p className="text-sm text-yellow-600 mb-4">{error}</p>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Affichage échec du paiement
  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement échoué</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Une erreur s\'est produite lors du traitement de votre paiement.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/order-form')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Réessayer le paiement
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage succès du paiement
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Icône de succès */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Paiement réussi !
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Votre commande a été confirmée et payée avec succès
        </p>

        {/* Détails de la commande */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Détails de la commande
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Numéro de commande:</span>
                <span className="font-semibold text-gray-900">{paymentDetails.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant total:</span>
                <span className="font-semibold text-gray-900">
                  {(paymentDetails.totalAmount / 100).toLocaleString('fr-FR')} XOF
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Payé
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            📧 Un email de confirmation vous a été envoyé avec tous les détails de votre commande.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Retour à l'accueil
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/personnalisation')}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Commander à nouveau
          </button>
        </div>

        {/* Note de pied de page */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Paiement sécurisé par PayDunya
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
