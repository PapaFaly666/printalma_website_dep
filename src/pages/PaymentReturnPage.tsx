import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { paytechService } from '../services/paytechService';

const PaymentReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const status = searchParams.get('status');
        const token = searchParams.get('token');
        const refCommand = searchParams.get('ref_command');

        console.log('🔍 Vérification paiement PayTech:', { status, token, refCommand });

        if (status === 'cancel') {
          setPaymentStatus('failed');
          setError('Le paiement a été annulé par l\'utilisateur');
          setIsVerifying(false);
          return;
        }

        if (!token) {
          setPaymentStatus('failed');
          setError('Token de paiement manquant');
          setIsVerifying(false);
          return;
        }

        // Vérifier le statut de la transaction avec PayTech
        const verification = await paytechService.checkPaymentStatus(token);

        if (verification.success) {
          // Mapper le statut de PayTech vers nos statuts locaux
          const mappedStatus = verification.status === 'PAID' ? 'success' :
                              verification.status === 'FAILED' ? 'failed' : 'pending';
          setPaymentStatus(mappedStatus);
          setPaymentDetails(verification.payment_data);

          // Si le paiement est réussi, vider le panier et rediriger
          if (mappedStatus === 'success') {
            setTimeout(() => {
              clearCart();
              // Ici vous pourriez rediriger vers la page des commandes
              // navigate('/my-orders');
            }, 3000);
          }
        } else {
          setPaymentStatus('failed');
          setError('Impossible de vérifier le statut du paiement');
        }
      } catch (error) {
        console.error('Erreur vérification paiement:', error);
        setPaymentStatus('failed');
        setError('Une erreur est survenue lors de la vérification du paiement');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, clearCart]);

  const handleRetryPayment = () => {
    navigate(-1); // Retour à la page de commande
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vérification du paiement</h2>
          <p className="text-gray-600">
            Nous vérifions le statut de votre transaction avec PayTech...
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
              <p className="text-gray-600 mb-6">
                Votre paiement a été traité avec succès par PayTech
              </p>

              {paymentDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4">Détails de la transaction</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Référence:</span>
                      <span className="font-medium">{paymentDetails.ref_command}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-medium">
                        {(paymentDetails.amount || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Méthode:</span>
                      <span className="font-medium">
                        {paymentDetails.payment_method || 'PayTech'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {new Date(paymentDetails.created_at || Date.now()).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>📧 Confirmation email:</strong> Un email de confirmation a été envoyé à votre adresse.
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  <strong>📦 Livraison:</strong> Vous recevrez des mises à jour sur l'état de votre commande.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/my-orders')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Voir mes commandes
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement échoué</h1>
              <p className="text-gray-600 mb-6">
                {error || 'Une erreur est survenue lors du traitement de votre paiement'}
              </p>

              <div className="bg-amber-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Que s'est-il passé ?</strong><br />
                  Le paiement n'a pas pu être finalisé. Aucun montant n'a été débité de votre compte.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRetryPayment}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Réessayer le paiement
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement en cours</h1>
              <p className="text-gray-600 mb-6">
                Votre paiement est en cours de validation par PayTech
              </p>

              <div className="bg-amber-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Temps d'attente:</strong> Le traitement peut prendre quelques instants.<br />
                  Vous recevrez une confirmation par email dès que le paiement sera validé.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Actualiser le statut
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur inattendue</h2>
        <p className="text-gray-600 mb-4">Une erreur est survenue lors du traitement du paiement</p>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default PaymentReturnPage;