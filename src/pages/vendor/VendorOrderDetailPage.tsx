import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  User,
  Phone,
  MapPin,
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
import DefaultProductImage from '../../components/ui/DefaultProductImage';
import { Order, OrderStatus } from '../../types/order';
import { useToast } from '../../components/ui/use-toast';
import { vendorOrderService } from '../../services/vendorOrderService';
import { CustomizationPreview } from '../../components/order/CustomizationPreview';
import '../../styles/order-timeline.css';

// Composant pour afficher une image avec fallback
const ProductImageWithFallback: React.FC<{
  src?: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src || imageError) {
    return (
      <DefaultProductImage 
        size="md" 
        alt={alt}
        showText={false}
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  );
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

        // Appel au service API
        const orderData = await vendorOrderService.getVendorOrderDetails(parseInt(orderId));

        console.log('✅ Détails de commande récupérés:', orderData);

        setOrder(orderData);
        // ❌ Suppression de la présélection de statut

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

  // Obtenir le label du statut
  const getStatusLabel = (status: OrderStatus) => {
    const statusLabels = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En traitement',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REJECTED: 'Rejetée'
    };
    return statusLabels[status];
  };

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
                      // Vérifier si c'est un produit personnalisé
                      const elementsByView = item.designElementsByView || item.customization?.elementsByView || {};
                      const isCustomized = Object.keys(elementsByView).length > 0;

                      // Trouver l'image mockup
                      let mockupUrl = item.mockupUrl || item.productImage;
                      if (!mockupUrl && item.colorVariation?.images?.[0]) {
                        mockupUrl = item.colorVariation.images[0].url;
                      }

                      // Récupérer la délimitation
                      let delimitation = item.delimitation || null;
                      if (!delimitation && item.colorVariation?.images?.[0]?.delimitations?.[0]) {
                        const delim = item.colorVariation.images[0].delimitations[0];
                        delimitation = {
                          x: delim.x,
                          y: delim.y,
                          width: delim.width,
                          height: delim.height,
                          coordinateType: delim.coordinateType || 'PERCENTAGE',
                          referenceWidth: delim.referenceWidth || 800,
                          referenceHeight: delim.referenceHeight || 800
                        };
                      }

                      return (
                        <div key={item.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                          {/* Image ou Preview avec personnalisation */}
                          {isCustomized ? (
                            <div className="w-24 h-24 flex-shrink-0">
                              {Object.entries(elementsByView).map(([viewKey, elements], idx) => {
                                // Pour la vue principale seulement
                                if (idx > 0) return null;

                                let viewImageUrl = mockupUrl;
                                let viewDelimitation = delimitation;

                                // Chercher l'image spécifique à la vue
                                if (item.viewsMetadata) {
                                  const viewMeta = item.viewsMetadata.find((v: any) => v.viewKey === viewKey);
                                  if (viewMeta) {
                                    viewImageUrl = viewMeta.imageUrl;
                                  }
                                }

                                if (item.colorVariation?.images) {
                                  const [, viewIdStr] = viewKey.split('-');
                                  const viewId = parseInt(viewIdStr);
                                  const viewImage = item.colorVariation.images.find((img: any) => img.id === viewId);
                                  if (viewImage) {
                                    viewImageUrl = viewImage.url;
                                    if (viewImage.delimitations?.[0]) {
                                      viewDelimitation = {
                                        x: viewImage.delimitations[0].x,
                                        y: viewImage.delimitations[0].y,
                                        width: viewImage.delimitations[0].width,
                                        height: viewImage.delimitations[0].height,
                                        coordinateType: viewImage.delimitations[0].coordinateType || 'PERCENTAGE',
                                        referenceWidth: viewImage.delimitations[0].referenceWidth || 800,
                                        referenceHeight: viewImage.delimitations[0].referenceHeight || 800
                                      };
                                    }
                                  }
                                }

                                return (
                                  <CustomizationPreview
                                    key={viewKey}
                                    productImageUrl={viewImageUrl || ''}
                                    designElements={elements as any[]}
                                    delimitation={viewDelimitation as any}
                                    productName={item.productName}
                                    className="w-24 h-24 rounded-lg"
                                    showInfo={false}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <ProductImageWithFallback
                              src={item.productImage}
                              alt={item.productName}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.productName}</h4>
                            {item.product?.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.product.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>Quantité: {item.quantity}</span>
                              {item.size && <span>Taille: {item.size}</span>}
                              {item.color && <span>Couleur: {item.color}</span>}
                            </div>
                            {item.product?.designName && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Design:</span> {item.product.designName}
                              </div>
                            )}
                            {isCustomized && (
                              <div className="mt-2 text-xs text-gray-500">
                                {Object.keys(elementsByView).length} vue(s) personnalisée(s)
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatAmount(item.unitPrice)}
                            </p>
                            <p className="text-sm text-gray-600">
                              x{item.quantity}
                            </p>
                            <p className="font-semibold text-gray-900 mt-1">
                              {formatAmount(item.totalPrice || item.unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Résumé financier */}
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
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
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
                    <p className="text-sm text-gray-600">{order.user.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{order.phoneNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-gray-600 mt-1">{order.shippingAddress.street}</p>
                  <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.region}</p>
                  <p className="text-gray-600">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-gray-600 mt-2">📞 {order.shippingAddress.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

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