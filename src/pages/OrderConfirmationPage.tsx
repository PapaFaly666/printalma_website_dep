import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  ExternalLink,
  Package,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Clock,
  CreditCard,
  CheckCheck
} from 'lucide-react';
import { paymentStatusService } from '../services/paymentStatusService';
import { PaymentStatus } from '../types/payment';
import { formatPriceInFRF as formatPrice } from '../utils/priceUtils';
import { usePaymentWebSocket } from '../hooks/usePaymentWebSocket';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderService, Order } from '../services/orderService';

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart(); // Ajout du hook pour vider le panier

  // Récupérer les paramètres de l'URL
  const orderNumber = searchParams.get('orderNumber') || '';
  const token = searchParams.get('token') || '';
  // Reconstruire paymentUrl depuis le token si absent (cas du cancel_url backend)
  const rawPaymentUrl = searchParams.get('paymentUrl') || '';
  const paymentUrl = rawPaymentUrl || (token ? `https://paydunya.com/checkout/invoice/${token}` : '');
  const totalAmount = searchParams.get('totalAmount') || '0';
  const email = searchParams.get('email') || '';
  const statusParam = searchParams.get('status'); // 'cancelled' quand PayDunya redirige depuis cancel_url
  const paymentMethodParam = searchParams.get('paymentMethod'); // 'ORANGE_MONEY' pour Orange Money

  // Si PayDunya redirige avec status=cancelled, on sait déjà que c'est échoué
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>(
    statusParam === 'cancelled' ? 'failed' : 'checking'
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // Nouvelle facture PayDunya créée pour retry (quand l'ancienne est expirée/annulée)
  const [retryPaymentUrl, setRetryPaymentUrl] = useState<string>('');
  const [retryToken, setRetryToken] = useState<string>('');
  const [isCreatingRetry, setIsCreatingRetry] = useState(false);

  // Sélecteur de méthode de paiement (SoftPay)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wave' | 'orange-money' | null>(null);
  const [omPhoneNumber, setOmPhoneNumber] = useState('');
  const [omLoading, setOmLoading] = useState(false);
  const [omError, setOmError] = useState<string | null>(null);

  // Orange Money QR Code data
  const [orangeMoneyData, setOrangeMoneyData] = useState<{
    qrCode: string;
    deepLinks: { MAXIT: string; OM: string };
    reference: string;
    orderNumber: string;
    totalAmount: number;
  } | null>(null);

  const orderService = new OrderService();

  // Callback stable (ne change pas entre re-renders) pour éviter
  // que usePaymentWebSocket relance sa connexion à chaque setState
  const handleWsStatusChange = useCallback((status: PaymentStatus) => {
    console.log('🔔 [OrderConfirmation] Mise à jour WebSocket reçue:', status);

    if (status === PaymentStatus.PAID) {
      setPaymentStatus('paid');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else if (status === PaymentStatus.FAILED || status === PaymentStatus.CANCELLED) {
      setPaymentStatus('failed');
    } else if (status === PaymentStatus.PENDING) {
      setPaymentStatus('pending');
    }
  }, []);

  // WebSocket désactivé - le polling HTTP suffit pour vérifier le statut
  const { isConnected: wsConnected } = usePaymentWebSocket({
    orderNumber,
    onStatusChange: handleWsStatusChange,
    enabled: false
  });

  // Charger les données Orange Money depuis localStorage
  useEffect(() => {
    if (paymentMethodParam === 'ORANGE_MONEY') {
      const storedData = localStorage.getItem('orangeMoneyPayment');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          console.log('🍊 [OrderConfirmation] Orange Money data loaded:', parsed);
          setOrangeMoneyData(parsed);
          // Nettoyer le localStorage après chargement
          localStorage.removeItem('orangeMoneyPayment');
        } catch (error) {
          console.error('❌ [OrderConfirmation] Erreur parsing Orange Money data:', error);
        }
      }
    }
  }, [paymentMethodParam]);

  // Polling continu du statut de paiement PayDunya (sans limite de temps)
  useEffect(() => {
    if (!token) {
      setPaymentStatus('pending');
      return;
    }

    // Si PayDunya a déjà indiqué cancelled via l'URL, pas besoin de poller
    if (statusParam === 'cancelled') {
      return;
    }

    console.log('🔄 [OrderConfirmation] Démarrage du polling continu pour token:', token);

    const checkInterval = 3000;

    let intervalId: ReturnType<typeof setInterval>;

    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 [OrderConfirmation] Vérification du statut...');

        const response = await paymentStatusService.checkPaymentStatus(token);

        console.log('📊 [OrderConfirmation] Résultat de la vérification:', response);

        if (response.status === PaymentStatus.PAID) {
          console.log('✅ [OrderConfirmation] Paiement confirmé !');
          setPaymentStatus('paid');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          clearInterval(intervalId);
          // Mise à jour du statut backend (filet de sécurité si webhook non reçu)
          if (orderData?.id) {
            paymentStatusService.updateOrderPaymentStatus(orderData.id, {
              payment_status: 'PAID',
              transaction_id: response.transaction_id || token,
            }).catch(err => console.error('⚠️ [OrderConfirmation] Erreur mise à jour statut:', err));
          }
          return;
        }

        if (response.status === PaymentStatus.FAILED || response.status === PaymentStatus.CANCELLED) {
          console.log('❌ [OrderConfirmation] Paiement échoué - arrêt du polling.');
          if (response.failure_reason) {
            console.error('💳 [OrderConfirmation] Raison d\'échec PayDunya:', response.failure_reason);
          }
          setPaymentStatus('failed');
          clearInterval(intervalId);
          return;
        }

        console.log('⏳ [OrderConfirmation] Paiement toujours en attente...');

      } catch (error) {
        console.error('❌ [OrderConfirmation] Erreur lors de la vérification:', error);
      }
    };

    intervalId = setInterval(checkPaymentStatus, checkInterval);
    checkPaymentStatus();

    return () => {
      clearInterval(intervalId);
    };
  }, [token]);

  // Polling pour Orange Money - vérification via l'endpoint /orders/number/:orderNumber
  useEffect(() => {
    // Activer uniquement si c'est un paiement Orange Money
    if (paymentMethodParam !== 'ORANGE_MONEY' || !orderNumber) {
      return;
    }

    console.log('🍊 [OrderConfirmation] Démarrage du polling Orange Money pour commande:', orderNumber);

    const checkInterval = 3000; // 3 secondes
    let intervalId: ReturnType<typeof setInterval>;

    const checkOrangeMoneyPaymentStatus = async () => {
      try {
        console.log('🔍 [OrderConfirmation] Vérification statut Orange Money...');

        const API_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
        const response = await fetch(`${API_URL}/orders/number/${orderNumber}`);

        if (!response.ok) {
          console.error('❌ [OrderConfirmation] Erreur récupération commande');
          return;
        }

        const data = await response.json();
        const order = data.data;

        console.log('📊 [OrderConfirmation] Statut commande Orange Money:', order.paymentStatus);

        if (order.paymentStatus === 'PAID') {
          console.log('✅ [OrderConfirmation] Paiement Orange Money confirmé !');
          setPaymentStatus('paid');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          clearInterval(intervalId);
          return;
        }

        if (order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED') {
          console.log('❌ [OrderConfirmation] Paiement Orange Money échoué');
          setPaymentStatus('failed');
          clearInterval(intervalId);
          return;
        }

        console.log('⏳ [OrderConfirmation] Paiement Orange Money en attente...');

      } catch (error) {
        console.error('❌ [OrderConfirmation] Erreur vérification Orange Money:', error);
      }
    };

    intervalId = setInterval(checkOrangeMoneyPaymentStatus, checkInterval);
    checkOrangeMoneyPaymentStatus();

    return () => {
      clearInterval(intervalId);
    };
  }, [paymentMethodParam, orderNumber]);

  // Charger les données de commande
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderNumber) {
        navigate('/');
        return;
      }

      try {
        setLoadingOrder(true);
        const order = await orderService.getOrderByNumber(orderNumber);
        console.log('📦 [OrderConfirmation] Données de commande chargées:', order);
        setOrderData(order);
      } catch (error) {
        console.error('❌ [OrderConfirmation] Erreur chargement commande:', error);
      } finally {
        setLoadingOrder(false);
      }
    };

    loadOrderData();
  }, [orderNumber, navigate]);

  // Vider le panier quand le paiement est confirmé comme réussi
  useEffect(() => {
    if (paymentStatus === 'paid') {
      console.log('🛒 [OrderConfirmation] Paiement réussi - Vidage du panier');
      clearCart();
    }
  }, [paymentStatus, clearCart]);

  // Si PayDunya redirige avec status=success → paiement confirmé directement
  useEffect(() => {
    if (statusParam === 'success' && token && orderData?.id) {
      console.log('✅ [OrderConfirmation] status=success détecté (PayDunya) - marquage PAID immédiat');
      setPaymentStatus('paid');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      paymentStatusService.updateOrderPaymentStatus(orderData.id, {
        payment_status: 'PAID',
        transaction_id: token,
      }).then(() => {
        console.log('✅ [OrderConfirmation] Statut commande mis à jour à PAID');
      }).catch(err => {
        console.error('⚠️ [OrderConfirmation] Erreur mise à jour statut:', err);
      });
    }
  }, [statusParam, token, orderData]);

  // Si Orange Money redirige avec status=success → paiement confirmé directement
  useEffect(() => {
    if (statusParam === 'success' && paymentMethodParam === 'ORANGE_MONEY' && orderData?.id) {
      console.log('✅ [OrderConfirmation] status=success détecté (Orange Money) - marquage PAID immédiat');
      setPaymentStatus('paid');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Le webhook Orange Money a déjà mis à jour le statut côté backend
      // Mais on force une vérification pour être sûr
      const API_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      fetch(`${API_URL}/orders/number/${orderNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data.data.paymentStatus !== 'PAID') {
            console.log('⚠️ [OrderConfirmation] Backend pas encore à jour, on attend le polling');
          } else {
            console.log('✅ [OrderConfirmation] Paiement Orange Money confirmé par le backend');
          }
        })
        .catch(err => {
          console.error('⚠️ [OrderConfirmation] Erreur vérification statut:', err);
        });
    }
  }, [statusParam, paymentMethodParam, orderData, orderNumber]);

  // Quand la commande est chargée et le paiement annulé → créer une nouvelle facture fraîche
  useEffect(() => {
    if (statusParam === 'cancelled' && orderData && !retryPaymentUrl && !isCreatingRetry) {
      createRetryInvoice(orderData);
    }
  }, [statusParam, orderData]);

  // Créer une nouvelle facture PayDunya fraîche pour l'ordre existant
  const createRetryInvoice = async (order: Order) => {
    setIsCreatingRetry(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      const customerName = [
        (order.shippingDetails as any)?.firstName,
        (order.shippingDetails as any)?.lastName
      ].filter(Boolean).join(' ') || 'Client';

      const response = await fetch(`${API_URL}/paydunya/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: {
            total_amount: order.totalAmount,
            description: `Commande ${orderNumber} - PrintAlma`,
          },
          store: { name: 'PrintAlma' },
          customer: {
            name: customerName,
            phone: (order as any).phoneNumber || '',
            email: email || '',
          },
          custom_data: {
            orderId: order.id,
            orderNumber: orderNumber,
          },
          actions: {
            callback_url: `${API_URL}/paydunya/webhook`,
            return_url: `${window.location.origin}/order-confirmation?orderNumber=${orderNumber}&totalAmount=${order.totalAmount}&email=${encodeURIComponent(email)}`,
            cancel_url: `${window.location.origin}/order-confirmation?orderNumber=${orderNumber}&status=cancelled`,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.redirect_url) {
        setRetryPaymentUrl(data.data.redirect_url);
        setRetryToken(data.data.token);
        console.log('✅ Nouvelle facture créée pour retry:', data.data.token);
      }
    } catch (err) {
      console.error('❌ Erreur création nouvelle facture retry:', err);
    } finally {
      setIsCreatingRetry(false);
    }
  };

  const handleRetryPayment = () => {
    const url = retryPaymentUrl || paymentUrl;
    if (url) {
      window.location.href = url;
    }
  };

  // Initier le paiement Orange Money via SoftPay
  // Doc: https://developers.paydunya.com/doc/FR/softpay
  const handleOrangeMoneyPayment = async () => {
    const activeToken = retryToken || token;
    if (!activeToken || !omPhoneNumber.trim()) return;

    setOmLoading(true);
    setOmError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
      const shippingDetails = orderData?.shippingDetails as any;
      const customerName = shippingDetails?.firstName
        ? `${shippingDetails.firstName} ${shippingDetails.lastName || ''}`.trim()
        : 'Client';

      const activeToken = retryToken || token;
      const response = await fetch(`${API_URL}/paydunya/softpay/orange-money`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_token: activeToken,
          customer_name: customerName,
          customer_email: email || '',
          phone_number: omPhoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        // Rediriger vers l'URL Orange Money retournée par PayDunya SoftPay
        window.location.href = data.data.url;
      } else {
        setOmError(data.message || 'Échec de l\'initiation du paiement Orange Money');
      }
    } catch {
      setOmError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setOmLoading(false);
    }
  };


  // Animation de confetti
  const ConfettiAnimation = () => (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720 - 360,
            opacity: 0
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            ease: 'linear',
            delay: Math.random() * 0.5
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AnimatePresence>
        {showConfetti && <ConfettiAnimation />}
      </AnimatePresence>

      {/* Header avec logo PrintAlma */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline text-sm font-medium text-gray-700">Retour</span>
            </button>

            {/* Logo PrintAlma */}
            <div className="flex items-center gap-2">
              <img
                src="/printalma_logo.svg"
                alt="PrintAlma"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>

            <div className="w-20" /> {/* Spacer pour centrer le logo */}
          </div>
        </div>
      </motion.div>

      {/* Container principal */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-2xl mx-auto">

          {/* Card principale */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >

            {/* Header simple avec icône de statut */}
            <div className="relative px-8 py-12 text-center bg-gray-800">

              {/* Icône animée */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={paymentStatus}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center relative"
                >
                  {paymentStatus === 'paid' ? (
                    <>
                      <CheckCircle2 className="w-14 h-14 text-white" />
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 border-4 border-white/30 rounded-full"
                      />
                    </>
                  ) : paymentStatus === 'checking' ? (
                    <Loader2 className="w-14 h-14 text-white animate-spin" />
                  ) : paymentStatus === 'failed' ? (
                    <AlertCircle className="w-14 h-14 text-white" />
                  ) : (
                    <Clock className="w-14 h-14 text-white" />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Titre animé */}
              <motion.h2
                key={paymentStatus + '-title'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl sm:text-4xl font-bold text-white mb-3"
              >
                {paymentStatus === 'paid'
                  ? 'Paiement réussi !'
                  : paymentStatus === 'failed'
                  ? 'Paiement échoué'
                  : paymentStatus === 'checking'
                  ? 'Vérification en cours...'
                  : 'Commande créée !'}
              </motion.h2>

              {/* Message */}
              <motion.p
                key={paymentStatus + '-message'}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-white/90 text-lg max-w-md mx-auto"
              >
                {paymentStatus === 'paid'
                  ? 'Votre paiement a été confirmé avec succès. Merci pour votre commande !'
                  : paymentStatus === 'checking'
                  ? 'Nous vérifions votre paiement en temps réel...'
                  : paymentStatus === 'failed'
                  ? 'Le paiement n\'a pas abouti. Veuillez réessayer.'
                  : 'Finalisez votre paiement pour confirmer votre commande.'}
              </motion.p>

              {/* Waves décoratives */}
              <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" className="w-full h-12 fill-current text-white">
                  <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                </svg>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="p-8 lg:p-12">

              {/* Numéro de commande */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">Numéro de commande</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {orderNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statut de vérification en cours */}
              <AnimatePresence mode="wait">
                {paymentStatus === 'checking' && (
                  <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <Loader2 className="w-6 h-6 text-gray-600 animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          Vérification automatique en cours
                        </p>
                        <p className="text-xs text-gray-600">
                          Nous vérifions votre paiement en temps réel. La page se mettra à jour automatiquement.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paiement réussi */}
                {paymentStatus === 'paid' && (
                  <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <CheckCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Paiement confirmé avec succès
                        </p>
                        <p className="text-xs text-green-700">
                          Votre commande est maintenant en cours de traitement.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paiement échoué */}
                {paymentStatus === 'failed' && (
                  <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          Le paiement n'a pas abouti
                        </p>
                        <p className="text-xs text-red-700 mb-3">
                          Votre commande est conservée. Choisissez une méthode ci-dessous pour payer.
                        </p>

                        {isCreatingRetry ? (
                          <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Préparation d'un nouveau lien de paiement...
                          </div>
                        ) : (retryPaymentUrl || paymentUrl) ? (
                          <button
                            onClick={handleRetryPayment}
                            className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Réessayer le paiement
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>



              {/* Orange Money QR Code Display */}
              {paymentMethodParam === 'ORANGE_MONEY' && orangeMoneyData && paymentStatus !== 'paid' && (
                <div className="mb-8">
                  <div className="bg-orange-50 rounded-lg p-8 border border-orange-200">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        🍊 Paiement Orange Money
                      </div>
                      <h3 className="text-2xl font-bold text-orange-900 mb-2">
                        Scannez le QR Code
                      </h3>
                      <p className="text-orange-700 text-sm">
                        Utilisez votre application MAX IT ou Orange Money
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                      <div className="flex justify-center">
                        <img
                          src={`data:image/png;base64,${orangeMoneyData.qrCode}`}
                          alt="QR Code Orange Money"
                          className="w-64 h-64 object-contain"
                        />
                      </div>
                    </div>

                    {/* Montant */}
                    <div className="bg-white rounded-lg p-4 mb-6 text-center border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(parseFloat(totalAmount))}
                      </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-orange-500">📱</span>
                        Comment payer :
                      </h4>
                      <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Ouvrez votre application <strong>MAX IT</strong> ou <strong>Orange Money</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Scannez le QR Code ci-dessus</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <span>Validez le paiement de <strong>{formatPrice(parseFloat(totalAmount))}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                          <span>Attendez la confirmation - cette page se mettra à jour automatiquement</span>
                        </li>
                      </ol>
                    </div>

                    {/* Mobile Deeplinks */}
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={orangeMoneyData.deepLinks.MAXIT}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-sm text-center transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ouvrir MAX IT
                      </a>
                      <a
                        href={orangeMoneyData.deepLinks.OM}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold text-sm text-center transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ouvrir Orange Money
                      </a>
                    </div>

                    {/* Reference */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        Référence: <span className="font-mono font-semibold text-gray-700">{orangeMoneyData.reference}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex flex-col gap-3">
                {/* Sélecteur de méthode de paiement - visible seulement si non payé */}
                <AnimatePresence>
                  {paymentStatus !== 'paid' && token && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700 text-center">
                        {paymentStatus === 'failed' ? 'Réessayer avec :' : 'Choisissez votre méthode de paiement :'}
                      </p>

                      {/* Boutons de sélection opérateur */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Wave */}
                        <button
                          onClick={() => setSelectedPaymentMethod('wave')}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border font-semibold transition-all ${
                            selectedPaymentMethod === 'wave'
                              ? 'border-gray-800 bg-gray-50 text-gray-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <img src="/wave-logo.png" alt="Wave" className="h-8 w-auto object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-sm">Wave</span>
                          {selectedPaymentMethod === 'wave' && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-gray-800 rounded-full" />
                          )}
                        </button>

                        {/* Orange Money */}
                        <button
                          onClick={() => setSelectedPaymentMethod('orange-money')}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border font-semibold transition-all ${
                            selectedPaymentMethod === 'orange-money'
                              ? 'border-gray-800 bg-gray-50 text-gray-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <img src="/om-logo.png" alt="Orange Money" className="h-8 w-auto object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-sm">Orange Money</span>
                          {selectedPaymentMethod === 'orange-money' && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-gray-800 rounded-full" />
                          )}
                        </button>
                      </div>

                      {/* Wave → redirection directe */}
                      {selectedPaymentMethod === 'wave' && (
                        <div>
                          {isCreatingRetry ? (
                            <div className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Préparation du paiement...
                            </div>
                          ) : (retryPaymentUrl || paymentUrl) ? (
                            <button
                              onClick={() => { window.location.href = retryPaymentUrl || paymentUrl; }}
                              className="w-full px-6 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-5 h-5" />
                              Payer avec Wave
                            </button>
                          ) : (
                            <div className="w-full px-6 py-4 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                              Lien de paiement indisponible
                            </div>
                          )}
                        </div>
                      )}

                      {/* Orange Money → SoftPay flow */}
                      {selectedPaymentMethod === 'orange-money' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Votre numéro Orange Money
                            </label>
                            <input
                              type="tel"
                              value={omPhoneNumber}
                              onChange={(e) => setOmPhoneNumber(e.target.value)}
                              placeholder="77XXXXXXX"
                              maxLength={9}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-800 transition-colors"
                            />
                          </div>
                          {omError && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {omError}
                            </p>
                          )}
                          <button
                            onClick={handleOrangeMoneyPayment}
                            disabled={omLoading || omPhoneNumber.trim().length < 9}
                            className="w-full px-6 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {omLoading ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Initiation en cours...</>
                            ) : (
                              <><CreditCard className="w-5 h-5" /> Payer avec Orange Money</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>

                {/* Bouton pour réessayer la vérification si timeout */}
                {paymentStatus === 'pending' && token && (
                  <button
                    onClick={handleRetryPayment}
                    className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Vérifier à nouveau le paiement
                  </button>
                )}

                {/* Bouton retour à l'accueil */}
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
