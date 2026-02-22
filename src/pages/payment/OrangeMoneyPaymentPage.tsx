import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Home, Clock, ExternalLink } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { paymentWebhookService } from '../../services/paymentWebhookService';
import { PaymentStatus } from '../../types/payment';

const OrangeMoneyPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 180; // 3 minutes (toutes les secondes)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const orderNumber = searchParams.get('orderNumber');
  const statusParam = searchParams.get('status');

  // Données Orange Money (QR code, deeplinks) depuis localStorage
  const [orangeMoneyData, setOrangeMoneyData] = useState<{
    qrCode: string;
    deepLinks: { MAXIT: string; OM: string };
    reference: string;
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

  // Fonction de vérification du statut
  const checkPaymentStatus = async () => {
    if (!orderNumber) {
      setError('Numéro de commande manquant');
      setIsVerifying(false);
      setPaymentStatus(PaymentStatus.FAILED);
      return;
    }

    try {
      setAttempts(prev => prev + 1);
      console.log(`🔍 [OM Payment] Vérification ${attempts + 1}/${maxAttempts} pour ${orderNumber}`);

      const response = await paymentWebhookService.verifyOrangeMoneyStatus(orderNumber);

      if (response.success && response.order) {
        const order = response.order;
        setOrderData(order);

        console.log(`📊 [OM Payment] Statut actuel: ${order.paymentStatus}`);

        // Vérifier si on doit rediriger automatiquement
        if (order.shouldRedirect && order.redirectUrl) {
          console.log(`🔀 [OM Payment] Redirection automatique vers: ${order.redirectUrl}`);
          window.location.href = order.redirectUrl;
          return;
        }

        // Mettre à jour le statut local
        const currentStatus = order.paymentStatus as PaymentStatus;
        setPaymentStatus(currentStatus);

        // Si le paiement est dans un état final, arrêter le polling
        if (currentStatus === PaymentStatus.PAID) {
          console.log('✅ [OM Payment] Paiement réussi !');
          stopPolling();
          setIsVerifying(false);
          // Vider le panier après 2 secondes
          setTimeout(() => {
            clearCart();
          }, 2000);
        } else if (
          currentStatus === PaymentStatus.FAILED ||
          currentStatus === PaymentStatus.CANCELLED
        ) {
          console.log(`❌ [OM Payment] Paiement échoué: ${currentStatus}`);
          stopPolling();
          setIsVerifying(false);
        }
      } else {
        console.warn('⚠️ [OM Payment] Réponse invalide du serveur');
      }
    } catch (error: any) {
      console.error('❌ [OM Payment] Erreur vérification:', error);
      setError(error.message || 'Erreur lors de la vérification du paiement');
    }
  };

  // Démarrer le polling
  const startPolling = () => {
    console.log('🚀 [OM Payment] Démarrage du polling toutes les 1 seconde');

    // Première vérification immédiate
    checkPaymentStatus();

    // Puis vérification toutes les 1 seconde
    pollingIntervalRef.current = setInterval(() => {
      if (attempts >= maxAttempts) {
        console.warn('⚠️ [OM Payment] Nombre maximum de tentatives atteint');
        console.warn('⚠️ [OM Payment] Timeout après 3 minutes - Paiement considéré comme échoué');
        stopPolling();
        setIsVerifying(false);
        setPaymentStatus(PaymentStatus.FAILED); // ← CHANGEMENT: Échoué au lieu de PENDING
        setError('Le délai de paiement a expiré. Veuillez réessayer.');
        return;
      }

      checkPaymentStatus();
    }, 1000); // 1 seconde
  };

  // Arrêter le polling
  const stopPolling = () => {
    console.log('🛑 [OM Payment] Arrêt du polling');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Charger les données Orange Money depuis localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('orangeMoneyPayment');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('🍊 [OM Payment] Données chargées depuis localStorage:', parsed);
        setOrangeMoneyData(parsed);
        // Nettoyer le localStorage après chargement
        localStorage.removeItem('orangeMoneyPayment');
      } catch (error) {
        console.error('❌ [OM Payment] Erreur parsing données:', error);
      }
    }
  }, []);

  // Démarrer le polling au montage
  useEffect(() => {
    // Si le statut est explicitement fourni dans l'URL
    if (statusParam) {
      if (statusParam === 'success') {
        setPaymentStatus(PaymentStatus.PAID);
        setIsVerifying(false);
      } else if (statusParam === 'cancelled' || statusParam === 'failed') {
        setPaymentStatus(PaymentStatus.FAILED);
        setIsVerifying(false);
      }
      return;
    }

    // Sinon, démarrer le polling
    startPolling();

    // Nettoyage au démontage
    return () => {
      stopPolling();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetryPayment = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToOrders = () => {
    navigate('/my-orders');
  };

  // États finaux: PAID, FAILED, CANCELLED
  const isFinalState = paymentStatus === PaymentStatus.PAID ||
                       paymentStatus === PaymentStatus.FAILED ||
                       paymentStatus === PaymentStatus.CANCELLED;

  // État de vérification (afficher tant qu'on n'est pas dans un état final)
  if (!isFinalState) {
    const progress = (attempts / maxAttempts) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-2xl w-full">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérification du paiement</h2>
          <p className="text-gray-600 mb-6">
            Scannez le QR code ou utilisez les liens ci-dessous pour payer
          </p>

          {/* QR Code et deeplinks si disponibles */}
          {orangeMoneyData && (
            <div className="mb-6">
              {/* QR Code */}
              <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg border-2 border-orange-200">
                <div className="flex justify-center mb-4">
                  <img
                    src={`data:image/png;base64,${orangeMoneyData.qrCode}`}
                    alt="QR Code Orange Money"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {orangeMoneyData.totalAmount.toLocaleString()} FCFA
                  </p>
                </div>
              </div>

              {/* Deeplinks */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <a
                  href={orangeMoneyData.deepLinks.MAXIT}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-semibold text-sm text-center transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir MAX IT
                </a>
                <a
                  href={orangeMoneyData.deepLinks.OM}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl font-semibold text-sm text-center transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir Orange Money
                </a>
              </div>
            </div>
          )}

          <div className="bg-orange-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-orange-800 mb-3">
              <strong>🍊 Paiement Orange Money</strong>
            </p>
            {orderNumber && (
              <p className="text-xs text-gray-600 mb-2">
                Commande: <span className="font-mono font-semibold">{orderNumber}</span>
              </p>
            )}
            <p className="text-xs text-gray-600">
              Tentatives: {attempts}/{maxAttempts}
            </p>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3 text-left">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  💡 Instructions
                </p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Scannez le QR code avec votre app Orange Money</li>
                  <li>• Ou cliquez sur un des boutons ci-dessus</li>
                  <li>• Le statut se met à jour automatiquement</li>
                  <li>• Restez sur cette page</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            ⏱️ Vérification automatique toutes les secondes
          </p>
        </div>
      </div>
    );
  }

  // Paiement réussi
  if (paymentStatus === PaymentStatus.PAID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-green-200 p-8 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎉 Paiement réussi !
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                Votre paiement via Orange Money a été validé avec succès
              </p>

              {orderData && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 mb-6 text-left border border-orange-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🍊</span>
                    Détails de la transaction Orange Money
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Commande:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {orderData.orderNumber}
                      </span>
                    </div>
                    {orderData.totalAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-bold text-green-600 text-lg">
                          {orderData.totalAmount.toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {orderData.transactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Transaction:</span>
                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                          {orderData.transactionId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Méthode:</span>
                      <span className="font-medium text-orange-600">
                        Orange Money
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">📧 Prochaines étapes</h4>
                <ul className="text-sm text-blue-800 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    Un email de confirmation a été envoyé
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    Vous recevrez des mises à jour sur votre commande
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    Votre commande est en cours de traitement
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleGoToOrders}
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-amber-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  📦 Voir mes commandes
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paiement échoué ou annulé
  if (
    paymentStatus === PaymentStatus.FAILED ||
    paymentStatus === PaymentStatus.CANCELLED
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-8 text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Paiement échoué
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                {error || paymentStatus === PaymentStatus.CANCELLED
                  ? 'Le paiement a été annulé'
                  : 'Une erreur est survenue lors du traitement de votre paiement Orange Money'}
              </p>

              <div className="bg-amber-50 rounded-lg p-6 mb-6 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-3">
                  ℹ️ Que s'est-il passé ?
                </h4>
                <p className="text-sm text-amber-800 text-left">
                  Le paiement n'a pas pu être finalisé avec Orange Money.
                  Aucun montant n'a été débité de votre compte. Vous pouvez
                  réessayer en utilisant votre application Orange Money ou MAX IT.
                </p>
              </div>

              {orderData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-gray-600">
                    Commande: <span className="font-mono font-semibold">{orderData.orderNumber}</span>
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRetryPayment}
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Réessayer le paiement
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État par défaut (ne devrait pas arriver)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">État inconnu</h2>
        <p className="text-gray-600 mb-4">
          Impossible de déterminer l'état du paiement
        </p>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default OrangeMoneyPaymentPage;
