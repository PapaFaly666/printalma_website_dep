import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import newOrderService from '../../services/newOrderService';
import { Order } from '../../types/order';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Package, Phone, Copy, Printer, Download, X, ZoomIn, ZoomOut, Maximize2, RotateCcw, Truck, MapPin, Clock, DollarSign, Calendar, Users } from 'lucide-react';
import { formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';
import { EnrichedOrderProductPreview } from '../../components/order/EnrichedOrderProductPreview';
import { CustomizationPreview } from '../../components/order/CustomizationPreview';
import { downloadDesignElementsAsPNG, exportAllViewsDesignElements } from '../../utils/printExport';
import { SimpleProductPreview } from '../../components/vendor/SimpleProductPreview';

// Fonction pour convertir un item de commande au format VendorProduct pour SimpleProductPreview
const convertOrderItemToVendorProduct = (item: any, enriched: any): any => {
  console.log('🔄 Conversion item → VendorProduct:', { item, enriched });

  // Construire la structure adminProduct avec les variations de couleur
  const adminProduct = enriched?.adminProduct ? {
    id: enriched.adminProduct.id,
    name: enriched.adminProduct.name || item.product?.name || 'Produit',
    description: enriched.adminProduct.description,
    colorVariations: enriched.adminProduct.colorVariations || []
  } : null;

  // Extraire les couleurs sélectionnées
  const selectedColors = item.colorVariation ? [{
    id: item.colorVariation.id || item.colorVariation.colorId || 0,
    name: item.colorVariation.name || item.color || 'Couleur',
    colorCode: item.colorVariation.colorCode || '#000000'
  }] : [];

  // Extraire les positions du design
  const designPositions = item.savedDesignPosition || enriched?.designPositions?.[0]?.position ? [{
    designId: item.designId || 0,
    position: item.savedDesignPosition || enriched.designPositions[0].position
  }] : [];

  // Structure pour SimpleProductPreview
  return {
    id: item.vendorProductId || item.id,
    vendorName: item.product?.name || enriched?.vendorName || 'Produit',
    price: item.unitPrice || 0,
    status: 'published',
    designId: item.designId,
    adminProduct: adminProduct,
    images: {
      adminReferences: [],
      total: 1,
      primaryImageUrl: item.mockupUrl || item.imageUrl || ''
    },
    designApplication: {
      hasDesign: !!item.designId || !!(enriched?.designApplication?.hasDesign),
      designUrl: item.designMetadata?.designImageUrl || enriched?.designApplication?.designUrl || '',
      positioning: 'custom',
      scale: enriched?.designApplication?.scale || item.savedDesignPosition?.scale || 0.8
    },
    designPositions: designPositions,
    designTransforms: enriched?.designTransforms || [],
    selectedColors: selectedColors
  };
};

// Fonction utilitaire pour normaliser les délimitations en pixels
const convertDelimitationToPixels = (delim: any, fallbackDelimitations?: any[]) => {
  if (!delim) return null;

  // 🔍 IMPORTANT: Conserver les vraies valeurs de référence
  // Ne PAS utiliser de valeurs par défaut qui pourraient être incorrectes
  let refWidth = delim.referenceWidth;
  let refHeight = delim.referenceHeight;

  // 🔧 WORKAROUND pour les anciennes commandes avec 800x800:
  // Si on détecte 800x800 mais qu'on a des délimitations multi-vues avec d'autres valeurs,
  // utiliser les valeurs des délimitations multi-vues comme référence
  if ((refWidth === 800 || refHeight === 800) && fallbackDelimitations && fallbackDelimitations.length > 0) {
    const firstViewDelim = fallbackDelimitations[0];
    if (firstViewDelim.referenceWidth && firstViewDelim.referenceWidth !== 800) {
      console.warn('⚠️ [convertDelimitation] Correction 800→' + firstViewDelim.referenceWidth + ' depuis delimitations[]');
      refWidth = firstViewDelim.referenceWidth;
      refHeight = firstViewDelim.referenceHeight;
    }
  }

  // Si pas de référence, on ne peut pas convertir correctement
  if (!refWidth || !refHeight) {
    console.warn('⚠️ [convertDelimitation] Pas de referenceWidth/Height, retour tel quel');
    return delim;
  }

  // 🔍 Détection automatique : si les valeurs sont <= 1, c'est du pourcentage (0-1)
  // Sinon, ce sont déjà des pixels
  const isPercentageFormat = delim.width <= 1 && delim.height <= 1 && delim.x <= 1 && delim.y <= 1;

  console.log('🔄 [convertDelimitation]', {
    input: { x: delim.x, y: delim.y, width: delim.width, height: delim.height },
    coordinateType: delim.coordinateType,
    isPercentageFormat,
    referenceSize: { width: refWidth, height: refHeight },
    corrected: refWidth !== delim.referenceWidth
  });

  // Si c'est au format pourcentage (valeurs 0-1), convertir en pixels
  if (isPercentageFormat) {
    const converted = {
      x: delim.x * refWidth,
      y: delim.y * refHeight,
      width: delim.width * refWidth,
      height: delim.height * refHeight,
      coordinateType: delim.coordinateType || 'PERCENTAGE',
      referenceWidth: refWidth,
      referenceHeight: refHeight
    };
    console.log('✅ [convertDelimitation] Converted to pixels:', converted);
    return converted;
  }

  // Sinon, retourner tel quel (déjà en pixels) AVEC les vraies références
  const result = {
    x: delim.x,
    y: delim.y,
    width: delim.width,
    height: delim.height,
    coordinateType: delim.coordinateType || 'PIXEL',
    referenceWidth: refWidth,
    referenceHeight: refHeight
  };
  console.log('✅ [convertDelimitation] Already in pixels:', result);
  return result;
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<{ url: string; name: string } | null>(null);
  const [exportingItems, setExportingItems] = useState<Set<number>>(new Set());

  // State for Product Visualization Modal
  const [productModal, setProductModal] = useState<{
    isOpen: boolean;
    productName: string;
    views: Array<{
      key: string;
      label: string;
      imageUrl: string;
      elements: any[];
      delimitation: any;
    }>;
    activeViewIndex: number;
    zoom: number;
  } | null>(null);

  // State for Vendor Product Preview Modal (non-customized products with designs)
  const [vendorProductModal, setVendorProductModal] = useState<{
    isOpen: boolean;
    productName: string;
    mockupUrl: string;
    designUrl: string;
    designName: string;
    designPosition: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
    };
    delimitation?: {
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType?: 'PERCENTAGE' | 'PIXEL';
      referenceWidth?: number;
      referenceHeight?: number;
    };
    zoom: number;
  } | null>(null);

  // Récupérer les données depuis le state de navigation si disponibles
  const orderDataFromState = location.state?.orderData as Order | undefined;

  // Helper pour normaliser deliveryInfo -> delivery_info
  const normalizeOrderData = (orderData: any): Order => {
    // Cas 1: deliveryInfo existe (structure imbriquée moderne)
    if (orderData.deliveryInfo && !orderData.delivery_info) {
      console.log('🔄 [OrderDetailPage] Mapping deliveryInfo (structure imbriquée) -> delivery_info');
      orderData.delivery_info = orderData.deliveryInfo;
      delete orderData.deliveryInfo;
    }
    // Cas 2: deliveryInfo est null mais on a des champs plats (ex: Sénégal)
    else if (!orderData.deliveryInfo && !orderData.delivery_info && orderData.deliveryType) {
      console.log('🔄 [OrderDetailPage] Création delivery_info depuis champs plats');

      // Construire delivery_info depuis les champs plats
      orderData.delivery_info = {
        deliveryType: orderData.deliveryType,

        // Champs plats pour rétrocompatibilité
        cityId: orderData.deliveryCityId,
        cityName: orderData.deliveryCityName,
        regionId: orderData.deliveryRegionId,
        regionName: orderData.deliveryRegionName,
        zoneId: orderData.deliveryZoneId,
        zoneName: orderData.deliveryZoneName,
        countryCode: orderData.shippingCountry === 'Sénégal' ? 'SN' : undefined,
        countryName: orderData.shippingCountry,

        transporteurId: orderData.transporteurId,
        transporteurName: orderData.transporteurName,
        transporteurLogo: orderData.transporteurLogo,

        deliveryFee: orderData.deliveryFee,
        deliveryTime: orderData.deliveryTime,

        // Métadonnées si disponibles
        metadata: orderData.deliveryMetadata || undefined
      };
    }
    return orderData;
  };

  useEffect(() => {
    if (orderId) {
      const fetchOrderDetails = async () => {
        setLoading(true);
        try {
          const numericOrderId = parseInt(orderId, 10);
          if (isNaN(numericOrderId)) {
            setError('ID de commande invalide.');
            setLoading(false);
            return;
          }

          // Utiliser les données du state si disponibles (depuis OrdersManagement)
          if (orderDataFromState && orderDataFromState.id === numericOrderId) {
            // Normaliser les données du state
            const normalizedOrder = normalizeOrderData(orderDataFromState);
            setOrder(normalizedOrder);
            setError(null);
            setLoading(false);
            return;
          }

          // Sinon, charger depuis l'API (navigation directe via URL)
          const fetchedOrder = await newOrderService.getOrderByIdAdmin(numericOrderId);
          setOrder(fetchedOrder);
          setError(null);
        } catch (err) {
          const errorMessage = newOrderService.handleError(err, 'chargement détail commande');
          setError(errorMessage);
          setOrder(null);
        }
        setLoading(false);
      };
      fetchOrderDetails();
    }
  }, [orderId, orderDataFromState]);

  // Gestion du raccourci clavier Échap pour fermer les modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDesign) setSelectedDesign(null);
        if (productModal) setProductModal(null);
        if (vendorProductModal) setVendorProductModal(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedDesign, productModal, vendorProductModal]);

  // Ouvrir le modal de visualisation produit
  const openProductModal = (
    productName: string,
    elementsByView: Record<string, any[]>,
    item: any,
    enriched: any,
    mockupUrl: string,
    delimitation: any
  ) => {
    const views: Array<{
      key: string;
      label: string;
      imageUrl: string;
      elements: any[];
      delimitation: any;
    }> = [];

    const getViewName = (vt: string): string => {
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
      return viewNames[vt?.toUpperCase()] || vt || 'Vue';
    };

    Object.entries(elementsByView).forEach(([viewKey, elements]) => {
      const [colorIdStr, viewIdStr] = viewKey.split('-');
      const viewId = parseInt(viewIdStr);

      let viewImageUrl = mockupUrl;
      let viewDelimitation = delimitation;
      let viewType = 'Autre';

      // Get view metadata
      if (item.viewsMetadata) {
        const viewMeta = item.viewsMetadata.find((v: any) => v.viewKey === viewKey);
        if (viewMeta) {
          viewImageUrl = viewMeta.imageUrl;
          viewType = viewMeta.viewType || 'Autre';
        }
      }

      if (item.colorVariation?.images) {
        const viewImage = item.colorVariation.images.find((img: any) => img.id === viewId);
        if (viewImage) {
          viewImageUrl = viewImage.url;
          viewType = viewImage.viewType || 'Autre';
          if (viewImage.delimitations?.[0]) {
            viewDelimitation = convertDelimitationToPixels(viewImage.delimitations[0]);
          }
        }
      }

      views.push({
        key: viewKey,
        label: getViewName(viewType),
        imageUrl: viewImageUrl || mockupUrl,
        elements: elements as any[],
        delimitation: viewDelimitation
      });
    });

    setProductModal({
      isOpen: true,
      productName,
      views,
      activeViewIndex: 0,
      zoom: 100
    });
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
    }
  };

  const downloadDesign = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `design-${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  // Export des éléments de personnalisation pour l'impression (sans mockup)
  const exportForPrint = async (
    itemId: number,
    elementsByView: Record<string, any[]>,
    productName: string,
    format: 'png' | 'pdf' = 'png',
    delimitation?: {
      x: number;
      y: number;
      width: number;
      height: number;
      coordinateType?: 'PERCENTAGE' | 'PIXEL';
      referenceWidth?: number;
      referenceHeight?: number;
    }
  ) => {
    setExportingItems(prev => new Set(prev).add(itemId));

    try {
      const filename = `impression_${order?.orderNumber || 'commande'}_${productName.replace(/\s+/g, '_')}`;

      // Vérifier s'il y a plusieurs vues ou une seule
      const viewKeys = Object.keys(elementsByView);

      if (viewKeys.length === 1) {
        // Une seule vue - export simple avec dimensions RÉELLES de la délimitation
        const elements = elementsByView[viewKeys[0]];
        if (format === 'pdf') {
          const { downloadDesignElementsAsPDF } = await import('../../utils/printExport');
          await downloadDesignElementsAsPDF(elements, filename, {
            delimitation,
            useRealDimensions: true // Utilise les dimensions réelles pour qualité optimale
          });
        } else {
          await downloadDesignElementsAsPNG(elements, filename, {
            delimitation,
            useRealDimensions: true // Utilise les dimensions réelles pour qualité optimale
          });
        }
      } else {
        // Plusieurs vues - export multiple avec dimensions RÉELLES
        await exportAllViewsDesignElements(elementsByView, filename, format, {
          delimitation,
          useRealDimensions: true // Utilise les dimensions réelles pour qualité optimale
        });
      }

    } catch (error) {
      console.error('❌ [Export] Erreur détaillée:', error);

      // Message d'erreur détaillé pour l'utilisateur
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(
        `Erreur lors de l'export:\n\n${errorMessage}\n\n` +
        `Veuillez vérifier la console pour plus de détails.`
      );
    } finally {
      setExportingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin"></div>
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-900 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Erreur</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button
            onClick={() => navigate('/admin/orders')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Commande introuvable</h3>
          <p className="text-gray-600 mb-8">Cette commande n'existe pas.</p>
          <Button
            onClick={() => navigate('/admin/orders')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header - Modern SaaS Style */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/orders')}
                className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors duration-150"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900">
                    #{order.orderNumber}
                  </h1>
                  <button
                    onClick={copyOrderNumber}
                    className="p-1.5 hover:bg-gray-50 rounded-md transition-colors duration-150"
                    title="Copier le numéro de commande"
                  >
                    <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1.5 bg-black text-sm font-medium text-white rounded-lg">
                {getStatusLabel(order.status)}
              </span>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-lg transition-colors duration-150"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* Summary Cards - Modern SaaS Dashboard Style */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-gray-200">
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</div>
                <div className="text-base font-medium text-gray-900 truncate">{order.user.firstName} {order.user.lastName}</div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Articles</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {order.orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid Layout - 2/3 Products, 1/3 Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Articles */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {order.orderItems.map((item, index) => {
                    // Extraire les données enrichies
                    const enriched = item.enrichedVendorProduct;

                    // Vérifier si c'est un produit personnalisé avec designElementsByView
                    const isCustomizedProduct = !!(
                      item.designElementsByView &&
                      Object.keys(item.designElementsByView).length > 0
                    ) || !!(
                      item.customization?.elementsByView &&
                      Object.keys(item.customization.elementsByView).length > 0
                    );

                    // Récupérer les éléments de design par vue
                    const elementsByView = item.designElementsByView || item.customization?.elementsByView || {};


                    // Trouver l'image mockup pour la couleur commandée
                    let mockupUrl = item.mockupUrl; // D'abord essayer mockupUrl sauvegardé
                    if (!mockupUrl && enriched?.adminProduct?.colorVariations) {
                      const colorVar = enriched.adminProduct.colorVariations.find(
                        (cv: any) => cv.colorCode === item.colorVariation?.colorCode
                      );
                      mockupUrl = colorVar?.images?.[0]?.url || enriched.images?.primaryImageUrl;
                    }

                    // Extraire le design et sa position
                    const hasDesign = enriched?.designApplication?.hasDesign || !!item.designId;
                    const designUrl = enriched?.designApplication?.designUrl || item.designMetadata?.designImageUrl;

                    // Utiliser savedDesignPosition sauvegardé en priorité, sinon depuis enrichedVendorProduct
                    const designPosition = item.savedDesignPosition ||
                      enriched?.designPositions?.[0]?.position || {
                        x: 0, y: 0,
                        scale: enriched?.designApplication?.scale || 0.8,
                        rotation: 0
                      };

                    // 🔍 DEBUG: Source des délimitations
                    console.log('🔍 [OrderDetailPage] Sources disponibles:', {
                      'item.delimitation': item.delimitation,
                      'item.colorVariation.images': item.colorVariation?.images?.length || 0,
                      'enriched.designDelimitations': enriched?.designDelimitations,
                      'item.designElementsByView keys': item.designElementsByView ? Object.keys(item.designElementsByView) : 'none'
                    });

                    // Extraire les délimitations et les convertir en pixels
                    // Priorité 1: Délimitation principale sauvegardée dans l'item
                    let delimitation = item.delimitation ? convertDelimitationToPixels(item.delimitation) : null;

                    // Priorité 2: Chercher dans colorVariation.images[].delimitations (format backend)
                    if (!delimitation && item.colorVariation?.images) {
                      for (const image of item.colorVariation.images) {
                        // @ts-ignore - delimitations existe dans le type mais TypeScript ne le voit pas
                        if (image.delimitations && image.delimitations.length > 0) {
                          console.log('🔍 [OrderDetailPage] Utilisation de colorVariation.images[].delimitations[0]:', image.delimitations[0]);
                          delimitation = convertDelimitationToPixels(image.delimitations[0]);
                          break;
                        }
                      }
                    }

                    // Priorité 3: Chercher dans enriched.designDelimitations
                    if (!delimitation && enriched?.designDelimitations && enriched.designDelimitations.length > 0) {
                      const delim = enriched.designDelimitations[0];
                      if (delim.delimitations && delim.delimitations.length > 0) {
                        delimitation = convertDelimitationToPixels(delim.delimitations[0]);
                      }
                    }

                    // Priorité 4: Chercher dans adminProduct.colorVariations
                    if (!delimitation && enriched?.adminProduct?.colorVariations) {
                      const colorVar = enriched.adminProduct.colorVariations.find(
                        (cv: any) => cv.colorCode === item.colorVariation?.colorCode
                      );
                      if (colorVar?.images && colorVar.images.length > 0) {
                        const img = colorVar.images[0];
                        if (img.delimitations && img.delimitations.length > 0) {
                          delimitation = convertDelimitationToPixels(img.delimitations[0]);
                        }
                      }
                    }

                    return (
                      <div key={item.id || index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                        {/* Product Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {item.product?.name || enriched?.vendorName || 'Produit inconnu'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              {item.size && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded">
                                  {item.size}
                                </span>
                              )}
                              {(item.color || item.colorVariation?.name) && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded">
                                  {item.color || item.colorVariation?.name}
                                  {item.colorVariation?.colorCode && (
                                    <span
                                      className="w-2 h-2 rounded-full ml-1.5 border border-gray-300"
                                      style={{ backgroundColor: item.colorVariation.colorCode }}
                                    />
                                  )}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 bg-gray-900 text-xs font-medium text-white rounded">
                                {item.quantity}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-semibold text-gray-900">{formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} / unité</div>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          {/* Product Preview */}
                          <div className="w-full">
                            {isCustomizedProduct ? (
                              <div className="space-y-3">
                                {/* Views Grid - Taille augmentée et responsive */}
                                <div className={`grid gap-4 ${Object.keys(elementsByView).length > 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                  {Object.entries(elementsByView).map(([viewKey, elements]) => {
                                    const [colorIdStr, viewIdStr] = viewKey.split('-');
                                    const colorId = parseInt(colorIdStr);
                                    const viewId = parseInt(viewIdStr);

                                    let viewImageUrl = mockupUrl;
                                    let viewDelimitation = delimitation;
                                    let viewType = 'Autre';

                                    // 🔍 NOUVEAU: Chercher la délimitation spécifique à cette vue dans colorVariation.images
                                    if (item.colorVariation?.images) {
                                      const viewImage = item.colorVariation.images.find((img: any) => img.id === viewId);
                                      if (viewImage && viewImage.delimitations && viewImage.delimitations.length > 0) {
                                        console.log(`🔍 [OrderDetailPage] viewImage.delimitations[0] AVANT conversion (view ${viewKey}):`, viewImage.delimitations[0]);
                                        viewDelimitation = convertDelimitationToPixels(viewImage.delimitations[0]);
                                        console.log(`🔍 [OrderDetailPage] viewDelimitation APRÈS conversion (view ${viewKey}):`, viewDelimitation);
                                        viewImageUrl = viewImage.url || viewImageUrl;
                                        viewType = viewImage.viewType || viewType;
                                      }
                                    }

                                    // Get view metadata (fallback)
                                    if (item.viewsMetadata) {
                                      const viewMeta = item.viewsMetadata.find((v: any) => v.viewKey === viewKey);
                                      if (viewMeta) {
                                        if (!viewImageUrl || viewImageUrl === mockupUrl) {
                                          viewImageUrl = viewMeta.imageUrl;
                                        }
                                        viewType = viewMeta.viewType || viewType;
                                      }
                                    }

                                    if (!viewImageUrl || viewImageUrl === mockupUrl) {
                                      if (item.colorVariation?.images) {
                                        const viewImage = item.colorVariation.images.find((img: any) => img.id === viewId);
                                        if (viewImage) {
                                          viewImageUrl = viewImage.url;
                                          viewType = viewImage.viewType || 'Autre';
                                          if (viewImage.delimitations && viewImage.delimitations.length > 0) {
                                            viewDelimitation = convertDelimitationToPixels(viewImage.delimitations[0]);
                                          }
                                        }
                                      }
                                    }

                                    if (!viewImageUrl || viewImageUrl === mockupUrl) {
                                      if (enriched?.adminProduct?.colorVariations) {
                                        const colorVar = enriched.adminProduct.colorVariations.find(
                                          (cv: any) => cv.id === colorId
                                        );
                                        if (colorVar?.images) {
                                          const viewImage = colorVar.images.find((img: any) => img.id === viewId);
                                          if (viewImage) {
                                            viewImageUrl = viewImage.url;
                                            viewType = viewImage.viewType || 'Autre';
                                            if (viewImage.delimitations && viewImage.delimitations.length > 0) {
                                              viewDelimitation = convertDelimitationToPixels(viewImage.delimitations[0]);
                                            }
                                          }
                                        }
                                      }
                                    }

                                    if (!viewImageUrl) {
                                      viewImageUrl = mockupUrl || item.product?.images?.[0]?.url;
                                    }

                                    const getViewName = (vt: string): string => {
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
                                      return viewNames[vt?.toUpperCase()] || vt || 'Vue';
                                    };

                                    // 🔍 DEBUG: Logs pour vérifier les données passées
                                    console.log(`🔍 [OrderDetailPage] Rendering view ${viewKey}:`, {
                                      viewImageUrl,
                                      elementsCount: elements.length,
                                      viewDelimitation: viewDelimitation ? {
                                        x: viewDelimitation.x,
                                        y: viewDelimitation.y,
                                        width: viewDelimitation.width,
                                        height: viewDelimitation.height,
                                        coordinateType: viewDelimitation.coordinateType,
                                        referenceWidth: viewDelimitation.referenceWidth,
                                        referenceHeight: viewDelimitation.referenceHeight
                                      } : null,
                                      firstElement: elements[0] ? {
                                        id: elements[0].id,
                                        type: elements[0].type,
                                        x: elements[0].x,
                                        y: elements[0].y,
                                        width: elements[0].width,
                                        height: elements[0].height,
                                        rotation: elements[0].rotation
                                      } : null
                                    });

                                    return (
                                      <div key={viewKey} className="relative w-full aspect-square">
                                        <CustomizationPreview
                                          productImageUrl={viewImageUrl}
                                          designElements={elements as any[]}
                                          delimitation={viewDelimitation as any}
                                          productName={item.product?.name || enriched?.vendorName || 'Produit'}
                                          colorName={item.colorVariation?.name || item.color}
                                          colorCode={item.colorVariation?.colorCode}
                                          size={item.size}
                                          quantity={item.quantity}
                                          className="w-full h-full border border-gray-200 rounded-lg"
                                          showInfo={false}
                                        />
                                        {Object.keys(elementsByView).length > 1 && (
                                          <div className="absolute bottom-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded text-xs font-medium">
                                            {getViewName(viewType)}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Actions - Téléchargements uniquement */}
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => exportForPrint(
                                      item.id,
                                      elementsByView,
                                      item.product?.name || enriched?.vendorName || 'produit',
                                      'png',
                                      delimitation || undefined
                                    )}
                                    disabled={exportingItems.has(item.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                                  >
                                    {exportingItems.has(item.id) ? (
                                      <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Download className="h-3.5 w-3.5" />
                                    )}
                                    PNG
                                  </button>
                                  <button
                                    onClick={() => exportForPrint(
                                      item.id,
                                      elementsByView,
                                      item.product?.name || enriched?.vendorName || 'produit',
                                      'pdf',
                                      delimitation || undefined
                                    )}
                                    disabled={exportingItems.has(item.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                                  >
                                    {exportingItems.has(item.id) ? (
                                      <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Download className="h-3.5 w-3.5" />
                                    )}
                                    PDF
                                  </button>
                                </div>
                              </div>
                            ) : mockupUrl || designUrl ? (
                              <div className="space-y-3">
                                <div className="w-full aspect-square">
                                  {/* Utiliser SimpleProductPreview pour afficher le design incorporé avec rotation */}
                                  <SimpleProductPreview
                                    product={convertOrderItemToVendorProduct(item, enriched)}
                                    showColorSlider={false}
                                    showDelimitations={false}
                                    onProductClick={() => {}}
                                    hideValidationBadges={true}
                                    imageObjectFit="contain"
                                    initialColorId={item.colorVariation?.id}
                                    className="w-full h-full border border-gray-200 rounded-lg"
                                  />
                                </div>
                                {/* Actions for vendor products - Téléchargement uniquement */}
                                {hasDesign && designUrl && (
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => downloadDesign(designUrl, item.designMetadata?.designName || 'design')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Télécharger Design
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full max-w-[240px] aspect-square border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Design Info */}
                          {item.designMetadata && designUrl && (
                            <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <img
                                src={designUrl}
                                alt={item.designMetadata.designName}
                                className="w-10 h-10 rounded-md border border-gray-200 object-contain bg-white p-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Design</div>
                                <div className="text-sm font-medium text-gray-900 truncate">{item.designMetadata.designName}</div>
                              </div>
                              <button
                                onClick={() => downloadDesign(designUrl, item.designMetadata.designName)}
                                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors duration-150"
                                title="Télécharger"
                              >
                                <Download className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Customer Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Client</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-gray-100">
                    {order.user.photo_profil && <AvatarImage src={order.user.photo_profil} />}
                    <AvatarFallback className="bg-gray-900 text-white text-sm font-medium">
                      {order.user.firstName?.[0]?.toUpperCase()}{order.user.lastName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{order.user.firstName} {order.user.lastName}</div>
                    <div className="text-sm text-gray-500 truncate">{order.user.email}</div>
                  </div>
                </div>
                {order.phoneNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                    <div className="p-1.5 bg-gray-50 rounded-md">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span>{order.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Order Total */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">Total de la commande</span>
                  <span className="text-2xl font-semibold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              {/* Delivery Information */}
              {order.delivery_info && (() => {
                const delivery = order.delivery_info;

                // Helper pour récupérer les valeurs avec fallback entre nouvelle et ancienne structure
                const cityName = delivery.location?.cityName || delivery.cityName;
                const regionName = delivery.location?.regionName || delivery.regionName;
                const zoneName = delivery.location?.zoneName || delivery.zoneName;
                const countryName = delivery.location?.countryName || delivery.countryName || order.shippingAddress?.country;
                const transporteurName = delivery.transporteur?.name || delivery.transporteurName;
                const transporteurLogo = delivery.transporteur?.logo || delivery.transporteurLogo;
                const deliveryFee = delivery.tarif?.amount ?? delivery.deliveryFee ?? 0;
                const deliveryTime = delivery.tarif?.deliveryTime || delivery.deliveryTime;

                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {/* Header Simple */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <Truck className="h-5 w-5 text-gray-700" />
                          <h3 className="text-lg font-semibold text-gray-900">Informations de Livraison</h3>
                        </div>
                        {/* Badge Type de Livraison */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-300">
                          <span className="text-sm">
                            {delivery.deliveryType === 'city' && '🏙️ Livraison en ville'}
                            {delivery.deliveryType === 'region' && '🌍 Livraison en région'}
                            {delivery.deliveryType === 'international' && '✈️ Livraison internationale'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenu Principal */}
                    <div className="p-6">
                      {/* Grid Principal : 3 colonnes sur desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                        {/* Colonne 1 : Destination */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            <MapPin className="h-4 w-4" />
                            <span>Destination</span>
                          </div>
                          <div className="space-y-2 pl-6">
                            {cityName && (
                              <div>
                                <div className="text-xs text-gray-500">Ville</div>
                                <div className="font-medium text-gray-900">{cityName}</div>
                              </div>
                            )}
                            {regionName && (
                              <div>
                                <div className="text-xs text-gray-500">Région</div>
                                <div className="font-medium text-gray-900">{regionName}</div>
                              </div>
                            )}
                            {zoneName && (
                              <div>
                                <div className="text-xs text-gray-500">Zone</div>
                                <div className="font-medium text-gray-900">{zoneName}</div>
                              </div>
                            )}
                            {countryName && (
                              <div>
                                <div className="text-xs text-gray-500">Pays</div>
                                <div className="font-bold text-gray-900">{countryName}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Colonne 2 : Transporteur */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            <Truck className="h-4 w-4" />
                            <span>Transporteur</span>
                          </div>
                          <div className="pl-6">
                            {transporteurName ? (
                              <div className="space-y-3">
                                {transporteurLogo && (
                                  <div className="w-20 h-20 border border-gray-200 rounded-lg bg-white p-2 flex items-center justify-center">
                                    <img
                                      src={transporteurLogo}
                                      alt={transporteurName}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-900">{transporteurName}</div>
                                  {deliveryTime && (
                                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>{deliveryTime}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Non sélectionné
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Colonne 3 : Tarification */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            <DollarSign className="h-4 w-4" />
                            <span>Tarification</span>
                          </div>
                          <div className="pl-6 space-y-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Frais de livraison</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {deliveryFee === 0 ? (
                                  <span className="text-green-600">Gratuit 🎉</span>
                                ) : (
                                  formatCurrency(deliveryFee)
                                )}
                              </div>
                            </div>
                            {deliveryTime && (
                              <div className="pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Délai estimé</div>
                                <div className="font-medium text-gray-900">{deliveryTime}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métadonnées (optionnel) */}
                      {delivery.metadata && (Object.keys(delivery.metadata).length > 0) && (
                        <>
                          <div className="border-t border-gray-200 my-6"></div>

                          {/* Dates */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {(delivery.metadata.selectedAt) && (
                              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500">Sélectionné le</div>
                                  <div className="font-medium text-gray-900 text-sm mt-0.5">
                                    {new Date(delivery.metadata.selectedAt).toLocaleString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            {delivery.metadata.calculatedAt && (
                              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500">Calculé le</div>
                                  <div className="font-medium text-gray-900 text-sm mt-0.5">
                                    {new Date(delivery.metadata.calculatedAt).toLocaleString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Liste des transporteurs disponibles */}
                          {(delivery.metadata.availableCarriers) &&
                           (delivery.metadata.availableCarriers?.length > 0) && (
                            <div>
                              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                <Users className="h-4 w-4" />
                                <span>Transporteurs disponibles ({(delivery.metadata.availableCarriers || []).length})</span>
                              </div>
                              <div className="space-y-2">
                                {(delivery.metadata.availableCarriers || []).map((carrier: any, index: number) => (
                                  <div
                                    key={carrier.transporteurId || carrier.id || index}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                      deliveryFee === carrier.fee
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        {carrier.name}
                                      </div>
                                      {carrier.time && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          <span>{carrier.time}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="font-bold text-gray-900">
                                        {formatCurrency(carrier.fee)}
                                      </div>
                                      {deliveryFee === carrier.fee && (
                                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                                          Choisi
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              {order.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
        </div>
      </main>

      {/* Design Preview Modal - Modern SaaS Style */}
      {selectedDesign && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedDesign(null)}
        >
          <div
            className="relative bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 truncate">{selectedDesign.name}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadDesign(selectedDesign.url, selectedDesign.name)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors duration-150"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </button>
                <button
                  onClick={() => setSelectedDesign(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-gray-50 overflow-y-auto">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <img
                  src={selectedDesign.url}
                  alt={selectedDesign.name}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Visualization Modal with Zoom Controls */}
      {productModal && productModal.isOpen && productModal.views.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setProductModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{productModal.productName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {productModal.views.length} vue{productModal.views.length > 1 ? 's' : ''} disponible{productModal.views.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Download Buttons */}
                <button
                  onClick={() => {
                    const activeView = productModal.views[productModal.activeViewIndex];
                    if (activeView) {
                      const elementsByView: Record<string, any[]> = {};
                      elementsByView[activeView.key] = activeView.elements;
                      exportForPrint(
                        Date.now(),
                        elementsByView,
                        `${productModal.productName}_${activeView.label}`,
                        'png',
                        activeView.delimitation
                      );
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                >
                  <Download className="h-4 w-4" />
                  PNG
                </button>
                <button
                  onClick={() => {
                    const activeView = productModal.views[productModal.activeViewIndex];
                    if (activeView) {
                      const elementsByView: Record<string, any[]> = {};
                      elementsByView[activeView.key] = activeView.elements;
                      exportForPrint(
                        Date.now(),
                        elementsByView,
                        `${productModal.productName}_${activeView.label}`,
                        'pdf',
                        activeView.delimitation
                      );
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
                <button
                  onClick={() => setProductModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150 ml-2"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row h-[calc(95vh-80px)]">
              {/* Main Preview Area */}
              <div className="flex-1 bg-gray-50 p-6 flex flex-col">
                {/* Zoom Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {productModal.views[productModal.activeViewIndex]?.label || 'Vue'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setProductModal(prev => prev ? { ...prev, zoom: Math.max(50, prev.zoom - 25) } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Zoom arrière"
                    >
                      <ZoomOut className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="px-3 text-sm font-medium text-gray-700 min-w-[4rem] text-center">
                      {productModal.zoom}%
                    </span>
                    <button
                      onClick={() => setProductModal(prev => prev ? { ...prev, zoom: Math.min(200, prev.zoom + 25) } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Zoom avant"
                    >
                      <ZoomIn className="h-4 w-4 text-gray-600" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                      onClick={() => setProductModal(prev => prev ? { ...prev, zoom: 100 } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Réinitialiser le zoom"
                    >
                      <RotateCcw className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setProductModal(prev => prev ? { ...prev, zoom: 150 } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Plein écran"
                    >
                      <Maximize2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Preview Container with Zoom */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-auto flex items-center justify-center p-4">
                  <div
                    className="transition-transform duration-200"
                    style={{ transform: `scale(${productModal.zoom / 100})` }}
                  >
                    {productModal.views[productModal.activeViewIndex] && (
                      <CustomizationPreview
                        productImageUrl={productModal.views[productModal.activeViewIndex].imageUrl}
                        designElements={productModal.views[productModal.activeViewIndex].elements}
                        delimitation={productModal.views[productModal.activeViewIndex].delimitation}
                        productName={productModal.productName}
                        className="w-[500px] h-[500px]"
                        showInfo={false}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnails Sidebar */}
              {productModal.views.length > 1 && (
                <div className="w-full lg:w-48 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 overflow-y-auto">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Vues</h4>
                  <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                    {productModal.views.map((view, index) => (
                      <button
                        key={view.key}
                        onClick={() => setProductModal(prev => prev ? { ...prev, activeViewIndex: index } : null)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                          index === productModal.activeViewIndex
                            ? 'border-gray-900 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CustomizationPreview
                          productImageUrl={view.imageUrl}
                          designElements={view.elements}
                          delimitation={view.delimitation}
                          productName={productModal.productName}
                          className="aspect-square"
                          showInfo={false}
                        />
                        <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 text-xs font-medium ${
                          index === productModal.activeViewIndex
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {view.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Product Preview Modal (for non-customized products with designs) */}
      {vendorProductModal && vendorProductModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setVendorProductModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{vendorProductModal.productName}</h3>
                {vendorProductModal.designUrl && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Design : {vendorProductModal.designName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Download Design Button */}
                {vendorProductModal.designUrl && (
                  <button
                    onClick={() => downloadDesign(vendorProductModal.designUrl, vendorProductModal.designName)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger Design
                  </button>
                )}
                <button
                  onClick={() => setVendorProductModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150 ml-2"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col h-[calc(95vh-80px)]">
              <div className="flex-1 bg-gray-50 p-6 flex flex-col">
                {/* Zoom Controls */}
                <div className="flex items-center justify-end mb-4">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setVendorProductModal(prev => prev ? { ...prev, zoom: Math.max(50, prev.zoom - 25) } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Zoom arrière"
                    >
                      <ZoomOut className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="px-3 text-sm font-medium text-gray-700 min-w-[4rem] text-center">
                      {vendorProductModal.zoom}%
                    </span>
                    <button
                      onClick={() => setVendorProductModal(prev => prev ? { ...prev, zoom: Math.min(200, prev.zoom + 25) } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Zoom avant"
                    >
                      <ZoomIn className="h-4 w-4 text-gray-600" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                      onClick={() => setVendorProductModal(prev => prev ? { ...prev, zoom: 100 } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Réinitialiser le zoom"
                    >
                      <RotateCcw className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setVendorProductModal(prev => prev ? { ...prev, zoom: 150 } : null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
                      title="Agrandir"
                    >
                      <Maximize2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Preview Container with Zoom */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-auto flex items-center justify-center p-4">
                  <div
                    style={{
                      width: `${500 * vendorProductModal.zoom / 100}px`,
                      height: `${500 * vendorProductModal.zoom / 100}px`
                    }}
                  >
                    <EnrichedOrderProductPreview
                      product={{
                        id: 0,
                        name: vendorProductModal.productName,
                        quantity: 1,
                        unitPrice: 0,
                        mockupImageUrl: vendorProductModal.mockupUrl,
                        designImageUrl: vendorProductModal.designUrl || null,
                        designPosition: vendorProductModal.designPosition,
                        delimitation: vendorProductModal.delimitation ? {
                          x: vendorProductModal.delimitation.x,
                          y: vendorProductModal.delimitation.y,
                          width: vendorProductModal.delimitation.width,
                          height: vendorProductModal.delimitation.height,
                          coordinateType: vendorProductModal.delimitation.coordinateType || 'PERCENTAGE'
                        } : undefined
                      }}
                      className="w-full h-full"
                    />
                  </div>
                </div>
                {/* Design Info */}
                {vendorProductModal.designUrl && (
                  <div className="mt-4 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                    <img
                      src={vendorProductModal.designUrl}
                      alt={vendorProductModal.designName}
                      className="w-16 h-16 rounded-lg border border-gray-200 object-contain bg-gray-50 p-2"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Design appliqué</div>
                      <div className="text-base font-medium text-gray-900">{vendorProductModal.designName}</div>
                    </div>
                    <button
                      onClick={() => downloadDesign(vendorProductModal.designUrl, vendorProductModal.designName)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;