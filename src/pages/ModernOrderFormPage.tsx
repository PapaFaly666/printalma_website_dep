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
  Home,
  Globe,
  Search
} from 'lucide-react';
import { HiSparkles, HiShoppingBag, HiCreditCard, HiTruck, HiCheckCircle } from 'react-icons/hi2';
import { BiSolidUser } from 'react-icons/bi';
import { IoLocationSharp } from 'react-icons/io5';
import { MdEmail, MdPhone } from 'react-icons/md';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../hooks/useOrder';
import { orderService, type CreateOrderRequest as OrderRequest } from '../services/orderService';
import { paymentStatusService } from '../services/paymentStatusService';
import { validatePaymentData } from '../types/payment';
import SimpleProductPreview from '../components/vendor/SimpleProductPreview';
import { formatPriceInFRF as formatPrice } from '../utils/priceUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { deliveryService, type City, type Region, type InternationalZone, type ZoneTarif, type Transporteur } from '../services/deliveryService';
import CountrySelector from '../components/ui/CountrySelector';
import CityAutocomplete from '../components/ui/CityAutocomplete';
import { COUNTRIES, getCountryByCode } from '../data/countries';
import { CustomizationPreview } from '../components/order/CustomizationPreview';
import { useToast } from '../components/ui/use-toast';

interface OrderFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string; // Code ISO 2 lettres
  notes: string;
}

// 🚚 Interface pour les informations de livraison
interface DeliveryInfo {
  // Type de livraison (OBLIGATOIRE)
  deliveryType: 'city' | 'region' | 'international';

  // Localisation (selon le type)
  cityId?: string;              // Si deliveryType = 'city'
  cityName?: string;
  regionId?: string;            // Si deliveryType = 'region'
  regionName?: string;
  zoneId?: string;              // Si deliveryType = 'international'
  zoneName?: string;
  countryCode?: string;         // Code ISO du pays (ex: "SN", "FR", "US")
  countryName?: string;

  // Transporteur sélectionné (OBLIGATOIRE)
  transporteurId: string;       // ID du transporteur choisi
  transporteurName?: string;    // Nom pour affichage
  transporteurLogo?: string;    // URL du logo

  // Tarification (OBLIGATOIRE)
  zoneTarifId: string;          // ID du tarif appliqué
  deliveryFee: number;          // Montant en XOF
  deliveryTime?: string;        // Ex: "24-48h", "2-3 jours"

  // Métadonnées optionnelles
  metadata?: {
    availableCarriers?: Array<{
      transporteurId: string;
      name: string;
      fee: number;
      time: string;
    }>;
    selectedAt?: string;        // ISO timestamp
    calculationDetails?: any;
  };
}

type Step = 'customer-info' | 'payment' | 'review';

// 🆕 Composant pour afficher le produit avec navigation entre vues
// Utilise CustomizationPreview pour garantir un rendu pixel-perfect identique à la page de personnalisation
const ProductPreviewWithViews: React.FC<{
  productData: any;
}> = ({ productData }) => {
  const [selectedViewIndex, setSelectedViewIndex] = useState(0);
  const [vendorProduct, setVendorProduct] = useState<any>(null);
  const [loadingVendorProduct, setLoadingVendorProduct] = useState(false);

  // 🏪 Charger le produit vendeur si nécessaire
  useEffect(() => {
    const loadVendorProduct = async () => {
      if (!productData?.vendorProductId) return;

      setLoadingVendorProduct(true);
      try {
        console.log('🏪 [ModernOrderFormPage] Chargement produit vendeur:', productData.vendorProductId);
        const vendorProductsService = (await import('../services/vendorProductsService')).default;
        const response = await vendorProductsService.getProductById(productData.vendorProductId);

        if (response.success && response.data) {
          console.log('✅ [ModernOrderFormPage] Produit vendeur chargé');
          setVendorProduct(response.data);
        }
      } catch (error) {
        console.error('❌ [ModernOrderFormPage] Erreur chargement produit vendeur:', error);
      } finally {
        setLoadingVendorProduct(false);
      }
    };

    loadVendorProduct();
  }, [productData?.vendorProductId]);

  // 🏪 Si c'est un produit vendeur, utiliser SimpleProductPreview
  if (productData?.vendorProductId) {
    if (loadingVendorProduct) {
      return (
        <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
        </div>
      );
    }

    if (vendorProduct) {
      return (
        <div className="flex flex-col gap-2 sm:gap-3">
          <SimpleProductPreview
            product={vendorProduct}
            showColorSlider={false}
            showDelimitations={false}
            onProductClick={() => {}}
            hideValidationBadges={true}
            initialColorId={productData.colorVariationId}
            imageObjectFit="contain"
          />
          <div className="text-center">
            <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-purple-100 text-purple-800">
              🏪 Design vendeur
            </span>
          </div>
        </div>
      );
    }

    // Fallback si le chargement échoue
    return (
      <div className="w-full aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
        <img
          src={productData.imageUrl}
          alt={productData.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // 🎨 Pour les produits customisés, utiliser la logique existante
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

  console.log('🔍 [ModernOrderFormPage] currentDelimitation:', currentDelimitation);

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {/* 🆕 Utilisation de CustomizationPreview pour un rendu identique à la page de customisation */}
      <CustomizationPreview
        productImageUrl={currentImageUrl}
        designElements={currentViewElements}
        delimitation={currentDelimitation}
        productName={productData?.name}
        colorName={productData?.color}
        colorCode={productData?.colorCode}
        className="w-full h-full aspect-square"
        showInfo={false}
      />

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
  const { toast } = useToast();

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
      // 🔍 IMPORTANT: Préserver les vraies délimitations avec leurs vraies références (1200x1200)
      // Ne PAS utiliser de valeurs par défaut qui écraseraient les vraies dimensions
      const delimitation = cartItem.delimitation || null;

      const mockupUrl = cartItem.mockupUrl || cartItem.imageUrl || null;

      // Préparer les données multi-vues
      const multiViewData = {
        customizationIds: cartItem.customizationIds || {},
        designElementsByView: cartItem.designElementsByView || {},
        viewsMetadata: Object.keys(cartItem.customizationIds || {}).map(viewKey => {
          const [colorId, viewId] = viewKey.split('-').map(Number);
          const viewDelimitation = cartItem.delimitations?.find((d: any) => d.viewId === viewId);

          return {
            viewKey,
            colorId,
            viewId,
            viewType: viewDelimitation?.viewType || 'OTHER',
            imageUrl: viewDelimitation?.imageUrl || cartItem.imageUrl,
            hasElements: !!(cartItem.designElementsByView?.[viewKey]?.length > 0),
            elementsCount: cartItem.designElementsByView?.[viewKey]?.length || 0
          };
        })
      };

      // 🔍 DEBUG: Vérifier ce qui est envoyé
      console.log('📤 [ModernOrderForm] OrderItem créé:', {
        productName: cartItem.name,
        delimitation: delimitation,
        delimitations: cartItem.delimitations,
        delimitationsCount: cartItem.delimitations?.length || 0
      });

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
        delimitations: cartItem.delimitations || [], // 🔍 IMPORTANT: Envoyer aussi les délimitations multi-vues
        customizationId: cartItem.customizationId,
        customizationIds: multiViewData.customizationIds,
        designElements: cartItem.designElements,
        designElementsByView: multiViewData.designElementsByView,
        viewsMetadata: multiViewData.viewsMetadata,
      };
    });
  };

  // 🚅 Fonction pour construire l'objet deliveryInfo
  const buildDeliveryInfo = (): DeliveryInfo | null => {
    const isSenegalDelivery = formData.countryCode === 'SN';

    // 🆕 Pour le Sénégal, le transporteur n'est pas obligatoire
    let selectedCarrierData = null;
    if (selectedCarrier) {
      selectedCarrierData = availableCarriers.find(
        c => c.transporteur.id === selectedCarrier
      );
    }

    // Pour l'international, un transporteur est obligatoire
    if (!isSenegalDelivery && !selectedCarrierData) {
      console.error('❌ Aucun transporteur sélectionné pour livraison internationale');
      return null;
    }

    // Construire l'objet de base
    const deliveryInfo: any = {
      deliveryType: deliveryType,
      countryCode: formData.countryCode || 'SN'
    };

    // 🆕 Ajouter les infos de transporteur seulement si disponible
    if (selectedCarrierData) {
      deliveryInfo.transporteurId = selectedCarrierData.transporteur.id.toString();
      deliveryInfo.transporteurName = selectedCarrierData.transporteur.name;
      deliveryInfo.transporteurLogo = selectedCarrierData.transporteur.logoUrl;
      deliveryInfo.zoneTarifId = selectedCarrierData.tarif.id.toString();
      deliveryInfo.deliveryFee = parseFloat(selectedCarrierData.tarif.prixTransporteur.toString());
      deliveryInfo.deliveryTime = `${selectedCarrierData.tarif.delaiLivraisonMin}-${selectedCarrierData.tarif.delaiLivraisonMax} jours`;
    } else {
      // 🆕 Pas de transporteur sélectionné (ex: livraison standard au Sénégal)
      // Ne pas envoyer transporteurId/zoneTarifId si non disponibles
      deliveryInfo.transporteurName = 'Livraison standard';
      deliveryInfo.deliveryFee = deliveryFee || 0; // Utiliser les frais calculés ou 0
      deliveryInfo.deliveryTime = deliveryTime || 'Standard';
    }

    // Ajouter les infos spécifiques selon le type de livraison
    if (deliveryType === 'city' && selectedCity) {
      deliveryInfo.cityId = selectedCity.id;
      deliveryInfo.cityName = selectedCity.name;
      deliveryInfo.countryName = 'Sénégal';
    } else if (deliveryType === 'region' && selectedRegion) {
      deliveryInfo.regionId = selectedRegion.id;
      deliveryInfo.regionName = selectedRegion.name;
      deliveryInfo.countryName = 'Sénégal';
    } else if (deliveryType === 'international' && selectedZone) {
      deliveryInfo.zoneId = selectedZone.id;
      deliveryInfo.zoneName = selectedZone.name;
      // Le countryName sera trouvé via le code pays
      deliveryInfo.countryName = (getCountryByCode(formData.countryCode) as any)?.country || formData.country;
    } else if (!isSenegalDelivery) {
      // Pour l'international, la localisation est obligatoire
      console.error('❌ Localisation obligatoire manquante pour livraison internationale:', {
        deliveryType,
        selectedCity: selectedCity?.nom,
        selectedRegion: selectedRegion?.nom,
        selectedZone: selectedZone?.nom
      });
      return null;
    } else {
      // 🆕 Pour le Sénégal, pas de localisation spécifique = livraison standard
      console.log('🇸🇳 [ModernOrderForm] Livraison standard Sénégal sans localisation spécifique');
      deliveryInfo.deliveryType = 'city'; // Par défaut
      deliveryInfo.countryName = 'Sénégal';
      deliveryInfo.cityId = '';
      deliveryInfo.cityName = formData.city || 'Non spécifié';
    }

    // Ajouter les métadonnées avec les transporteurs disponibles
    deliveryInfo.metadata = {
      availableCarriers: availableCarriers.map(ac => ({
        transporteurId: ac.transporteur.id.toString(),
        name: ac.transporteur.name,
        fee: parseFloat(ac.tarif.prixTransporteur.toString()),
        time: `${ac.tarif.delaiLivraisonMin}-${ac.tarif.delaiLivraisonMax} jours`
      })),
      selectedAt: new Date().toISOString(),
      isStandardDelivery: !selectedCarrierData && isSenegalDelivery, // 🆕 Indicateur de livraison standard
      calculationDetails: {
        isSenegalDelivery,
        hasCarrier: !!selectedCarrierData,
        availableCarriersCount: availableCarriers.length
      }
    };

    console.log('🚚 [ModernOrderForm] DeliveryInfo construit:', deliveryInfo);
    return deliveryInfo;
  };

  // ✅ Fonction pour valider les informations de livraison
  const validateDeliveryInfo = (): boolean => {
    // 🔍 Log de debug pour voir l'état actuel
    console.log('🔍 [ModernOrderForm] Validation livraison:', {
      deliveryType,
      selectedCarrier: selectedCarrier || 'NON',
      deliveryFee,
      availableCarriersCount: availableCarriers.length,
      selectedCity: selectedCity?.name || 'NON',
      selectedRegion: selectedRegion?.name || 'NON',
      selectedZone: selectedZone?.name || 'NON',
      deliveryAvailable,
      isSenegal: formData.countryCode === 'SN'
    });

    // 🆕 Pour le Sénégal, le transporteur n'est pas obligatoire
    const isSenegalDelivery = formData.countryCode === 'SN';
    const requiresCarrier = !isSenegalDelivery; // Seulement pour l'international

    if (requiresCarrier && (!selectedCarrier || deliveryFee === 0)) {
      console.error('❌ Transporteur requis mais non sélectionné');
      setErrors(prev => ({
        ...prev,
        delivery: 'Veuillez sélectionner un mode de livraison'
      }));
      return false;
    }

    // 🆕 Pour le Sénégal, la localisation spécifique n'est pas obligatoire
    if (!isSenegalDelivery) {
      // Vérifier la localisation selon le type (seulement pour l'international)
      if (deliveryType === 'city' && !selectedCity) {
        console.error('❌ Ville non sélectionnée pour livraison en ville (international)');
        setErrors(prev => ({
          ...prev,
          delivery: 'Veuillez sélectionner une ville'
        }));
        return false;
      }

      if (deliveryType === 'region' && !selectedRegion) {
        console.error('❌ Région non sélectionnée pour livraison en région (international)');
        setErrors(prev => ({
          ...prev,
          delivery: 'Veuillez sélectionner une région'
        }));
        return false;
      }

      if (deliveryType === 'international' && !selectedZone) {
        console.error('❌ Zone non sélectionnée pour livraison internationale');
        setErrors(prev => ({
          ...prev,
          delivery: 'Veuillez sélectionner une zone de livraison'
        }));
        return false;
      }
    }

    console.log('✅ Validation livraison réussie');
    return true;
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
    countryCode: 'SN',
    notes: ''
  });

  // 🆕 États pour la livraison dynamique
  const [deliveryType, setDeliveryType] = useState<any>('city');
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([]);
  const [zoneTarifs, setZoneTarifs] = useState<ZoneTarif[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loadingDeliveryData, setLoadingDeliveryData] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean>(false);
  const [deliveryMessage, setDeliveryMessage] = useState<string>('');
  const [availableCarriers, setAvailableCarriers] = useState<Array<{
    transporteur: Transporteur;
    tarif: ZoneTarif;
  }>>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [addressInputTouched, setAddressInputTouched] = useState<boolean>(false); // Pour savoir si le champ adresse a été touché
  const [showDeliveryInfo, setShowDeliveryInfo] = useState<boolean>(false); // Pour contrôler l'affichage

  // 🆕 États pour la localisation sélectionnée
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedZone, setSelectedZone] = useState<InternationalZone | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<string>('paydunya');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrderFormData> & { delivery?: string; payment?: string }>({});

  // 🆕 Fonction pour gérer le changement de pays
  const handleCountryChange = (country: any) => {
    setFormData(prev => ({
      ...prev,
      country: country.name,
      countryCode: country.code,
      city: '' // Réinitialiser la ville quand le pays change
    }));

    // Réinitialiser les options de livraison et recalculer
    setSelectedDelivery('');
    setDeliveryFee(0);
    setDeliveryTime('');
    setDeliveryAvailable(false);
    setDeliveryMessage('');
    setShowDeliveryInfo(false); // Cacher les infos de livraison
    setAvailableCarriers([]); // Réinitialiser les transporteurs
    setSelectedCarrier(''); // Réinitialiser le transporteur sélectionné
    setAddressInputTouched(false); // Réinitialiser l'état de saisie

    // 🆕 Réinitialiser les états de localisation
    setSelectedCity(null);
    setSelectedRegion(null);
    setSelectedZone(null);

    // Déterminer automatiquement le type de livraison
    if (country.code === 'SN') {
      setDeliveryType('city'); // Sénégal -> villes et régions
    } else if (country.region === 'Afrique') {
      setDeliveryType('region'); // Afrique -> régions
    } else {
      setDeliveryType('international'); // Reste du monde -> international
    }

    // Effacer les erreurs de livraison
    setErrors(prev => ({ ...prev, delivery: undefined }));
  };

  // ========================================
  // 📦 SYSTÈME DE VÉRIFICATION DE LIVRAISON
  // ========================================
  /**
   * Normalise les noms de villes pour une meilleure correspondance
   * entre les données GeoNames et la base de données admin.
   *
   * Transformations appliquées :
   * - Conversion en minuscules
   * - Suppression des accents (é -> e, à -> a, etc.)
   * - Suppression des caractères spéciaux (garde uniquement a-z, 0-9, espaces, tirets)
   *
   * Exemple : "Dakar-Médina" -> "dakar-medina"
   */
  const normalizeCityName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garde seulement lettres, chiffres, espaces et tirets
      .trim();
  };

  /**
   * Vérifie automatiquement la disponibilité de livraison pour une ville sélectionnée.
   *
   * FONCTIONNEMENT :
   * ================
   *
   * 1. Pour le Sénégal (code SN) :
   *    a) Recherche EXACTE dans les villes définies par l'admin (ex: Dakar, Thiès)
   *       -> Si trouvé : affiche le tarif et délai de la ville
   *
   *    b) Recherche PARTIELLE dans les villes si pas de match exact
   *       -> Exemple: "Daka" matchera "Dakar"
   *
   *    c) Recherche dans les régions (13 régions du Sénégal)
   *       -> Si la ville est listée dans "mainCities" d'une région
   *       -> Affiche le tarif et délai de la région
   *
   *    d) Si aucune correspondance : "Zone non desservie"
   *
   * 2. Pour les autres pays (international) :
   *    - Recherche dans les zones internationales définies par l'admin
   *    - Affiche le tarif et délai de la zone internationale
   *
   * Les données sont chargées depuis l'API backend :
   * - /api/delivery/cities (villes Dakar & banlieue)
   * - /api/delivery/regions (13 régions du Sénégal)
   * - /api/delivery/international-zones (zones mondiales)
   *
   * @param cityName - Nom de la ville saisie (vient de GeoNames autocomplete)
   * @param countryCode - Code ISO du pays (ex: 'SN', 'FR', 'US')
   */
  const checkDeliveryAvailability = async (cityName: string, countryCode: string) => {
    if (!cityName || !countryCode) {
      setDeliveryAvailable(false);
      setDeliveryMessage('Veuillez sélectionner un pays et une ville');
      setDeliveryFee(0);
      setDeliveryTime('');
      setSelectedDelivery('');
      return;
    }

    try {
      console.log('🔍 [ModernOrderForm] Vérification livraison:', { cityName, countryCode });

      if (countryCode === 'SN') {
        console.log('🏙️ [ModernOrderForm] Villes admin disponibles:', cities.map(c => ({ id: c.id, name: c.name, status: c.status })));
        console.log('🗺️ [ModernOrderForm] Régions admin disponibles:', regions.map(r => ({ id: r.id, name: r.name, status: r.status })));

        const normalizedSearch = normalizeCityName(cityName);
        console.log('🔎 [ModernOrderForm] Recherche normalisée:', normalizedSearch);
        console.log('📊 [ModernOrderForm] Données brutes:', { citiesCount: cities.length, regionsCount: regions.length });

        // Chercher d'abord dans les villes définies par l'admin avec nom normalisé
        let cityData = cities.find(city =>
          city.status === 'active' && normalizeCityName(city.name) === normalizedSearch
        );

        // Si pas de correspondance exacte, chercher une correspondance partielle stricte
        if (!cityData) {
          console.log('🔍 [ModernOrderForm] Recherche partielle pour:', normalizedSearch);
          cityData = cities.find(city => {
            const normalizedCityName = normalizeCityName(city.name);
            const isStartMatch = normalizedCityName.startsWith(normalizedSearch) && normalizedSearch.length >= 3;
            const isIncludesMatch = normalizedCityName.includes(normalizedSearch) && normalizedSearch.length >= 4;
            const isActive = city.status === 'active';
            const match = isActive && (isStartMatch || isIncludesMatch);

            console.log('🔎 [ModernOrderForm] Test ville:', {
              cityName: city.name,
              normalizedCityName,
              normalizedSearch,
              isActive,
              isStartMatch,
              isIncludesMatch,
              match
            });

            return match;
          });
        }

        if (!cityData) {
          console.log('❌ [ModernOrderForm] Aucune ville trouvée pour:', normalizedSearch);
        }

        if (cityData && cityData.status === 'active') {
          const isExactMatch = normalizeCityName(cityData.name) === normalizedSearch;
          console.log('✅ [ModernOrderForm] Ville trouvée:', cityData.name, isExactMatch ? '(correspondance exacte)' : '(correspondance partielle)');

          // 🆕 Mettre à jour les états de localisation
          setSelectedCity(cityData);
          setSelectedRegion(null);
          setSelectedZone(null);

          // Ville trouvée et active
          setDeliveryAvailable(true);
          setSelectedDelivery(cityData.id);
          setDeliveryFee(parseFloat(cityData.price));

          // Formater le temps de livraison
          if (cityData.deliveryTimeMin && cityData.deliveryTimeMax && cityData.deliveryTimeUnit) {
            const unit = cityData.deliveryTimeUnit === 'heures' ? 'heures' : 'jours';
            setDeliveryTime(`${cityData.deliveryTimeMin}-${cityData.deliveryTimeMax} ${unit}`);
          } else {
            setDeliveryTime('Standard');
          }

          // Message détaillé selon le tarif
          if (cityData.isFree || parseFloat(cityData.price) === 0) {
            setDeliveryMessage(`🎉 Livraison gratuite disponible à ${cityData.name}`);
          } else {
            setDeliveryMessage(`✅ Livraison disponible à ${cityData.name}`);
          }
          return;
        }

        console.log('❌ [ModernOrderForm] Ville non trouvée, recherche dans les régions...');

        // Si ville non trouvée, chercher dans les régions avec normalisation
        let regionData = regions.find(region => {
          const normalizedRegionName = normalizeCityName(region.name);
          const normalizedMainCities = region.mainCities ? normalizeCityName(region.mainCities) : '';
          const isExactRegionMatch = normalizedRegionName === normalizedSearch;
          const isInMainCities = normalizedMainCities && normalizedMainCities.includes(normalizedSearch);
          const isActive = region.status === 'active';
          const match = isActive && (isExactRegionMatch || isInMainCities);

          console.log('🔎 [ModernOrderForm] Test région:', {
            regionName: region.name,
            normalizedRegionName,
            normalizedSearch,
            normalizedMainCities,
            isActive,
            isExactRegionMatch,
            isInMainCities,
            match
          });

          return match;
        });

        // Si pas de correspondance exacte, chercher une correspondance partielle stricte pour les régions
        if (!regionData) {
          regionData = regions.find(region => {
            const normalizedRegionName = normalizeCityName(region.name);
            return region.status === 'active' && (
              // La recherche correspond au début du nom de région (au moins 3 caractères)
              (normalizedRegionName.startsWith(normalizedSearch) && normalizedSearch.length >= 3) ||
              // Correspondance partielle plus stricte (nom de région contient recherche)
              (normalizedRegionName.includes(normalizedSearch) && normalizedSearch.length >= 4)
            );
          });
        }

        if (regionData && regionData.status === 'active') {
          console.log('✅ [ModernOrderForm] Région trouvée:', regionData.name, 'avec mainCities:', regionData.mainCities);

          // 🆕 Mettre à jour les états de localisation
          setSelectedCity(null);
          setSelectedRegion(regionData);
          setSelectedZone(null);

          // Région trouvée et active
          setDeliveryAvailable(true);
          setSelectedDelivery(regionData.id);
          setDeliveryFee(parseFloat(regionData.price));

          // Formater le temps de livraison
          const unit = regionData.deliveryTimeUnit === 'heures' ? 'heures' : 'jours';
          setDeliveryTime(`${regionData.deliveryTimeMin}-${regionData.deliveryTimeMax} ${unit}`);

          setDeliveryMessage(`✅ Livraison disponible dans la région de ${regionData.name}`);
        } else {
          console.log('❌ [ModernOrderForm] Ni ville ni région trouvée pour:', cityName);

          // 🆕 Réinitialiser les états de localisation
          setSelectedCity(null);
          setSelectedRegion(null);
          setSelectedZone(null);

          // Ni ville ni région trouvée
          setDeliveryAvailable(false);
          setDeliveryFee(0);
          setDeliveryTime('');
          setSelectedDelivery('');
          setDeliveryMessage(`❌ Désolé, la livraison vers "${cityName}" n'est pas encore disponible. Veuillez contacter le service client ou choisir une autre ville.`);
        }
      } else {
        // Pour les autres pays, utiliser les zones internationales
        // Chercher le pays sélectionné dans la liste des pays
        const selectedCountryInfo = getCountryByCode(countryCode);

        console.log('🌍 [ModernOrderForm] Recherche zone internationale:', {
          countryCode,
          countryName: selectedCountryInfo?.name,
          totalZones: internationalZones.length,
          activeZones: internationalZones.filter(z => z.status === 'active').length
        });

        const zone = internationalZones.find(z => {
          if (z.status !== 'active') return false;

          const hasCountry = z.countries.some((country: string | any) => {
            // Récupérer le nom du pays stocké dans la zone
            const storedCountryName = typeof country === 'string' ? country : country.country;

            // Normaliser pour la comparaison (minuscules, sans accents)
            const normalizedStored = storedCountryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normalizedCountryCode = countryCode.toLowerCase();
            const normalizedCountryName = selectedCountryInfo?.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

            console.log('🔍 [ModernOrderForm] Comparaison pays:', {
              zoneName: z.name,
              storedCountryName,
              normalizedStored,
              normalizedCountryCode,
              normalizedCountryName,
              matchCode: normalizedStored === normalizedCountryCode,
              matchName: normalizedStored === normalizedCountryName
            });

            // Comparer avec le code pays (ex: "FR") OU le nom du pays (ex: "France")
            return normalizedStored === normalizedCountryCode ||
                   normalizedStored === normalizedCountryName;
          });

          if (hasCountry) {
            console.log('✅ [ModernOrderForm] Zone trouvée:', z.name, 'avec', z.countries.length, 'pays');
          }

          return hasCountry;
        });

        if (zone) {
          console.log('🔍 [ModernOrderForm] Zone trouvée, recherche des tarifs:', {
            zoneId: zone.id,
            zoneIdType: typeof zone.id,
            zoneName: zone.name,
            zoneComplete: zone,
            allZoneTarifs: zoneTarifs,
            allTransporteurs: transporteurs
          });

          // Chercher tous les tarifs de transporteurs pour cette zone
          const tarifsForZone = zoneTarifs.filter(tarif => {
            // Vérifier la correspondance par ID ou par nom de zone
            const matchById = tarif.zoneId === zone.id;
            const matchByName = tarif.zoneName === zone.name;
            const match = (matchById || matchByName) && tarif.status === 'active';

            console.log('🔎 [ModernOrderForm] Vérification tarif:', {
              tarifId: tarif.id,
              tarifZoneId: tarif.zoneId,
              tarifZoneName: tarif.zoneName,
              targetZoneId: zone.id,
              targetZoneName: zone.name,
              matchById,
              matchByName,
              status: tarif.status,
              active: tarif.status === 'active',
              finalMatch: match
            });
            return match;
          });

          console.log('📋 [ModernOrderForm] Tarifs filtrés pour cette zone:', tarifsForZone);

          // ✅ Utiliser les données enrichies directement depuis l'API
          const carriersForZone = tarifsForZone
            .map(tarif => {
              // Les données enrichies contiennent déjà le transporteur complet!
              const enrichedTarif = tarif as any; // Cast temporaire pour accéder aux données enrichies

              if (enrichedTarif.transporteur) {
                console.log('✅ [ModernOrderForm] Transporteur enrichi trouvé:', {
                  tarifId: tarif.id,
                  transporteurName: enrichedTarif.transporteur.name,
                  transporteurLogo: enrichedTarif.transporteurLogo,
                  countries: enrichedTarif.countries
                });

                return {
                  transporteur: enrichedTarif.transporteur,
                  tarif: tarif,
                  logo: enrichedTarif.transporteurLogo
                };
              }

              // Fallback: recherche dans la liste locale si pas de données enrichies
              const transporteur = transporteurs.find(t => t.id === tarif.transporteurId);
              console.log('🚛 [ModernOrderForm] Fallback recherche transporteur:', {
                tarifId: tarif.id,
                transporteurId: tarif.transporteurId,
                transporteurTrouve: !!transporteur
              });

              return transporteur ? { transporteur, tarif, logo: transporteur.logoUrl || '' } : null;
            })
            .filter((item): item is { transporteur: Transporteur; tarif: ZoneTarif; logo: string } => item !== null);

          console.log('🚚 [ModernOrderForm] Transporteurs disponibles pour la zone:', {
            zoneName: zone.name,
            zoneId: zone.id,
            carriersForZone,
            zoneTarifsCount: zoneTarifs.length,
            transporteursCount: transporteurs.length,
            tarifsForThisZone: zoneTarifs.filter(t => t.zoneId === zone.id)
          });

          if (carriersForZone.length > 0) {
            // 🆕 Mettre à jour les états de localisation
            setSelectedCity(null);
            setSelectedRegion(null);
            setSelectedZone(zone);

            // Il y a des transporteurs avec tarifs définis pour cette zone
            setAvailableCarriers(carriersForZone);
            setDeliveryAvailable(true);
            setSelectedDelivery(zone.id);

            // Par défaut, sélectionner le premier transporteur (le moins cher)
            const cheapestCarrier = carriersForZone.reduce((prev, curr) =>
              parseFloat(curr.tarif.prixTransporteur) < parseFloat(prev.tarif.prixTransporteur) ? curr : prev
            );

            setSelectedCarrier(cheapestCarrier.transporteur.id);
            setDeliveryFee(parseFloat(cheapestCarrier.tarif.prixTransporteur));
            setDeliveryTime(`${cheapestCarrier.tarif.delaiLivraisonMin}-${cheapestCarrier.tarif.delaiLivraisonMax} jours`);

            const countryInfo = getCountryByCode(countryCode);
            setDeliveryMessage(`🌍 ${carriersForZone.length} transporteur${carriersForZone.length > 1 ? 's' : ''} disponible${carriersForZone.length > 1 ? 's' : ''} pour ${countryInfo?.name || countryCode}`);
          } else {
            // 🆕 Mettre à jour les états de localisation
            setSelectedCity(null);
            setSelectedRegion(null);
            setSelectedZone(zone);

            // Zone existe mais pas de tarif transporteur défini, utiliser le prix standard
            setAvailableCarriers([]);
            setSelectedCarrier('');
            setDeliveryAvailable(true);
            setSelectedDelivery(zone.id);
            setDeliveryFee(parseFloat(zone.price));
            setDeliveryTime(`${zone.deliveryTimeMin}-${zone.deliveryTimeMax} jours`);
            const countryInfo = getCountryByCode(countryCode);
            setDeliveryMessage(`🌍 Livraison internationale disponible vers ${countryInfo?.name || countryCode}`);
          }
        } else {
          console.log('❌ [ModernOrderForm] Aucune zone internationale trouvée pour:', countryCode, selectedCountryInfo?.name);
          console.log('📊 [ModernOrderForm] Zones disponibles:', internationalZones.map(z => ({
            name: z.name,
            countries: z.countries,
            status: z.status
          })));

          // 🆕 Réinitialiser les états de localisation
          setSelectedCity(null);
          setSelectedRegion(null);
          setSelectedZone(null);

          setDeliveryAvailable(false);
          setDeliveryFee(0);
          setDeliveryTime('');
          setSelectedDelivery('');
          setAvailableCarriers([]);
          setSelectedCarrier('');
          const countryInfo = getCountryByCode(countryCode);
          setDeliveryMessage(`❌ Désolé, la livraison vers ${countryInfo?.name || countryCode} n'est pas encore disponible. Veuillez contacter le service client.`);
        }
      }
    } catch (error) {
      console.error('❌ [ModernOrderForm] Erreur vérification livraison:', error);

      // 🆕 Réinitialiser les états de localisation en cas d'erreur
      setSelectedCity(null);
      setSelectedRegion(null);
      setSelectedZone(null);

      setDeliveryAvailable(false);
      setDeliveryMessage(`❌ Une erreur est survenue lors de la vérification de la livraison. Veuillez réessayer.`);
      setDeliveryFee(0);
      setDeliveryTime('');
      setSelectedDelivery('');
    }
  };

  // 🆕 Charger les données de livraison au démarrage
  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        setLoadingDeliveryData(true);
        console.log('📦 [ModernOrderForm] Chargement des données de livraison...');

        const [citiesData, regionsData, zonesData, tarifsData, transporteursData] = await Promise.all([
          deliveryService.getCities(),
          deliveryService.getRegions(),
          deliveryService.getInternationalZones(),
          deliveryService.getZoneTarifs(),
          deliveryService.getTransporteurs(),
        ]);

        // Filtrer uniquement les zones actives
        setCities(citiesData.filter(c => c.status === 'active'));
        setRegions(regionsData.filter(r => r.status === 'active'));
        setInternationalZones(zonesData.filter(z => z.status === 'active'));
        setZoneTarifs(tarifsData.filter(t => t.status === 'active'));
        setTransporteurs(transporteursData.filter(t => t.status === 'active'));

        console.log('✅ [ModernOrderForm] Données de livraison chargées:', {
          cities: citiesData.length,
          regions: regionsData.length,
          zones: zonesData.length,
          tarifs: tarifsData.length,
          transporteurs: transporteursData.length
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

  // 🆕 Vérifier la disponibilité de la livraison uniquement quand l'adresse complète est saisie
  useEffect(() => {
    // Cacher les infos si l'adresse est effacée ET réinitialiser complètement les états de livraison
    if (!formData.address || formData.address.length < 3) {
      setShowDeliveryInfo(false);
      // 🐛 Réinitialiser complètement tous les états de livraison pour éviter le bug de conservation
      setDeliveryMessage('');
      setDeliveryAvailable(false);
      setDeliveryFee(0);
      setDeliveryTime('');
      setSelectedDelivery('');
      setAvailableCarriers([]);
      setSelectedCarrier('');
      // Réinitialiser aussi les états de localisation
      setSelectedCity(null);
      setSelectedRegion(null);
      setSelectedZone(null);
      return;
    }

    // Ne vérifier que si adresse a au moins 3 caractères, pays défini, et données de livraison chargées
    if (formData.address && formData.address.length >= 3 && formData.countryCode &&
        ((cities.length > 0 || regions.length > 0) || formData.countryCode !== 'SN') && addressInputTouched) {
      // Attendre un peu que l'utilisateur finisse de taper
      const timer = setTimeout(() => {
        // Utiliser l'adresse complète (quartier/zone) pour vérifier la disponibilité
        // L'admin définit les quartiers/zones comme "Point E", "Médina", etc.
        checkDeliveryAvailability(formData.address, formData.countryCode);
        setShowDeliveryInfo(true); // Afficher les infos après la vérification
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [formData.address, formData.countryCode, cities, regions, internationalZones, addressInputTouched]);

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
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'review', label: 'Confirmation', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

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
      if (!formData.country || !formData.countryCode) newErrors.country = 'Pays requis';

      // 🆕 Validation de la disponibilité de la livraison (seulement si l'utilisateur a saisi une ville)
      if (showDeliveryInfo && !deliveryAvailable) {
        newErrors.delivery = 'La livraison n\'est pas disponible pour cette ville. Veuillez choisir une autre ville ou contacter le service client.';
      }

      // 🆕 Validation de la sélection du transporteur pour les zones internationales
      if (showDeliveryInfo && deliveryAvailable && availableCarriers.length > 0 && !selectedCarrier) {
        newErrors.delivery = 'Veuillez sélectionner un transporteur pour continuer.';
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
      console.log('=== DÉBUT PAIEMENT PAYDUNYA ===');

      console.log('💳 [ModernOrderForm] Traitement paiement PayDunya:', {
        cartItemsCount: cartItems.length,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity
        }))
      });

      // 1. VALIDATION DE LA LIVRAISON
      console.log('1️⃣ Validation de la livraison...');
      if (!validateDeliveryInfo()) {
        console.error('❌ Validation livraison échouée');
        setIsSubmitting(false);
        return;
      }
      console.log('✅ Validation livraison OK');

      // 2. CONSTRUCTION DELIVERY INFO
      console.log('2️⃣ Construction deliveryInfo...');
      const deliveryInfo = buildDeliveryInfo();
      if (!deliveryInfo) {
        console.error('❌ Construction deliveryInfo échouée');
        setErrors(prev => ({
          ...prev,
          delivery: 'Erreur lors de la construction des infos de livraison'
        }));
        setIsSubmitting(false);
        return;
      }
      console.log('✅ DeliveryInfo construit:', deliveryInfo);

      // 3. CRÉATION DES ORDER ITEMS
      console.log('3️⃣ Construction des articles...');
      const orderItems = createOrderItems();
      console.log(`✅ ${orderItems.length} article(s) créé(s)`);

      // 4. CALCUL DU TOTAL (PRODUITS + LIVRAISON)
      console.log('4️⃣ Calcul du total...');
      const subtotal = orderItems.reduce((sum, item) =>
        sum + (item.unitPrice * item.quantity), 0
      );
      const totalAmount = subtotal + deliveryInfo.deliveryFee;
      console.log('💰 Calculs:', {
        subtotal,
        deliveryFee: deliveryInfo.deliveryFee,
        totalAmount
      });

      // 5. CONSTRUCTION DE LA REQUÊTE
      console.log('5️⃣ Construction de la requête...');
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
        totalAmount: totalAmount, // Total calculé (produits + livraison)
        deliveryInfo: deliveryInfo // 🚚 AJOUTER LES INFOS DE LIVRAISON
      };

      console.log('📦 Requête complète:', {
        email: orderRequest.email,
        itemsCount: orderRequest.orderItems.length,
        totalAmount: orderRequest.totalAmount,
        deliveryInfo: orderRequest.deliveryInfo // Log complet de deliveryInfo
      });

      // 🔍 DEBUG COMPLET: Vérifier les données de customisation envoyées
      console.log('🔍 [DEBUG] Données de customisation envoyées au backend:', {
        orderItems: orderRequest.orderItems.map(item => ({
          productId: item.productId,
          customizationId: item.customizationId,
          customizationIds: item.customizationIds,
          hasDesignElements: !!(item.designElements && item.designElements.length > 0),
          designElementsByViewKeys: Object.keys(item.designElementsByView || {}),
          viewsMetadataCount: item.viewsMetadata?.length || 0
        }))
      });

      // 🔧 FIX: Nettoyer les données de customisation invalides avant envoi
      const cleanedOrderItems = orderRequest.orderItems.map(item => {
        const cleaned = { ...item };

        // 🎯 Cas des produits vendor avec design prédéfini : ne PAS envoyer de données de customisation
        if (cleaned.vendorProductId && cleaned.designId) {
          console.log(`🎯 [DEBUG] Produit vendor avec design prédéfini détecté (productId: ${cleaned.productId}) - Suppression des champs de customisation`);

          // Supprimer tous les champs de customisation pour les produits vendor avec design défini
          delete cleaned.customizationId;
          delete cleaned.customizationIds;
          delete cleaned.designElements;
          delete cleaned.designElementsByView;
          delete cleaned.viewsMetadata;
        } else {
          // Pour les autres produits, nettoyer uniquement les données vides

          // Si customizationIds est un objet vide, le supprimer pour éviter validation errors
          if (cleaned.customizationIds && Object.keys(cleaned.customizationIds).length === 0) {
            delete cleaned.customizationIds;
          }

          // Si designElementsByView est un objet vide, le supprimer
          if (cleaned.designElementsByView && Object.keys(cleaned.designElementsByView).length === 0) {
            delete cleaned.designElementsByView;
          }

          // Si designElements est un tableau vide, le supprimer
          if (cleaned.designElements && Array.isArray(cleaned.designElements) && cleaned.designElements.length === 0) {
            delete cleaned.designElements;
          }

          // Si viewsMetadata est un tableau vide, le supprimer
          if (cleaned.viewsMetadata && Array.isArray(cleaned.viewsMetadata) && cleaned.viewsMetadata.length === 0) {
            delete cleaned.viewsMetadata;
          }
        }

        return cleaned;
      });

      // Mettre à jour la requête avec les données nettoyées
      orderRequest.orderItems = cleanedOrderItems;

      console.log('🧹 [DEBUG] Données de customisation nettoyées:', {
        orderItems: orderRequest.orderItems.map(item => ({
          productId: item.productId,
          isVendorProduct: !!item.vendorProductId,
          hasDesignId: !!item.designId,
          hasCustomizationId: !!item.customizationId,
          hasCustomizationIds: !!item.customizationIds,
          hasDesignElements: !!item.designElements,
          hasDesignElementsByView: !!item.designElementsByView,
          hasViewsMetadata: !!item.viewsMetadata
        }))
      });

      // Log détaillé des champs clés pour validation
      console.log('🔍 Validation deliveryInfo:', {
        transporteurId: orderRequest.deliveryInfo?.transporteurId,
        transporteurIdType: typeof orderRequest.deliveryInfo?.transporteurId,
        zoneTarifId: orderRequest.deliveryInfo?.zoneTarifId,
        zoneTarifIdType: typeof orderRequest.deliveryInfo?.zoneTarifId,
        deliveryFee: orderRequest.deliveryInfo?.deliveryFee,
        deliveryFeeType: typeof orderRequest.deliveryInfo?.deliveryFee,
        deliveryType: orderRequest.deliveryInfo?.deliveryType,
        countryCode: orderRequest.deliveryInfo?.countryCode
      });

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
      console.error('=== ERREUR PAIEMENT PAYDUNYA ===');

      // Gestion sécurisée de l'erreur pour éviter les propriétés undefined
      // Vérifier si error n'est pas null ou undefined
      if (!error) {
        console.error('❌ Erreur inattendue: error est null ou undefined');
        toast({
          title: "Erreur de paiement",
          description: "Une erreur inattendue est survenue. Veuillez réessayer.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const errorMessage = error.message || 'Erreur inconnue';
      const errorResponse = error.response || null;
      const errorData = errorResponse?.data || null;
      const errorStack = error.stack || 'No stack available';

      // Logger de manière sécurisée pour éviter les problèmes avec les extensions
      console.error('❌ Erreur détectée');
      console.error('❌ Message:', errorMessage);
      if (errorData) {
        console.error('❌ Response:', JSON.stringify(errorData, null, 2));
      }
      console.error('❌ Stack:', errorStack);

      // 🚨 GESTION SPÉCIFIQUE DES ERREURS DE LIVRAISON
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Erreurs de validation spécifiques à la livraison
          const deliveryErrors = errorData.errors.filter((err: string) =>
            err.toLowerCase().includes('livraison') ||
            err.toLowerCase().includes('transporteur') ||
            err.toLowerCase().includes('frais') ||
            err.toLowerCase().includes('zone') ||
            err.toLowerCase().includes('ville') ||
            err.toLowerCase().includes('région')
          );

          if (deliveryErrors.length > 0) {
            setErrors({
              delivery: deliveryErrors.join('\n')
            });
          } else {
            setErrors({
              payment: errorData.errors.join('\n')
            });
          }
        } else if (errorData.message) {
          // Message d'erreur général
          if (errorData.message.toLowerCase().includes('livraison') ||
              errorData.message.toLowerCase().includes('transporteur')) {
            setErrors({
              delivery: errorData.message
            });
          } else {
            setErrors({
              payment: errorData.message || 'Erreur de validation'
            });
          }
        } else {
          setErrors({
            payment: 'Veuillez vérifier vos informations'
          });
        }
      } else if (error.response && error.response.status === 500) {
        setErrors({
          payment: 'Erreur serveur. Veuillez réessayer plus tard.'
        });
      } else if (error.message) {
        setErrors({
          payment: error.message
        });
      } else {
        setErrors({
          payment: 'Erreur lors du traitement du paiement'
        });
      }
    } finally {
      setIsSubmitting(false);
      console.log('=== FIN PAIEMENT PAYDUNYA ===');
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
        console.log('=== DÉBUT PAIEMENT À LA LIVRAISON ===');
        console.log('💵 [ModernOrderForm] Traitement paiement à la livraison:', {
          cartItemsCount: cartItems.length,
          cartItems: cartItems.map(item => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity
          }))
        });

        // 1. VALIDATION DE LA LIVRAISON
        console.log('1️⃣ Validation de la livraison...');
        if (!validateDeliveryInfo()) {
          console.error('❌ Validation livraison échouée');
          setIsSubmitting(false);
          return;
        }
        console.log('✅ Validation livraison OK');

        // 2. CONSTRUCTION DELIVERY INFO
        console.log('2️⃣ Construction deliveryInfo...');
        const deliveryInfo = buildDeliveryInfo();
        if (!deliveryInfo) {
          console.error('❌ Construction deliveryInfo échouée');
          setErrors(prev => ({
            ...prev,
            delivery: 'Erreur lors de la construction des infos de livraison'
          }));
          setIsSubmitting(false);
          return;
        }
        console.log('✅ DeliveryInfo construit:', deliveryInfo);

        // 3. CRÉATION DES ORDER ITEMS
        console.log('3️⃣ Construction des articles...');
        const orderItems = createOrderItems();
        console.log(`✅ ${orderItems.length} article(s) créé(s)`);

        // 4. CALCUL DU TOTAL (PRODUITS + LIVRAISON)
        console.log('4️⃣ Calcul du total...');
        const subtotal = orderItems.reduce((sum, item) =>
          sum + (item.unitPrice * item.quantity), 0
        );
        const totalAmount = subtotal + deliveryInfo.deliveryFee;
        console.log('💰 Calculs:', {
          subtotal,
          deliveryFee: deliveryInfo.deliveryFee,
          totalAmount
        });

        // 5. CONSTRUCTION DE LA REQUÊTE
        console.log('5️⃣ Construction de la requête...');
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
          totalAmount: totalAmount, // Total calculé (produits + livraison)
          deliveryInfo: deliveryInfo // 🚚 AJOUTER LES INFOS DE LIVRAISON
        };

        console.log('📦 Requête complète:', {
          email: orderRequest.email,
          itemsCount: orderRequest.orderItems.length,
          totalAmount: orderRequest.totalAmount,
          deliveryType: orderRequest.deliveryInfo?.deliveryType,
          transporteur: orderRequest.deliveryInfo?.transporteurName,
          deliveryFee: orderRequest.deliveryInfo?.deliveryFee
        });

        // 🔍 DEBUG COMPLET: Vérifier les données de customisation envoyées
        console.log('🔍 [DEBUG] Données de customisation envoyées au backend:', {
          orderItems: orderRequest.orderItems.map(item => ({
            productId: item.productId,
            customizationId: item.customizationId,
            customizationIds: item.customizationIds,
            hasDesignElements: !!(item.designElements && item.designElements.length > 0),
            designElementsByViewKeys: Object.keys(item.designElementsByView || {}),
            viewsMetadataCount: item.viewsMetadata?.length || 0
          }))
        });

        // 🔧 FIX: Nettoyer les données de customisation invalides avant envoi
        const cleanedOrderItems = orderRequest.orderItems.map(item => {
          const cleaned = { ...item };

          // 🎯 Cas des produits vendor avec design prédéfini : ne PAS envoyer de données de customisation
          if (cleaned.vendorProductId && cleaned.designId) {
            console.log(`🎯 [DEBUG] Produit vendor avec design prédéfini détecté (productId: ${cleaned.productId}) - Suppression des champs de customisation`);

            // Supprimer tous les champs de customisation pour les produits vendor avec design défini
            delete cleaned.customizationId;
            delete cleaned.customizationIds;
            delete cleaned.designElements;
            delete cleaned.designElementsByView;
            delete cleaned.viewsMetadata;
          } else {
            // Pour les autres produits, nettoyer uniquement les données vides

            // Si customizationIds est un objet vide, le supprimer pour éviter validation errors
            if (cleaned.customizationIds && Object.keys(cleaned.customizationIds).length === 0) {
              delete cleaned.customizationIds;
            }

            // Si designElementsByView est un objet vide, le supprimer
            if (cleaned.designElementsByView && Object.keys(cleaned.designElementsByView).length === 0) {
              delete cleaned.designElementsByView;
            }

            // Si designElements est un tableau vide, le supprimer
            if (cleaned.designElements && Array.isArray(cleaned.designElements) && cleaned.designElements.length === 0) {
              delete cleaned.designElements;
            }

            // Si viewsMetadata est un tableau vide, le supprimer
            if (cleaned.viewsMetadata && Array.isArray(cleaned.viewsMetadata) && cleaned.viewsMetadata.length === 0) {
              delete cleaned.viewsMetadata;
            }
          }

          return cleaned;
        });

        // Mettre à jour la requête avec les données nettoyées
        orderRequest.orderItems = cleanedOrderItems;

        console.log('🧹 [DEBUG] Données de customisation nettoyées:', {
          orderItems: orderRequest.orderItems.map(item => ({
            productId: item.productId,
            isVendorProduct: !!item.vendorProductId,
            hasDesignId: !!item.designId,
            hasCustomizationId: !!item.customizationId,
            hasCustomizationIds: !!item.customizationIds,
            hasDesignElements: !!item.designElements,
            hasDesignElementsByView: !!item.designElementsByView,
            hasViewsMetadata: !!item.viewsMetadata
          }))
        });

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

      } catch (error: any) {
        console.error('=== ERREUR PAIEMENT À LA LIVRAISON ===');

        // Vérifier si error n'est pas null ou undefined
        if (!error) {
          console.error('❌ Erreur inattendue: error est null ou undefined');
          toast({
            title: "Erreur de paiement",
            description: "Une erreur inattendue est survenue lors du paiement à la livraison. Veuillez réessayer.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        console.error('❌ Erreur:', error);
        console.error('❌ Message:', error.message || 'Pas de message');
        console.error('❌ Response:', error.response?.data || 'Pas de response');

        // 🚨 GESTION SPÉCIFIQUE DES ERREURS DE LIVRAISON
        if (error.response && error.response.status === 400) {
          const errorData = error.response.data;

          if (errorData.errors && Array.isArray(errorData.errors)) {
            // Erreurs de validation spécifiques à la livraison
            const deliveryErrors = errorData.errors.filter((err: string) =>
              err.toLowerCase().includes('livraison') ||
              err.toLowerCase().includes('transporteur') ||
              err.toLowerCase().includes('frais') ||
              err.toLowerCase().includes('zone') ||
              err.toLowerCase().includes('ville') ||
              err.toLowerCase().includes('région')
            );

            if (deliveryErrors.length > 0) {
              setErrors({
                delivery: deliveryErrors.join('\n')
              });
            } else {
              setErrors({
                payment: errorData.errors.join('\n')
              });
            }
          } else if (errorData.message) {
            // Message d'erreur général
            if (errorData.message.toLowerCase().includes('livraison') ||
                errorData.message.toLowerCase().includes('transporteur')) {
              setErrors({
                delivery: errorData.message
              });
            } else {
              setErrors({
                payment: errorData.message || 'Erreur de validation'
              });
            }
          } else {
            setErrors({
              payment: 'Veuillez vérifier vos informations'
            });
          }
        } else if (error.response && error.response.status === 500) {
          setErrors({
            payment: 'Erreur serveur. Veuillez réessayer plus tard.'
          });
        } else if (error.message) {
          setErrors({
            payment: error.message
          });
        } else {
          setErrors({
            payment: 'Erreur lors de la création de la commande. Veuillez réessayer.'
          });
        }
      } finally {
        setIsSubmitting(false);
        console.log('=== FIN PAIEMENT À LA LIVRAISON ===');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof OrderFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // 🔄 Si l'adresse change, marquer le champ comme touché pour déclencher la vérification
    if (name === 'address') {
      setAddressInputTouched(true); // Marquer que le champ adresse a été modifié
      // Réinitialiser les infos de livraison pour forcer une nouvelle vérification
      setShowDeliveryInfo(false);
      setDeliveryMessage('');
      setDeliveryAvailable(false);
      setDeliveryFee(0);
      setDeliveryTime('');
      setSelectedDelivery('');
      setAvailableCarriers([]);
      setSelectedCarrier('');
      setSelectedCity(null);
      setSelectedRegion(null);
      setSelectedZone(null);
      setErrors(prev => ({ ...prev, delivery: undefined }));
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 font-['Inter',_'system-ui',_sans-serif]">
      {/* Header fixe avec progression - Design moderne */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => navigate(-1)}
              className="group p-1.5 sm:p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
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
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                            isCompleted ? 'text-white shadow-green-200' : isActive ? 'text-white shadow-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </motion.div>
                        <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-semibold tracking-wide hidden md:block ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
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
                {/* Étape 1 : Informations client - Design moderne */}
                {currentStep === 'customer-info' && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/50 p-3 sm:p-8 space-y-4 sm:space-y-8 border border-slate-100">
                    {/* Header avec icône moderne */}
                    <div className="flex items-center gap-2 sm:gap-4 pb-3 sm:pb-6 border-b border-slate-100">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl sm:rounded-2xl blur-md sm:blur-lg opacity-40 animate-pulse"></div>
                        <div className="relative p-2 sm:p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-blue-200/50 flex-shrink-0">
                          <BiSolidUser className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h2 className="text-sm sm:text-2xl font-bold text-slate-900 tracking-tight">Vos informations</h2>
                          <HiSparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" />
                        </div>
                        <p className="text-[10px] sm:text-base text-slate-500 mt-0.5 sm:mt-1">Pour la livraison et le suivi</p>
                      </div>
                    </div>

                    {/* Structure du formulaire */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Section 1: Identité */}
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                          <BiSolidUser className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Identité</h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="group">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                              Prénom <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-xs sm:text-base placeholder:text-slate-400 font-medium ${
                                errors.firstName ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500'
                              }`}
                              placeholder="Jean"
                            />
                            {errors.firstName && <p className="text-xs text-red-600 mt-1 sm:mt-2 font-medium flex items-center gap-1"><span>⚠️</span>{errors.firstName}</p>}
                          </div>

                          <div className="group">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                              Nom <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-slate-200 hover:border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-xs sm:text-base placeholder:text-slate-400 font-medium"
                              placeholder="Dupont"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Contact */}
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                          <MdEmail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Contact</h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="group">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                              Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <MdEmail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-xs sm:text-base placeholder:text-slate-400 font-medium ${
                                  errors.email ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 hover:border-slate-300'
                                }`}
                                placeholder="jean.dupont@email.com"
                              />
                            </div>
                            {errors.email && <p className="text-xs text-red-600 mt-1 sm:mt-2 font-medium flex items-center gap-1"><span>⚠️</span>{errors.email}</p>}
                          </div>

                          <div className="group">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                              Téléphone <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <MdPhone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-xs sm:text-base placeholder:text-slate-400 font-medium ${
                                  errors.phone ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 hover:border-slate-300'
                                }`}
                                placeholder="77 123 45 67"
                              />
                            </div>
                            {errors.phone && <p className="text-xs text-red-600 mt-1 sm:mt-2 font-medium flex items-center gap-1"><span>⚠️</span>{errors.phone}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Adresse de livraison */}
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                          <IoLocationSharp className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Adresse de livraison</h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          {/* Ligne 1: Pays et Ville */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="group">
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                Pays <span className="text-red-500">*</span>
                              </label>
                              <CountrySelector
                                value={formData.countryCode}
                                onChange={handleCountryChange}
                                placeholder="Sélectionner votre pays"
                                showPopular={true}
                                showRegion={true}
                                className={`w-full ${errors.country ? 'animate-pulse' : ''}`}
                              />
                              {errors.country && <p className="text-xs text-red-600 mt-1 sm:mt-2 font-medium flex items-center gap-1"><span>⚠️</span>{errors.country}</p>}
                            </div>

                            <div className="group">
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                                Ville <span className="text-red-500">*</span>
                              </label>
                              <CityAutocomplete
                                countryCode={formData.countryCode}
                                value={formData.city}
                                onChange={(cityName) => {
                                  setFormData(prev => ({ ...prev, city: cityName }));
                                  // Effacer l'erreur si présente
                                  if (errors.city) {
                                    setErrors(prev => ({ ...prev, city: undefined }));
                                  }
                                }}
                                placeholder="Rechercher une ville..."
                                error={!!errors.city}
                              />
                              {errors.city && <p className="text-xs text-red-600 mt-1 sm:mt-2 font-medium flex items-center gap-1"><span>⚠️</span>{errors.city}</p>}
                            </div>
                          </div>

                          {/* Ligne 2: Adresse complète seule */}
                          <div className="group">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                              Adresse complète <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <IoLocationSharp className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-xs sm:text-base placeholder:text-slate-400 font-medium ${
                                  errors.address ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 hover:border-slate-300'
                                }`}
                                placeholder="123 Rue de la République"
                              />
                            </div>
                            {errors.address && <p className="text-xs text-red-600 mt-1 sm:mt-2 font-medium flex items-center gap-1"><span>⚠️</span>{errors.address}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 🆕 Section de disponibilité de livraison sur toute la largeur */}
                    {showDeliveryInfo && deliveryMessage && (
                      <div className="mt-6">
                        <div className="p-4 rounded-lg border-2" style={{
                          borderColor: deliveryAvailable ? '#10b981' : '#ef4444',
                          backgroundColor: deliveryAvailable ? '#f0fdf4' : '#fef2f2'
                        }}>
                          <div className="flex items-start gap-3">
                            {deliveryAvailable ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Truck className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs sm:text-sm font-medium mb-2 ${deliveryAvailable ? 'text-green-900' : 'text-red-900'}`}>
                                {deliveryMessage}
                              </p>

                              {/* Afficher les transporteurs disponibles pour les zones internationales */}
                              {(() => {
                                console.log('🎨 [ModernOrderForm] Rendu transporteurs:', {
                                  showDeliveryInfo,
                                  deliveryAvailable,
                                  availableCarriersLength: availableCarriers.length,
                                  availableCarriers,
                                  selectedCarrier
                                });
                                return null;
                              })()}
                              {deliveryAvailable && availableCarriers.length > 0 && (
                                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                                    <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                                      Sélectionnez votre transporteur :
                                    </p>
                                    <span className="text-xs text-gray-500">
                                      {availableCarriers.length} option{availableCarriers.length > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <div className="grid gap-2 sm:gap-3">
                                    {availableCarriers.map(({ transporteur, tarif }) => {
                                      const prixTransporteur = parseFloat(tarif.prixTransporteur);
                                      const prixStandard = parseFloat(tarif.prixStandardInternational);
                                      const economie = prixStandard > prixTransporteur ? prixStandard - prixTransporteur : 0;

                                      return (
                                        <label
                                          key={transporteur.id}
                                          className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                                            selectedCarrier === transporteur.id
                                              ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200'
                                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50 hover:shadow-md'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name="carrier"
                                            value={transporteur.id}
                                            checked={selectedCarrier === transporteur.id}
                                            onChange={(e) => {
                                              setSelectedCarrier(e.target.value);
                                              setDeliveryFee(prixTransporteur);
                                              setDeliveryTime(`${tarif.delaiLivraisonMin}-${tarif.delaiLivraisonMax} jours`);
                                            }}
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500 flex-shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            {/* En-tête avec logo et nom */}
                                            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                              {transporteur.logoUrl ? (
                                                <div className="w-12 h-8 sm:w-16 sm:h-10 flex items-center justify-center bg-white rounded-lg border border-gray-200 p-0.5 sm:p-1">
                                                  <img
                                                    src={transporteur.logoUrl}
                                                    alt={transporteur.name}
                                                    className="max-w-full max-h-full object-contain"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 rounded-lg">
                                                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                </div>
                                              )}
                                              <div className="flex-1">
                                                <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                                                  {transporteur.name}
                                                </span>
                                                {/* Zone name masqué sur mobile uniquement
                                                <span className="hidden sm:block text-xs text-gray-500">
                                                  {tarif.zoneName}
                                                </span>
                                                */}
                                              </div>
                                            </div>

                                            {/* Informations tarifaires */}
                                            <div className="flex items-center justify-between gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                                              <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Prix</span>
                                                  <span className="text-sm sm:text-lg font-bold text-green-600">
                                                    {formatPrice(prixTransporteur)}
                                                  </span>
                                                  {economie > 0 && (
                                                    <span className="text-[10px] sm:text-xs text-green-600 font-medium">
                                                      Économisez {formatPrice(economie)}
                                                    </span>
                                                  )}
                                                </div>
                                                {prixStandard > prixTransporteur && (
                                                  <div className="ml-2 flex flex-col items-end">
                                                    <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                                      {formatPrice(prixStandard)}
                                                    </span>
                                                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-full">
                                                      -{Math.round((economie / prixStandard) * 100)}%
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              <div className="flex flex-col items-end">
                                                <span className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Délai</span>
                                                <div className="flex items-center gap-1.5 text-gray-700">
                                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  <span className="text-xs sm:text-sm font-semibold">
                                                    {tarif.delaiLivraisonMin}-{tarif.delaiLivraisonMax} jours
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>

                                  {/* Note informative */}
                                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-1.5 sm:gap-2">
                                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      <p className="text-xs text-blue-700">
                                        Les délais sont estimatifs et peuvent varier selon la destination exacte et les conditions de transport.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Afficher les frais pour les livraisons sans choix de transporteur */}
                              {deliveryAvailable && availableCarriers.length === 0 && deliveryFee > 0 && (
                                <div className="text-xs text-green-700 space-y-1">
                                  <p>Frais de livraison: <span className="font-bold">{formatPrice(deliveryFee)}</span></p>
                                  {deliveryTime && <p>Délai estimé: {deliveryTime}</p>}
                                </div>
                              )}

                              {deliveryAvailable && availableCarriers.length === 0 && deliveryFee === 0 && (
                                <div className="text-xs text-green-700">
                                  <p className="font-bold">Livraison gratuite</p>
                                  {deliveryTime && <p>Délai estimé: {deliveryTime}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {errors.delivery && (
                      <div className="mt-4">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 font-medium">{errors.delivery}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={goToNextStep}
                      disabled={showDeliveryInfo && !deliveryAvailable}
                      className={`group w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold tracking-wide transition-all duration-300 shadow-lg sm:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-lg relative overflow-hidden ${
                        showDeliveryInfo && !deliveryAvailable
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:scale-[0.97] shadow-blue-200/50 hover:shadow-2xl hover:shadow-blue-300/50'
                      }`}
                    >
                      <span className="relative z-10">
                        {showDeliveryInfo && !deliveryAvailable ? 'Livraison non disponible' : 'Continuer'}
                      </span>
                      {!(showDeliveryInfo && !deliveryAvailable) && (
                        <>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Étape 2 : Paiement */}
                {currentStep === 'payment' && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                      <div className="p-2 bg-purple-100 rounded-lg sm:rounded-xl flex-shrink-0">
                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold text-gray-900">Mode de paiement</h2>
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
                              <p className="font-bold text-gray-900 text-sm sm:text-lg">PayDunya</p>
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full">
                                Recommandé
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                              Paiement sécurisé avec toutes les principales méthodes mobile et bancaire
                            </p>
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
                              <span className="text-lg sm:text-2xl">💵</span>
                              <p className="font-bold text-gray-900 text-sm sm:text-lg">Paiement à la livraison</p>
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
                        className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-xs sm:text-base"
                      >
                        Retour
                      </button>
                      <button
                        onClick={goToNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-base"
                      >
                        Continuer
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Étape 3 : Confirmation */}
                {currentStep === 'review' && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-gray-200">
                      <div className="p-2 bg-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold text-gray-900">Vérification finale</h2>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Confirmez votre commande</p>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Récap informations */}
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
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
                          <div className="flex items-center gap-1.5">
                            <span>{formData.country}</span>
                            <span className="text-lg">{getCountryByCode(formData.countryCode)?.flag}</span>
                          </div>
                        </div>
                      </div>

                      {/* Récap livraison */}
                      <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
                            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Livraison
                          </h3>
                          <button
                            onClick={() => setCurrentStep('customer-info')}
                            className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-semibold text-xs sm:text-sm flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Modifier
                          </button>
                        </div>
                        {deliveryAvailable ? (
                          <>
                            <p className="text-xs sm:text-sm text-gray-900 font-medium mb-0.5">
                              📍 {formData.city}, {formData.country} {getCountryByCode(formData.countryCode)?.flag}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              Frais: <span className="font-semibold">
                                {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
                              </span>
                              {deliveryTime && ` • Délai: ${deliveryTime}`}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm text-red-500 italic">Livraison non disponible pour cette ville</p>
                        )}
                      </div>

                      {/* Récap paiement */}
                      <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
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
                        className="flex-1 bg-gray-100 text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-xs sm:text-base"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:from-green-700 hover:to-green-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-base"
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