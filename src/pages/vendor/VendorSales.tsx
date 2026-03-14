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
  MapPin,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ordersService, Order, OrderStatus } from '../../services/ordersService';
import { toast } from 'sonner';

// React Query Hooks pour les commandes vendeur
import {
  useMyOrders,
  useVendorFinances,
} from '../../hooks/vendor';

const VendorSales: React.FC = () => {
  const navigate = useNavigate();

  // 🔄 React Query Hooks - Gestion automatique du cache et des requêtes
  const ordersQuery = useMyOrders();
  const financesQuery = useVendorFinances();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL' | 'PAYMENT_FAILED'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // État pour toutes les commandes (non paginées)
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Pagination côté client - calculer les ordres à afficher
  const displayedOrders = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return allOrders.slice(startIndex, endIndex);
  }, [allOrders, pagination.page, pagination.limit]);

  // Synchroniser les données du cache avec l'état local
  useEffect(() => {
    if (ordersQuery.data) {
      // Filtrer les commandes selon les filtres
      let filteredOrders = ordersQuery.data.orders || [];

      // Filtrer par statut
      if (statusFilter === 'PAYMENT_FAILED') {
        filteredOrders = filteredOrders.filter(o => o.paymentStatus === 'FAILED');
      } else if (statusFilter !== 'ALL') {
        filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
      }

      // Filtrer par recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(o =>
          o.orderNumber?.toLowerCase().includes(term) ||
          o.user?.email?.toLowerCase().includes(term) ||
          o.user?.username?.toLowerCase().includes(term)
        );
      }

      // Filtrer par date
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          default:
            startDate = new Date(0);
        }

        filteredOrders = filteredOrders.filter(o =>
          new Date(o.createdAt) >= startDate
        );
      }

      setAllOrders(filteredOrders);

      // Pagination côté client
      const totalOrders = filteredOrders.length;
      const totalPages = Math.ceil(totalOrders / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total: totalOrders,
        totalPages
      }));
    }
  }, [ordersQuery.data, statusFilter, searchTerm, dateFilter]);

  // Statistiques depuis l'API
  const statistics = useMemo(() => {
    const stats = ordersQuery.data?.statistics;
    const finances = financesQuery.data;

    return {
      totalOrders: stats?.totalOrders ?? allOrders.length,
      totalRevenue: stats?.totalRevenue ?? 0,
      totalVendorEarnings: stats?.totalVendorAmount ?? finances?.availableAmount ?? 0,
      pendingOrders: stats?.pendingOrders ?? allOrders.filter(o => o.status === 'PENDING').length,
      processingOrders: stats?.processingOrders ?? allOrders.filter(o => o.status === 'PROCESSING').length,
      shippedOrders: stats?.shippedOrders ?? allOrders.filter(o => o.status === 'SHIPPED').length,
      deliveredOrders: stats?.deliveredOrders ?? allOrders.filter(o => o.status === 'DELIVERED').length,
      cancelledOrders: stats?.cancelledOrders ?? allOrders.filter(o => o.status === 'CANCELLED').length,
    };
  }, [ordersQuery.data, financesQuery.data, allOrders]);

  const isLoading = ordersQuery.isLoading;
  const isRefetching = ordersQuery.isRefetching;

  // Fonction pour tout rafraîchir
  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await ordersQuery.refetch();
      await financesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Changer de page
  const changePage = (newPage: number) => {
    const totalPages = Math.ceil(allOrders.length / pagination.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage, totalPages }));
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

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFilter('all');
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-6 py-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Suivi des Commandes
              </h1>
              <p className="text-gray-600 text-sm">
                Consultez et suivez la progression de toutes vos commandes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refetchAll}
                disabled={isLoading}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching || refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="px-6 pb-8 space-y-8">
          {/* Statistiques principales - 5 KPIs modernes */}
          <div className="grid gap-4 md:grid-cols-3">
            {isLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* 1. Total Commandes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Total Commandes</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics.totalOrders}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Toutes vos commandes
                    </div>
                  </div>
                </motion.div>

                {/* 2. Chiffre d'affaires */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Chiffre d'affaires</span>
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatAmount(statistics.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Revenu total (commandes payées)
                    </div>
                  </div>
                </motion.div>

                {/* 3. Mes Gains */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Mes Gains</span>
                      <div className="w-8 h-8 rounded-lg bg-[rgb(20,104,154)]/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-[rgb(20,104,154)]" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatAmount(statistics.totalVendorEarnings)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Gains après commission
                    </div>
                  </div>
                </motion.div>

                {/* 4. En attente */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">En attente</span>
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics.pendingOrders}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      En attente de confirmation
                    </div>
                  </div>
                </motion.div>

                {/* 5. Livrées */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Livrées</span>
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics.deliveredOrders}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Commandes terminées
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Filtres et recherche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
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
          </motion.div>

          {/* Liste des commandes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>
                    Commandes ({pagination.total} total{pagination.total > 1 ? 's' : ''})
                    {pagination.total > 0 && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        - Page {pagination.page} sur {pagination.totalPages}
                      </span>
                    )}
                  </span>
                  {isRefetching && <RefreshCw className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : displayedOrders.length === 0 ? (
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
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5 mt-4"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Réinitialiser les filtres</span>
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {displayedOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-[rgb(20,104,154)]/30 transition-all"
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
                                    <p className="text-sm font-medium text-[rgb(20,104,154)]">
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
                              <button
                                type="button"
                                onClick={() => viewOrderDetails(order.id)}
                                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Détails</span>
                              </button>
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
                          <button
                            type="button"
                            onClick={() => changePage(pagination.page - 1)}
                            disabled={pagination.page === 1 || isLoading}
                            className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-3 py-1.5 text-sm"
                          >
                            Précédent
                          </button>

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              const startPage = Math.max(1, pagination.page - 2);
                              const pageNumber = startPage + i;

                              if (pageNumber > pagination.totalPages) return null;

                              const isActivePage = pageNumber === pagination.page;

                              return (
                                <button
                                  key={pageNumber}
                                  type="button"
                                  onClick={() => changePage(pageNumber)}
                                  disabled={isLoading}
                                  className={isActivePage
                                    ? "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-sm min-w-[40px] bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white"
                                    : "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-3 py-1.5 text-sm min-w-[40px]"
                                  }
                                >
                                  {pageNumber}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => changePage(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages || isLoading}
                            className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-3 py-1.5 text-sm"
                          >
                            Suivant
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorSales;
