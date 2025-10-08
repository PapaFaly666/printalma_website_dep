import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin/orders-management.css';
import { useAuth } from '../../contexts/AuthContext';
import newOrderService from '../../services/newOrderService';
import { Order, OrderStatus, OrderStatistics, ShippingAddressObjectDto } from '../../types/order';
import { WebSocketService } from '../../services/websocketService';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye,
  Edit3,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Home,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  CreditCard,
  Bell,
  BellOff,
  MoreHorizontal,
  ExternalLink,
  Archive,
  Settings,
  Zap,
  Sparkles,
  Activity,
  ShoppingCart,
  TrendingUpIcon,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Dot
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import { Progress } from '../../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import NotificationCenter from '../../components/NotificationCenter';
import { getStatusColor, getStatusIcon, formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';

const OrdersManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États principaux
  const [orders, setOrders] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');
  
  // États de filtrage et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  // États pour la gestion des rafraîchissements
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  // ==========================================
  // ACTIONS DE BASE
  // ==========================================

  const viewOrderDetails = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // ==========================================
  // GESTION DES DONNÉES DE BASE
  // ==========================================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page: currentPage,
        limit: pageSize,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { orderNumber: searchTerm })
      };

      const result = await newOrderService.getAllOrders(filters);
      
      setOrders(result.orders);
      setTotalPages(result.totalPages);
      
      console.log('✅ Commandes chargées:', result.orders.length);
      
    } catch (error) {
      const errorMessage = newOrderService.handleError(error, 'chargement commandes');
      setError(errorMessage);
      console.error('❌ Erreur chargement commandes:', error);
      
      // Notification native du navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(errorMessage, {
          body: errorMessage,
          icon: '/favicon.ico',
          tag: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, searchTerm]);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await newOrderService.getStatistics();
      setStatistics(stats);
      console.log('📊 Statistiques chargées:', stats);
    } catch (error) {
      console.error('❌ Erreur statistiques:', error);
      // Notification native du navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Statistiques indisponibles', {
          body: 'Impossible de charger les statistiques',
          icon: '/favicon.ico',
          tag: 'warning'
        });
      }
    }
  }, []);

  // ==========================================
  // FONCTIONS AVANCÉES
  // ==========================================

  // Fonction de rafraîchissement avec débounce
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      const now = Date.now();
      if (now - lastRefreshTime > 2000) { // Minimum 2 secondes entre les rafraîchissements
        console.log('🔄 Rafraîchissement des commandes...');
        fetchOrders();
        setLastRefreshTime(now);
      }
    }, 1000); // Délai de 1 seconde
    
    setRefreshTimeout(newTimeout);
  }, [fetchOrders, lastRefreshTime, refreshTimeout]);

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await newOrderService.updateOrderStatus(orderId, newStatus);
      
      // Mettre à jour localement
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      // Notification native du navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Commande ${orderId} mise à jour vers ${newStatus}`, {
          body: `Commande ${orderId} mise à jour vers ${newStatus}`,
          icon: '/favicon.ico',
          tag: 'success'
        });
      }

      // Recharger les stats
      fetchStatistics();
      
    } catch (error) {
      const errorMessage = newOrderService.handleError(error, 'mise à jour statut');
      // Notification native du navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(errorMessage, {
          body: errorMessage,
          icon: '/favicon.ico',
          tag: 'error'
        });
      }
    }
  };

  // ==========================================
  // WEBSOCKET ET TEMPS RÉEL
  // ==========================================

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
      console.log('🔌 Connexion WebSocket admin...');
      
      const webSocketService = new WebSocketService();
      webSocketService.connectWebSocket();
      
      webSocketService.onNewOrder = (notification) => {
        console.log('🆕 Nouvelle commande reçue:', notification);
        console.log('🔍 Structure complète de la notification:', JSON.stringify(notification, null, 2));
        
        debouncedRefresh();
        fetchStatistics();
        
        const orderId = notification.data.orderId;
        console.log('🔍 ID extrait:', orderId);
        
        if (orderId && typeof orderId === 'number') {
          console.log('✅ ID trouvé, notification intelligente à implémenter si besoin');
          // Ici, on pourrait créer une notification plus riche avec les données de notification.data
        } else {
          console.log('❌ Pas d\'ID trouvé, stratégie alternative...');
          // ... (logique de fallback existante, peut être revue/supprimée si notification.data est fiable)
        }
      };

      webSocketService.onOrderStatusChanged = (data) => {
        console.log('📝 Statut commande changé:', data);
        
        if (data.data.orderId) {
          setOrders(prev => 
            prev.map(order => 
              order.id === data.data.orderId 
                ? { ...order, status: data.data.newStatus as OrderStatus }
                : order
            )
          );
          // Notification intelligente à implémenter si besoin
        } else {
          // ... (logique de fallback existante)
        }
        fetchStatistics();
      };

      return () => {
        webSocketService.disconnect();
      };
    }
  }, [user, debouncedRefresh, fetchStatistics]);

  // ==========================================
  // EFFETS
  // ==========================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // ==========================================
  // NETTOYAGE
  // ==========================================

  useEffect(() => {
    // Nettoyer le timeout au démontage
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout]);

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================

  // Export CSV (avec filtres status + période + recherche)
  const handleExportCSV = async () => {
    try {
      setExporting(true);

      // Déterminer période
      let startISO: string | undefined;
      let endISO: string | undefined;
      if (exportPeriod !== 'all') {
        const now = new Date();
        const nowISO = new Date(now).toISOString();
        let start: Date;
        if (exportPeriod === '24h') {
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (exportPeriod === '7d') {
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        startISO = start.toISOString();
        endISO = nowISO;
      }

      // Pagination API
      const pageSizeExport = 100; // respecter contraintes backend
      const maxPages = 100; // garde-fou
      let page = 1;
      const allRows: Order[] = [];

      // Construire les filtres de la requête
      const baseFilters: Record<string, any> = {
        page,
        limit: pageSizeExport,
      };
      if (statusFilter !== 'all') baseFilters.status = statusFilter;
      if (searchTerm) baseFilters.orderNumber = searchTerm;
      if (startISO) baseFilters.startDate = startISO;
      if (endISO) baseFilters.endDate = endISO;

      // Boucle jusqu'à épuisement des pages
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await newOrderService.getAllOrders({ ...baseFilters, page });
        if (Array.isArray(res.orders)) {
          allRows.push(...res.orders);
        }
        if (!res || !res.orders || res.orders.length < pageSizeExport || page >= maxPages) break;
        page += 1;
      }

      // Sécurité: filtre client par période + statut + recherche si nécessaire
      let filtered = [...allRows];
      if (statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === statusFilter);
      }
      if (searchTerm) {
        filtered = filtered.filter(o => String(o.orderNumber || '').includes(searchTerm));
      }
      if (startISO || endISO) {
        const startMs = startISO ? new Date(startISO).getTime() : undefined;
        const endMs = endISO ? new Date(endISO).getTime() : undefined;
        filtered = filtered.filter(o => {
          const t = new Date(o.createdAt).getTime();
          if (Number.isNaN(t)) return false;
          if (startMs && t < startMs) return false;
          if (endMs && t > endMs) return false;
          return true;
        });
      }

      // Génération CSV
      const headers = [
        'ID',
        'Numéro commande',
        'Client - Prénom',
        'Client - Nom',
        'Client - Email',
        'Vendeur',
        'Vendeur - Email',
        'Articles (nb)',
        'Statut',
        'Montant total',
        'Téléphone',
        'Adresse',
        'Créé le',
        'Mis à jour le'
      ];

      const escapeCell = (val: unknown) => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = filtered.map(o => {
        const itemsCount = Array.isArray(o.orderItems) ? o.orderItems.reduce((sum, it) => sum + (it.quantity || 0), 0) : 0;
        const address = (o as any).shippingAddress?.fullFormatted
          || (((o as any).shippingAddress?.street || '') + (((o as any).shippingAddress?.city) ? ', ' + (o as any).shippingAddress.city : ''))
          || '';
        return [
          o.id,
          o.orderNumber || '',
          o.user?.firstName || '',
          o.user?.lastName || '',
          o.user?.email || '',
          (o as any).vendor?.username || '',
          (o as any).vendor?.email || '',
          itemsCount,
          o.status,
          o.totalAmount,
          o.phoneNumber || '',
          address,
          o.createdAt,
          o.updatedAt
        ].map(escapeCell).join(',');
      });

      const csvContent = [headers.map(escapeCell).join(','), ...rows].join('\n');
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const periodLabel = exportPeriod === 'all' ? 'toutes_periodes' : exportPeriod;
      const statusLabel = statusFilter === 'all' ? 'tous_statuts' : statusFilter.toLowerCase();
      const link = document.createElement('a');
      link.href = url;
      link.download = `commandes_${statusLabel}_${periodLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erreur export commandes CSV:', e);
      alert('Erreur lors de l\'export CSV.');
    } finally {
      setExporting(false);
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Accès Refusé</CardTitle>
            <CardDescription>
              Vous devez être administrateur pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="w-full px-6 py-8">
          {/* Header Ultra-Moderne */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                      Commandes
            </h1>
                    <p className="text-slate-500 text-sm font-medium">
                      Tableau de bord • {orders.length} commande{orders.length > 1 ? 's' : ''} • Page {currentPage}/{totalPages}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications - REST et WebSocket */}
                <NotificationCenter />

                <Button onClick={debouncedRefresh} disabled={loading} variant="outline" className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>

                <div className="flex items-center gap-2">
                  <Select value={exportPeriod} onValueChange={(v) => setExportPeriod(v as 'all' | '24h' | '7d' | '30d')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Période export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes périodes</SelectItem>
                      <SelectItem value="24h">Dernières 24h</SelectItem>
                      <SelectItem value="7d">7 derniers jours</SelectItem>
                      <SelectItem value="30d">30 derniers jours</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="gap-2 bg-slate-900 hover:bg-slate-800" disabled={exporting} onClick={async () => { await handleExportCSV(); }}>
                    <Download className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
                    {exporting ? 'Export...' : 'Exporter'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques simplifiées */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500">Total Commandes</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">{statistics.totalOrders}</p>
                        <Badge variant="secondary" className="text-xs">
                          +{statistics.ordersCount.today}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">aujourd'hui</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500">Revenus</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(statistics.revenue.total)}</p>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-medium">+12%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{formatCurrency(statistics.revenue.monthly)} ce mois</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500">En attente</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">{statistics.ordersByStatus.pending}</p>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                          Urgent
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">à traiter</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500">Livrées</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900">{statistics.ordersByStatus.delivered}</p>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">98%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">taux de succès</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertes modernes */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Erreur de chargement</strong>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={debouncedRefresh}>
                    Réessayer
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Filtres modernes */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher commandes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-80"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmées</SelectItem>
                      <SelectItem value="PROCESSING">En traitement</SelectItem>
                      <SelectItem value="SHIPPED">Expédiées</SelectItem>
                      <SelectItem value="DELIVERED">Livrées</SelectItem>
                      <SelectItem value="CANCELLED">Annulées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={debouncedRefresh} className="gap-2 bg-slate-900 hover:bg-slate-800">
                  <Search className="h-4 w-4" />
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau ultra-moderne */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Commandes</CardTitle>
                    <CardDescription>Gestion et suivi en temps réel</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  {orders.length} total
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
                    <p className="text-slate-500 font-medium">Chargement des commandes...</p>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Package className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucune commande</h3>
                  <p className="text-sm text-center max-w-md">
                    Aucune commande ne correspond à vos critères de recherche. 
                    Essayez de modifier vos filtres.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-semibold text-slate-900">Commande</TableHead>
                        <TableHead className="font-semibold text-slate-900">Client</TableHead>
                        <TableHead className="font-semibold text-slate-900">Vendeur</TableHead>
                        <TableHead className="font-semibold text-slate-900">Articles</TableHead>
                        <TableHead className="font-semibold text-slate-900">Statut</TableHead>
                        <TableHead className="font-semibold text-slate-900">Montant</TableHead>
                        <TableHead className="font-semibold text-slate-900">Contact</TableHead>
                        <TableHead className="font-semibold text-slate-900">Date</TableHead>
                        <TableHead className="font-semibold text-slate-900 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, index) => (
                        <TableRow 
                          key={order.id} 
                          className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-slate-900 opacity-60"></div>
                              <div className="space-y-1">
                                <p className="font-mono text-sm font-semibold text-slate-900">
                                  #{order.orderNumber}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-slate-500">
                                    ID: {order.id}
                                  </p>
                                  {order.notes && (
                                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                      Note
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                                  {(order.user?.firstName?.[0] || '?').toUpperCase()}
                                  {(order.user?.lastName?.[0] || '').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">
                                  {order.user?.firstName || 'Client'}
                                  {order.user?.lastName || 'inconnu'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.user?.email || 'Email inconnu'}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {(order as any).vendor ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                    {(((order as any).vendor?.username?.[0]) || 'V').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">
                                    {(order as any).vendor?.username || 'Vendeur'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {(order as any).vendor?.email || 'Email inconnu'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">Pas de vendeur</span>
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3 text-slate-500" />
                                <span className="text-sm font-medium text-slate-900">
                                  {order.orderItems?.length || 0} article{(order.orderItems?.length || 0) > 1 ? 's' : ''}
                                </span>
                              </div>
                              {order.orderItems && order.orderItems.length > 0 && (
                                <div className="text-xs text-slate-500 max-w-32 truncate">
                                  {order.orderItems[0].product?.name}
                                  {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} autre${order.orderItems.length > 2 ? 's' : ''}`}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={`${getStatusColor(order.status)} border-0 font-medium`}>
                              <div className="flex items-center gap-1.5">
                                {getStatusIcon(order.status)}
                                {getStatusLabel(order.status)}
                              </div>
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-900">
                                {formatCurrency(order.totalAmount)}
                              </div>
                              {order.orderItems && order.orderItems.length > 0 && (
                                <div className="text-xs text-slate-500">
                                  Moy. {formatCurrency(order.totalAmount / order.orderItems.reduce((sum, item) => sum + item.quantity, 0))}/article
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1 max-w-40">
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{order.phoneNumber}</span>
                              </div>
                              <div className="flex items-start gap-1 text-xs text-slate-500">
                                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span className="truncate leading-tight">
                                  {(order.shippingAddress && order.shippingAddress.street) 
                                    ? `${order.shippingAddress.street}${order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}`
                                    : order.shippingAddress?.fullFormatted || 'Adresse non disponible'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="h-3 w-3" />
                                <span className="text-sm">
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2 justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewOrderDetails(order.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir les détails</TooltipContent>
                              </Tooltip>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => viewOrderDetails(order.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                                    disabled={order.status === 'CONFIRMED'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                                    disabled={order.status === 'SHIPPED' || order.status === 'DELIVERED'}
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Expédier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                    disabled={order.status === 'DELIVERED'}
                                  >
                                    <Home className="h-4 w-4 mr-2" />
                                    Livrer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                    className="text-red-600 focus:text-red-600"
                                    disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Annuler
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination ultra-moderne */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Page {currentPage} sur {totalPages}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{orders.length} commandes affichées</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-slate-900" : ""}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default OrdersManagement; 