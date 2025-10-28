import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { usePaytech } from '../hooks/usePaytech';
import { useOrder } from '../hooks/useOrder';
import { paytechService, type CreateOrderRequest } from '../services/paytechService';
import { orderService, type CreateOrderRequest as OrderRequest } from '../services/orderService';
import SimpleProductPreview from '../components/vendor/SimpleProductPreview';
import { formatPrice } from '../utils/priceUtils';

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

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'mobile' | 'card' | 'transfer';
}

const OrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, items: cartItems, clearCart } = useCart();
  const {
    createOrder,
    loading: orderLoading,
    error: orderError,
    currentOrder
  } = useOrder();
  const {
    initiatePaymentAndRedirect,
    loading: paytechLoading,
    error: paytechError,
    getAvailableMethods
  } = usePaytech();

  // Récupérer les données du produit depuis le panier (premier article)
  const cartItem = cartItems[0];
  const productData = cartItem;

  // Transformer les données du produit pour SimpleProductPreview
  const getProductForPreview = () => {
    if (!productData) return null;

    return {
      id: Number(productData.id),
      vendorName: productData.name,
      price: productData.price || 0,
      adminProduct: {
        id: productData.adminProductId,
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
      // Ajouter les positions de design avec coordonnées par défaut
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

  // États du formulaire
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

  // États additionnels pour la commande
  const [selectedDelivery, setSelectedDelivery] = useState<string>('standard');
  const [selectedPayment, setSelectedPayment] = useState<string>('paytech');
  const [selectedPayTechMethod, setSelectedPayTechMethod] = useState<string>('orange_money');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  // Obtenir les méthodes de paiement disponibles depuis le hook
  const availablePaymentMethods = getAvailableMethods();

  // Vérifier si le panier est vide
  useEffect(() => {
    if (!cartItem) {
      navigate('/');
      return;
    }
  }, [cartItem, navigate]);

  // États de chargement et erreurs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrderFormData> & { delivery?: string; payment?: string }>({});

  // Note: Les retours de paiement sont maintenant gérés par des pages dédiées
  // /payment/success et /payment/cancel (voir documentation PayTech)
  // Cette page se concentre uniquement sur la création de commande et l'initialisation du paiement

  // Options de livraison
  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'standard',
      name: 'Livraison Standard',
      price: 1500,
      estimatedDays: 3,
      description: 'Livraison à domicile dans un délai de 3-5 jours ouvrables'
    },
    {
      id: 'express',
      name: 'Livraison Express',
      price: 3000,
      estimatedDays: 1,
      description: 'Livraison urgente à domicile dans 24h (Dakar uniquement)'
    },
    {
      id: 'pickup',
      name: 'Retrait Magasin',
      price: 0,
      estimatedDays: 0,
      description: 'Retrait gratuit dans nos locaux à Dakar Plateau'
    }
  ];

  // Méthodes de paiement PayTech selon la documentation officielle
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paytech',
      name: 'PayTech (Paiement sécurisé)',
      icon: '💳',
      description: 'Wave, Orange Money, Free Money, Cartes bancaires, PayPal',
      type: 'card'
    },
    {
      id: 'cash',
      name: 'Paiement à la livraison',
      icon: '💵',
      description: 'Paiement en espèces à la réception du colis',
      type: 'transfer'
    }
  ];

  // Options spécifiques de paiement PayTech selon la documentation et le hook
  const payTechPaymentOptions = availablePaymentMethods.filter(method =>
    ['wave', 'orange_money', 'free_money', 'carte_bancaire', 'paypal'].includes(method.id)
  ).map(method => ({
    id: method.id,
    name: method.name,
    icon: method.icon,
    description: method.description
  }));

  // Calculs
  const productPrice = cartItem?.price || 0;
  const shippingFee = deliveryOptions.find(d => d.id === selectedDelivery)?.price || 0;
  const totalAmount = (productPrice / 100) + shippingFee;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + (deliveryOptions.find(d => d.id === selectedDelivery)?.estimatedDays || 3));

  // Effacer les erreurs quand l'utilisateur commence à taper
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur correspondante
    if (errors[name as keyof OrderFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit trouvé</h2>
          <p className="text-gray-600 mb-4">Veuillez sélectionner un produit avant de continuer.</p>
          <button
            onClick={() => navigate('/personnalisation')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> & { delivery?: string; payment?: string } = {};

    // Validation des informations personnelles
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^(70|75|76|77|78|33)[0-9]{7}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Format invalide. Ex: 77 123 45 67';
    }

    // Validation de l'adresse
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Le code postal est requis';

    // Validation du paiement
    if (!selectedPayment) newErrors.payment = 'Veuillez sélectionner une méthode de paiement';

    // Afficher les erreurs de commande ou PayTech si présentes
    if (orderError) {
      newErrors.payment = orderError;
    } else if (paytechError) {
      newErrors.payment = paytechError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Génération de numéro de commande
  const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  // Paiement PayTech via création de commande réelle
  const processPayTechPayment = async () => {
    try {
      console.log('🛒 [OrderForm] Création de commande réelle avec paiement PayTech');

      // Préparer les données de commande selon le format attendu par le backend
      const orderRequest: OrderRequest = {
        shippingDetails: {
          shippingName: `${formData.firstName} ${formData.lastName}`,
          shippingStreet: formData.address,
          shippingCity: formData.city,
          shippingRegion: formData.city, // Utiliser la ville comme région
          shippingPostalCode: formData.postalCode,
          shippingCountry: formData.country,
        },
        phoneNumber: formData.phone,
        notes: formData.notes || '',
        orderItems: [{
          productId: Number(productData?.id) || 0,
          quantity: 1,
          size: productData?.size,
          color: productData?.color,
          colorId: 1, // Valeur par défaut car colorId n'existe pas dans CartItem
        }],
        paymentMethod: 'PAYTECH',
        initiatePayment: true, // Important: demander l'initialisation du paiement
      };

      console.log('📦 [OrderForm] Données de commande:', orderRequest);

      // Utiliser le hook useOrder pour créer la commande avec paiement
      const orderResponse = await createOrder(
        orderRequest,
        // Callback de succès
        (response) => {
          console.log('✅ [OrderForm] Commande créée avec succès:', response.data);

          // La redirection vers PayTech est gérée automatiquement par le hook
          // Le stockage localStorage est aussi géré par le hook
        },
        // Callback d'erreur
        (error) => {
          console.error('❌ [OrderForm] Erreur lors de la création de commande:', error);
          setErrors(prev => ({
            ...prev,
            payment: error || 'Erreur lors de la création de la commande',
          }));
        }
      );

      // En cas de succès, la redirection se fera automatiquement via le hook
      console.log('🔄 [OrderForm] Commande en cours de création...');

    } catch (error: any) {
      console.error('❌ [OrderForm] Erreur lors du processus de commande:', error);
      setErrors(prev => ({
        ...prev,
        payment: error.message || 'Erreur lors du traitement du paiement PayTech',
      }));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (selectedPayment === 'paytech') {
      // Utiliser PayTech pour le paiement
      await processPayTechPayment();
    } else {
      // Pour le paiement à la livraison, traiter directement
      setIsSubmitting(true);

      try {
        const generatedOrderNumber = generateOrderNumber();
        setOrderNumber(generatedOrderNumber);
        setOrderComplete(true);

        // Vider le panier après validation de la commande
        clearCart();

      } catch (error) {
        console.error('Erreur lors de la commande:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Container principal */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                Finaliser la commande
              </h1>
            </div>

            {/* Barre de progression sur desktop */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                <span className="text-gray-700">Panier</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                <span className="text-gray-900 font-medium">Livraison & Paiement</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                <span className="text-gray-500">Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal avec layout optimisé */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto">

          {/* État de commande terminée - Layout centré */}
          {orderComplete ? (
            <div className="grid grid-cols-1 place-items-center min-h-[60vh]">
              <div className="w-full max-w-2xl">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 lg:p-12 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-green-600" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Commande confirmée !</h2>
                  <p className="text-gray-600 mb-6 text-base sm:text-lg">
                    Votre commande a été validée avec succès
                  </p>
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 sm:mb-8">
                    <p className="text-sm text-gray-600 mb-2">Numéro de commande</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{orderNumber}</p>
                  </div>
                  <div className="space-y-3 text-left mb-8 bg-gray-50 rounded-xl p-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email de confirmation:</span>
                      <span className="font-medium text-gray-900">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de livraison estimée:</span>
                      <span className="font-medium text-gray-900">
                        {estimatedDelivery.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate('/panier')}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Voir mes commandes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Layout responsive optimisé */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
              {/* Colonne gauche : Récapitulatif et options - Responsive */}
              <div className="xl:col-span-4 order-2 lg:order-1">
                <div className="sticky top-24 lg:top-28 space-y-4 lg:space-y-6">
                  {/* Récapitulatif du produit */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                      Récapitulatif
                    </h2>
                    <div className="space-y-4">
                      {/* Affichage du produit avec design si disponible */}
                      {getProductForPreview() ? (
                        <div className="flex justify-center">
                          <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
                            <SimpleProductPreview
                              product={getProductForPreview()!}
                              imageObjectFit="contain"
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 sm:gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={productData?.imageUrl || '/api/placeholder/100/100'}
                              alt={productData?.name || 'Produit'}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                              {productData?.name || 'Produit'}
                            </h3>
                          </div>
                        </div>
                      )}

                      {/* Informations du produit */}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                          {productData?.name || 'Produit'}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Couleur: <span className="font-medium">{productData?.color || 'N/A'}</span>
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Taille: <span className="font-medium">{productData?.size || 'N/A'}</span>
                          </p>
                          {productData?.vendorName && (
                            <p className="text-xs sm:text-sm text-gray-600">
                              Vendeur: <span className="font-medium">{productData.vendorName}</span>
                            </p>
                          )}
                          <p className="text-sm sm:text-base font-bold text-gray-900 mt-2">
                            {formatPrice(productPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options de livraison */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                      Livraison
                    </h3>
                    <div className="space-y-3">
                      {deliveryOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`block p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedDelivery === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="delivery"
                              value={option.id}
                              checked={selectedDelivery === option.id}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-2">
                                  <p className="font-medium text-gray-900 text-sm sm:text-base">{option.name}</p>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{option.description}</p>
                                </div>
                                <span className="font-semibold text-gray-900 text-sm sm:text-base whitespace-nowrap">
                                  {option.price === 0 ? 'Gratuit' : formatPrice(option.price)}
                                </span>
                              </div>
                              {option.estimatedDays > 0 && (
                                <p className="text-xs text-blue-600 mt-2">
                                  Livraison estimée: {option.estimatedDays} jour{option.estimatedDays > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.delivery && (
                      <p className="mt-2 text-sm text-red-600">{errors.delivery}</p>
                    )}
                  </div>

                  {/* Méthodes de paiement - Version compacte */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                      Paiement
                    </h3>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`block p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedPayment === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={selectedPayment === method.id}
                              onChange={(e) => setSelectedPayment(e.target.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {method.id === 'paytech' && <span className="text-xl sm:text-2xl">{method.icon}</span>}
                                <p className="font-medium text-gray-900 text-sm sm:text-base">{method.name}</p>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">{method.description}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Options de paiement PayTech spécifiques */}
                    {selectedPayment === 'paytech' && (
                      <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900">Choisissez votre méthode de paiement</h4>
                            <p className="text-xs text-blue-800 mt-1">
                              Sélectionnez la méthode que vous préférez pour payer
                            </p>

                            {/* Sélecteur de méthodes PayTech */}
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {payTechPaymentOptions.map((option) => (
                                <label
                                  key={option.id}
                                  className={`relative flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                                    selectedPayTechMethod === option.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="paytech_method"
                                    value={option.id}
                                    checked={selectedPayTechMethod === option.id}
                                    onChange={(e) => setSelectedPayTechMethod(e.target.value)}
                                    className="sr-only"
                                  />
                                  <span className="text-sm sm:text-base">{option.icon}</span>
                                  <span className="text-xs font-medium text-gray-700">{option.name}</span>
                                </label>
                              ))}
                            </div>

                            {/* Informations de sécurité */}
                            <div className="mt-3 text-xs text-blue-800">
                              <p>💳 Paiement 100% sécurisé par PayTech, solution agréée au Sénégal</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {errors.payment && (
                      <p className="mt-2 text-sm text-red-600">{errors.payment}</p>
                    )}
                  </div>

                  {/* Résumé financier */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Total de la commande</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sous-total</span>
                        <span className="font-medium">
                          {formatPrice(productPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Livraison</span>
                        <span className="font-medium">
                          {shippingFee === 0 ? 'Gratuit' : formatPrice(shippingFee)}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite : Formulaire - Responsive */}
              <div className="xl:col-span-8 order-1 lg:order-2">
                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                  {/* Informations personnelles */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informations personnelles
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Prénom */}
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Votre prénom"
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                        )}
                      </div>

                      {/* Nom */}
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Nom *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Votre nom"
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="votre@email.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Téléphone */}
                      <div className="sm:col-span-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="77 123 45 67"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Adresse de livraison
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Adresse */}
                      <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse complète *
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Votre adresse complète"
                        />
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                        )}
                      </div>

                      {/* Ville */}
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                          Ville *
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Dakar"
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                        )}
                      </div>

                      {/* Code postal */}
                      <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                          Code postal *
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.postalCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="12000"
                        />
                        {errors.postalCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                        )}
                      </div>

                      {/* Pays */}
                      <div className="sm:col-span-2">
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                          Pays *
                        </label>
                        <input
                          type="text"
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Sénégal"
                        />
                      </div>

                      {/* Notes */}
                      <div className="sm:col-span-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions spéciales (optionnel)
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          placeholder="Instructions spéciales pour la livraison..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action - Responsive */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Retour
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || orderLoading || paytechLoading}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                          isSubmitting || orderLoading || paytechLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {orderLoading || paytechLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="hidden sm:inline">Création de la commande...</span>
                            <span className="sm:hidden">Commande...</span>
                          </>
                        ) : isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Traitement en cours...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            <span className="hidden sm:inline">
                              {selectedPayment === 'paytech' ? 'Payer avec PayTech' : 'Confirmer'} ({formatPrice(totalAmount)})
                            </span>
                            <span className="sm:hidden">
                              {selectedPayment === 'paytech' ? 'Payer' : 'Confirmer'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderFormPage;