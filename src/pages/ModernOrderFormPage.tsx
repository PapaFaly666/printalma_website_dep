import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  CreditCard,
  Truck,
  Shield,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Lock,
  Edit3,
  Home
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../hooks/useOrder';
import { orderService, type CreateOrderRequest as OrderRequest } from '../services/orderService';
import { paymentStatusService } from '../services/paymentStatusService';
import { validatePaymentData } from '../types/payment';
import SimpleProductPreview from '../components/vendor/SimpleProductPreview';
import { formatPriceInFRF as formatPrice } from '../utils/priceUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
}

interface DeliveryOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description: string;
}

type Step = 'customer-info' | 'delivery' | 'payment' | 'review';

// 🆕 Composant pour afficher le produit avec navigation entre vues
const ProductPreviewWithViews: React.FC<{
  productData: any;
}> = ({ productData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedViewIndex, setSelectedViewIndex] = useState(0);

  // Traduire le viewType en français
  const getViewName = (viewType: string): string => {
    const viewNames: Record<string, string> = {
      'FRONT': 'Devant',
      'BACK': 'Arrière',
      'LEFT': 'Gauche',
      'RIGHT': 'Droite',
      'TOP': 'Dessus',
      'BOTTOM': 'Dessous',
      'DETAIL': 'Détail',
      'OTHER': 'Autre'
    };
    return viewNames[viewType?.toUpperCase()] || viewType || 'Vue';
  };

  // Récupérer toutes les vues disponibles
  const availableViews = React.useMemo(() => {
    if (!productData?.customizationIds) return [];

    return Object.keys(productData.customizationIds).map(viewKey => {
      const [colorId, viewId] = viewKey.split('-').map(Number);
      const delimitation = productData.delimitations?.find((d: any) => d.viewId === viewId);

      return {
        viewKey,
        colorId,
        viewId,
        viewType: delimitation?.viewType || 'OTHER',
        delimitation,
        imageUrl: delimitation?.imageUrl
      };
    });
  }, [productData?.customizationIds, productData?.delimitations]);

  const currentView = availableViews[selectedViewIndex];

  // Récupérer les éléments pour la vue actuelle
  const getCurrentViewElements = () => {
    if (!currentView || !productData?.designElementsByView) return [];
    return productData.designElementsByView[currentView.viewKey] || [];
  };

  const currentViewElements = getCurrentViewElements();
  const currentDelimitation = currentView?.delimitation;
  const currentImageUrl = currentDelimitation?.imageUrl || productData?.imageUrl;

  return (
    <div className="flex flex-col gap-3">
      {/* Conteneur de l'image avec personnalisations */}
      <div className="relative w-48 h-48 bg-white rounded-2xl border border-gray-200 flex items-center justify-center p-2">
        <div ref={containerRef} className="relative w-full h-full">
          {/* Image du produit */}
          <img
            key={currentImageUrl}
            ref={imgRef}
            src={currentImageUrl}
            alt={productData?.name}
            className="w-full h-full object-contain rounded"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Personnalisations superposées */}
          {imageLoaded && currentViewElements.length > 0 && currentDelimitation && (() => {
            if (!containerRef.current) return null;

            const rect = containerRef.current.getBoundingClientRect();
            const refWidth = currentDelimitation.referenceWidth || 800;
            const refHeight = currentDelimitation.referenceHeight || 800;
            const scaleX = rect.width / refWidth;
            const scaleY = rect.height / refHeight;
            const scale = Math.min(scaleX, scaleY);

            return (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                {currentViewElements.map((element: any, idx: number) => {
                  const left = element.x * rect.width;
                  const top = element.y * rect.height;
                  const scaledWidth = element.width * scale;
                  const scaledHeight = element.height * scale;
                  const scaledFontSize = element.type === 'text' ? (element.fontSize || 24) * scale : 0;

                  return (
                    <div
                      key={`element-${idx}`}
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                        transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                        transformOrigin: 'center center',
                        zIndex: element.zIndex || 0,
                      }}
                    >
                      {element.type === 'text' ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: element.textAlign || 'center',
                            fontSize: `${scaledFontSize}px`,
                            fontFamily: element.fontFamily || 'Arial',
                            color: element.color || '#000000',
                            fontWeight: element.fontWeight || 'normal',
                            fontStyle: element.fontStyle || 'normal',
                            textDecoration: element.textDecoration || 'none',
                            textAlign: element.textAlign || 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            lineHeight: 1,
                          }}
                        >
                          {element.text}
                        </div>
                      ) : element.type === 'image' ? (
                        <img
                          src={element.imageUrl}
                          alt="Design"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Navigation entre les vues */}
      {availableViews.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {availableViews.map((view, index) => (
            <button
              key={view.viewKey}
              onClick={() => setSelectedViewIndex(index)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedViewIndex === index
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={getViewName(view.viewType)}
            >
              {getViewName(view.viewType)}
            </button>
          ))}
        </div>
      )}

      {/* Badge informatif */}
      {availableViews.length > 0 && (
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✨ {availableViews.length} vue{availableViews.length > 1 ? 's' : ''} personnalisée{availableViews.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

const ModernOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { items: cartItems, clearCart } = useCart();
  const { loading: orderLoading, error: orderError } = useOrder();

  // Récupérer les données du produit depuis le panier (premier article)
  const cartItem = cartItems[0];
  const productData = cartItem;

  // États
  const [currentStep, setCurrentStep] = useState<Step>('customer-info');
  const [formData, setFormData] = useState<OrderFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Sénégal',
    notes: ''
  });
  const [selectedDelivery, setSelectedDelivery] = useState<string>('standard');
  const [selectedPayment, setSelectedPayment] = useState<string>('paydunya');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrderFormData> & { delivery?: string; payment?: string }>({});

  // Rediriger si panier vide
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/');
    }
  }, [cartItems, navigate]);

  // Transformer les données du produit pour SimpleProductPreview
  const getProductForPreview = () => {
    if (!productData) return null;

    return {
      id: Number(productData.productId),
      vendorName: productData.name,
      price: productData.price || 0,
      adminProduct: {
        id: productData.adminProductId || productData.productId,
        name: productData.name,
        colorVariations: [{
          id: 1,
          name: productData.color,
          colorCode: productData.colorCode,
          images: [{
            id: 1,
            url: productData.imageUrl,
            viewType: 'Front',
            delimitations: productData.delimitations || []
          }]
        }]
      },
      designApplication: {
        hasDesign: !!productData.designUrl,
        designUrl: productData.designUrl || '',
        positioning: 'center',
        scale: productData.designScale || 0.8
      },
      designPositions: productData.designId ? [{
        designId: productData.designId,
        position: {
          x: 0,
          y: 0,
          scale: productData.designScale || 0.8,
          rotation: 0,
          constraints: {
            minScale: 0.1,
            maxScale: 3.0
          },
          designWidth: 200,
          designHeight: 200,
          designScale: productData.designScale || 0.8
        }
      }] : [],
      designTransforms: [],
      designId: productData.designId || undefined,
      selectedColors: [{
        id: 1,
        name: productData.color,
        colorCode: productData.colorCode
      }],
      images: {
        adminReferences: [{
          colorName: productData.color || '',
          colorCode: productData.colorCode || '',
          adminImageUrl: productData.imageUrl || '',
          imageType: 'base' as const
        }],
        total: 1,
        primaryImageUrl: productData.imageUrl || ''
      },
      isWizardProduct: false,
      status: 'approved'
    };
  };

  // Options de livraison
  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'standard',
      name: 'Livraison Standard',
      price: 1500,
      estimatedDays: 3,
      description: 'Livraison à domicile sous 3-5 jours'
    },
    {
      id: 'express',
      name: 'Livraison Express',
      price: 3000,
      estimatedDays: 1,
      description: 'Livraison en 24h (Dakar uniquement)'
    },
    {
      id: 'pickup',
      name: 'Retrait en magasin',
      price: 0,
      estimatedDays: 0,
      description: 'Retrait gratuit dans nos locaux'
    }
  ];

  // Calculs - Utiliser le prix suggéré par le vendeur si disponible, sinon le prix de base
  const productPrice = cartItem?.suggestedPrice || cartItem?.price || 0;
  const shippingFee = deliveryOptions.find(d => d.id === selectedDelivery)?.price || 0;
  const subtotal = productPrice; // Pas de division par 100, le prix est déjà en FCFA
  const total = subtotal + shippingFee;

  // Debug: afficher les valeurs de calcul
  console.log('🔍 [ModernOrderForm] Debug prix:', {
    cartItem: cartItem,
    suggestedPrice: cartItem?.suggestedPrice,
    price: cartItem?.price,
    productPrice: productPrice,
    subtotal: subtotal,
    shippingFee: shippingFee,
    total: total
  });

  // Configuration des étapes
  const steps = [
    { id: 'customer-info', label: 'Informations', icon: User },
    { id: 'delivery', label: 'Livraison', icon: Truck },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'review', label: 'Confirmation', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Validation par étape
  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<OrderFormData> = {};

    if (step === 'customer-info') {
      if (!formData.firstName && !formData.lastName) {
        newErrors.firstName = 'Au moins un prénom ou nom requis';
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email valide requis';
      }
      if (!formData.phone || !/^(70|75|76|77|78|33)[0-9]{7}$/.test(formData.phone.replace(/\s+/g, ''))) {
        newErrors.phone = 'Téléphone valide requis';
      }
      if (!formData.address) newErrors.address = 'Adresse requise';
      if (!formData.city) newErrors.city = 'Ville requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre étapes
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id as Step);
      }
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id as Step);
    }
  };

  // Génération de numéro de commande
  const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  // Traitement du paiement PayDunya
  const processPayDunyaPayment = async () => {
    try {
      setIsSubmitting(true);

      const productId = Number(productData?.productId);
      if (!productId || productId <= 0) {
        throw new Error(`Invalid productId: ${productData?.productId}`);
      }

      const orderRequest: OrderRequest = {
        email: formData.email,
        shippingDetails: {
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          street: formData.address,
          city: formData.city,
          region: formData.city,
          postalCode: formData.postalCode || undefined,
          country: formData.country,
        },
        phoneNumber: formData.phone,
        notes: formData.notes || undefined,
        orderItems: [{
          productId: productId,
          quantity: 1,
          unitPrice: productData?.price || 0,
          size: productData?.size,
          color: productData?.color,
          colorId: 1,
          // 🎨 Données de design depuis le panier
          vendorProductId: productData?.vendorProductId,
          mockupUrl: productData?.mockupUrl,
          designId: productData?.designId,
          designPositions: productData?.designPositions,
          designMetadata: productData?.designMetadata,
          delimitation: productData?.delimitation,
          // 🆕 Personnalisations
          customizationId: productData?.customizationId,
          customizationIds: productData?.customizationIds,
          designElements: productData?.designElements,
          designElementsByView: productData?.designElementsByView,
        }],
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true,
      };

      const orderResponse = orderService.isUserAuthenticated()
        ? await orderService.createOrderWithPayment(orderRequest)
        : await orderService.createGuestOrder(orderRequest);

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Échec de la création de commande');
      }

      const paymentData = orderResponse.data.payment;
      if (!paymentData) {
        throw new Error('Données de paiement PayDunya manquantes');
      }

      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Données de paiement incomplètes: ${validation.missingFields.join(', ')}`);
      }

      const retrievedPaymentUrl = paymentData.redirect_url || paymentData.payment_url;
      if (!retrievedPaymentUrl) {
        throw new Error('URL de paiement PayDunya manquante');
      }

      const pendingPaymentData = {
        orderId: orderResponse.data.id,
        orderNumber: orderResponse.data.orderNumber,
        token: paymentData.token,
        totalAmount: orderResponse.data.totalAmount,
        timestamp: Date.now(),
      };

      paymentStatusService.savePendingPayment(pendingPaymentData);

      // Rediriger l'onglet actuel vers PayDunya
      // PayDunya redirigera automatiquement vers /order-confirmation après le paiement
      console.log('🔄 [ModernOrderForm] Redirection vers PayDunya:', retrievedPaymentUrl);
      window.location.href = retrievedPaymentUrl;

    } catch (error: any) {
      console.error('Erreur lors du processus de commande:', error);

      let errorMessage = 'Erreur lors du traitement du paiement';
      if (error.response?.status === 400) {
        errorMessage = 'Veuillez vérifier vos informations';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors(prev => ({
        ...prev,
        payment: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soumission finale
  const handleFinalSubmit = async () => {
    if (selectedPayment === 'paydunya') {
      await processPayDunyaPayment();
    } else {
      // Pour le paiement à la livraison, créer la commande directement
      setIsSubmitting(true);

      try {
        // Préparer les données de commande
        const orderRequest: OrderRequest = {
          email: formData.email,
          shippingDetails: {
            firstName: formData.firstName || undefined,
            lastName: formData.lastName || undefined,
            street: formData.address,
            city: formData.city,
            region: formData.city,
            postalCode: formData.postalCode || undefined,
            country: formData.country,
          },
          phoneNumber: formData.phone,
          notes: formData.notes || undefined,
          orderItems: [{
            productId: Number(productData?.productId),
            quantity: 1,
            unitPrice: productData?.price || 0,
            size: productData?.size,
            color: productData?.color,
            colorId: 1,
            // 🎨 Données de design depuis le panier
            vendorProductId: productData?.vendorProductId,
            mockupUrl: productData?.mockupUrl,
            designId: productData?.designId,
            designPositions: productData?.designPositions,
            designMetadata: productData?.designMetadata,
            delimitation: productData?.delimitation,
            // 🆕 Personnalisations
            customizationId: productData?.customizationId,
            customizationIds: productData?.customizationIds,
            designElements: productData?.designElements,
            designElementsByView: productData?.designElementsByView,
          }],
          paymentMethod: 'CASH_ON_DELIVERY',
          initiatePayment: false,
        };

        // Créer la commande
        const orderResponse = orderService.isUserAuthenticated()
          ? await orderService.createOrderWithPayment(orderRequest)
          : await orderService.createGuestOrder(orderRequest);

        if (orderResponse.success && orderResponse.data) {
          console.log('📦 [ModernOrderForm] Commande créée avec succès:', orderResponse.data.orderNumber);
          console.log('💡 [ModernOrderForm] Le panier sera vidé après confirmation du paiement');

          // Rediriger vers la page de confirmation
          const confirmationUrl = `/order-confirmation?orderNumber=${encodeURIComponent(orderResponse.data.orderNumber)}&totalAmount=${encodeURIComponent(total)}&email=${encodeURIComponent(formData.email)}`;
          navigate(confirmationUrl);
        }

      } catch (error) {
        console.error('Erreur lors de la commande:', error);
        setErrors(prev => ({
          ...prev,
          payment: 'Erreur lors de la création de la commande. Veuillez réessayer.',
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof OrderFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe avec progression */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Barre de progression moderne */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.1 : 1,
                            backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb'
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isCompleted ? 'text-white' : isActive ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </motion.div>
                        <span className={`text-xs mt-2 font-medium hidden sm:block ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>

                      {index < steps.length - 1 && (
                        <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-600 to-green-500"
                            initial={{ width: '0%' }}
                            animate={{ width: index < currentStepIndex ? '100%' : '0%' }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="w-10" /> {/* Spacer pour équilibrer */}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Colonne gauche : Formulaire avec transitions */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {/* Étape 1 : Informations client */}
                {currentStep === 'customer-info' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Vos informations</h2>
                        <p className="text-sm text-gray-500">Pour la livraison et le suivi de commande</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Jean"
                        />
                        {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Dupont"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="jean.dupont@email.com"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="77 123 45 67"
                          />
                        </div>
                        {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse complète <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors.address ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="123 Rue de la République"
                          />
                        </div>
                        {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ville <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Dakar"
                        />
                        {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code postal
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="12000"
                        />
                      </div>
                    </div>

                    <button
                      onClick={goToNextStep}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      Continuer
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Étape 2 : Livraison */}
                {currentStep === 'delivery' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Mode de livraison</h2>
                        <p className="text-sm text-gray-500">Choisissez votre option préférée</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {deliveryOptions.map((option) => (
                        <motion.label
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                            selectedDelivery === option.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <input
                              type="radio"
                              name="delivery"
                              value={option.id}
                              checked={selectedDelivery === option.id}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-semibold text-gray-900">{option.name}</p>
                                <p className="font-bold text-gray-900">
                                  {option.price === 0 ? 'Gratuit' : formatPrice(option.price)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              {option.estimatedDays > 0 && (
                                <p className="text-xs text-blue-600 mt-2">
                                  Livraison estimée: {option.estimatedDays} jour{option.estimatedDays > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200"
                      >
                        Retour
                      </button>
                      <button
                        onClick={goToNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        Continuer
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Étape 3 : Paiement */}
                {currentStep === 'payment' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <CreditCard className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Mode de paiement</h2>
                        <p className="text-sm text-gray-500">Sélectionnez votre méthode préférée</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`block p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                          selectedPayment === 'paydunya'
                            ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="radio"
                            name="payment"
                            value="paydunya"
                            checked={selectedPayment === 'paydunya'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="mt-1 w-5 h-5 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Lock className="w-5 h-5 text-green-600" />
                              <p className="font-bold text-gray-900 text-lg">PayDunya</p>
                              <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                Recommandé
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              Paiement sécurisé avec toutes les principales méthodes de paiement mobile et bancaire
                            </p>

                            {/* Méthodes disponibles */}
                            {selectedPayment === 'paydunya' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 p-4 bg-white rounded-xl border border-blue-200"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <Shield className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-semibold text-gray-900">Méthodes disponibles</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {['📱 Orange Money', '💰 Wave', '📲 Free Money', '💳 Carte bancaire', '🏦 MTN Money', '💵 Moov Money'].map((method) => (
                                    <div key={method} className="px-3 py-2 bg-gray-50 rounded-lg text-xs font-medium text-gray-700 text-center">
                                      {method}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-blue-800">
                                    💡 <span className="font-semibold">Comment ça marche ?</span> Vous serez redirigé vers PayDunya pour choisir votre méthode et finaliser le paiement en toute sécurité.
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.label>

                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`block p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                          selectedPayment === 'cash'
                            ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="radio"
                            name="payment"
                            value="cash"
                            checked={selectedPayment === 'cash'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="mt-1 w-5 h-5 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">💵</span>
                              <p className="font-bold text-gray-900 text-lg">Paiement à la livraison</p>
                            </div>
                            <p className="text-sm text-gray-600">
                              Payez en espèces lors de la réception de votre commande
                            </p>
                          </div>
                        </div>
                      </motion.label>
                    </div>

                    {errors.payment && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <p className="text-sm text-red-600 font-medium">{errors.payment}</p>
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200"
                      >
                        Retour
                      </button>
                      <button
                        onClick={goToNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        Continuer
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Étape 4 : Confirmation */}
                {currentStep === 'review' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Vérification finale</h2>
                        <p className="text-sm text-gray-500">Confirmez votre commande</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Récap informations */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Informations de livraison
                          </h3>
                          <button
                            onClick={() => setCurrentStep('customer-info')}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Modifier
                          </button>
                        </div>
                        <div className="text-sm space-y-1 text-gray-700">
                          <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                          <p>{formData.email}</p>
                          <p>{formData.phone}</p>
                          <p>{formData.address}</p>
                          <p>{formData.city} {formData.postalCode}</p>
                        </div>
                      </div>

                      {/* Récap livraison */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Livraison
                          </h3>
                          <button
                            onClick={() => setCurrentStep('delivery')}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Modifier
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 font-medium">
                          {deliveryOptions.find(d => d.id === selectedDelivery)?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {deliveryOptions.find(d => d.id === selectedDelivery)?.description}
                        </p>
                      </div>

                      {/* Récap paiement */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Paiement
                          </h3>
                          <button
                            onClick={() => setCurrentStep('payment')}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Modifier
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedPayment === 'paydunya' ? 'PayDunya - Paiement sécurisé' : 'Paiement à la livraison'}
                        </p>
                      </div>

                      {/* Sécurité */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-900 mb-1">Paiement 100% sécurisé</h4>
                            <p className="text-sm text-green-700">
                              Vos données sont protégées et cryptées. Nous ne stockons aucune information bancaire.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-2xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-5 h-5" />
                            Confirmer ({formatPrice(total)})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Colonne droite : Résumé sticky */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <ShoppingBag className="w-6 h-6 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Résumé de la commande</h3>
              </div>

              {/* Produit avec preview */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex justify-center mb-4">
                  {/* 🆕 Utiliser ProductPreviewWithViews si customisations disponibles */}
                  {productData?.customizationIds && productData?.designElementsByView ? (
                    <ProductPreviewWithViews productData={productData} />
                  ) : getProductForPreview() ? (
                    <div className="w-48 h-48">
                      <SimpleProductPreview
                        product={getProductForPreview()!}
                        imageObjectFit="contain"
                        className="w-full h-full"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-gray-900 mb-2">{productData?.name}</h4>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-3">
                    <span>Couleur: {productData?.color}</span>
                    <span>•</span>
                    <span>Taille: {productData?.size}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPrice(productPrice)}
                  </div>
                </div>
              </div>

              {/* Totaux */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium">
                    {shippingFee === 0 ? 'Gratuit' : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Badges de confiance */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Livraison rapide et fiable</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>Garantie satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernOrderFormPage;
