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
  DollarSign
} from 'lucide-react';
import { ordersService, Order, OrderStatus, OrdersResponse } from '../../services/ordersService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  PENDING: { label: 'En attente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmée', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: 'En préparation', icon: Package, color: 'bg-purple-100 text-purple-800' },
  SHIPPED: { label: 'Expédiée', icon: Truck, color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Livrée', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulée', icon: XCircle, color: 'bg-red-100 text-red-800' }
};

export const VendorSalesPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Charger les commandes
  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const filters = {
        page: pagination.page,
        limit: pagination.limit,
        ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      };

      const response: OrdersResponse = await ordersService.getMyOrders(filters);
      setOrders(response.orders);
      setPagination(response.pagination);
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
  }, [pagination.page, selectedStatus]);

  // Polling toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false); // Rafraîchir sans loader
    }, 5000);

    return () => clearInterval(interval);
  }, [pagination.page, selectedStatus, searchTerm]);

  // Rafraîchissement manuel
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  // Recherche
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  // Calculer le total des revenus
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.status !== 'CANCELLED') {
      return sum + order.totalAmount;
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {totalRevenue.toFixed(2)} €
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Livrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'DELIVERED').length}
            </div>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          <CardTitle>Commandes ({pagination.total})</CardTitle>
          <CardDescription>
            Page {pagination.page} sur {pagination.totalPages}
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
                              {format(new Date(order.createdAt), 'PPP à HH:mm', { locale: fr })}
                            </CardDescription>
                          </div>
                          <Badge className={statusConfig[order.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[order.status].label}
                          </Badge>
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

                        {/* Total */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="text-sm">Méthode de paiement: <span className="font-medium">{order.paymentMethod}</span></p>
                          <p className="text-lg font-bold">{order.totalAmount.toFixed(2)} €</p>
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
