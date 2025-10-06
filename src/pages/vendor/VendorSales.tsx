import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  Clock,
  DollarSign,
  User,
  Phone,
  MapPin,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { Order, OrderStatus, OrderStatistics } from '../../types/order';
import { useNavigate } from 'react-router-dom';
import { vendorOrderService, VendorOrderStatistics, VendorOrderFilters } from '../../services/vendorOrderService';


const VendorSales: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statistics, setStatistics] = useState<VendorOrderStatistics>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    revenueThisMonth: 0,
    ordersThisMonth: 0,
    revenueLastMonth: 0,
    ordersLastMonth: 0
  });

  // État pour les métadonnées de pagination
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrevious: false
  });

  // Charger les données depuis le backend
  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des commandes vendeur depuis le backend...');

      // Construire les filtres pour l'API
      const filters: VendorOrderFilters = {
        page: pagination.page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as OrderStatus : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
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

      // Appel au service API
      const response = await vendorOrderService.getVendorOrders(filters);

      console.log('✅ Commandes récupérées:', response);

      setOrders(response.orders);
      setFilteredOrders(response.orders);

      // Mettre à jour les métadonnées de pagination
      setPagination({
        page: response.page,
        totalPages: response.totalPages,
        total: response.total,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious
      });

      // Charger les statistiques en parallèle
      loadStatistics();

    } catch (error) {
      console.log('⚠️ Commandes non disponibles depuis le backend, utilisation des données mock');

      // En cas d'erreur, on garde les données existantes ou on affiche un état vide
      // Le service gère déjà le fallback vers les données mock en mode développement
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques séparément
  const loadStatistics = async () => {
    try {
      console.log('📊 Chargement des statistiques vendeur...');
      const stats = await vendorOrderService.getVendorOrderStatistics();

      console.log('✅ Statistiques récupérées:', stats);
      setStatistics(stats);

    } catch (error) {
      console.log('⚠️ Statistiques non disponibles depuis le backend, utilisation des données locales');

      // En cas d'erreur (backend pas disponible), calculer les statistiques localement
      if (orders.length > 0) {
        const localStats = vendorOrderService.calculateLocalStatistics(orders);
        setStatistics(localStats);
      } else {
        // Statistiques par défaut pour la démo quand aucune commande n'est disponible
        setStatistics({
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          monthlyGrowth: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0
        });
      }
    }
  };

  // Effet pour charger les données au montage et quand les filtres changent
  useEffect(() => {
    loadOrders();
  }, [pagination.page, statusFilter, dateFilter]);

  // Effet séparé pour la recherche avec debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadOrders();
      }
    }, 500); // Attendre 500ms après la dernière frappe

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fonction pour changer de page
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Fonction pour rafraîchir les données
  const refreshData = () => {
    loadOrders();
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
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  {loading ? '' : `Commandes ce mois: ${statistics.ordersThisMonth ?? 0}`}
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
                  {loading ? '' : `CA ce mois: ${formatAmount(statistics.revenueThisMonth ?? 0)}`}
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
            transition={{ delay: 0.4 }}
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                  <SelectItem value="PROCESSING">En traitement</SelectItem>
                  <SelectItem value="SHIPPED">Expédiée</SelectItem>
                  <SelectItem value="DELIVERED">Livrée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
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
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ?
                    'Aucune commande ne correspond aux filtres appliqués.' :
                    'Vous n\'avez pas encore de commandes.'
                  }
                </p>
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
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
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatAmount(order.totalAmount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Informations client */}
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{order.user.firstName} {order.user.lastName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{order.phoneNumber}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{order.shippingAddress.city}, {order.shippingAddress.region}</span>
                          </div>
                        </div>

                        {/* Produits */}
                        <div className="border-t pt-3">
                          <p className="text-sm text-gray-600 mb-2">
                            {order.orderItems.length} produit(s):
                          </p>
                          <div className="space-y-1">
                            {order.orderItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-900">
                                  {item.quantity}x {item.productName}
                                </span>
                                <span className="text-gray-600">
                                  {formatAmount(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
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

                        {/* Actions en lecture seule uniquement */}
                        {order.trackingNumber && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (order.trackingNumber) {
                                navigator.clipboard.writeText(order.trackingNumber);
                                // Vous pourriez ajouter un toast ici
                              }
                            }}
                            title="Copier le numéro de suivi"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                </div>

                {/* Contrôles de pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-700">
                      Affichage {((pagination.page - 1) * 10) + 1} à{' '}
                      {Math.min(pagination.page * 10, pagination.total)} sur{' '}
                      {pagination.total} commande{pagination.total > 1 ? 's' : ''}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page - 1)}
                        disabled={!pagination.hasPrevious || loading}
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
                        disabled={!pagination.hasNext || loading}
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