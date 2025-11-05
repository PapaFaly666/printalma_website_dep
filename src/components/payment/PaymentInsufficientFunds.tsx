import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Smartphone, CreditCard, Building2, Phone, Mail, MessageCircle } from 'lucide-react';

interface PaymentInsufficientFundsProps {
  orderNumber: string;
  amount: number;
  onRetry?: () => void;
  onHome?: () => void;
}

const PaymentInsufficientFunds: React.FC<PaymentInsufficientFundsProps> = ({
  orderNumber,
  amount,
  onRetry,
  onHome
}) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate('/checkout');
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate('/');
    }
  };

  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <AlertTriangle className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Fonds insuffisants</h1>
            <p className="text-lg opacity-90">Votre paiement n'a pas pu être traité</p>
          </div>

          {/* Amount Info */}
          <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant requis</p>
                <p className="text-3xl font-bold text-gray-900">{formatAmount(amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Commande</p>
                <p className="text-lg font-semibold text-gray-900">{orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pourquoi le paiement a échoué ?</h2>
            <ul className="space-y-3">
              {[
                'Solde du compte mobile ou bancaire insuffisant',
                'Limite de paiement journalière ou hebdomadaire atteinte',
                'Compte temporairement bloqué ou suspendu',
                'Problème de connexion avec votre opérateur',
              ].map((reason, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <span className="text-red-600 text-sm font-bold">•</span>
                  </div>
                  <span className="ml-3 text-gray-700">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Solutions possibles</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Vérifier votre solde</h3>
                <p className="text-sm text-gray-600">
                  Consultez votre solde mobile ou bancaire avant de réessayer
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Autre méthode</h3>
                <p className="text-sm text-gray-600">
                  Essayez une autre carte ou méthode de paiement disponible
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Contacter la banque</h3>
                <p className="text-sm text-gray-600">
                  Débloquez votre carte ou contactez votre opérateur
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="px-6 py-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Besoin d'aide ?</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-center text-gray-700">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-sm">support@printalma.com</span>
              </div>
              <div className="flex items-center justify-center text-gray-700">
                <Phone className="w-5 h-5 mr-2 text-green-600" />
                <span className="text-sm">+221 77 123 45 67</span>
              </div>
              <div className="flex items-center justify-center text-gray-700">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                <span className="text-sm">Chat en direct (9h-18h)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-6 bg-white">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRetry}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Réessayer le paiement
              </button>
              <button
                onClick={handleHome}
                className="flex-1 bg-gray-200 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>

        {/* Additional Tips */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Conseils utiles</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vérifiez que vous avez activé les paiements en ligne sur votre compte</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Assurez-vous que votre compte n'est pas bloqué ou en maintenance</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vérifiez votre limite de paiement avec votre opérateur</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Essayez de recharger votre compte avant de réessayer</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentInsufficientFunds;
