import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import newOrderService from '../../services/newOrderService';
import { Order } from '../../types/order';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Package, Phone, Copy, Printer, Download, X, Eye, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';
import { EnrichedOrderProductPreview } from '../../components/order/EnrichedOrderProductPreview';
import { CustomizationPreview } from '../../components/order/CustomizationPreview';
import { downloadDesignElementsAsPNG, exportAllViewsDesignElements } from '../../utils/printExport';

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
            setOrder(orderDataFromState);
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
            const delim = viewImage.delimitations[0];
            viewDelimitation = {
              x: delim.x,
              y: delim.y,
              width: delim.width,
              height: delim.height,
              coordinateType: delim.coordinateType || 'PERCENTAGE',
              referenceWidth: delim.referenceWidth || 800,
              referenceHeight: delim.referenceHeight || 800
            };
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
        // Une seule vue - export simple
        const elements = elementsByView[viewKeys[0]];
        if (format === 'pdf') {
          const { downloadDesignElementsAsPDF } = await import('../../utils/printExport');
          await downloadDesignElementsAsPDF(elements, filename, {
            width: 2000,
            height: 2000,
            delimitation
          });
        } else {
          await downloadDesignElementsAsPNG(elements, filename, {
            width: 2000,
            height: 2000,
            delimitation
          });
        }
      } else {
        // Plusieurs vues - export multiple
        await exportAllViewsDesignElements(elementsByView, filename, format, {
          width: 2000,
          height: 2000,
          delimitation
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
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
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200">
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</div>
                <div className="text-base font-medium text-gray-900 truncate">{order.user.firstName} {order.user.lastName}</div>
              </div>
              <div className="px-6 py-5">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Livraison</div>
                <div className="text-base font-medium text-gray-900 truncate">{order.shippingAddress?.city || 'Non définie'}</div>
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

                    // Extraire les délimitations
                    // Priorité 1: Délimitation sauvegardée dans l'item
                    let delimitation = item.delimitation || null;

                    // Priorité 2: Chercher dans enriched.designDelimitations
                    if (!delimitation && enriched?.designDelimitations && enriched.designDelimitations.length > 0) {
                      const delim = enriched.designDelimitations[0];
                      if (delim.delimitations && delim.delimitations.length > 0) {
                        const firstDelim = delim.delimitations[0];
                        delimitation = {
                          x: firstDelim.x,
                          y: firstDelim.y,
                          width: firstDelim.width,
                          height: firstDelim.height,
                          coordinateType: firstDelim.coordinateType || 'PERCENTAGE',
                          referenceWidth: firstDelim.referenceWidth || 800,
                          referenceHeight: firstDelim.referenceHeight || 800
                        };
                      }
                    }

                    // Priorité 3: Chercher dans adminProduct.colorVariations
                    if (!delimitation && enriched?.adminProduct?.colorVariations) {
                      const colorVar = enriched.adminProduct.colorVariations.find(
                        (cv: any) => cv.colorCode === item.colorVariation?.colorCode
                      );
                      if (colorVar?.images && colorVar.images.length > 0) {
                        const img = colorVar.images[0];
                        if (img.delimitations && img.delimitations.length > 0) {
                          const firstDelim = img.delimitations[0];
                          delimitation = {
                            x: firstDelim.x,
                            y: firstDelim.y,
                            width: firstDelim.width,
                            height: firstDelim.height,
                            coordinateType: firstDelim.coordinateType || 'PERCENTAGE',
                            referenceWidth: firstDelim.referenceWidth || 800,
                            referenceHeight: firstDelim.referenceHeight || 800
                          };
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
                          <div className="flex-shrink-0">
                            {isCustomizedProduct ? (
                              <div className="space-y-3">
                                {/* Views Grid */}
                                <div className={`grid gap-3 ${Object.keys(elementsByView).length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                  {Object.entries(elementsByView).map(([viewKey, elements]) => {
                                    const [colorIdStr, viewIdStr] = viewKey.split('-');
                                    const colorId = parseInt(colorIdStr);
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

                                    if (!viewImageUrl || viewImageUrl === mockupUrl) {
                                      if (item.colorVariation?.images) {
                                        const viewImage = item.colorVariation.images.find((img: any) => img.id === viewId);
                                        if (viewImage) {
                                          viewImageUrl = viewImage.url;
                                          viewType = viewImage.viewType || 'Autre';
                                          if (viewImage.delimitations && viewImage.delimitations.length > 0) {
                                            const delim = viewImage.delimitations[0];
                                            viewDelimitation = {
                                              x: delim.x,
                                              y: delim.y,
                                              width: delim.width,
                                              height: delim.height,
                                              coordinateType: delim.coordinateType || 'PERCENTAGE',
                                              referenceWidth: delim.referenceWidth || 800,
                                              referenceHeight: delim.referenceHeight || 800
                                            };
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
                                              const delim = viewImage.delimitations[0];
                                              viewDelimitation = {
                                                x: delim.x,
                                                y: delim.y,
                                                width: delim.width,
                                                height: delim.height,
                                                coordinateType: delim.coordinateType || 'PERCENTAGE',
                                                referenceWidth: delim.referenceWidth || 800,
                                                referenceHeight: delim.referenceHeight || 800
                                              };
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

                                    return (
                                      <div key={viewKey} className="relative">
                                        <CustomizationPreview
                                          productImageUrl={viewImageUrl}
                                          designElements={elements as any[]}
                                          delimitation={viewDelimitation as any}
                                          productName={item.product?.name || enriched?.vendorName || 'Produit'}
                                          colorName={item.colorVariation?.name || item.color}
                                          colorCode={item.colorVariation?.colorCode}
                                          size={item.size}
                                          quantity={item.quantity}
                                          className={`w-full aspect-square border border-gray-200 rounded-lg ${Object.keys(elementsByView).length > 1 ? 'max-w-[140px]' : 'max-w-[240px]'}`}
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

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => openProductModal(
                                      item.product?.name || enriched?.vendorName || 'Produit',
                                      elementsByView,
                                      item,
                                      enriched,
                                      mockupUrl || '',
                                      delimitation
                                    )}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Voir
                                  </button>
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
                                <EnrichedOrderProductPreview
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
                                    delimitation: delimitation || undefined,
                                    vendorProductId: item.vendorProductId || enriched?.id
                                  }}
                                  className="w-full max-w-[240px] aspect-square border border-gray-200 rounded-lg"
                                />
                                {/* Actions for vendor products */}
                                {(mockupUrl || hasDesign) && (
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => setVendorProductModal({
                                        isOpen: true,
                                        productName: item.product?.name || enriched?.vendorName || 'Produit',
                                        mockupUrl: mockupUrl || '',
                                        designUrl: hasDesign ? designUrl || '' : '',
                                        designName: item.designMetadata?.designName || 'Design',
                                        designPosition: designPosition,
                                        delimitation: delimitation || undefined,
                                        zoom: 100
                                      })}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Voir
                                    </button>
                                    {hasDesign && designUrl && (
                                      <button
                                        onClick={() => downloadDesign(designUrl, item.designMetadata?.designName || 'design')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded-lg transition-all duration-150 hover:scale-[1.02]"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        Design
                                      </button>
                                    )}
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
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setSelectedDesign({ url: designUrl, name: item.designMetadata.designName })}
                                  className="p-1.5 hover:bg-gray-200 rounded-md transition-colors duration-150"
                                  title="Voir"
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => downloadDesign(designUrl, item.designMetadata.designName)}
                                  className="p-1.5 hover:bg-gray-200 rounded-md transition-colors duration-150"
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
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

              {/* Shipping Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Adresse de livraison</h3>
                {order.shippingAddress ? (
                  <div className="text-sm text-gray-600 space-y-1.5">
                    {order.shippingAddress.name && (
                      <div className="font-medium text-gray-900">{order.shippingAddress.name}</div>
                    )}
                    <div>{order.shippingAddress.street}</div>
                    {order.shippingAddress.apartment && <div>{order.shippingAddress.apartment}</div>}
                    <div>{order.shippingAddress.city}, {order.shippingAddress.region}</div>
                    {order.shippingAddress.postalCode && <div>{order.shippingAddress.postalCode}</div>}
                    <div className="font-medium text-gray-900 pt-1">{order.shippingAddress.country}</div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Aucune adresse</p>
                )}
              </div>

              {/* Order Total */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">Total de la commande</span>
                  <span className="text-2xl font-semibold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

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
                        delimitation: vendorProductModal.delimitation
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