import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  User,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Image as ImageIcon,
  Download,
  RefreshCw,
  ExternalLink,
  Copy,
  Mail,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Order, OrderStatus } from '../../types/order';
import { useToast } from '../../components/ui/use-toast';
import { FundsRequestForm } from '../../components/vendor/FundsRequestForm';
import { vendorOrderService } from '../../services/vendorOrderService';
import { CustomizationPreview } from '../../components/order/CustomizationPreview';
import { EnrichedOrderProductPreview } from '../../components/order/EnrichedOrderProductPreview';
import '../../styles/order-timeline.css';



// Fonction pour préparer les données pour CustomizationPreview
const prepareCustomizationPreviewData = (orderItem: any): {
  productImageUrl: string;
  designElements: any[];
  delimitation?: any;
  productName: string;
  colorName?: string;
  colorCode?: string;
  size?: string;
  quantity: number;
} | null => {
  // Vérifier si le produit a des éléments de personnalisation (texte/image personnalisés)
  const hasCustomizationElements = orderItem.customization?.designElements?.length > 0
    || orderItem.designElementsByView
    || (orderItem.customization?.elementsByView && Object.keys(orderItem.customization.elementsByView).length > 0);

  if (!hasCustomizationElements) {
    return null; // Pas de personnalisation, utiliser l'affichage classique
  }

  // Obtenir l'image du produit de base
  const productImageUrl = orderItem.colorVariation?.images?.[0]?.url
    || orderItem.productImage
    || orderItem.mockupUrl;

  if (!productImageUrl) {
    return null;
  }

  // Extraire les éléments de design
  let designElements: any[] = [];

  // Priorité 1: designElementsByView (format moderne)
  if (orderItem.designElementsByView) {
    // Prendre les éléments de la première vue disponible
    const firstViewKey = Object.keys(orderItem.designElementsByView)[0];
    if (firstViewKey) {
      designElements = orderItem.designElementsByView[firstViewKey] || [];
    }
  }
  // Priorité 2: customization.elementsByView
  else if (orderItem.customization?.elementsByView) {
    const firstViewKey = Object.keys(orderItem.customization.elementsByView)[0];
    if (firstViewKey) {
      designElements = orderItem.customization.elementsByView[firstViewKey] || [];
    }
  }
  // Priorité 3: customization.designElements (format legacy)
  else if (orderItem.customization?.designElements) {
    designElements = orderItem.customization.designElements;
  }

  // Extraire la délimitation
  const delimitation = orderItem.delimitation
    || orderItem.colorVariation?.images?.[0]?.delimitations?.[0]
    || orderItem.adminProduct?.colorVariations?.[0]?.images?.[0]?.delimitations?.[0];

  return {
    productImageUrl,
    designElements,
    delimitation,
    productName: orderItem.productName,
    colorName: orderItem.color,
    colorCode: orderItem.colorVariation?.colorCode,
    size: orderItem.size,
    quantity: orderItem.quantity
  };
};

const VendorOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // ❌ États supprimés pour la modification de statut
  // const [updating, setUpdating] = useState(false);
  // const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  // const [statusNote, setStatusNote] = useState('');


  // Charger les détails de la commande depuis le backend
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId) return;

      setLoading(true);
      try {
        console.log('🔄 Chargement des détails de la commande:', orderId);

        // Appel direct à l'API pour contourner les données mock en développement
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/vendor/orders/${orderId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const orderData = await response.json();
        console.log('✅ Détails de commande récupérés (API directe):', orderData);

        setOrder(orderData.data);

      } catch (error) {
        console.error('❌ Erreur lors du chargement de la commande:', error);

        const errorMessage = vendorOrderService.handleError(error, 'chargement détails commande');

        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });

        // Si erreur 404, rediriger vers la liste
        if (error.message?.includes('404')) {
          setTimeout(() => {
            navigate('/vendeur/sales');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [orderId, toast, navigate]);

  // ❌ FONCTION SUPPRIMÉE: updateOrderStatus
  // Les vendeurs ne peuvent plus modifier les statuts des commandes

  
  // Obtenir le badge de statut
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { label: 'En traitement', color: 'bg-orange-100 text-orange-800', icon: Package },
      SHIPPED: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800', icon: Truck },
      DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
      REJECTED: { label: 'Rejetée', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0 font-medium text-sm px-3 py-1`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  // Formater le montant
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} F`;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Copier le numéro de commande
  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      toast({
        title: "Copié",
        description: "Numéro de commande copié dans le presse-papiers.",
      });
    }
  };

  // Contacter le client
  const contactClient = () => {
    if (order) {
      window.location.href = `mailto:${order.user.email}?subject=Commande ${order.orderNumber}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Commande introuvable</h2>
          <p className="mt-1 text-gray-600">Cette commande n'existe pas ou vous n'y avez pas accès.</p>
          <Button
            onClick={() => navigate('/vendeur/sales')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/vendeur/sales')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Commande {order.orderNumber}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyOrderNumber}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-600">
                Créée le {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(order.status)}
            <Button
              variant="outline"
              size="sm"
              onClick={contactClient}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contacter le client
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de commande */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Détails de la commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Produits */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Produits commandés</h3>
                  <div className="space-y-4">
                    {order.orderItems.map((item) => {
                      return (
                        <div key={item.id} className="p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                          {/* Product Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-medium text-gray-900 truncate">
                                {item.productName || item.product?.name || 'Produit inconnu'}
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
                              {(item as any).designMetadata?.designName && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Design:</span> {(item as any).designMetadata.designName}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-semibold text-gray-900">{formatAmount(item.totalPrice || item.unitPrice * item.quantity)}</div>
                              <div className="text-xs text-gray-500">{formatAmount(item.unitPrice)} / unité</div>
                            </div>
                          </div>

                          {/* Product Preview */}
                          <div className="w-full">
                            {/* Vérifier si c'est un produit personnalisé avec designElementsByView */}
                            {((item as any).designElementsByView && Object.keys((item as any).designElementsByView).length > 0) ||
                             ((item as any).customization?.elementsByView && Object.keys((item as any).customization.elementsByView).length > 0) ? (
                              <div className="space-y-3">
                                <div className={`grid gap-4 ${
                                  Object.keys((item as any).designElementsByView || (item as any).customization?.elementsByView || {}).length > 1
                                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                    : 'grid-cols-1'
                                }`}>
                                  {Object.entries((item as any).designElementsByView || (item as any).customization?.elementsByView || {}).map(([viewKey, elements]) => {
                                    const elementsByView = (item as any).designElementsByView || (item as any).customization?.elementsByView || {};
                                    const [colorIdStr, viewIdStr] = viewKey.split('-');

                                    // Trouver l'image mockup pour cette vue
                                    let viewImageUrl = item.mockupUrl;
                                    if (item.colorVariation?.images) {
                                      const viewImage = item.colorVariation.images.find((img: any) => img.id === parseInt(viewIdStr));
                                      if (viewImage) {
                                        viewImageUrl = viewImage.url;
                                      }
                                    }

                                    // Récupérer la délimitation
                                    let viewDelimitation = item.delimitation;
                                    if (item.colorVariation?.images) {
                                      const viewImage = item.colorVariation.images.find((img: any) => img.id === parseInt(viewIdStr));
                                      if (viewImage?.delimitations?.[0]) {
                                        viewDelimitation = viewImage.delimitations[0];
                                      }
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
                                      <div key={viewKey} className="relative w-full aspect-square">
                                        <CustomizationPreview
                                          productImageUrl={viewImageUrl}
                                          designElements={elements as any[]}
                                          delimitation={viewDelimitation as any}
                                          productName={item.productName || item.product?.name || 'Produit'}
                                          colorName={item.colorVariation?.name || item.color}
                                          colorCode={item.colorVariation?.colorCode}
                                          size={item.size}
                                          quantity={item.quantity}
                                          className="w-full h-full border border-gray-200 rounded-lg"
                                          showInfo={false}
                                        />
                                        {Object.keys(elementsByView).length > 1 && (
                                          <div className="absolute bottom-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded text-xs font-medium">
                                            {getViewName(viewIdStr)}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : item.mockupUrl || (item as any).designMetadata?.designImageUrl ? (
                              <div className="w-full aspect-square">
                                <EnrichedOrderProductPreview
                                  product={{
                                    id: item.productId || item.id,
                                    name: item.productName || item.product?.name || 'Produit',
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice || 0,
                                    colorName: item.colorVariation?.name || item.color,
                                    colorCode: item.colorVariation?.colorCode,
                                    size: item.size,
                                    mockupImageUrl: item.mockupUrl,
                                    designImageUrl: (item as any).designMetadata?.designImageUrl || null,
                                    designPosition: (item as any).designPositions || {
                                      x: 0.5, y: 0.5,
                                      scale: 0.6,
                                      rotation: 0
                                    },
                                    delimitation: item.delimitation ? {
                                      x: item.delimitation.x,
                                      y: item.delimitation.y,
                                      width: item.delimitation.width,
                                      height: item.delimitation.height,
                                      coordinateType: item.delimitation.coordinateType || 'PERCENTAGE'
                                    } : undefined,
                                    vendorProductId: item.vendorProductId
                                  }}
                                  className="w-full h-full border border-gray-200 rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="w-full aspect-square border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Résumé financier simplifié */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="text-gray-900">{formatAmount(order.subtotal || order.totalAmount - (order.shippingAmount || 0))}</span>
                    </div>
                    {order.shippingAmount && order.shippingAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Livraison</span>
                        <span className="text-gray-900">{formatAmount(order.shippingAmount)}</span>
                      </div>
                    )}
                    {order.taxAmount && order.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taxes</span>
                        <span className="text-gray-900">{formatAmount(order.taxAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-gray-900">Total commande</span>
                      <span className="text-gray-900">{formatAmount(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message informatif */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Information importante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-900">
                  Vous pouvez maintenant <strong>consulter</strong> vos commandes et suivre leur progression,
                  mais seuls les <strong>administrateurs</strong> peuvent modifier les statuts des commandes.
                </p>
                <p className="text-blue-800 text-sm mt-2">
                  Pour toute question sur le statut d'une commande, contactez l'équipe administrative.
                </p>
              </CardContent>
            </Card>

            {/* Timeline de suivi de la commande */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Suivi de la commande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="order-timeline">
                  <div className="timeline">
                    <div className={`timeline-item ${vendorOrderService.isStatusReached(order.status, 'PENDING') ? 'completed' : ''}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h5>Commande reçue</h5>
                        <p>{formatDate(order.createdAt)}</p>
                      </div>
                    </div>

                    <div className={`timeline-item ${vendorOrderService.isStatusReached(order.status, 'CONFIRMED') ? 'completed' : ''}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h5>Commande confirmée</h5>
                        <p>{order.confirmedAt ? formatDate(order.confirmedAt) : 'En attente de confirmation par l\'admin'}</p>
                      </div>
                    </div>

                    <div className={`timeline-item ${vendorOrderService.isStatusReached(order.status, 'PROCESSING') ? 'completed' : ''}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h5>En traitement</h5>
                        <p>{order.processingAt ? formatDate(order.processingAt) : 'Non démarré'}</p>
                      </div>
                    </div>

                    <div className={`timeline-item ${vendorOrderService.isStatusReached(order.status, 'SHIPPED') ? 'completed' : ''}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h5>Expédiée</h5>
                        <p>{order.shippedAt ? formatDate(order.shippedAt) : 'Non expédiée'}</p>
                        {order.trackingNumber && (
                          <p className="text-sm text-gray-600 mt-1">Suivi: {order.trackingNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className={`timeline-item ${vendorOrderService.isStatusReached(order.status, 'DELIVERED') ? 'completed' : ''}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h5>Livrée</h5>
                        <p>{order.deliveredAt ? formatDate(order.deliveredAt) : 'Non livrée'}</p>
                      </div>
                    </div>

                    {/* Statuts terminaux */}
                    {order.status === 'CANCELLED' && (
                      <div className="timeline-item cancelled">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <h5>Commande annulée</h5>
                          <p>{order.cancelledAt ? formatDate(order.cancelledAt) : formatDate(order.updatedAt)}</p>
                          {order.cancelReason && (
                            <p className="text-sm text-red-600 mt-1">Raison: {order.cancelReason}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {order.status === 'REJECTED' && (
                      <div className="timeline-item rejected">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <h5>Commande rejetée</h5>
                          <p>{order.rejectedAt ? formatDate(order.rejectedAt) : formatDate(order.updatedAt)}</p>
                          {order.rejectReason && (
                            <p className="text-sm text-red-600 mt-1">Raison: {order.rejectReason}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Informations client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={order.user.photo_profil} alt={`${order.user.firstName} ${order.user.lastName}`} />
                    <AvatarFallback>
                      {order.user.firstName[0]}{order.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            
            {/* Gain du vendeur - Résumé financier */}
            {(order as any).beneficeCommande && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-blue-800">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Vos gains
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bénéfice net - en premier */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div>
                      <span className="text-sm font-medium text-green-700">Votre bénéfice</span>
                      <p className="text-xs text-green-600 mt-0.5">Ce que vous gagnez vraiment</p>
                    </div>
                    <span className="text-2xl font-bold text-green-900">{formatAmount((order as any).beneficeCommande)}</span>
                  </div>

                  {/* Montant que le vendeur reçoit - en deuxième */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-blue-700">Après commission</span>
                    <span className="text-xl font-bold text-blue-900">{formatAmount((order as any).vendorAmount)}</span>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span>Total commande:</span>
                      <span>{formatAmount(order.totalAmount)}</span>
                    </div>
                    {(order as any).commissionRate && (
                      <div className="flex justify-between">
                        <span>Commission:</span>
                        <span>-{formatAmount((order as any).commissionAmount || 0)} ({(order as any).commissionRate}%)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations de paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Méthode:</span>
                    <span className="font-medium">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant:</span>
                    <span className="font-medium">{formatAmount(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    <div className="text-sm">
                      <p className="font-medium">Commande créée</p>
                      <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {order.confirmedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      <div className="text-sm">
                        <p className="font-medium">Commande confirmée</p>
                        <p className="text-gray-600">{formatDate(order.confirmedAt)}</p>
                      </div>
                    </div>
                  )}

                  {order.shippedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                      <div className="text-sm">
                        <p className="font-medium">Commande expédiée</p>
                        <p className="text-gray-600">{formatDate(order.shippedAt)}</p>
                      </div>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <div className="text-sm">
                        <p className="font-medium">Commande livrée</p>
                        <p className="text-gray-600">{formatDate(order.deliveredAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Notes du client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderDetailPage;