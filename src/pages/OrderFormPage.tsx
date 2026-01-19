import React, { useState, useEffect, useRef } from 'react';
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
  Package
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { usePaydunya } from '../hooks/usePaydunya';
import { useOrder } from '../hooks/useOrder';
import { orderService, type CreateOrderRequest as OrderRequest } from '../services/orderService';
import { paymentStatusService } from '../services/paymentStatusService';
import { validatePaymentData } from '../types/payment';
import SimpleProductPreview from '../components/vendor/SimpleProductPreview';
import vendorProductsService from '../services/vendorProductsService';
import { formatPriceInFRF as formatPrice } from '../utils/priceUtils';
import SimpleDeliveryForm from '../components/delivery/SimpleDeliveryForm';
import { isSenegalCountry, generateDeliverySummary } from '../utils/deliveryInfoUtils';
import type { DeliveryInfo } from '../types/order';

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
      <div className="relative w-48 h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
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
        <div className="flex flex-wrap items-center justify-center gap-1">
          {availableViews.map((view, index) => (
            <button
              key={view.viewKey}
              onClick={() => setSelectedViewIndex(index)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedViewIndex === index
                  ? 'bg-primary text-white'
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
        <div className="text-center text-xs text-gray-500">
          {availableViews.length} vue{availableViews.length > 1 ? 's' : ''} personnalisée{availableViews.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

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
    loading: paydunyaLoading,
    error: paydunyaError,
    getAvailableMethods
  } = usePaydunya();

  // Récupérer les données du produit depuis le panier (premier article)
  const cartItem = cartItems[0];
  const productData = cartItem;

  // Transformer les données du produit pour SimpleProductPreview
  const getProductForPreview = () => {
    if (!productData) return null;

    console.log('🔍 [OrderFormPage] CartItem data:', productData);

    return {
      id: Number(productData.productId), // Utiliser productId au lieu de id
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
  const [selectedPayment, setSelectedPayment] = useState<string>('paydunya'); // Défaut sur PayDunya
  const [selectedPayDunyaMethod, setSelectedPayDunyaMethod] = useState<string>('orange_money');

  // 🆕 États pour la gestion des informations de livraison par pays
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | undefined>();
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryValidationErrors, setDeliveryValidationErrors] = useState<string[]>([]);

  // 🆕 État pour les données du produit vendeur (pour finalImages)
  const [vendorProductData, setVendorProductData] = useState<any>(null);

  // Déterminer si c'est une commande internationale
  const isInternational = !isSenegalCountry(formData.country, 'SN');

  // Obtenir les méthodes de paiement disponibles depuis le hook
  const availablePaymentMethods = getAvailableMethods();

  // Vérifier si le panier est vide
  useEffect(() => {
    if (!cartItem) {
      navigate('/');
      return;
    }
  }, [cartItem, navigate]);

  // 🆕 Charger les données du produit vendeur pour finalImages
  useEffect(() => {
    const loadVendorProductData = async () => {
      if (!cartItem?.vendorProductId) {
        setVendorProductData(null);
        return;
      }

      try {
        console.log('🏪 [OrderFormPage] Chargement produit vendeur:', cartItem.vendorProductId);
        const response = await vendorProductsService.getProductById(cartItem.vendorProductId);

        if (response.success && response.data) {
          console.log('✅ [OrderFormPage] Produit vendeur chargé avec finalImages:', {
            hasFinalImages: !!response.data.finalImages,
            finalImagesCount: response.data.finalImages?.length || 0
          });
          setVendorProductData(response.data);
        }
      } catch (error) {
        console.error('❌ [OrderFormPage] Erreur chargement produit vendeur:', error);
      }
    };

    loadVendorProductData();
  }, [cartItem?.vendorProductId]);

  // États de chargement et erreurs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrderFormData> & { delivery?: string; payment?: string }>({});

  // Note: Les retours de paiement sont maintenant gérés par des pages dédiées
  // /payment/success et /payment/cancel (voir documentation PayDunya)
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

  // Méthodes de paiement - Uniquement PayDunya et Paiement à la livraison
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'paydunya',
      name: 'PayDunya (Paiement sécurisé)',
      icon: '💳',
      description: 'Orange Money, Wave, MTN Money, Moov Money, Cartes bancaires, Wallet',
      type: 'card'
    },
    {
      id: 'cash_on_delivery',
      name: 'Paiement à la livraison',
      icon: '💵',
      description: 'Paiement en espèces à la réception du colis',
      type: 'transfer'
    }
  ];

  // Options spécifiques de paiement PayDunya selon la documentation et le hook
  const payDunyaPaymentOptions = availablePaymentMethods.filter(method =>
    ['orange_money', 'wave', 'mtn_money', 'moov_money', 'carte_bancaire', 'paypal'].includes(method.id)
  ).map(method => ({
    id: method.id,
    name: method.name,
    icon: method.icon,
    description: method.description
  }));

  // Calculs - Utiliser le prix suggéré par le vendeur si disponible, sinon le prix de base
  const productPrice = cartItem?.suggestedPrice || cartItem?.price || 0;
  // 🆕 Utiliser les frais de livraison du système par pays, ou les frais standard si Sénégal
  const shippingFee = isInternational ? deliveryFee : (deliveryOptions.find(d => d.id === selectedDelivery)?.price || 0);
  const totalAmount = productPrice + shippingFee;

  // Debug: afficher les valeurs de calcul
  console.log('🔍 [OrderForm] Debug prix:', {
    cartItem: cartItem,
    suggestedPrice: cartItem?.suggestedPrice,
    price: cartItem?.price,
    productPrice: productPrice,
    shippingFee: shippingFee,
    totalAmount: totalAmount
  });
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

  // Validation du formulaire selon la documentation API v2
  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> & { delivery?: string; payment?: string } = {};

    // Validation des informations personnelles (au moins prénom OU nom requis selon la doc)
    const hasName = formData.firstName.trim() || formData.lastName.trim();
    if (!hasName) {
      newErrors.firstName = 'Au moins un prénom ou nom est requis';
    }

    // Validation des longueurs max
    if (formData.firstName.length > 100) {
      newErrors.firstName = 'Le prénom doit contenir au maximum 100 caractères';
    }
    if (formData.lastName.length > 100) {
      newErrors.lastName = 'Le nom doit contenir au maximum 100 caractères';
    }

    // Email OBLIGATOIRE pour PayDunya selon la nouvelle documentation
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis pour le paiement PayDunya';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
    }

    // Téléphone (OBLIGATOIRE selon la doc)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^(70|75|76|77|78|33)[0-9]{7}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Format invalide. Ex: 77 123 45 67';
    }

    // Validation de l'adresse avec limites de longueur (OBLIGATOIRE)
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    } else if (formData.address.length > 200) {
      newErrors.address = 'L\'adresse doit contenir au maximum 200 caractères';
    }

    // Ville (OBLIGATOIRE)
    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise';
    } else if (formData.city.length > 100) {
      newErrors.city = 'La ville doit contenir au maximum 100 caractères';
    }

    // Code postal (OPTIONNEL selon la doc)
    if (formData.postalCode && formData.postalCode.length > 20) {
      newErrors.postalCode = 'Le code postal doit contenir au maximum 20 caractères';
    }

    // Pays (OBLIGATOIRE)
    if (!formData.country.trim()) {
      newErrors.country = 'Le pays est requis';
    } else if (formData.country.length > 100) {
      newErrors.country = 'Le pays doit contenir au maximum 100 caractères';
    }

    // 🆕 Validation des informations de livraison (seulement pour l'international)
    if (deliveryValidationErrors.length > 0) {
      newErrors.delivery = deliveryValidationErrors.join(', ');
    }

    // Validation du paiement
    if (!selectedPayment) newErrors.payment = 'Veuillez sélectionner une méthode de paiement';

    // Afficher les erreurs de commande ou PayDunya si présentes
    if (orderError) {
      newErrors.payment = orderError;
    } else if (paydunyaError) {
      newErrors.payment = paydunyaError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Paiement PayDunya via création de commande réelle - Version conforme à la documentation
  const processPayDunyaPayment = async () => {
    try {
      console.log('🛒 [OrderForm] === DÉBUT DU PROCESSUS PAYDUNYA ===');
      console.log('📧 Email:', formData.email);
      console.log('📱 Téléphone:', formData.phone);
      console.log('💰 Montant total:', totalAmount, 'FCFA');

      // Validation du productId selon la documentation
      const productId = Number(productData?.productId);
      if (!productId || productId <= 0) {
        throw new Error(`Invalid productId: ${productData?.productId}. Must be greater than 0`);
      }

      console.log('✅ ProductId valide:', productId);

      // Préparer les données de commande selon le format attendu par le backend et la documentation PayDunya
      const orderRequest: OrderRequest = {
        email: formData.email, // Email OBLIGATOIRE pour PayDunya
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
          unitPrice: productPrice,
          size: productData?.size,
          color: productData?.color,
          colorId: 1,
          // 🎨 Ajouter les données de design/ personnalisation si disponibles
          vendorProductId: productData?.vendorProductId,
          mockupUrl: productData?.mockupUrl,
          designId: productData?.designId,
          designPositions: productData?.designPositions,
          designMetadata: productData?.designMetadata,
          delimitation: productData?.delimitation,
          // 🆕 Ajouter les données de personnalisation
          customizationId: productData?.customizationId,
          customizationIds: productData?.customizationIds, // 🆕 Tous les IDs de personnalisation
          designElements: productData?.designElements, // @deprecated
          designElementsByView: productData?.designElementsByView, // 🆕 Organisé par vue
        }],
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true, // IMPORTANT : Déclenche la création du paiement PayDunya
        // 🆕 Ajouter les informations de livraison (important pour l'international)
        deliveryInfo: deliveryInfo,
      };

      console.log('📦 [OrderForm] Données de commande PayDunya:', JSON.stringify(orderRequest, null, 2));

      // 🎨 Vérifier les données de personnalisation
      const hasCustomization = !!productData?.customizationId;
      const hasCustomizationIds = !!productData?.customizationIds;
      const hasDesignElements = !!(productData?.designElements && productData.designElements.length > 0);
      const hasDesignElementsByView = !!productData?.designElementsByView;

      console.log('🎨 [OrderForm] Personnalisation détectée:', {
        hasCustomization,
        hasCustomizationIds,
        hasDesignElements,
        hasDesignElementsByView,
        customizationId: productData?.customizationId,
        customizationIds: productData?.customizationIds,
        customizationIdsCount: Object.keys(productData?.customizationIds || {}).length,
        designElementsCount: productData?.designElements?.length,
        designElementsByViewCount: Object.keys(productData?.designElementsByView || {}).length,
        orderItemCustomizationId: orderRequest.orderItems[0]?.customizationId,
        orderItemCustomizationIds: orderRequest.orderItems[0]?.customizationIds,
        orderItemDesignElementsByView: orderRequest.orderItems[0]?.designElementsByView
      });

      // Utiliser orderService qui gère automatiquement la normalisation des réponses
      console.log('🔄 [OrderForm] Envoi de la requête au backend...');
      const orderResponse = orderService.isUserAuthenticated()
        ? await orderService.createOrderWithPayment(orderRequest)
        : await orderService.createGuestOrder(orderRequest);

      console.log('✅ [OrderForm] Réponse du backend (normalisée):', JSON.stringify(orderResponse, null, 2));

      // Vérifier si la commande a été créée avec succès
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Échec de la création de commande');
      }

      // Valider les données de paiement
      const paymentData = orderResponse.data.payment;
      if (!paymentData) {
        throw new Error('Données de paiement PayDunya manquantes dans la réponse');
      }

      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        console.error('❌ [OrderForm] Données de paiement invalides:', validation.missingFields);
        throw new Error(`Données de paiement incomplètes: ${validation.missingFields.join(', ')}`);
      }

      // Récupérer l'URL de paiement (déjà normalisée par orderService)
      const paymentUrl = paymentData.redirect_url || paymentData.payment_url;
      if (!paymentUrl) {
        throw new Error('URL de paiement PayDunya manquante');
      }

      // Stocker les informations de commande pour la page de retour (selon la documentation)
      const pendingPaymentData = {
        orderId: orderResponse.data.id,
        orderNumber: orderResponse.data.orderNumber,
        token: paymentData.token,
        totalAmount: orderResponse.data.totalAmount,
        timestamp: Date.now(),
      };

      paymentStatusService.savePendingPayment(pendingPaymentData);
      console.log('💾 [OrderForm] Données sauvegardées dans localStorage:', pendingPaymentData);

      console.log('🔄 [OrderForm] === REDIRECTION VERS PAYDUNYA ===');
      console.log('🌐 URL:', paymentUrl);
      console.log('🎫 Token:', paymentData.token);
      console.log('📋 Order ID:', orderResponse.data.id);
      console.log('📋 Order Number:', orderResponse.data.orderNumber);

      // Afficher un message de chargement avant la redirection
      const loadingMessage = `✅ Commande créée avec succès !\n\n📋 Numéro: ${orderResponse.data.orderNumber}\n💰 Montant: ${totalAmount} FCFA\n\n🔄 Redirection vers PayDunya...`;
      console.log(loadingMessage);

      // Ouvrir PayDunya dans un nouvel onglet
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');

      // Rediriger vers la page de confirmation avec les paramètres
      const confirmationUrl = `/order-confirmation?orderNumber=${encodeURIComponent(orderResponse.data.orderNumber)}&token=${encodeURIComponent(paymentData.token)}&paymentUrl=${encodeURIComponent(paymentUrl)}&totalAmount=${encodeURIComponent(totalAmount)}&email=${encodeURIComponent(formData.email)}`;
      navigate(confirmationUrl);

    } catch (error: any) {
      console.error('❌ [OrderForm] Erreur lors du processus de commande:', error);

      // Gestion des erreurs selon la documentation PayDunya
      let errorMessage = 'Erreur lors du traitement du paiement PayDunya';

      if (error.response?.status === 400) {
        // Données invalides
        errorMessage = 'Veuillez vérifier vos informations de commande';
      } else if (error.response?.status === 500) {
        // Erreur serveur
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        // Erreur réseau
        errorMessage = 'Problème de connexion. Vérifiez votre connexion Internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors(prev => ({
        ...prev,
        payment: errorMessage,
      }));

      // Afficher une alerte visuelle
      alert(`❌ ${errorMessage}\n\nVeuillez réessayer ou contacter le support si le problème persiste.`);
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (selectedPayment === 'paydunya') {
      // Utiliser PayDunya pour le paiement
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
            unitPrice: productPrice,
            size: productData?.size,
            color: productData?.color,
            colorId: 1,
            // 🎨 Ajouter les données de design/ personnalisation si disponibles
            vendorProductId: productData?.vendorProductId,
            mockupUrl: productData?.mockupUrl,
            designId: productData?.designId,
            designPositions: productData?.designPositions,
            designMetadata: productData?.designMetadata,
            delimitation: productData?.delimitation,
            // 🆕 Ajouter les données de personnalisation
            customizationId: productData?.customizationId,
            customizationIds: productData?.customizationIds, // 🆕 Tous les IDs de personnalisation
            designElements: productData?.designElements, // @deprecated
            designElementsByView: productData?.designElementsByView, // 🆕 Organisé par vue
          }],
          paymentMethod: 'CASH_ON_DELIVERY',
          initiatePayment: false,
          // 🆕 Ajouter les informations de livraison (important pour l'international)
          deliveryInfo: deliveryInfo,
        };

        // Créer la commande
        const orderResponse = orderService.isUserAuthenticated()
          ? await orderService.createOrderWithPayment(orderRequest)
          : await orderService.createGuestOrder(orderRequest);

        if (orderResponse.success && orderResponse.data) {
          // Vider le panier après validation de la commande
          clearCart();

          // Rediriger vers la page de confirmation
          const confirmationUrl = `/order-confirmation?orderNumber=${encodeURIComponent(orderResponse.data.orderNumber)}&totalAmount=${encodeURIComponent(totalAmount)}&email=${encodeURIComponent(formData.email)}`;
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
          {/* Layout responsive optimisé */}
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
                      {/* 🆕 Affichage du produit avec navigation entre vues */}
                      {productData?.customizationIds && productData?.designElementsByView ? (
                        <div className="flex justify-center">
                          <ProductPreviewWithViews productData={productData} />
                        </div>
                      ) : vendorProductData?.finalImages && vendorProductData.finalImages.length > 0 ? (
                        // 🆕 Afficher l'image finale pré-générée pour les produits vendeur
                        <div className="flex justify-center">
                          <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {(() => {
                              // Trouver l'image finale correspondant à la couleur sélectionnée
                              const finalImage = vendorProductData.finalImages.find(
                                (fi: any) => fi.colorId === productData?.colorVariationId
                              ) || vendorProductData.finalImages[0];
                              return (
                                <img
                                  src={finalImage.finalImageUrl}
                                  alt={`${vendorProductData.vendorName} - ${finalImage.colorName}`}
                                  className="w-full h-full object-contain"
                                />
                              );
                            })()}
                          </div>
                        </div>
                      ) : getProductForPreview() ? (
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

                  {/* 🆕 Options de livraison par pays */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                      Livraison
                    </h3>

                    {/* Options standard pour le Sénégal */}
                    {!isInternational && (
                      <div className="space-y-3 mb-4">
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
                    )}

                    {/* Formulaire pour les informations de livraison par pays */}
                    <SimpleDeliveryForm
                      country={formData.country}
                      countryCode={isSenegalCountry(formData.country) ? 'SN' : formData.country.toUpperCase()}
                      onDeliveryInfoChange={setDeliveryInfo}
                      onDeliveryFeeChange={setDeliveryFee}
                      onValidationError={setDeliveryValidationErrors}
                      disabled={isSubmitting || orderLoading || paydunyaLoading}
                    />

                    {/* Afficher les erreurs de validation */}
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
                                {method.id === 'paydunya' && <span className="text-xl sm:text-2xl">{method.icon}</span>}
                                <p className="font-medium text-gray-900 text-sm sm:text-base">{method.name}</p>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">{method.description}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Options de paiement PayDunya spécifiques */}
                    {selectedPayment === 'paydunya' && (
                      <div className="mt-4 space-y-3">
                        {/* Information sur le processus */}
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-blue-900">Comment ça marche ?</p>
                              <ol className="mt-2 space-y-1 text-xs text-blue-800">
                                <li>1️⃣ Cliquez sur "Payer avec PayDunya"</li>
                                <li>2️⃣ Vous serez redirigé vers PayDunya</li>
                                <li>3️⃣ Choisissez votre méthode de paiement</li>
                                <li>4️⃣ Confirmez le paiement</li>
                                <li>5️⃣ Vous serez automatiquement redirigé ici</li>
                              </ol>
                            </div>
                          </div>
                        </div>

                        {/* Sélection de la méthode préférée */}
                        <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start gap-3">
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-green-900">Méthodes acceptées</h4>
                              <p className="text-xs text-green-800 mt-1">
                                Vous choisirez votre méthode sur la page PayDunya
                              </p>

                              {/* Affichage des méthodes disponibles */}
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm">📱</span>
                                  <span className="text-xs font-medium text-gray-700">Orange Money</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm">💰</span>
                                  <span className="text-xs font-medium text-gray-700">Wave</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm">💳</span>
                                  <span className="text-xs font-medium text-gray-700">Carte bancaire</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm">📲</span>
                                  <span className="text-xs font-medium text-gray-700">Free Money</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm">🏦</span>
                                  <span className="text-xs font-medium text-gray-700">Moov Money</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm">💼</span>
                                  <span className="text-xs font-medium text-gray-700">MTN Money</span>
                                </div>
                              </div>

                              {/* Informations de sécurité */}
                              <div className="mt-3 flex items-center gap-2 text-xs text-green-800">
                                <Shield className="w-3 h-3" />
                                <p>Paiement 100% sécurisé par PayDunya, solution agréée au Sénégal</p>
                              </div>
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
                          Prénom * <span className="text-xs text-gray-500">(au moins prénom ou nom requis)</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          maxLength={100}
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
                          Nom * <span className="text-xs text-gray-500">(au moins prénom ou nom requis)</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          maxLength={100}
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
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="votre@email.com"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Téléphone */}
                      <div className="sm:col-span-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="+221 77 123 45 67"
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Format: +221 suivi de votre numéro</p>
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
                          Adresse complète * <span className="text-xs text-gray-500">({formData.address.length}/200)</span>
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          maxLength={200}
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
                          Ville * <span className="text-xs text-gray-500">({formData.city.length}/100)</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          maxLength={100}
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
                          Code postal <span className="text-xs text-gray-500">(optionnel)</span>
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          maxLength={20}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.postalCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="12000 (optionnel)"
                        />
                        {errors.postalCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                        )}
                      </div>

                      {/* Pays */}
                      <div className="sm:col-span-2">
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                          Pays * <span className="text-xs text-gray-500">({formData.country.length}/100)</span>
                        </label>
                        <input
                          type="text"
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          maxLength={100}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.country ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Sénégal"
                        />
                        {errors.country && (
                          <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                        )}
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
                        disabled={isSubmitting || orderLoading || paydunyaLoading}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                          isSubmitting || orderLoading || paydunyaLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {orderLoading || paydunyaLoading ? (
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
                              {selectedPayment === 'paydunya' ? 'Payer avec PayDunya' : 'Confirmer la commande'} ({formatPrice(totalAmount)})
                            </span>
                            <span className="sm:hidden">
                              {selectedPayment === 'paydunya' ? 'Payer' : 'Confirmer'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFormPage;