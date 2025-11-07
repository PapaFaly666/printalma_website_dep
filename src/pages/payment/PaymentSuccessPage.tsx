import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Mail, ArrowRight, Home } from 'lucide-react';
import { paymentStatusService } from '../../services/paymentStatusService';
import { PaymentTracker } from '../../components/payment/PaymentTracker';
import { useCart } from '../../contexts/CartContext';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [showConfetti, setShowConfetti] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  const orderNumber = searchParams.get('order_number') || searchParams.get('orderNumber');
  const orderId = searchParams.get('order') || searchParams.get('orderId');
  const token = searchParams.get('token');

  useEffect(() => {
    // Vider le panier après un paiement réussi
    clearCart();

    // Arrêter les confettis après 5 secondes
    const timer = setTimeout(() => setShowConfetti(false), 5000);

    // Récupérer les données de commande en attente
    const pendingPayment = paymentStatusService.getPendingPayment();
    if (pendingPayment) {
      setOrderData(pendingPayment);
    }

    return () => clearTimeout(timer);
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti absolute w-2 h-2 opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
                animation: `fall ${3 + Math.random() * 2}s linear ${Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Success Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-white text-center">
              <div className="flex justify-center mb-4 animate-bounce-slow">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <CheckCircle2 className="w-20 h-20" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2">Paiement réussi !</h1>
              <p className="text-lg opacity-90">Votre commande a été confirmée avec succès</p>
            </div>

            {/* Order Info */}
            {(orderNumber || orderData) && (
              <div className="px-6 py-6 bg-green-50 border-b border-green-100">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Numéro de commande</p>
                    <p className="text-2xl font-bold text-gray-900">{orderNumber || orderData?.orderNumber}</p>
                  </div>
                  {orderData?.totalAmount && (
                    <>
                      <div className="h-12 w-px bg-gray-300" />
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Montant</p>
                        <p className="text-2xl font-bold text-green-600">
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

            {/* Thank You Message */}
            <div className="px-6 py-8 text-center border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Merci pour votre confiance ! 🎉
              </h2>
              <p className="text-gray-700 max-w-2xl mx-auto">
                Votre paiement a été traité avec succès et votre commande est maintenant en cours de préparation.
                Vous recevrez bientôt un email de confirmation avec tous les détails.
              </p>
            </div>

            {/* Payment Tracker avec polling automatique */}
            {orderId && (
              <div className="px-6 py-6">
                <PaymentTracker
                  orderId={parseInt(orderId)}
                  onPaymentSuccess={(order) => {
                    console.log('✅ Paiement confirmé définitivement:', order);
                    paymentStatusService.clearPendingPayment();
                  }}
                  onPaymentFailure={(order) => {
                    console.log('❌ Le paiement a finalement échoué:', order);
                    navigate('/payment/failed');
                  }}
                  autoStart={true}
                  showDetails={true}
                />
              </div>
            )}

            {/* Next Steps */}
            <div className="px-6 py-8 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Prochaines étapes</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 rounded-full p-4 mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Confirmation par email</h4>
                  <p className="text-sm text-gray-600">
                    Un email de confirmation avec les détails de votre commande vous sera envoyé
                  </p>
                  <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Immédiat
                  </div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-purple-100 rounded-full p-4 mb-4">
                    <Package className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Préparation</h4>
                  <p className="text-sm text-gray-600">
                    Votre commande sera préparée et vérifiée avec soin avant expédition
                  </p>
                  <div className="mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    24-48h
                  </div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 rounded-full p-4 mb-4">
                    <Truck className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Livraison</h4>
                  <p className="text-sm text-gray-600">
                    Votre colis sera expédié et livré à l'adresse indiquée
                  </p>
                  <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    3-5 jours
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-6 bg-white">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Voir mes commandes
                  <ArrowRight className="w-5 h-5" />
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

          {/* Additional Info */}
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-lg shadow p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-3">Besoin d'aide ?</h3>
            <p className="text-gray-700 mb-4">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                support@printalma.com
              </span>
              <span className="flex items-center">
                <Package className="w-4 h-4 mr-2 text-green-600" />
                +221 77 123 45 67
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }

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

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccessPage;
