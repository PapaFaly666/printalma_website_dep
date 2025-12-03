// src/pages/vendor/VendorSalesPage.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { ordersService, Order, OrderStatus, OrdersResponse } from '../../services/ordersService';
import { toast } from 'sonner';

// ✅ Fonction de formatage de date native pour remplacer date-fns
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const statusConfig = {
  PENDING: { label: 'En attente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmée', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: 'En préparation', icon: Package, color: 'bg-purple-100 text-purple-800' },
  SHIPPED: { label: 'Expédiée', icon: Truck, color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Livrée', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulée', icon: XCircle, color: 'bg-red-100 text-red-800' }
};

// Configuration pour le statut de paiement
const paymentStatusConfig = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Échouée', color: 'bg-red-100 text-red-800' }
};

export const VendorSalesPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les commandes
  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const filters = {
        ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      };

      const response: OrdersResponse = await ordersService.getMyOrders(filters);
      setOrders(response.orders);
    } catch (error: any) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error(error.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  // Polling toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false); // Rafraîchir sans loader
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedStatus, searchTerm]);

  // Rafraîchissement manuel
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  // Recherche
  const handleSearch = () => {
    fetchOrders();
  };

  // Calculer le total des revenus et des gains du vendeur
  const totalRevenue = orders.reduce((sum, order) => {
    // Uniquement les commandes payées (PAID) comptent pour les revenus
    if (order.status !== 'CANCELLED' && order.paymentStatus === 'PAID') {
      return sum + order.totalAmount;
    }
    return sum;
  }, 0);

  // LES GAINS DU VENDEUR = commission_amount (montant que la plateforme gagne)
  // OU vendor_amount (montant que le vendeur reçoit après commission)
  // IMPORTANT: Uniquement les commandes avec paymentStatus === 'PAID'
  const totalCommissionAmount = orders.reduce((sum, order) => {
    if (order.status !== 'CANCELLED' &&
        order.paymentStatus === 'PAID' &&
        order.commission_info?.commission_amount) {
      return sum + order.commission_info.commission_amount;
    }
    return sum;
  }, 0);

  const totalVendorEarnings = orders.reduce((sum, order) => {
    if (order.status !== 'CANCELLED' &&
        order.paymentStatus === 'PAID' &&
        order.commission_info?.vendor_amount) {
      return sum + order.commission_info.vendor_amount;
    }
    return sum;
  }, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Ventes</h1>
          <p className="text-muted-foreground">Gérez vos commandes en cours et votre historique</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques des statuts de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
            <div className="text-xs text-gray-500">En attente de confirmation</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Échoués</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.paymentStatus === 'FAILED').length}
            </div>
            <div className="text-xs text-gray-500">Paiements non aboutis</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'CONFIRMED').length}
            </div>
            <div className="text-xs text-gray-500">Commandes confirmées</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'DELIVERED').length}
            </div>
            <div className="text-xs text-gray-500">Commandes livrées</div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {(totalRevenue / 100).toLocaleString()} F
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commissions (Gains plateforme)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1 text-orange-600">
              <DollarSign className="h-5 w-5" />
              {(totalCommissionAmount / 100).toLocaleString()} F
            </div>
            <p className="text-xs text-muted-foreground">Total des commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mes Gains Nets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1 text-green-600">
              <DollarSign className="h-5 w-5" />
              {(totalVendorEarnings / 100).toLocaleString()} F
            </div>
            <p className="text-xs text-muted-foreground">Après commission déduite</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Rechercher</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="N° commande, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as OrderStatus | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmées</SelectItem>
                  <SelectItem value="PROCESSING">En préparation</SelectItem>
                  <SelectItem value="SHIPPED">Expédiées</SelectItem>
                  <SelectItem value="DELIVERED">Livrées</SelectItem>
                  <SelectItem value="CANCELLED">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les commandes ({orders.length})</CardTitle>
          <CardDescription>
            Affichage de toutes vos commandes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Chargement des commandes...</p>
            </div>
          ) : orders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune commande trouvée avec ces critères
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <Card key={order.id} className="border-l-4" style={{
                      borderLeftColor: order.status === 'DELIVERED' ? '#10b981' :
                                       order.status === 'CANCELLED' ? '#ef4444' :
                                       order.status === 'SHIPPED' ? '#6366f1' : '#f59e0b'
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Commande #{order.orderNumber}
                            </CardTitle>
                            <CardDescription>
                              Client: {order.user?.username || 'N/A'} ({order.user?.email})
                            </CardDescription>
                            <CardDescription>
                              {formatDate(new Date(order.createdAt))}
                            </CardDescription>
                            <div className="flex gap-2 mt-1">
                              <Badge className={statusConfig[order.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[order.status].label}
                              </Badge>
                              {/* Badge de statut de paiement */}
                              {order.paymentStatus && (
                                <Badge className={paymentStatusConfig[order.paymentStatus]?.color || 'bg-gray-100 text-gray-800'}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                                </Badge>
                              )}
                            </div>
                            {/* Message spécial pour les paiements échoués */}
                            {order.paymentStatus === 'FAILED' && order.notes && (
                              <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Paiement échoué</strong>: Voir les notes pour plus de détails
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Articles */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Articles:</p>
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded-md">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.productName}</p>
                                {item.designName && (
                                  <p className="text-xs text-muted-foreground">Design: {item.designName}</p>
                                )}
                                {item.size && <p className="text-xs">Taille: {item.size}</p>}
                                {item.color && <p className="text-xs">Couleur: {item.color}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm">x{item.quantity}</p>
                                <p className="text-sm font-semibold">{item.totalPrice.toFixed(2)} €</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Adresse de livraison */}
                        <div className="pt-2 border-t">
                          <p className="text-sm font-semibold mb-1">Adresse de livraison:</p>
                          <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                        </div>

                        {/* Commission et Total */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="space-y-1">
                            <p className="text-sm">Méthode: <span className="font-medium">{order.paymentMethod}</span></p>
                            {order.commission_info && order.paymentStatus === 'PAID' ? (
                              <>
                                <p className="text-sm text-orange-600">
                                  Commission ({order.commission_info.commission_rate}%):
                                  <span className="font-medium"> {(order.commission_info.commission_amount / 100).toLocaleString()} F</span>
                                </p>
                                <p className="text-sm text-green-600 font-medium">
                                  <strong>MES GAINS</strong>: <span className="font-bold">{(order.commission_info.vendor_amount / 100).toLocaleString()} F</span>
                                </p>
                              </>
                            ) : order.paymentStatus === 'FAILED' ? (
                              <p className="text-sm text-red-600 font-medium">
                                <strong>PAIEMENT ÉCHOUÉ</strong> - Pas de gains pour cette commande
                              </p>
                            ) : (
                              <p className="text-sm text-yellow-600">
                                Paiement en attente
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{(order.totalAmount / 100).toLocaleString()} F</p>
                            <p className="text-xs text-gray-500">Total commande</p>
                            {order.commission_info && order.commission_info.has_custom_rate && (
                              <Badge variant="secondary" className="mt-1">
                                Taux personnalisé
                              </Badge>
                            )}
                          </div>
                        </div>

                        {order.notes && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Notes:</strong> {order.notes}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          </CardContent>
      </Card>
    </div>
  );
};
