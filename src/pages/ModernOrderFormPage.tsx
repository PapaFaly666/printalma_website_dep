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
import { deliveryService, type City, type Region, type InternationalZone } from '../services/deliveryService';

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

type DeliveryType = 'city' | 'region' | 'international';

interface DeliveryOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
  type: DeliveryType;
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
    <div className="flex flex-col gap-2 sm:gap-3">
      {/* Conteneur de l'image avec personnalisations */}
      <div className="relative w-full h-full bg-white rounded-lg sm:rounded-xl border border-gray-200 flex items-center justify-center p-1 sm:p-2">
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
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          {availableViews.map((view, index) => (
            <button
              key={view.viewKey}
              onClick={() => setSelectedViewIndex(index)}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-all ${
                selectedViewIndex === index
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
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
          <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
            {availableViews.length} vue{availableViews.length > 1 ? 's' : ''} personnalisée{availableViews.length > 1 ? 's' : ''}
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

  // 🆕 Fonction pour extraire et préparer les délimitations depuis le panier
  const getDelimitationFromCart = () => {
    if (!productData) return null;

    // Priorité 1: delimitation directe dans le panier
    if (productData.delimitation) {
      return {
        x: productData.delimitation.x,
        y: productData.delimitation.y,
        width: productData.delimitation.width,
        height: productData.delimitation.height,
        coordinateType: productData.delimitation.coordinateType || 'PERCENTAGE',
        referenceWidth: productData.delimitation.referenceWidth || 800,
        referenceHeight: productData.delimitation.referenceHeight || 800
      };
    }

    // Priorité 2: chercher dans les délimitations des variations de couleur
    if (productData.delimitations && productData.delimitations.length > 0) {
      const firstDelim = productData.delimitations[0];
      if (firstDelim) {
        return {
          x: firstDelim.x || 0.2,
          y: firstDelim.y || 0.2,
          width: firstDelim.width || 0.6,
          height: firstDelim.height || 0.6,
          coordinateType: firstDelim.coordinateType || 'PERCENTAGE',
          referenceWidth: firstDelim.referenceWidth || 800,
          referenceHeight: firstDelim.referenceHeight || 800
        };
      }
    }

    // Priorité 3: valeurs par défaut si aucune délimitation trouvée
    return {
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6,
      coordinateType: 'PERCENTAGE' as const,
      referenceWidth: 800,
      referenceHeight: 800
    };
  };

  // 🆕 Fonction pour extraire l'URL du mockup depuis le panier
  const getMockupUrlFromCart = () => {
    if (!productData) return null;

    // Priorité 1: mockupUrl directe dans le panier
    if (productData.mockupUrl) {
      return productData.mockupUrl;
    }

    // Priorité 2: imageUrl de base du produit
    if (productData.imageUrl) {
      return productData.imageUrl;
    }

    // Priorité 3: chercher dans les images du produit
    if (productData.images && productData.images.length > 0) {
      return productData.images[0].url || productData.images[0].adminImageUrl;
    }

    return null;
  };

  // 🆕 Fonction pour préparer les données multi-vues pour le backend
  const prepareMultiViewDataForBackend = () => {
    if (!productData) return {};

    console.log('🔍 [ModernOrderForm] Préparation des données multi-vues:', {
      hasCustomizationIds: !!productData.customizationIds,
      hasDesignElementsByView: !!productData.designElementsByView,
      hasDelimitations: !!productData.delimitations,
      customizationIdsKeys: productData.customizationIds ? Object.keys(productData.customizationIds) : [],
      designElementsByViewKeys: productData.designElementsByView ? Object.keys(productData.designElementsByView) : []
    });

    // Structurer les données multi-vues pour le backend
    const multiViewData = {
      // IDs de personnalisation par vue (format: "colorId-viewId": customizationId)
      customizationIds: productData.customizationIds || {},

      // Éléments de design par vue (format: "colorId-viewId": [elements])
      designElementsByView: productData.designElementsByView || {},

      // Métadonnées des vues pour aider le backend
      viewsMetadata: Object.keys(productData.customizationIds || {}).map(viewKey => {
        const [colorId, viewId] = viewKey.split('-').map(Number);

        // Trouver la délimitation correspondante
        const delimitation = productData.delimitations?.find((d: any) => d.viewId === viewId);

        return {
          viewKey,
          colorId,
          viewId,
          viewType: delimitation?.viewType || 'OTHER',
          imageUrl: delimitation?.imageUrl || productData.imageUrl,
          hasElements: !!(productData.designElementsByView?.[viewKey]?.length > 0),
          elementsCount: productData.designElementsByView?.[viewKey]?.length || 0
        };
      })
    };

    console.log('✅ [ModernOrderForm] Données multi-vues préparées:', multiViewData);
    return multiViewData;
  };

  // 🆕 Fonction pour créer les orderItems depuis les articles du panier
  const createOrderItems = () => {
    console.log('📦 [ModernOrderForm] Création orderItems depuis le panier:', {
      cartItemsCount: cartItems.length,
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        price: item.suggestedPrice || item.price
      }))
    });

    // Créer un orderItem pour chaque article du panier
    return cartItems.map(cartItem => {
      // Extraire les délimitations et mockup de chaque article
      const delimitation = cartItem.delimitation || {
        x: 0.2,
        y: 0.2,
        width: 0.6,
        height: 0.6,
        coordinateType: 'PERCENTAGE' as const,
        referenceWidth: 800,
        referenceHeight: 800
      };

      const mockupUrl = cartItem.mockupUrl || cartItem.imageUrl || null;

      // Préparer les données multi-vues
      const multiViewData = {
        customizationIds: cartItem.customizationIds || {},
        designElementsByView: cartItem.designElementsByView || {},
        viewsMetadata: Object.keys(cartItem.customizationIds || {}).map(viewKey => {
          const [colorId, viewId] = viewKey.split('-').map(Number);
          const delimitation = cartItem.delimitations?.find((d: any) => d.viewId === viewId);

          return {
            viewKey,
            colorId,
            viewId,
            viewType: delimitation?.viewType || 'OTHER',
            imageUrl: delimitation?.imageUrl || cartItem.imageUrl,
            hasElements: !!(cartItem.designElementsByView?.[viewKey]?.length > 0),
            elementsCount: cartItem.designElementsByView?.[viewKey]?.length || 0
          };
        })
      };

      return {
        productId: cartItem.productId,
        unitPrice: cartItem.suggestedPrice || cartItem.price,
        color: cartItem.color,
        colorId: 1,
        size: cartItem.size,
        sizeId: cartItem.sizeId,
        quantity: cartItem.quantity,
        vendorProductId: cartItem.vendorProductId,
        mockupUrl: mockupUrl,
        designId: cartItem.designId,
        designPositions: cartItem.designPositions,
        designMetadata: cartItem.designMetadata,
        delimitation: delimitation,
        customizationId: cartItem.customizationId,
        customizationIds: multiViewData.customizationIds,
        designElements: cartItem.designElements,
        designElementsByView: multiViewData.designElementsByView,
        viewsMetadata: multiViewData.viewsMetadata,
      };
    });
  };

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

  // 🆕 États pour la livraison dynamique
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('city');
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([]);
  const [loadingDeliveryData, setLoadingDeliveryData] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryTime, setDeliveryTime] = useState<string>('');

  const [selectedPayment, setSelectedPayment] = useState<string>('paydunya');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrderFormData> & { delivery?: string; payment?: string }>({});

  // 🆕 Charger les données de livraison au démarrage
  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        setLoadingDeliveryData(true);
        console.log('📦 [ModernOrderForm] Chargement des données de livraison...');

        const [citiesData, regionsData, zonesData] = await Promise.all([
          deliveryService.getCities(),
          deliveryService.getRegions(),
          deliveryService.getInternationalZones(),
        ]);

        // Filtrer uniquement les zones actives
        setCities(citiesData.filter(c => c.status === 'active'));
        setRegions(regionsData.filter(r => r.status === 'active'));
        setInternationalZones(zonesData.filter(z => z.status === 'active'));

        console.log('✅ [ModernOrderForm] Données de livraison chargées:', {
          cities: citiesData.length,
          regions: regionsData.length,
          zones: zonesData.length
        });
      } catch (error) {
        console.error('❌ [ModernOrderForm] Erreur chargement données livraison:', error);
        setErrors(prev => ({ ...prev, delivery: 'Impossible de charger les options de livraison' }));
      } finally {
        setLoadingDeliveryData(false);
      }
    };

    loadDeliveryData();
  }, []);

  // 🆕 Calculer les frais de livraison quand l'utilisateur sélectionne une option
  useEffect(() => {
    const calculateFee = async () => {
      if (!selectedDelivery) {
        setDeliveryFee(0);
        setDeliveryTime('');
        return;
      }

      try {
        console.log('💰 [ModernOrderForm] Calcul frais livraison:', {
          type: deliveryType,
          selectedId: selectedDelivery
        });

        const params =
          deliveryType === 'city' ? { cityId: selectedDelivery } :
          deliveryType === 'region' ? { regionId: selectedDelivery } :
          { internationalZoneId: selectedDelivery };

        const result = await deliveryService.calculateDeliveryFee(
          params.cityId,
          params.regionId,
          params.internationalZoneId
        );

        setDeliveryFee(result.fee);
        setDeliveryTime(result.deliveryTime);

        console.log('✅ [ModernOrderForm] Frais calculés:', {
          fee: result.fee,
          deliveryTime: result.deliveryTime
        });
      } catch (error) {
        console.error('❌ [ModernOrderForm] Erreur calcul frais:', error);
        setErrors(prev => ({ ...prev, delivery: 'Erreur de calcul des frais de livraison' }));
      }
    };

    calculateFee();
  }, [selectedDelivery, deliveryType]);

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

  // 🆕 Calculs basés sur TOUS les articles du panier
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.suggestedPrice || item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);

  const shippingFee = deliveryFee; // Utiliser les frais calculés dynamiquement
  const total = subtotal + shippingFee;

  // Quantité totale d'articles dans le panier
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Debug: afficher les valeurs de calcul
  console.log('🔍 [ModernOrderForm] Debug prix (tous les articles):', {
    cartItemsCount: cartItems.length,
    items: cartItems.map(item => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      price: item.suggestedPrice || item.price,
      subtotal: (item.suggestedPrice || item.price) * item.quantity
    })),
    subtotal: subtotal,
    shippingFee: shippingFee,
    total: total,
    totalQuantity: totalQuantity
  });

  // Configuration des étapes
  const steps = [
    { id: 'customer-info', label: 'Informations', icon: User },
    { id: 'delivery', label: 'Livraison', icon: Truck },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'review', label: 'Confirmation', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // 🆕 Obtenir le nom de la zone de livraison sélectionnée
  const getSelectedDeliveryName = (): string => {
    if (!selectedDelivery) return '';

    if (deliveryType === 'city') {
      const city = cities.find(c => c.id === selectedDelivery);
      return city ? city.name : '';
    } else if (deliveryType === 'region') {
      const region = regions.find(r => r.id === selectedDelivery);
      return region ? region.name : '';
    } else {
      const zone = internationalZones.find(z => z.id === selectedDelivery);
      return zone ? zone.name : '';
    }
  };

  // Validation par étape
  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<OrderFormData> & { delivery?: string } = {};

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

    // 🆕 Validation de la livraison
    if (step === 'delivery') {
      if (!selectedDelivery) {
        newErrors.delivery = 'Veuillez sélectionner une option de livraison';
      }
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

      console.log('💳 [ModernOrderForm] Traitement paiement PayDunya:', {
        cartItemsCount: cartItems.length,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity
        }))
      });

      // 🆕 Créer les orderItems depuis tous les articles du panier
      const orderItems = createOrderItems();

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
        orderItems: orderItems,
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true,
        // 🆕 Informations de livraison
        deliveryFee: deliveryFee,
        deliveryZoneId: selectedDelivery,
        deliveryType: deliveryType,
        deliveryTime: deliveryTime,
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
        console.log('💵 [ModernOrderForm] Traitement paiement à la livraison:', {
          cartItemsCount: cartItems.length,
          cartItems: cartItems.map(item => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity
          }))
        });

        // 🆕 Créer les orderItems depuis tous les articles du panier
        const orderItems = createOrderItems();

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
          orderItems: orderItems,
          paymentMethod: 'CASH_ON_DELIVERY',
          initiatePayment: false,
          // 🆕 Informations de livraison
          deliveryFee: deliveryFee,
          deliveryZoneId: selectedDelivery,
          deliveryType: deliveryType,
          deliveryTime: deliveryTime,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header fixe avec progression */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Barre de progression moderne - optimisée mobile */}
            <div className="flex-1 mx-2 sm:mx-4 lg:mx-8 max-w-3xl">
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
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isCompleted ? 'text-white' : isActive ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </motion.div>
                        <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium hidden md:block ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>

                      {index < steps.length - 1 && (
                        <div className="flex-1 h-0.5 bg-gray-200 mx-1 sm:mx-2">
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

            {/* Indicateur d'étape mobile uniquement */}
            <div className="md:hidden text-xs font-semibold text-gray-600 flex-shrink-0">
              {currentStepIndex + 1}/{steps.length}
            </div>
            <div className="hidden md:block w-10" /> {/* Spacer pour équilibrer */}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Colonne gauche : Formulaire avec transitions */}
          <div className="lg:col-span-7 order-2 lg:order-1">
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
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                      <div className="p-2 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vos informations</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Pour la livraison et le suivi</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base ${
                            errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Jean"
                        />
                        {errors.firstName && <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                          placeholder="Dupont"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base ${
                              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="jean.dupont@email.com"
                          />
                        </div>
                        {errors.email && <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.email}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Téléphone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base ${
                              errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="77 123 45 67"
                          />
                        </div>
                        {errors.phone && <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.phone}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Adresse complète <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base ${
                              errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="123 Rue de la République"
                          />
                        </div>
                        {errors.address && <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Ville <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base ${
                            errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Dakar"
                        />
                        {errors.city && <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Code postal
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                          placeholder="12000"
                        />
                      </div>
                    </div>

                    <button
                      onClick={goToNextStep}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      Continuer
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}

                {/* Étape 2 : Livraison */}
                {currentStep === 'delivery' && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                      <div className="p-2 bg-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Mode de livraison</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Choisissez votre zone</p>
                      </div>
                    </div>

                    {loadingDeliveryData ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-gray-600">Chargement des options...</span>
                      </div>
                    ) : (
                      <>
                        {/* Sélecteur de type de livraison */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Type de livraison</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDeliveryType('city');
                                setSelectedDelivery('');
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                deliveryType === 'city'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              🏙️ Dakar & Banlieue
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeliveryType('region');
                                setSelectedDelivery('');
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                deliveryType === 'region'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              🗺️ Autres régions
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeliveryType('international');
                                setSelectedDelivery('');
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                deliveryType === 'international'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              🌍 International
                            </button>
                          </div>
                        </div>

                        {/* Sélecteur de zone */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {deliveryType === 'city' ? 'Ville' : deliveryType === 'region' ? 'Région' : 'Zone internationale'}
                          </label>

                          {deliveryType === 'city' && (
                            <select
                              value={selectedDelivery}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Sélectionner une ville...</option>

                              <optgroup label="Dakar Ville">
                                {cities
                                  .filter(c => c.zoneType === 'dakar-ville')
                                  .map(city => (
                                    <option key={city.id} value={city.id}>
                                      {city.name} - {city.isFree ? 'Gratuit' : `${formatPrice(parseFloat(city.price))}`}
                                    </option>
                                  ))}
                              </optgroup>

                              <optgroup label="Banlieue">
                                {cities
                                  .filter(c => c.zoneType === 'banlieue')
                                  .map(city => (
                                    <option key={city.id} value={city.id}>
                                      {city.name} - {formatPrice(parseFloat(city.price))}
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          )}

                          {deliveryType === 'region' && (
                            <select
                              value={selectedDelivery}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Sélectionner une région...</option>
                              {regions.map(region => (
                                <option key={region.id} value={region.id}>
                                  {region.name} - {formatPrice(parseFloat(region.price))}
                                </option>
                              ))}
                            </select>
                          )}

                          {deliveryType === 'international' && (
                            <select
                              value={selectedDelivery}
                              onChange={(e) => setSelectedDelivery(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Sélectionner une zone...</option>
                              {internationalZones.map(zone => (
                                <option key={zone.id} value={zone.id}>
                                  {zone.name} - {formatPrice(parseFloat(zone.price))}
                                  {zone.countries.length > 0 && ` (${zone.countries.slice(0, 3).join(', ')}${zone.countries.length > 3 ? '...' : ''})`}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Affichage des informations de livraison sélectionnée */}
                        {selectedDelivery && deliveryFee > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-green-900 mb-1">Livraison sélectionnée</p>
                                <div className="text-sm text-green-700 space-y-1">
                                  <p>Frais: <span className="font-bold">{formatPrice(deliveryFee)}</span></p>
                                  {deliveryTime && <p>Délai: {deliveryTime}</p>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {errors.delivery && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.delivery}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex gap-2 sm:gap-3 pt-2">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-sm sm:text-base"
                      >
                        Retour
                      </button>
                      <button
                        onClick={goToNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        Continuer
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Étape 3 : Paiement */}
                {currentStep === 'payment' && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                      <div className="p-2 bg-purple-100 rounded-lg sm:rounded-xl flex-shrink-0">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Mode de paiement</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Sélectionnez votre méthode</p>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <motion.label
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`block p-4 sm:p-5 border-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${
                          selectedPayment === 'paydunya'
                            ? 'border-blue-500 bg-blue-50 shadow-md sm:shadow-lg ring-1 sm:ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <input
                            type="radio"
                            name="payment"
                            value="paydunya"
                            checked={selectedPayment === 'paydunya'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
                              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                              <p className="font-bold text-gray-900 text-base sm:text-lg">PayDunya</p>
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full">
                                Recommandé
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                              Paiement sécurisé avec toutes les principales méthodes mobile et bancaire
                            </p>

                            {/* Méthodes disponibles */}
                            {selectedPayment === 'paydunya' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-blue-200"
                              >
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                  <span className="text-xs sm:text-sm font-semibold text-gray-900">Méthodes disponibles</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                  {['📱 Orange Money', '💰 Wave', '📲 Free Money', '💳 Carte bancaire', '🏦 MTN Money', '💵 Moov Money'].map((method) => (
                                    <div key={method} className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium text-gray-700 text-center">
                                      {method}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-md sm:rounded-lg">
                                  <p className="text-[10px] sm:text-xs text-blue-800 leading-relaxed">
                                    <span className="font-semibold">Comment ça marche ?</span> Vous serez redirigé vers PayDunya pour choisir votre méthode et finaliser le paiement.
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.label>

                      <motion.label
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`block p-4 sm:p-5 border-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${
                          selectedPayment === 'cash'
                            ? 'border-blue-500 bg-blue-50 shadow-md sm:shadow-lg ring-1 sm:ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <input
                            type="radio"
                            name="payment"
                            value="cash"
                            checked={selectedPayment === 'cash'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                              <span className="text-xl sm:text-2xl">💵</span>
                              <p className="font-bold text-gray-900 text-base sm:text-lg">Paiement à la livraison</p>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
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
                        className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl"
                      >
                        <p className="text-xs sm:text-sm text-red-600 font-medium">{errors.payment}</p>
                      </motion.div>
                    )}

                    <div className="flex gap-2 sm:gap-3 pt-2">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-sm sm:text-base"
                      >
                        Retour
                      </button>
                      <button
                        onClick={goToNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        Continuer
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Étape 4 : Confirmation */}
                {currentStep === 'review' && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                      <div className="p-2 bg-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vérification finale</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Confirmez votre commande</p>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Récap informations */}
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Informations
                          </h3>
                          <button
                            onClick={() => setCurrentStep('customer-info')}
                            className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-semibold text-xs sm:text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Modifier
                          </button>
                        </div>
                        <div className="text-xs sm:text-sm space-y-0.5 sm:space-y-1 text-gray-700 leading-relaxed">
                          <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                          <p className="truncate">{formData.email}</p>
                          <p>{formData.phone}</p>
                          <p className="break-words">{formData.address}</p>
                          <p>{formData.city} {formData.postalCode}</p>
                        </div>
                      </div>

                      {/* Récap livraison */}
                      <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Livraison
                          </h3>
                          <button
                            onClick={() => setCurrentStep('delivery')}
                            className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-semibold text-xs sm:text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Modifier
                          </button>
                        </div>
                        {selectedDelivery ? (
                          <>
                            <p className="text-xs sm:text-sm text-gray-900 font-medium mb-0.5">
                              {deliveryType === 'city' ? '🏙️ ' : deliveryType === 'region' ? '🗺️ ' : '🌍 '}
                              {getSelectedDeliveryName()}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              Frais: <span className="font-semibold">{formatPrice(deliveryFee)}</span>
                              {deliveryTime && ` • Délai: ${deliveryTime}`}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500 italic">Aucune livraison sélectionnée</p>
                        )}
                      </div>

                      {/* Récap paiement */}
                      <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Paiement
                          </h3>
                          <button
                            onClick={() => setCurrentStep('payment')}
                            className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-semibold text-xs sm:text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Modifier
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">
                          {selectedPayment === 'paydunya' ? 'PayDunya - Paiement sécurisé' : 'Paiement à la livraison'}
                        </p>
                      </div>

                      {/* Sécurité */}
                      <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-green-900 mb-0.5 sm:mb-1 text-sm sm:text-base">Paiement 100% sécurisé</h4>
                            <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                              Vos données sont protégées et cryptées. Nous ne stockons aucune information bancaire.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-2">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-sm sm:text-base"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-green-700 hover:to-green-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span className="hidden sm:inline">Traitement...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Confirmer ({formatPrice(total)})</span>
                            <span className="sm:hidden">{formatPrice(total)}</span>
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
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Résumé de la commande</h3>
              </div>

              {/* 🆕 Liste regroupée des articles du panier par produit/couleur */}
              <div className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {(() => {
                  // Regrouper les articles par produit et couleur
                  const groupedItems = cartItems.reduce((acc, item) => {
                    const key = `${item.productId}-${item.color}`;
                    if (!acc[key]) {
                      acc[key] = {
                        productId: item.productId,
                        name: item.name,
                        color: item.color,
                        colorCode: item.colorCode,
                        imageUrl: item.imageUrl,
                        customizationIds: item.customizationIds,
                        designElementsByView: item.designElementsByView,
                        delimitations: item.delimitations,
                        items: []
                      };
                    }
                    acc[key].items.push(item);
                    return acc;
                  }, {} as Record<string, any>);

                  return Object.values(groupedItems).map((group: any) => {
                    const totalGroupQuantity = group.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                    const totalGroupPrice = group.items.reduce((sum: number, item: any) =>
                      sum + ((item.suggestedPrice || item.price) * item.quantity), 0);

                    return (
                      <div key={`${group.productId}-${group.color}`} className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50/20 rounded-lg sm:rounded-xl border border-gray-200">
                        <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
                          {/* Preview du produit */}
                          <div className="flex-shrink-0">
                            {group.customizationIds && group.designElementsByView ? (
                              <div className="w-20 h-20 sm:w-24 sm:h-24">
                                <ProductPreviewWithViews productData={group.items[0]} />
                              </div>
                            ) : (
                              <img
                                src={group.imageUrl}
                                alt={group.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-md sm:rounded-lg bg-white border border-gray-200"
                              />
                            )}
                          </div>

                          {/* Détails du produit */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                              {group.name}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <span className="text-xs sm:text-sm text-gray-600">Couleur:</span>
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: group.colorCode }}
                                />
                                <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{group.color}</span>
                              </div>
                            </div>

                            {/* 🆕 Liste des tailles et quantités */}
                            <div className="space-y-1 mb-1.5 sm:mb-2">
                              <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">Tailles:</p>
                              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                {group.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white border border-blue-200 rounded-md sm:rounded-lg"
                                  >
                                    <span className="text-xs sm:text-sm font-bold text-blue-700">{item.size}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-500">×</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{item.quantity}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                                      ({formatPrice((item.suggestedPrice || item.price) * item.quantity)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Total pour ce groupe */}
                            <div className="pt-1.5 sm:pt-2 border-t border-gray-200 flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{totalGroupQuantity} article{totalGroupQuantity > 1 ? 's' : ''}</span>
                              </span>
                              <span className="text-sm sm:text-base font-bold text-blue-600">
                                {formatPrice(totalGroupPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Totaux */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-2.5 sm:space-y-4">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium text-gray-900">
                    {shippingFee === 0 ? <span className="text-green-600 font-semibold">Gratuit</span> : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4 flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Badges de confiance */}
              <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  </div>
                  <span className="leading-tight">Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <span className="leading-tight">Livraison rapide et fiable</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <span className="leading-tight">Garantie satisfaction</span>
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
