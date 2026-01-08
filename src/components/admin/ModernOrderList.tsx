import React, { useState, useEffect, useCallback } from 'react';
import { Order, AdminOrderFilters, OrderResponse } from '../../types/order';
import { NewOrderService } from '../../services/newOrderService';
import { useAuth } from '../../contexts/AuthContext';
import WebSocketService from '../../services/websocketService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import {
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ModernOrderListProps {
  onSelectOrder?: (order: Order) => void;
  selectedOrderId?: number;
}

export const ModernOrderList = ({ onSelectOrder, selectedOrderId }: ModernOrderListProps) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [newOrdersAvailable, setNewOrdersAvailable] = useState(0);
  const [filters, setFilters] = useState<AdminOrderFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // ✅ Utiliser le vrai service
  const orderService = new NewOrderService();

  const fetchOrders = async () => {
    setLoading(true);
    setNewOrdersAvailable(0); // Reset le compteur quand on actualise
    try {
      console.log('🔄 Fetching REAL orders with filters:', filters);
      
      const response = await orderService.getAllOrders(filters);
      console.log('✅ REAL Orders response:', response);
      
      // ✅ Gestion robuste de la réponse
      if (response && typeof response === 'object') {
        setOrders(response.orders || []);
        
        // Assurer que pagination a toutes les propriétés requises
        const paginationData = {
          page: response.page || filters.page || 1,
          totalPages: response.totalPages || 1,
          total: response.total || 0,
          totalItems: response.total || 0,
          limit: response.limit || filters.limit || 10
        };
        
        setPagination(paginationData);
        console.log('📊 Pagination set:', paginationData);
      } else {
        console.warn('⚠️ Format de réponse inattendu:', response);
        setOrders([]);
        setPagination({
          page: 1,
          totalPages: 1,
          total: 0,
          totalItems: 0,
          limit: 10
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des vraies commandes:', error);
      setOrders([]);
      setPagination({
        page: 1,
        totalPages: 1,
        total: 0,
        totalItems: 0,
        limit: 10
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GESTION TEMPS RÉEL WEBSOCKET - VRAIES DONNÉES
  // ==========================================

  const handleNewOrder = useCallback((notification: any) => {
    console.log('🆕 VRAIE nouvelle commande reçue pour la table:', notification);
    
    // Si on est sur la première page et qu'on n'a pas de filtres spécifiques,
    // ajouter la nouvelle commande en haut de la liste
    if (filters.page === 1 && !filters.status && !filters.userEmail && !filters.orderNumber) {
      const newOrderRaw = notification.data;
      if (newOrderRaw) {
        // ✅ Les données viennent directement du backend, structure déjà correcte
        const newOrder = {
          ...newOrderRaw,
          id: newOrderRaw.id || Date.now() + Math.random(), // ✅ Backup au cas où
          status: newOrderRaw.status || 'PENDING', // ✅ Backup au cas où
        };

        setOrders(prevOrders => {
          // ✅ Vérifier si la commande n'existe pas déjà (par ID et par orderNumber)
          const existsById = prevOrders.some(order => order.id === newOrder.id);
          const existsByNumber = prevOrders.some(order => order.orderNumber === newOrder.orderNumber);
          
          if (!existsById && !existsByNumber) {
            console.log('➕ Ajout de la VRAIE nouvelle commande à la table:', newOrder.orderNumber);
            // Ajouter en haut et limiter au nombre d'éléments par page
            return [newOrder, ...prevOrders.slice(0, (filters.limit || 10) - 1)];
          } else {
            console.log('⚠️ Commande déjà existante, ignorée:', newOrder.orderNumber);
            return prevOrders;
          }
        });
        
        // Mettre à jour le compteur total
        setPagination(prev => ({
          ...prev,
          total: (prev.total || 0) + 1,
          totalItems: (prev.totalItems || 0) + 1
        }));
      }
    } else {
      // Si on n'est pas sur la première page ou qu'on a des filtres,
      // incrémenter le compteur de nouvelles commandes disponibles
      setNewOrdersAvailable(prev => prev + 1);
      console.log('📢 Nouvelle VRAIE commande disponible (actualiser pour voir)');
    }
  }, [filters]);

  const handleOrderStatusChanged = useCallback((notification: any) => {
    console.log('📝 VRAI changement de statut reçu pour la table:', notification);
    
    const { orderId, newStatus } = notification.data || {};
    if (orderId && newStatus) {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      console.log(`✅ Statut mis à jour pour la VRAIE commande ${orderId}: ${newStatus}`);
    }
  }, []);

  // Inscription aux événements WebSocket
  useEffect(() => {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) return;

    console.log('🔌 Inscription aux événements WebSocket pour la table des commandes');
    
    // S'abonner aux événements WebSocket
    WebSocketService.onNewOrder(handleNewOrder as any);
    WebSocketService.onOrderStatusChanged(handleOrderStatusChanged as any);

    // Note: Pas de cleanup nécessaire car on utilise le singleton WebSocketService
    // qui gère ses propres listeners
  }, [handleNewOrder, handleOrderStatusChanged, user?.role]);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const getStatusIcon = (status: string) => {
    // ✅ Protection contre les valeurs undefined/null
    const safeStatus = status?.toLowerCase() || 'pending';
    
    switch (safeStatus) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    // ✅ Protection contre les valeurs undefined/null
    const safeStatus = status?.toLowerCase() || 'pending';
    
    switch (safeStatus) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus as any, `Statut mis à jour vers ${newStatus} par l'admin`);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));
    } catch (error: any) {
      const errorMessage = orderService.handleError(error, 'la mise à jour');
      console.error(errorMessage);
    }
  };

  return (
    <Card className="modern-card fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Commandes
              {newOrdersAvailable > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  +{newOrdersAvailable} nouvelle{newOrdersAvailable > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Gérez toutes les commandes de la plateforme
              {newOrdersAvailable > 0 && (
                <span className="text-blue-600 ml-2">
                  • {newOrdersAvailable} nouvelle{newOrdersAvailable > 1 ? 's' : ''} commande{newOrdersAvailable > 1 ? 's' : ''} disponible{newOrdersAvailable > 1 ? 's' : ''}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {newOrdersAvailable > 0 && (
              <Button 
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                }}
                variant="default"
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Package className="h-4 w-4" />
                Voir les nouvelles ({newOrdersAvailable})
              </Button>
            )}
            <Button 
              onClick={fetchOrders} 
              disabled={loading}
              variant="outline" 
              size="sm"
              className="gap-2 action-button"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'loading-spinner' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtres */}
        <div className="filters-section">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium text-gray-700">Filtres</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 filters-grid">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs text-gray-600">Statut</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  status: value === 'all' ? undefined : value as any, 
                  page: 1 
                })}
              >
                <SelectTrigger className="filter-input">
                  <SelectValue placeholder="Tous les statuts" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail" className="text-xs text-gray-600">Email client</Label>
              <Input
                id="userEmail"
                type="email"
                value={filters.userEmail || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  userEmail: e.target.value || undefined, 
                  page: 1 
                })}
                placeholder="client@example.com"
                className="h-9 filter-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNumber" className="text-xs text-gray-600">Numéro de commande</Label>
              <Input
                id="orderNumber"
                value={filters.orderNumber || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  orderNumber: e.target.value || undefined, 
                  page: 1 
                })}
                placeholder="CMD-20250101-0001"
                className="h-9 filter-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit" className="text-xs text-gray-600">Par page</Label>
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  limit: parseInt(value), 
                  page: 1 
                })}
              >
                <SelectTrigger className="filter-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table des commandes */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded skeleton" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px] skeleton" />
                  <Skeleton className="h-4 w-[200px] skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-state-icon" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-500 mb-4">
              Aucune commande ne correspond aux critères de recherche.
            </p>
            <Button variant="outline" onClick={fetchOrders} className="action-button">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        ) : (
          <>
            <div className="modern-table rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="w-[100px] table-cell">Numéro</TableHead>
                    <TableHead className="table-cell">Client</TableHead>
                    <TableHead className="table-cell">Date</TableHead>
                    <TableHead className="table-cell">Statut</TableHead>
                    <TableHead className="text-right table-cell">Total</TableHead>
                    <TableHead className="w-[100px] table-cell">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow 
                      key={order.id}
                      className={`order-row cursor-pointer hover:bg-gray-50 ${
                        selectedOrderId === order.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onSelectOrder?.(order)}
                    >
                      <TableCell className="font-medium table-cell">
                        #{order.orderNumber}
                      </TableCell>
                      <TableCell className="table-cell">
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.user?.firstName} {order.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 table-cell">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge 
                          variant={getStatusVariant(order.status)}
                          className="status-badge gap-1"
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium table-cell">
                        {order.totalAmount?.toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="table-cell">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder?.(order);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Affichage de {((pagination.page || 1) - 1) * (pagination.limit || 10) + 1} à{' '}
                  {Math.min((pagination.page || 1) * (pagination.limit || 10), pagination.totalItems || 0)} sur{' '}
                  {pagination.totalItems || 0} résultats
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(pagination.page || 1) <= 1}
                    onClick={() => setFilters({ ...filters, page: (pagination.page || 1) - 1 })}
                    className="pagination-button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page || 1} sur {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                    onClick={() => setFilters({ ...filters, page: (pagination.page || 1) + 1 })}
                    className="pagination-button"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}; 