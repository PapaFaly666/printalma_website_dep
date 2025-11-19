import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import newOrderService from '../../services/newOrderService';
import { Order } from '../../types/order';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Package, User, MapPin, Phone, Copy, Printer, Download, X, Eye } from 'lucide-react';
import { getStatusIcon, formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';
import { EnrichedOrderProductPreview } from '../../components/order/EnrichedOrderProductPreview';
import { CustomizationPreview } from '../../components/order/CustomizationPreview';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<{ url: string; name: string } | null>(null);

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

          // ✨ PRIORITÉ 1 : Utiliser les données du state si disponibles (depuis OrdersManagement)
          if (orderDataFromState && orderDataFromState.id === numericOrderId) {
            console.log('✅ [OrderDetailPage] Utilisation des données du state (avec enrichedVendorProduct)');
            console.log('🎨 [OrderDetailPage] Items avec enrichedVendorProduct:',
              orderDataFromState.orderItems?.map(item => ({
                id: item.id,
                hasEnriched: !!item.enrichedVendorProduct,
                designId: item.designId,
                mockupUrl: item.mockupUrl
              }))
            );
            setOrder(orderDataFromState);
            setError(null);
            setLoading(false);
            return;
          }

          // ✨ PRIORITÉ 2 : Sinon, charger depuis l'API (navigation directe via URL)
          console.log('🔄 [OrderDetailPage] Chargement depuis l\'API...');
          const fetchedOrder = await newOrderService.getOrderByIdAdmin(numericOrderId);

          console.log('📦 [OrderDetailPage] Commande chargée depuis API:', fetchedOrder);
          console.log('🎨 [OrderDetailPage] Items avec enrichedVendorProduct:',
            fetchedOrder.orderItems?.map(item => ({
              id: item.id,
              hasEnriched: !!item.enrichedVendorProduct,
              designId: item.designId,
              mockupUrl: item.mockupUrl
            }))
          );

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

  // Gestion du raccourci clavier Échap pour fermer le modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDesign) {
        setSelectedDesign(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedDesign]);

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-black animate-spin"></div>
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-black rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-black mb-3">Erreur</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button
            onClick={() => navigate('/admin/orders')}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3"
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
      <div className="fixed inset-0 bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-3">Commande introuvable</h3>
          <p className="text-gray-600 mb-8">Cette commande n'existe pas.</p>
          <Button
            onClick={() => navigate('/admin/orders')}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header - Modern with glass effect - RESPONSIVE */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6 w-full sm:w-auto">
              <Button
                onClick={() => navigate('/admin/orders')}
                variant="ghost"
                className="text-gray-600 hover:text-black hover:bg-gray-100/50 px-2 sm:px-3 py-2 rounded-xl transition-all"
              >
                <ArrowLeft className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </Button>

              <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent hidden sm:block"></div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-black to-gray-700 flex items-center justify-center shadow-lg shadow-black/10">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent truncate">
                      #{order.orderNumber}
                    </h1>
                  </div>
                  <button
                    onClick={copyOrderNumber}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                    title="Copier le numéro"
                  >
                    <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:ml-12 truncate">
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

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <Badge
                variant="outline"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-2 rounded-xl shadow-sm hover:shadow-md transition-all flex-1 sm:flex-initial justify-center"
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className="font-semibold">{getStatusLabel(order.status)}</span>
                </div>
              </Badge>

              <Button
                onClick={() => window.print()}
                variant="outline"
                className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all px-3 sm:px-4"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Imprimer</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full">
        {/* Métriques modernes avec cartes - RESPONSIVE */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-black to-gray-800 rounded-2xl p-6 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                  Montant total
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(order.totalAmount)}
                </div>
                <div className="text-sm text-white/80 font-medium">
                  {order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Client
                  </div>
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-lg font-bold text-black mb-1">
                  {order.user.firstName} {order.user.lastName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {order.user.email}
                </div>
              </div>
            </div>

            {/* Livraison */}
            <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Livraison
                  </div>
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-lg font-bold text-black mb-1">
                  {order.shippingAddress?.city || 'Non définie'}
                </div>
                <div className="text-sm text-gray-500">
                  {order.shippingAddress?.country || 'Adresse incomplète'}
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Créée le
                  </div>
                  <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-lg font-bold text-black mb-1">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal - RESPONSIVE */}
        <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
            {/* Articles - 8 colonnes sur desktop, pleine largeur sur mobile */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-black flex items-center">
                      <Package className="h-5 w-5 mr-2 text-gray-700" />
                      Articles commandés
                    </h2>
                    <span className="px-3 py-1 bg-black text-white text-sm font-semibold rounded-full w-fit">
                      {order.orderItems.length}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
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

                    console.log('🔍 [OrderDetail] Item:', item.id, {
                      mockupUrl: item.mockupUrl,
                      designId: item.designId,
                      savedDesignPosition: item.savedDesignPosition,
                      designMetadata: item.designMetadata,
                      delimitation: item.delimitation,
                      enriched: enriched,
                      isCustomizedProduct,
                      elementsByView: Object.keys(elementsByView)
                    });

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

                    console.log('🎨 [OrderDetail] Design info:', {
                      hasDesign,
                      designUrl,
                      mockupUrl
                    });

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
                          coordinateType: firstDelim.coordinateType || 'PERCENTAGE'
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
                            coordinateType: firstDelim.coordinateType || 'PERCENTAGE'
                          };
                        }
                      }
                    }

                    console.log('📐 [OrderDetail] Delimitation:', delimitation);
                    console.log('📍 [OrderDetail] Design Position:', designPosition);
                    console.log('🆔 [OrderDetail] VendorProductId:', {
                      fromItem: item.vendorProductId,
                      fromEnriched: enriched?.id,
                      final: item.vendorProductId || enriched?.id
                    });

                    return (
                      <div key={item.id || index} className="p-3 sm:p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all group">
                        <div className="flex flex-col gap-4 sm:gap-6">
                          {/* Header mobile avec nom et prix */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 order-0">
                            <h3 className="text-lg sm:text-xl font-bold text-black group-hover:text-gray-700 transition-colors line-clamp-1">
                              {item.product?.name || enriched?.vendorName || 'Produit inconnu'}
                            </h3>
                            <div className="sm:hidden">
                              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Prix unitaire</span>
                                  <span className="text-sm font-bold text-gray-700">{formatCurrency(item.unitPrice)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total</span>
                                    <span className="text-lg font-bold text-black">{formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                            {/* Preview du produit avec design - RESPONSIVE */}
                            <div className="flex-shrink-0 w-full lg:w-80 mx-auto lg:mx-0">
                              {isCustomizedProduct ? (
                                // Affichage pour produits personnalisés avec designElementsByView
                                <div className="space-y-4">
                                  {Object.entries(elementsByView).map(([viewKey, elements]) => {
                                    // Parser la clé pour obtenir colorVariationId et viewId
                                    const [colorIdStr, viewIdStr] = viewKey.split('-');
                                    const colorId = parseInt(colorIdStr);
                                    const viewId = parseInt(viewIdStr);

                                    // Trouver l'image de la vue
                                    let viewImageUrl = mockupUrl;
                                    let viewDelimitation = delimitation;

                                    // Chercher dans les données de colorVariation
                                    if (item.colorVariation?.images) {
                                      const viewImage = item.colorVariation.images.find((img: any) => img.id === viewId);
                                      if (viewImage) {
                                        viewImageUrl = viewImage.url;
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

                                    // Si pas trouvé, essayer dans enriched
                                    if (!viewImageUrl && enriched?.adminProduct?.colorVariations) {
                                      const colorVar = enriched.adminProduct.colorVariations.find(
                                        (cv: any) => cv.id === colorId
                                      );
                                      if (colorVar?.images) {
                                        const viewImage = colorVar.images.find((img: any) => img.id === viewId);
                                        if (viewImage) {
                                          viewImageUrl = viewImage.url;
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

                                    // Utiliser l'URL de base si rien trouvé
                                    if (!viewImageUrl) {
                                      viewImageUrl = mockupUrl || item.product?.images?.[0]?.url;
                                    }

                                    return (
                                      <div key={viewKey} className="relative group-hover:scale-[1.02] transition-transform duration-300">
                                        <CustomizationPreview
                                          productImageUrl={viewImageUrl}
                                          designElements={elements as any[]}
                                          delimitation={viewDelimitation as any}
                                          productName={item.product?.name || enriched?.vendorName || 'Produit'}
                                          colorName={item.colorVariation?.name || item.color}
                                          colorCode={item.colorVariation?.colorCode}
                                          size={item.size}
                                          quantity={item.quantity}
                                          className="w-full aspect-square lg:w-80 lg:h-80 rounded-2xl shadow-lg"
                                          showInfo={true}
                                        />
                                        {Object.keys(elementsByView).length > 1 && (
                                          <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                                            Vue {viewKey}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : mockupUrl || designUrl ? (
                                <div className="relative group-hover:scale-[1.02] transition-transform duration-300">
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
                                    className="w-full aspect-square lg:w-80 lg:h-80 rounded-2xl shadow-lg"
                                  />
                                </div>
                              ) : (
                                <div className="w-full aspect-square lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300">
                                  <Package className="h-16 sm:h-20 w-16 sm:w-20 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Détails - RESPONSIVE */}
                            <div className="flex-1 min-w-0 w-full space-y-4">
                              {item.product?.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                  {item.product.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {item.size && (
                                  <span className="px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl shadow-sm">
                                    📏 {item.size}
                                  </span>
                                )}
                                {(item.color || item.product?.orderedColorName) && (
                                  <span className="px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm">
                                    🎨 {item.color || item.product?.orderedColorName}
                                    {item.colorVariation?.colorCode && (
                                      <span
                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: item.colorVariation.colorCode }}
                                      />
                                    )}
                                  </span>
                                )}
                                <span className="px-3 sm:px-4 py-2 bg-gradient-to-r from-black to-gray-800 text-white text-xs font-bold rounded-xl shadow-lg">
                                  ×{item.quantity}
                                </span>
                              </div>

                              {/* Informations du design - Style moderne avec miniature */}
                              {item.designMetadata && designUrl && (
                                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-white border-2 border-blue-300 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                                        <img
                                          src={designUrl}
                                          alt={item.designMetadata.designName}
                                          className="w-full h-full object-contain p-1"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
                                          Design personnalisé
                                        </div>
                                        <div className="text-sm font-semibold text-blue-800 truncate">
                                          {item.designMetadata.designName}
                                        </div>
                                        {item.designMetadata.designCategory && (
                                          <div className="text-xs text-blue-600 mt-1 flex items-center">
                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                                            {item.designMetadata.designCategory}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      <button
                                        onClick={() => setSelectedDesign({ url: designUrl, name: item.designMetadata.designName })}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md"
                                        title="Voir le design"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => downloadDesign(designUrl, item.designMetadata.designName)}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md"
                                        title="Télécharger le design"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Prix - Carte moderne (desktop uniquement) */}
                          <div className="hidden sm:block text-right flex-shrink-0 min-w-[140px]">
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                                Prix unitaire
                              </div>
                              <div className="text-lg font-bold text-gray-700 mb-3">
                                {formatCurrency(item.unitPrice)}
                              </div>
                              <div className="border-t border-gray-200 pt-3">
                                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                                  Total
                                </div>
                                <div className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                                  {formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar - 4 colonnes */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              {/* Client - Style moderne */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-black">
                    Informations client
                  </h3>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl">
                    <Avatar className="h-10 w-10 sm:h-14 sm:w-14 ring-2 ring-gray-200">
                      {order.user.photo_profil && <AvatarImage src={order.user.photo_profil} />}
                      <AvatarFallback className="bg-gradient-to-br from-black to-gray-700 text-white font-bold text-sm sm:text-lg">
                        {order.user.firstName?.[0]?.toUpperCase()}{order.user.lastName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black text-sm sm:text-base truncate">
                        {order.user.firstName} {order.user.lastName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{order.user.email}</div>
                    </div>
                  </div>

                  {order.phoneNumber && (
                    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-transparent border border-green-200 rounded-xl">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-black font-semibold">{order.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Adresse - Style moderne */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-black">
                    Adresse de livraison
                  </h3>
                </div>

                {order.shippingAddress ? (
                  <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-transparent rounded-xl border border-gray-100">
                    {order.shippingAddress.name && (
                      <div className="font-bold text-black text-sm sm:text-base">{order.shippingAddress.name}</div>
                    )}
                    <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-1">
                      <div>{order.shippingAddress.street}</div>
                      {order.shippingAddress.apartment && (
                        <div>{order.shippingAddress.apartment}</div>
                      )}
                      <div className="font-medium">{order.shippingAddress.city}, {order.shippingAddress.region}</div>
                      {order.shippingAddress.postalCode && (
                        <div className="text-gray-600">{order.shippingAddress.postalCode}</div>
                      )}
                      <div className="text-black font-bold pt-1 sm:pt-2 border-t border-gray-200 mt-1 sm:mt-2">
                        {order.shippingAddress.country}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 p-3 sm:p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    Aucune adresse disponible
                  </p>
                )}
              </div>

              {/* Récapitulatif - Style premium */}
              <div className="bg-gradient-to-br from-black to-gray-800 rounded-2xl p-4 sm:p-6 shadow-2xl text-white">
                <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Récapitulatif
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-white/70">Sous-total</span>
                    <span className="text-white font-semibold">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-3 sm:pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm sm:text-lg">Total</span>
                      <div className="text-right">
                        <div className="text-xl sm:text-3xl font-bold text-white">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes - Style moderne */}
              {order.notes && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-6 shadow-lg">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-amber-900">Notes</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed whitespace-pre-line p-3 bg-white/50 rounded-lg">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de prévisualisation du design */}
      {selectedDesign && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedDesign(null)}
        >
          <div
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-bold text-black truncate">Prévisualisation du design</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedDesign.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => downloadDesign(selectedDesign.url, selectedDesign.name)}
                    className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => downloadDesign(selectedDesign.url, selectedDesign.name)}
                    className="sm:hidden p-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDesign(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <img
                  src={selectedDesign.url}
                  alt={selectedDesign.name}
                  className="w-full h-auto max-h-[60vh] sm:max-h-[70vh] object-contain"
                />
              </div>
            </div>

            {/* Footer info */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4">
                  <span className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-700 rounded-full font-medium text-xs w-fit">
                    Design original
                  </span>
                  <span className="text-center sm:text-left">Cliquez en dehors pour fermer</span>
                </div>
                <div className="text-center sm:text-right text-gray-500">
                  Appuyez sur Échap pour fermer
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;