import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Eye,
  RefreshCw,
  Clock,
  DollarSign,
  User,
  Phone,
  MapPin,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ordersService, Order, OrderStatus } from '../../services/ordersService';
import { toast } from 'sonner';

const VendorSales: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL' | 'PAYMENT_FAILED'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Statistiques depuis l'API
  const [apiStatistics, setApiStatistics] = useState<any>(null);

  const statistics = useMemo(() => {
    // Utiliser les statistiques de l'API si disponibles, sinon calculer localement
    if (apiStatistics) {
      return {
        totalOrders: apiStatistics.totalOrders || 0,
        totalRevenue: apiStatistics.totalRevenue || 0,
        totalVendorEarnings: apiStatistics.totalVendorAmount || 0,
        pendingOrders: apiStatistics.pendingOrders || orders.filter(o => o.status === 'PENDING').length,
        processingOrders: apiStatistics.processingOrders || orders.filter(o => o.status === 'PROCESSING').length,
        shippedOrders: apiStatistics.shippedOrders || orders.filter(o => o.status === 'SHIPPED').length,
        deliveredOrders: apiStatistics.deliveredOrders || orders.filter(o => o.status === 'DELIVERED').length,
        cancelledOrders: apiStatistics.cancelledOrders || orders.filter(o => o.status === 'CANCELLED').length,
      };
    }

    // Fallback: calcul local
    const paidOrders = orders.filter(order => order.paymentStatus === 'PAID');
    return {
      totalOrders: pagination?.total || 0,
      totalRevenue: paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      totalVendorEarnings: paidOrders.reduce((sum, order) => sum + (order.commission_info?.vendor_amount || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      processingOrders: orders.filter(o => o.status === 'PROCESSING').length,
      shippedOrders: orders.filter(o => o.status === 'SHIPPED').length,
      deliveredOrders: orders.filter(o => o.status === 'DELIVERED').length,
      cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
    };
  }, [orders, pagination, apiStatistics]);

  // Charger les données depuis le backend
  const loadOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const filters: any = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter !== 'ALL' && statusFilter !== 'PAYMENT_FAILED' && { status: statusFilter }),
        ...(statusFilter === 'PAYMENT_FAILED' && { paymentStatus: 'FAILED' }),
        ...(searchTerm && { search: searchTerm })
      };

      // Ajouter les filtres de date
      if (dateFilter !== 'all') {
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            filters.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filters.startDate = weekAgo.toISOString();
            break;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filters.startDate = monthAgo.toISOString();
            break;
        }
      }

      console.log('🔄 Chargement des commandes vendeur...');
      const response = await ordersService.getMyOrders(filters);

      console.log('✅ Commandes récupérées:', response);
      console.log('🔍 bénéficeCommande dans la première commande:', response.orders[0]?.beneficeCommande);
      console.log('🔍 totalAmount dans la première commande:', response.orders[0]?.totalAmount);
      console.log('🔍 Premier item de la première commande:', response.orders[0]?.items?.[0]);

      setOrders(response.orders);
      setPagination(response.pagination);

      // Récupérer les statistiques depuis l'API si disponibles
      if (response.statistics) {
        console.log('📊 Statistiques depuis l\'API:', response.statistics);
        setApiStatistics(response.statistics);
      }
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
    loadOrders();
  }, [pagination.page, statusFilter, dateFilter]);

  // Recherche avec debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadOrders();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Polling toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(false); // Rafraîchir sans loader
    }, 5000);

    return () => clearInterval(interval);
  }, [pagination.page, statusFilter, dateFilter, searchTerm]);

  // Rafraîchissement manuel
  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(false);
  };

  // Changer de page
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Badge de statut
  const getStatusBadge = (status: OrderStatus, paymentStatus?: string) => {
    // Si le paiement a échoué, afficher le badge de paiement échoué en priorité
    if (paymentStatus === 'FAILED') {
      return (
        <Badge className="bg-red-100 text-red-800 border-0 font-medium">
          <XCircle className="w-3 h-3 mr-1" />
          Paiement échoué
        </Badge>
      );
    }

    const statusConfig = {
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { label: 'En traitement', color: 'bg-orange-100 text-orange-800', icon: Package },
      SHIPPED: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800', icon: Truck },
      DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0 font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Voir les détails d'une commande
  const viewOrderDetails = (orderId: number) => {
    navigate(`/vendeur/sales/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Suivi des Commandes
            </h1>
            <p className="text-gray-600 mt-1">
              Consultez et suivez la progression de toutes vos commandes
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Message informatif pour les vendeurs */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900">📋 Information importante</h5>
                <p className="text-blue-800 text-sm mt-1">
                  Vous pouvez maintenant <strong>consulter</strong> vos commandes et suivre leur progression,
                  mais seuls les <strong>administrateurs</strong> peuvent modifier les statuts des commandes.
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  Pour toute question sur le statut d'une commande, contactez l'équipe administrative.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : statistics.totalOrders}
                </div>
                <div className="text-xs text-gray-500">
                  Toutes vos commandes
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : formatAmount(statistics.totalRevenue)}
                </div>
                <div className="text-xs text-gray-500">
                  Revenu total (commandes payées)
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mes Gains</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {loading ? '...' : formatAmount(statistics.totalVendorEarnings)}
                </div>
                <div className="text-xs text-gray-500">
                  Gains après commission (commandes payées)
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : statistics.pendingOrders}
                </div>
                <div className="text-xs text-gray-500">
                  En attente de confirmation
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Livrées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : statistics.deliveredOrders}
                </div>
                <div className="text-xs text-gray-500">
                  Commandes terminées
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtres et recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par numéro, client, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'ALL' | 'PAYMENT_FAILED')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                  <SelectItem value="PROCESSING">En traitement</SelectItem>
                  <SelectItem value="SHIPPED">Expédiée</SelectItem>
                  <SelectItem value="DELIVERED">Livrée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                  <SelectItem value="PAYMENT_FAILED">Paiement échoué</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                Commandes ({pagination.total} total{pagination.total > 1 ? 's' : ''})
                {pagination.total > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    - Page {pagination.page} sur {pagination.totalPages}
                  </span>
                )}
              </span>
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'all' ?
                    'Aucune commande ne correspond aux filtres appliqués.' :
                    'Vous n\'avez pas encore de commandes.'
                  }
                </p>
                {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setDateFilter('all');
                    }}
                    className="mt-4"
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header de la commande */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {order.orderNumber}
                              </h3>
                              {getStatusBadge(order.status, order.paymentStatus)}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatAmount(order.items?.[0]?.unitPrice || order.beneficeCommande || order.totalAmount / 100)}
                              </p>
                              {order.paymentStatus === 'FAILED' ? (
                                <p className="text-sm font-medium text-red-600">
                                  ❌ Paiement échoué
                                </p>
                              ) : order.commission_info?.vendor_amount ? (
                                <p className="text-sm font-medium text-blue-600">
                                  +{formatAmount(order.commission_info.vendor_amount)} (mes gains)
                                </p>
                              ) : null}
                              <p className="text-sm text-gray-500">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Informations client */}
                          {order.user && (
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>{order.user.username || order.user.email}</span>
                              </div>
                              {order.shippingAddress && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{order.shippingAddress}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Produits */}
                          {order.items && order.items.length > 0 && (
                            <div className="border-t pt-3">
                              <p className="text-sm text-gray-600 mb-2">
                                {order.items.length} produit(s):
                              </p>
                              <div className="space-y-1">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-900">
                                      {item.quantity}x {item.productName}
                                    </span>
                                    <span className="text-gray-600">
                                      {formatAmount(item.unitPrice || item.totalPrice)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="ml-6 flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Contrôles de pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-700">
                      Affichage {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                      {pagination.total} commande{pagination.total > 1 ? 's' : ''}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page - 1)}
                        disabled={pagination.page === 1 || loading}
                      >
                        Précédent
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const startPage = Math.max(1, pagination.page - 2);
                          const pageNumber = startPage + i;

                          if (pageNumber > pagination.totalPages) return null;

                          return (
                            <Button
                              key={pageNumber}
                              variant={pageNumber === pagination.page ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(pageNumber)}
                              disabled={loading}
                              className="min-w-[40px]"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages || loading}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorSales;
