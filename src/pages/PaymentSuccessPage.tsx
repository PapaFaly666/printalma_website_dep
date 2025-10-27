import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone,
  Loader2,
  RefreshCw
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

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkStatus, loading: paytechLoading } = usePaytech();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('Vérification du paiement en cours...');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const token = searchParams.get('token');
  const refCommand = searchParams.get('ref_command');

  // Effacer les données de paiement en cours
  useEffect(() => {
    const pendingPayment = localStorage.getItem('pendingPayment');
    if (pendingPayment) {
      try {
        const data = JSON.parse(pendingPayment);
        setPaymentData(data);

        // Extraire les informations client du custom_field si disponible
        if (data.custom_field) {
          const customField = typeof data.custom_field === 'string'
            ? JSON.parse(data.custom_field)
            : data.custom_field;

          if (customField.customerInfo) {
            setCustomerInfo(customField.customerInfo);
          }
        }

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
      if (!token) {
        setStatus('error');
        setMessage('Token de paiement manquant');
        return;
      }

      try {
        console.log('🔍 [PaymentSuccess] Vérification du statut pour token:', token);

        const paymentStatus = await checkStatus(token);

        if (paymentStatus.success) {
          switch (paymentStatus.status) {
            case 'PAID':
              setStatus('success');
              setMessage('Paiement effectué avec succès !');

              // Vider le panier après un paiement réussi
              const { useCart } = await import('../contexts/CartContext');
              const { clearCart } = useCart();
              clearCart();

              break;

            case 'PENDING':
              setStatus('pending');
              setMessage('Paiement en cours de traitement...');

              // Recommencer la vérification après quelques secondes
              if (retryCount < 5) {
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                }, 3000);
              } else {
                setStatus('error');
                setMessage('Le paiement prend plus de temps que prévu. Veuillez vérifier votre statut plus tard.');
              }
              break;

            case 'FAILED':
              setStatus('error');
              setMessage('Le paiement a échoué');
              break;

            default:
              setStatus('pending');
              setMessage('Statut du paiement inconnu, vérification en cours...');
          }
        } else {
          setStatus('error');
          setMessage('Erreur lors de la vérification du paiement');
        }

      } catch (error) {
        console.error('❌ [PaymentSuccess] Erreur lors de la vérification:', error);
        setStatus('error');
        setMessage('Erreur lors de la vérification du paiement');
      }
    };

    handlePaymentReturn();
  }, [token, checkStatus, retryCount]);

  // Recommencer la vérification manuellement
  const handleRetry = () => {
    setRetryCount(0);
    setStatus('loading');
    setMessage('Nouvelle vérification du paiement en cours...');
  };

  if (status === 'loading' || paytechLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Vérification en cours...</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Échec du paiement</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer la vérification
            </button>
            <button
              onClick={() => navigate('/order-form')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour au formulaire
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">Paiement en cours</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Référence:</strong> {refCommand || paymentData?.ref_command || 'N/A'}
            </p>
            <p className="text-sm text-yellow-800">
              <strong>Montant:</strong> {paymentData ? formatPrice(paymentData.amount / 100) : 'N/A'}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser le statut
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Succès
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
                Paiement réussi
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Message de succès */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-14 h-14 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">Paiement effectué avec succès !</h2>
            <p className="text-gray-600 text-lg mb-8">
              Merci pour votre commande. Vous recevrez une confirmation par email prochainement.
            </p>

            {/* Informations de commande */}
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Détails de la commande
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Numéro de commande</p>
                  <p className="font-semibold text-gray-900">{refCommand || paymentData?.ref_command || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Produit</p>
                  <p className="font-semibold text-gray-900">{paymentData?.item_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant payé</p>
                  <p className="font-semibold text-gray-900">
                    {paymentData ? formatPrice(paymentData.amount / 100) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {paymentData ? new Date(paymentData.timestamp).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations client si disponibles */}
            {customerInfo && (
              <div className="bg-blue-50 rounded-xl p-6 text-left mb-8">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations de livraison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Nom</p>
                    <p className="font-medium text-blue-900">
                      {customerInfo.firstName} {customerInfo.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <p className="font-medium text-blue-900">{customerInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </p>
                    <p className="font-medium text-blue-900">{customerInfo.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Adresse
                    </p>
                    <p className="font-medium text-blue-900">
                      {customerInfo.address}, {customerInfo.city}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Continuer mes achats
              </button>
              <button
                onClick={() => navigate('/order-form')}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Nouvelle commande
              </button>
            </div>
          </div>

          {/* Informations additionnelles */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Informations de paiement
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Paiement sécurisé via PayTech</p>
              <p>• Vous recevrez un email de confirmation détaillée</p>
              <p>• Pour toute question, contactez notre support client</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;