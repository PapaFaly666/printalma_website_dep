import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, AlertTriangle, RefreshCw, Home, HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import PaymentInsufficientFunds from '../../components/payment/PaymentInsufficientFunds';
import { paymentStatusService } from '../../services/paymentStatusService';

const PaymentFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);

  const token = searchParams.get('token');
  const orderNumber = searchParams.get('order_number') || searchParams.get('orderNumber');
  const reason = searchParams.get('reason');
  const responseCode = searchParams.get('response_code');

  // Vérifier si c'est un problème de fonds insuffisants
  const isInsufficientFunds =
    reason?.toLowerCase().includes('insufficient') ||
    reason?.toLowerCase().includes('fonds') ||
    responseCode === '03';

  useEffect(() => {
    // Récupérer les données de commande en attente
    const pendingPayment = paymentStatusService.getPendingPayment();
    if (pendingPayment) {
      setOrderData(pendingPayment);
    }
  }, []);

  // Si c'est un problème de fonds insuffisants, afficher le composant dédié
  if (isInsufficientFunds) {
    return (
      <PaymentInsufficientFunds
        orderNumber={orderNumber || orderData?.orderNumber || 'N/A'}
        amount={orderData?.totalAmount || 0}
        onRetry={() => navigate('/checkout')}
        onHome={() => navigate('/')}
      />
    );
  }

  // Sinon, afficher la page d'échec générale
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-8 text-white text-center">
            <div className="flex justify-center mb-4 animate-shake">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <XCircle className="w-20 h-20" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">Paiement échoué</h1>
            <p className="text-lg opacity-90">Nous n'avons pas pu traiter votre paiement</p>
          </div>

          {/* Order Info */}
          {(orderNumber || orderData) && (
            <div className="px-6 py-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Numéro de commande</p>
                  <p className="text-xl font-bold text-gray-900">{orderNumber || orderData?.orderNumber}</p>
                </div>
                {orderData?.totalAmount && (
                  <>
                    <div className="h-12 w-px bg-gray-300" />
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Montant</p>
                      <p className="text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          minimumFractionDigits: 0,
                        }).format(orderData.totalAmount)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {reason && (
            <div className="px-6 py-6 bg-orange-50 border-b border-orange-100">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Détails de l'erreur</h3>
                  <p className="text-gray-700">{reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Possible Reasons */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Pourquoi le paiement a-t-il échoué ?
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: '💳',
                  title: 'Informations incorrectes',
                  description: 'Numéro de carte, date d\'expiration ou CVV incorrect'
                },
                {
                  icon: '🔒',
                  title: 'Carte refusée',
                  description: 'Votre banque a refusé la transaction'
                },
                {
                  icon: '🌐',
                  title: 'Problème de connexion',
                  description: 'Erreur de connexion avec le système de paiement'
                },
                {
                  icon: '⏱️',
                  title: 'Session expirée',
                  description: 'Le délai de paiement a été dépassé'
                },
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start">
                    <span className="text-3xl mr-3">{item.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div className="px-6 py-8 bg-blue-50 border-b border-blue-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Comment résoudre le problème ?
            </h2>
            <ul className="space-y-4">
              {[
                'Vérifiez les informations de votre carte ou compte',
                'Assurez-vous d\'avoir les fonds nécessaires',
                'Essayez une autre méthode de paiement',
                'Contactez votre banque si le problème persiste',
                'Vérifiez votre connexion internet',
              ].map((solution, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 font-bold">{index + 1}</span>
                  </div>
                  <span className="ml-4 text-gray-700">{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Besoin d'aide ?</h3>
            <p className="text-center text-gray-700 mb-6">
              Notre équipe est là pour vous aider à résoudre ce problème
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center text-center">
                <Mail className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                <p className="text-sm text-gray-600">support@printalma.com</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center text-center">
                <Phone className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Téléphone</h4>
                <p className="text-sm text-gray-600">+221 77 123 45 67</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center text-center">
                <MessageCircle className="w-8 h-8 text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Chat en direct</h4>
                <p className="text-sm text-gray-600">Disponible 9h-18h</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-6 bg-white">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Réessayer le paiement
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <HelpCircle className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Questions fréquentes</h3>
          </div>
          <div className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Mon argent a-t-il été débité ?
              </summary>
              <p className="mt-2 text-sm text-gray-600 pl-4">
                Non, si le paiement a échoué, aucun débit n'a été effectué sur votre compte.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Puis-je utiliser une autre méthode de paiement ?
              </summary>
              <p className="mt-2 text-sm text-gray-600 pl-4">
                Oui, vous pouvez réessayer avec une autre carte ou méthode de paiement disponible.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Ma commande est-elle toujours valide ?
              </summary>
              <p className="mt-2 text-sm text-gray-600 pl-4">
                Oui, votre commande est en attente de paiement. Vous avez 24 heures pour finaliser le paiement.
              </p>
            </details>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        details summary::-webkit-details-marker {
          display: none;
        }

        details summary {
          list-style: none;
        }

        details summary::after {
          content: "▼";
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 0.75rem;
          transition: transform 0.2s;
        }

        details[open] summary::after {
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
};

export default PaymentFailedPage;
