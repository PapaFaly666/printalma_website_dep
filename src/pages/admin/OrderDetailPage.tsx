import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import newOrderService from '../../services/newOrderService';
import { Order } from '../../types/order';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Package, User, MapPin, Phone, Copy, Printer } from 'lucide-react';
import { getStatusIcon, formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          const fetchedOrder = await newOrderService.getOrderById(numericOrderId);
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
  }, [orderId]);

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Button
                onClick={() => navigate('/admin/orders')}
                variant="ghost"
                className="text-gray-600 hover:text-black px-0"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Commandes
              </Button>

              <div className="h-6 w-px bg-gray-200"></div>

              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-black">
                    Commande #{order.orderNumber}
                  </h1>
                  <button
                    onClick={copyOrderNumber}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
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

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-gray-300">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span>{getStatusLabel(order.status)}</span>
                </div>
              </Badge>

              <Button
                onClick={() => window.print()}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full">
        {/* Métriques */}
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="w-full px-8 py-8">
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">
                  {formatCurrency(order.totalAmount)}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Total ({order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''})
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-black mb-2">
                  {order.user.firstName} {order.user.lastName}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Client
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-black mb-2">
                  {order.shippingAddress?.city || 'Non définie'}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Livraison
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-black mb-2">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Date de création
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="w-full px-8 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Articles - 8 colonnes */}
            <div className="col-span-8">
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-black">
                    Articles commandés ({order.orderItems.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.orderItems.map((item, index) => (
                    <div key={item.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-6">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          {item.product?.designImageUrl ? (
                            <img
                              src={item.product.designImageUrl}
                              alt={item.product.designName || item.product.name || 'Produit'}
                              className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Détails */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-black mb-2">
                            {item.product?.name || 'Produit inconnu'}
                          </h3>
                          {item.product?.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {item.product.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3">
                            {item.size && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                Taille: {item.size}
                              </span>
                            )}
                            {(item.color || item.product?.orderedColorName) && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                Couleur: {item.color || item.product?.orderedColorName}
                              </span>
                            )}
                            <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                              Quantité: {item.quantity}
                            </span>
                          </div>
                        </div>

                        {/* Prix */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm text-gray-500 mb-1">Prix unitaire</div>
                          <div className="text-lg font-semibold text-black mb-2">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <div className="text-xl font-bold text-black">
                            {formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - 4 colonnes */}
            <div className="col-span-4 space-y-6">
              {/* Client */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-black mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informations client
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      {order.user.photo_profil && <AvatarImage src={order.user.photo_profil} />}
                      <AvatarFallback className="bg-gray-100 text-black font-semibold">
                        {order.user.firstName?.[0]?.toUpperCase()}{order.user.lastName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-black">
                        {order.user.firstName} {order.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{order.user.email}</div>
                    </div>
                  </div>

                  {order.phoneNumber && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-black font-medium">{order.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-black mb-6 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Adresse de livraison
                </h3>

                {order.shippingAddress ? (
                  <div className="space-y-2 text-sm">
                    {order.shippingAddress.name && (
                      <div className="font-semibold text-black">{order.shippingAddress.name}</div>
                    )}
                    <div className="text-gray-700">{order.shippingAddress.street}</div>
                    {order.shippingAddress.apartment && (
                      <div className="text-gray-700">{order.shippingAddress.apartment}</div>
                    )}
                    <div className="text-gray-700">{order.shippingAddress.city}, {order.shippingAddress.region}</div>
                    {order.shippingAddress.postalCode && (
                      <div className="text-gray-700">{order.shippingAddress.postalCode}</div>
                    )}
                    <div className="text-black font-medium">{order.shippingAddress.country}</div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune adresse disponible</p>
                )}
              </div>

              {/* Récapitulatif */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-black mb-6">Récapitulatif</h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="text-black font-medium">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between">
                      <span className="font-bold text-black text-lg">Total</span>
                      <span className="font-bold text-black text-lg">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-black mb-4">Notes</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;