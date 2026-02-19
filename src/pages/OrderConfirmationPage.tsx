import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  ExternalLink,
  Mail,
  Package,
  Truck,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Sparkles,
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
import { OrderProductPreview } from '../components/order/OrderProductPreview';

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

  // Fonction pour forcer une vérification manuelle du statut du paiement
  const handleForceCheckPayment = async () => {
    if (!token) {
      console.log('❌ [OrderConfirmation] Aucun token disponible pour la vérification');
      return;
    }

    console.log('🔍 [OrderConfirmation] Vérification manuelle forcée pour token:', token);
    setPaymentStatus('checking');

    try {
      const response = await paymentStatusService.checkPaymentStatus(token);
      console.log('📊 [OrderConfirmation] Résultat de la vérification forcée:', response);

      if (response.status === PaymentStatus.PAID) {
        console.log('✅ [OrderConfirmation] Paiement confirmé lors de la vérification forcée !');
        setPaymentStatus('paid');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else if (response.status === PaymentStatus.FAILED || response.status === PaymentStatus.CANCELLED) {
        console.log('❌ [OrderConfirmation] Paiement vraiment échoué (vérification forcée)');
        setPaymentStatus('failed');
      } else {
        console.log('⏳ [OrderConfirmation] Paiement toujours en attente (vérification forcée)');
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('❌ [OrderConfirmation] Erreur lors de la vérification forcée:', error);
      setPaymentStatus('pending');
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

            {/* Header coloré avec icône de statut - Branding PrintAlma */}
            <div className={`relative px-8 py-12 text-center ${
              paymentStatus === 'paid'
                ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                : paymentStatus === 'checking'
                ? 'bg-[#049be5]'
                : paymentStatus === 'failed'
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}>

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

              {/* Numéro de commande avec animation - PrintAlma Branding */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#049be5]/5 to-[#049be5]/10 rounded-2xl p-6 mb-8 border-2 border-[#049be5]/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#049be5]/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#049be5]/5 rounded-full blur-2xl" />

                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-[#049be5]" />
                      <p className="text-sm font-medium text-gray-600">Numéro de commande</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-[#049be5]">
                      {orderNumber}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Sparkles className="w-8 h-8 text-[#049be5]" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Statut de vérification en cours */}
              <AnimatePresence mode="wait">
                {paymentStatus === 'checking' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="mb-8 bg-gradient-to-r from-[#049be5]/5 to-[#049be5]/10 border-2 border-[#049be5]/30 rounded-2xl p-6 relative overflow-hidden"
                  >
                    {/* Animation de fond */}
                    <motion.div
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: 'linear'
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#049be5]/10 to-transparent"
                    />

                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        >
                          <Loader2 className="w-6 h-6 text-[#049be5]" />
                        </motion.div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-900">
                            Vérification automatique en cours
                          </p>
                          {wsConnected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200"
                            >
                              <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 bg-emerald-500 rounded-full"
                              />
                              En direct
                            </motion.span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 mb-3">
                          Nous vérifions votre paiement en temps réel. La page se mettra à jour automatiquement.
                        </p>

                        {/* Points de chargement animés */}
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                delay: i * 0.2
                              }}
                              className="w-2 h-2 bg-[#049be5] rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Paiement réussi */}
                {paymentStatus === 'paid' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        <CheckCheck className="w-6 h-6 text-green-600" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Paiement confirmé avec succès !
                        </p>
                        <p className="text-xs text-green-700">
                          Votre commande est maintenant en cours de traitement. Vous recevrez une confirmation par email.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Paiement échoué */}
                {paymentStatus === 'failed' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          Le paiement n'a pas abouti
                        </p>
                        <p className="text-xs text-red-700 mb-3">
                          Votre commande est conservée. Choisissez une méthode ci-dessous pour payer.
                        </p>

                        {/* Bouton réessayer rapide */}
                        {isCreatingRetry ? (
                          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Préparation d'un nouveau lien de paiement...
                          </div>
                        ) : (retryPaymentUrl || paymentUrl) ? (
                          <button
                            onClick={handleRetryPayment}
                            className="w-full bg-[#049be5] hover:bg-[#0388cc] text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Réessayer le paiement
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Détails de la commande - PrintAlma Branding */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 mb-8"
              >
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#049be5]/10 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#049be5]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email de confirmation</p>
                      <p className="text-sm font-medium text-gray-900">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#049be5]/10 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#049be5]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Montant total</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(parseFloat(totalAmount) || orderData?.totalAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      paymentStatus === 'paid'
                        ? 'bg-emerald-50'
                        : paymentStatus === 'checking'
                        ? 'bg-[#049be5]/10'
                        : 'bg-amber-50'
                    }`}>
                      <Truck className={`w-5 h-5 ${
                        paymentStatus === 'paid'
                          ? 'text-emerald-600'
                          : paymentStatus === 'checking'
                          ? 'text-[#049be5]'
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Statut du paiement</p>
                      <p className={`text-sm font-semibold ${
                        paymentStatus === 'paid'
                          ? 'text-emerald-600'
                          : paymentStatus === 'checking'
                          ? 'text-[#049be5]'
                          : paymentStatus === 'failed'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}>
                        {paymentStatus === 'paid'
                          ? 'Payé ✓'
                          : paymentStatus === 'checking'
                          ? 'Vérification...'
                          : paymentStatus === 'failed'
                          ? 'Échoué'
                          : 'En attente'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Produits commandés */}
              {!loadingOrder && orderData && orderData.orderItems && orderData.orderItems.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#049be5]" />
                    Produits commandés
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orderData.orderItems.map((item: any, index: number) => {
                      console.log('🎨 [OrderConfirmation] Item reçu:', item);

                      // Extraire les données depuis enrichedVendorProduct
                      const enriched = item.enrichedVendorProduct;
                      console.log('🎨 [OrderConfirmation] enrichedVendorProduct:', enriched);

                      // Trouver l'image mockup pour la couleur commandée
                      let mockupUrl = null;
                      if (enriched?.adminProduct?.colorVariations) {
                        const colorVar = enriched.adminProduct.colorVariations.find(
                          (cv: any) => cv.colorCode === item.colorVariation?.colorCode
                        );
                        mockupUrl = colorVar?.images?.[0]?.url || enriched.images?.primaryImageUrl;
                      }

                      // Extraire le design et sa position
                      const hasDesign = enriched?.designApplication?.hasDesign;
                      const designUrl = enriched?.designApplication?.designUrl;
                      const designPosition = enriched?.designPositions?.[0]?.position || {
                        x: 0,
                        y: 0,
                        scale: enriched?.designApplication?.scale || 0.8,
                        rotation: 0
                      };

                      // Extraire la première délimitation
                      const delimitation = enriched?.designDelimitations?.[0];

                      console.log('🎨 [OrderConfirmation] Données extraites:', {
                        mockupUrl,
                        hasDesign,
                        designUrl,
                        designPosition,
                        delimitation
                      });

                      return (
                        <OrderProductPreview
                          key={index}
                          product={{
                            id: item.productId || item.id,
                            name: item.product?.name || enriched?.vendorName || 'Produit',
                            quantity: item.quantity,
                            unitPrice: item.unitPrice || 0,
                            colorName: item.colorVariation?.name || item.color,
                            colorCode: item.colorVariation?.colorCode,
                            size: item.size,
                            mockupImageUrl: mockupUrl,
                            designImageUrl: hasDesign ? designUrl : null,
                            designPosition: designPosition,
                            delimitation: delimitation
                          }}
                          className="aspect-square"
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Boutons d'action */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-3"
              >
                {/* Sélecteur de méthode de paiement - visible seulement si non payé */}
                <AnimatePresence>
                  {paymentStatus !== 'paid' && token && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-semibold text-gray-700 text-center">
                        {paymentStatus === 'failed' ? 'Réessayer avec :' : 'Choisissez votre méthode de paiement :'}
                      </p>

                      {/* Boutons de sélection opérateur */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Wave */}
                        <button
                          onClick={() => setSelectedPaymentMethod('wave')}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all ${
                            selectedPaymentMethod === 'wave'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <img src="/wave-logo.png" alt="Wave" className="h-8 w-auto object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-sm">Wave</span>
                          {selectedPaymentMethod === 'wave' && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full" />
                          )}
                        </button>

                        {/* Orange Money */}
                        <button
                          onClick={() => setSelectedPaymentMethod('orange-money')}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all ${
                            selectedPaymentMethod === 'orange-money'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                          }`}
                        >
                          <img src="/om-logo.png" alt="Orange Money" className="h-8 w-auto object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="text-sm">Orange Money</span>
                          {selectedPaymentMethod === 'orange-money' && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full" />
                          )}
                        </button>
                      </div>

                      {/* Wave → redirection directe */}
                      {selectedPaymentMethod === 'wave' && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {isCreatingRetry ? (
                            <div className="w-full px-6 py-4 bg-blue-100 text-blue-700 rounded-xl font-semibold flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Préparation du paiement...
                            </div>
                          ) : (retryPaymentUrl || paymentUrl) ? (
                            <button
                              onClick={() => { window.location.href = retryPaymentUrl || paymentUrl; }}
                              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                              <ExternalLink className="w-5 h-5" />
                              Payer avec Wave
                            </button>
                          ) : (
                            <div className="w-full px-6 py-4 bg-gray-100 text-gray-500 rounded-xl text-sm text-center">
                              Lien de paiement indisponible
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Orange Money → SoftPay flow */}
                      {selectedPaymentMethod === 'orange-money' && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
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
                              className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors"
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
                            className="w-full px-6 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
                          >
                            {omLoading ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Initiation en cours...</>
                            ) : (
                              <><CreditCard className="w-5 h-5" /> Payer avec Orange Money</>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bouton pour réessayer la vérification si timeout */}
                {paymentStatus === 'pending' && token && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleRetryPayment}
                    className="w-full px-6 py-4 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Vérifier à nouveau le paiement
                  </motion.button>
                )}

                {/* Bouton retour à l'accueil */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Retour à l'accueil
                </motion.button>
              </motion.div>

              {/* Note informative */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl"
              >
                <p className="text-xs text-blue-800 text-center flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>
                    Un email de confirmation a été envoyé à <strong>{email}</strong>
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer avec conseils */}
          {paymentStatus !== 'paid' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Besoin d'aide ?
              </h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Assurez-vous d'avoir finalisé le paiement sur PayDunya</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>La vérification peut prendre quelques secondes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Cette page se met à jour automatiquement, pas besoin de rafraîchir</span>
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
