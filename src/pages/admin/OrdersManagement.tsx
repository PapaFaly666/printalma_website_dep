import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin/orders-management.css';
import { useAuth } from '../../contexts/AuthContext';
import newOrderService from '../../services/newOrderService';
import { Order, OrderStatus, OrderStatistics, ShippingAddressObjectDto } from '../../types/order';

// Types basés sur la structure RÉELLE de l'API
interface PaymentInfo {
  status: string;
  status_text: string;
  status_icon: string;
  status_color: string;
  method: string;
  method_text: string;
  transaction_id?: string;
  attempts_count: number;
  last_attempt_at?: string;
}

interface PaymentError {
  reason: string;
  category: string;
  message: string;
  timestamp: string;
  attemptNumber: number;
}

// Type minimal pour customer_info (utilisé dans les fonctions)
interface CustomerInfo {
  full_name?: string;
  shipping_name?: string;
  user_firstname?: string;
  user_lastname?: string;
  email?: string;
  shipping_email?: string;
  user_email?: string;
  phone?: string;
  shipping_phone?: string;
  user_phone?: string;
  shipping_address?: any;
  notes?: string;
  user_role?: string;
}

import { WebSocketService } from '../../services/websocketService';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Home,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  MoreHorizontal,
  LayoutGrid,
  LayoutList,
  Zap,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import NotificationCenter from '../../components/NotificationCenter';
import { getStatusColor, getStatusIcon, formatCurrency, getStatusLabel } from '../../utils/orderUtils.tsx';
import { EnrichedOrderProductPreview } from '../../components/order/EnrichedOrderProductPreview';

// Import pour le drag-and-drop
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCorners,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Fonctions utilitaires pour le paiement
const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'PENDING': 'bg-amber-100 text-amber-800 border-amber-200',
    'PAID': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'FAILED': 'bg-red-100 text-red-800 border-red-200',
    'CANCELLED': 'bg-slate-100 text-slate-800 border-slate-200',
    'REFUNDED': 'bg-cyan-100 text-cyan-800 border-cyan-200'
  };
  return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
};

const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    'PAYDUNYA': 'PayDunya',
    'PAYTECH': 'PayTech',
    'CASH_ON_DELIVERY': 'Paiement à la livraison',
    'WAVE': 'Wave',
    'ORANGE_MONEY': 'Orange Money'
  };
  return methods[method] || method;
};

// Fonctions utilitaires basées sur la structure RÉELLE de l'API
const getCustomerDisplayName = (order: any): string => {
  if (order.shippingName) return order.shippingName;
  if (order.customer_info?.full_name) return order.customer_info.full_name;
  if (order.customer_info?.shipping_name) return order.customer_info.shipping_name;
  if (order.user?.firstName || order.user?.lastName) {
    return `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();
  }
  return 'Client inconnu';
};

const getCustomerEmail = (order: any): string => {
  if (order.email) return order.email;
  if (order.customer_info?.email) return order.customer_info.email;
  if (order.customer_info?.shipping_email) return order.customer_info.shipping_email;
  if (order.user?.email) return order.user.email;
  return 'Email non disponible';
};

const getCustomerPhone = (order: any): string => {
  if (order.phoneNumber) return order.phoneNumber;
  if (order.customer_info?.phone) return order.customer_info.phone;
  if (order.customer_info?.shipping_phone) return order.customer_info.shipping_phone;
  if (order.user?.phone) return order.user.phone;
  return 'Téléphone non disponible';
};

const getCustomerInitials = (order: any): string => {
  const name = getCustomerDisplayName(order);
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getFormattedShippingAddress = (order: any): string => {
  if (order.shippingAddressFull) return order.shippingAddressFull;

  const parts = [
    order.shippingStreet,
    order.shippingCity,
    order.shippingRegion,
    order.shippingPostalCode,
    order.shippingCountry
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(', ');
  return 'Adresse non disponible';
};

// Parser les erreurs de paiement depuis les notes
const parsePaymentError = (notes: string): PaymentError | null => {
  try {
    if (notes && notes.includes('💳 PAYMENT FAILED')) {
      const match = notes.match(/\{[^}]+\}/);
      if (match) return JSON.parse(match[0]);
    }
    return null;
  } catch {
    return null;
  }
};

// Formatter les dates importantes
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Type pour les vues
type ViewMode = 'table' | 'kanban';

// Configuration des colonnes Kanban
const KANBAN_COLUMNS: { id: OrderStatus; title: string; color: string; icon: any }[] = [
  { id: 'PENDING', title: 'En attente', color: 'bg-amber-50 border-amber-200', icon: Clock },
  { id: 'CONFIRMED', title: 'Confirmées', color: 'bg-blue-50 border-blue-200', icon: CheckCircle },
  { id: 'PROCESSING', title: 'En traitement', color: 'bg-purple-50 border-purple-200', icon: Package },
  { id: 'SHIPPED', title: 'Expédiées', color: 'bg-indigo-50 border-indigo-200', icon: Truck },
  { id: 'DELIVERED', title: 'Livrées', color: 'bg-emerald-50 border-emerald-200', icon: Home },
  { id: 'CANCELLED', title: 'Annulées', color: 'bg-red-50 border-red-200', icon: XCircle },
];

// Composant pour une carte de commande dans le Kanban
interface KanbanCardProps {
  order: Order;
  onView: (orderId: number) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order, onView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `order-${order.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border-2 ${
        isDragging ? 'border-slate-400 shadow-2xl rotate-3 scale-105' : 'border-slate-200 shadow-sm hover:shadow-lg'
      } p-3 mb-2 transition-all cursor-grab active:cursor-grabbing group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-900 to-slate-600"></div>
          <span className="font-mono text-xs font-bold text-slate-900">
            #{order.orderNumber}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onView(order.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-9 w-9 border-2 border-slate-100">
          <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-xs font-bold">
            {getCustomerInitials(order)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">
            {getCustomerDisplayName(order)}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {getCustomerEmail(order)}
          </p>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="space-y-2 mb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Montant
          </span>
          <span className="font-bold text-slate-900">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Package className="h-3 w-3" />
            Articles
          </span>
          <span className="font-semibold text-slate-900">
            {(order as any).itemsCount || order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
          </span>
        </div>
      </div>

      {/* Aperçu des produits avec designs */}
      {order.orderItems && order.orderItems.length > 0 && (
        <div className="space-y-2 mb-2">
          <div className="text-xs text-slate-500 font-medium">Produits:</div>
          <div className="grid grid-cols-1 gap-2">
            {order.orderItems.slice(0, 2).map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-2 p-1 bg-slate-50 rounded">
                {/* Mini aperçu du produit avec design selon la documentation API */}
                <div className="w-10 h-10 bg-white rounded border border-slate-200 flex-shrink-0 overflow-hidden relative">
                  {(item.adminProduct || item.product) && (
                    <>
                      {/* Image du produit selon la structure enrichie */}
                      <img
                        src={
                          // Priorité 1: images.primaryImageUrl (données enrichies)
                          item.images?.primaryImageUrl ||
                          // Priorité 2: adminProduct.colorVariations[0].images[0].url
                          item.adminProduct?.colorVariations?.[0]?.images?.[0]?.url ||
                          // Priorité 3: product.imageUrl (ancienne structure)
                          item.product?.imageUrl ||
                          // Fallback: image par défaut
                          '/api/placeholder/40/40'
                        }
                        alt={
                          item.adminProduct?.name ||
                          item.product?.name ||
                          'Produit'
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/40/40';
                        }}
                      />

                      {/* Overlay du design selon designApplication */}
                      {item.designApplication?.hasDesign && item.designApplication.designUrl && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <img
                            src={item.designApplication.designUrl}
                            alt="Design personnalisé"
                            className="w-6 h-6 object-contain mix-blend-multiply"
                            style={{
                              transform: `translate(-50%, -50%) scale(${item.designApplication.scale || 0.6})`,
                              left: '50%',
                              top: '50%',
                              filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.3))'
                            }}
                          />
                        </div>
                      )}

                      {/* Badge design si présent */}
                      {item.designApplication?.hasDesign && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-bl px-1">
                          🎨
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Détails du produit selon la documentation API */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-900 truncate">
                    {/* Priorité au nom du adminProduct (produit enrichi) */}
                    {item.adminProduct?.name ||
                     item.product?.name ||
                     `Produit ${index + 1}`}

                    {/* Indicateur vendeur si disponible */}
                    {item.vendor?.shop_name && (
                      <span className="text-xs text-blue-600 font-normal ml-1">
                        ({item.vendor.shop_name})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {/* Taille */}
                    {item.size && (
                      <span className="bg-white px-1 py-0.5 rounded text-slate-600">
                        {item.size}
                      </span>
                    )}

                    {/* Couleur - Priorité aux données enrichies */}
                    {(item.color ||
                      (item.adminProduct?.colorVariations?.find(cv => cv.id === item.colorId)?.name) ||
                      (item.designDelimitations?.[0]?.colorName)
                    ) && (
                      <span className="bg-white px-1 py-0.5 rounded text-slate-600 flex items-center gap-1">
                        {/* Swatch de couleur si disponible */}
                        {(item.adminProduct?.colorVariations?.find(cv => cv.id === item.colorId)?.colorCode ||
                          item.designDelimitations?.[0]?.colorCode) && (
                          <span
                            className="w-2 h-2 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: item.adminProduct?.colorVariations?.find(cv => cv.id === item.colorId)?.colorCode ||
                                          item.designDelimitations?.[0]?.colorCode || '#ccc'
                            }}
                          />
                        )}
                        {item.color ||
                         item.adminProduct?.colorVariations?.find(cv => cv.id === item.colorId)?.name ||
                         item.designDelimitations?.[0]?.colorName}
                      </span>
                    )}

                    {/* Quantité */}
                    <span className="text-slate-400">
                      x{item.quantity || 1}
                    </span>

                    {/* Indicateur de design */}
                    {item.designApplication?.hasDesign && (
                      <span className="text-xs text-purple-600 font-medium">
                        🎨
                      </span>
                    )}
                  </div>

                  {/* Prix unitaire et informations supplémentaires */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>Prix unitaire:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(item.unitPrice || 0)}
                    </span>

                    {/* Indicateur de prix suggéré si différent */}
                    {item.adminProduct?.price &&
                     item.adminProduct.price !== item.unitPrice && (
                      <span className="text-xs text-green-600">
                        (Vendeur: {formatCurrency(item.adminProduct.price)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 flex-shrink-0 text-right">
                  <div>{formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}</div>
                  {item.quantity > 1 && (
                    <div className="text-xs text-slate-500 font-normal">
                      ({item.quantity} × {formatCurrency(item.unitPrice || 0)})
                    </div>
                  )}
                </div>
              </div>
            ))}

            {order.orderItems.length > 2 && (
              <div className="text-xs text-slate-500 italic text-center py-1">
                +{order.orderItems.length - 2} autre{order.orderItems.length - 2 > 1 ? 's' : ''} produit{order.orderItems.length - 2 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <Badge className={`${getPaymentStatusColor((order as any).payment_info?.status || 'PENDING')} text-xs border-2 font-semibold px-2 py-0.5`}>
          {(order as any).payment_info?.status_text || 'En attente'}
        </Badge>
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  );
};

// Composant pour une colonne Kanban avec Droppable
interface KanbanColumnProps {
  column: typeof KANBAN_COLUMNS[0];
  orders: Order[];
  onView: (orderId: number) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, orders, onView }) => {
  const Icon = column.icon;
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div
        className={`${column.color} rounded-xl border-2 ${
          isOver ? 'border-slate-400 bg-slate-100 scale-102' : ''
        } p-4 flex flex-col transition-all duration-200`}
        style={{ minHeight: '600px', maxHeight: '80vh' }}
      >
        {/* Header de la colonne style Trello */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-xl ${column.color.replace('bg-', 'bg-gradient-to-br from-').replace('-50', '-200').replace('border-', 'to-')} shadow-md flex items-center justify-center border-2 border-white`}>
              <Icon className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{column.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono font-bold text-sm px-3 py-1 bg-white border-2 border-slate-200">
            {orders.length}
          </Badge>
        </div>

        {/* Zone de drop avec scroll */}
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto space-y-2 pr-2 ${
            isOver ? 'bg-blue-50 rounded-lg p-2' : ''
          } transition-colors duration-200`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          <SortableContext items={orders.map(o => `order-${o.id}`)} strategy={verticalListSortingStrategy}>
            {orders.map((order) => (
              <KanbanCard key={order.id} order={order} onView={onView} />
            ))}
          </SortableContext>

          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white/50 rounded-lg border-2 border-dashed border-slate-200">
              <Package className="h-16 w-16 mb-3 opacity-20" />
              <p className="text-sm font-medium">Aucune commande</p>
              <p className="text-xs mt-1">Glissez une commande ici</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

  // États pour la vue
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // États pour le drag-and-drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

  const extractVendorNameFromNotes = (notes?: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/Produit vendeur:\s*(.+?)\s*\(ID:/i);
    return match ? match[1].trim() : null;
  };

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    const newTimeout = setTimeout(() => {
      const now = Date.now();
      if (now - lastRefreshTime > 2000) {
        console.log('🔄 Rafraîchissement des commandes...');
        fetchOrders();
        setLastRefreshTime(now);
      }
    }, 1000);

    setRefreshTimeout(newTimeout);
  }, [fetchOrders, lastRefreshTime, refreshTimeout]);

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await newOrderService.updateOrderStatus(orderId, newStatus);

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Commande ${orderId} mise à jour vers ${newStatus}`, {
          body: `Commande ${orderId} mise à jour vers ${newStatus}`,
          icon: '/favicon.ico',
          tag: 'success'
        });
      }

      fetchStatistics();

    } catch (error) {
      const errorMessage = newOrderService.handleError(error, 'mise à jour statut');
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
  // DRAG AND DROP HANDLERS
  // ==========================================

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Si on survole une colonne (statut)
    if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      return;
    }

    // Si on survole une autre carte
    const activeOrderId = parseInt(activeId.replace('order-', ''));
    const overOrderId = parseInt(overId.replace('order-', ''));

    const activeOrder = orders.find(o => o.id === activeOrderId);
    const overOrder = orders.find(o => o.id === overOrderId);

    if (!activeOrder || !overOrder) return;

    // Si les deux cartes sont dans des colonnes différentes, déplacer immédiatement
    if (activeOrder.status !== overOrder.status) {
      setOrders(prev => {
        const activeIndex = prev.findIndex(o => o.id === activeOrderId);
        const overIndex = prev.findIndex(o => o.id === overOrderId);

        const newOrders = [...prev];
        newOrders[activeIndex] = { ...newOrders[activeIndex], status: overOrder.status };

        // Réorganiser l'ordre
        const [removed] = newOrders.splice(activeIndex, 1);
        newOrders.splice(overIndex, 0, removed);

        return newOrders;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Extraire l'ID de la commande
    const orderIdMatch = activeId.match(/order-(\d+)/);
    if (!orderIdMatch) return;

    const orderId = parseInt(orderIdMatch[1]);
    const draggedOrder = orders.find(o => o.id === orderId);

    if (!draggedOrder) return;

    // Déterminer le nouveau statut
    let newStatus: OrderStatus | null = null;

    // Si on drop sur une colonne directement
    if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      newStatus = overId as OrderStatus;
    } else {
      // Si on drop sur une carte, prendre le statut de cette carte
      const overOrderId = parseInt(overId.replace('order-', ''));
      const overOrder = orders.find(o => o.id === overOrderId);
      if (overOrder) {
        newStatus = overOrder.status;
      }
    }

    // Si le statut a changé, mettre à jour via l'API
    if (newStatus && draggedOrder.status !== newStatus) {
      updateOrderStatus(orderId, newStatus);
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
        debouncedRefresh();
        fetchStatistics();
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

  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout]);

  // ==========================================
  // EXPORT CSV
  // ==========================================

  const handleExportCSV = async () => {
    try {
      setExporting(true);

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

      const pageSizeExport = 100;
      const maxPages = 100;
      let page = 1;
      const allRows: Order[] = [];

      const baseFilters: Record<string, any> = {
        page,
        limit: pageSizeExport,
      };
      if (statusFilter !== 'all') baseFilters.status = statusFilter;
      if (searchTerm) baseFilters.orderNumber = searchTerm;
      if (startISO) baseFilters.startDate = startISO;
      if (endISO) baseFilters.endDate = endISO;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await newOrderService.getAllOrders({ ...baseFilters, page });
        if (Array.isArray(res.orders)) {
          allRows.push(...res.orders);
        }
        if (!res || !res.orders || res.orders.length < pageSizeExport || page >= maxPages) break;
        page += 1;
      }

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

      const headers = [
        'ID',
        'Numéro commande',
        'Client - Nom complet',
        'Client - Email',
        'Client - Téléphone',
        'Client - Rôle',
        'Articles (nb)',
        'Statut commande',
        'Statut paiement',
        'Méthode paiement',
        'ID Transaction',
        'Montant total',
        'Adresse complète',
        'Code Postal',
        'Ville',
        'Pays',
        'Infos complémentaires',
        'Notes client',
        'Créé le',
        'Mis à jour le',
        'Livraison estimée'
      ];

      const escapeCell = (val: unknown) => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = filtered.map(o => {
        const itemsCount = (o as any).itemsCount || (Array.isArray(o.orderItems) ? o.orderItems.reduce((sum, it) => sum + (it.quantity || 0), 0) : 0);
        const customerInfo = (o as any).customer_info as CustomerInfo;
        const shippingAddress = customerInfo?.shipping_address;

        return [
          o.id,
          o.orderNumber || '',
          getCustomerDisplayName(o),
          getCustomerEmail(o),
          getCustomerPhone(o),
          customerInfo?.user_role || '',
          itemsCount,
          o.status || '',
          (o as any).payment_info?.status_text || (o as any).paymentStatus || '',
          formatPaymentMethod((o as any).payment_info?.method || (o as any).paymentMethod || ''),
          (o as any).payment_info?.transaction_id || (o as any).transactionId || '',
          o.totalAmount || 0,
          getFormattedShippingAddress(o),
          shippingAddress?.postal_code || '',
          shippingAddress?.city || '',
          shippingAddress?.country || '',
          shippingAddress?.additional_info || '',
          customerInfo?.notes || '',
          o.createdAt || '',
          o.updatedAt || '',
          (o as any).estimatedDelivery || ''
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

  // ==========================================
  // GROUPER LES COMMANDES PAR STATUT (KANBAN)
  // ==========================================

  const ordersByStatus = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.id] = orders.filter(order => order.status === column.id);
    return acc;
  }, {} as Record<OrderStatus, Order[]>);

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================

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
          {/* Header Ultra-Moderne avec Gradient */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center shadow-lg">
                      <Package className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Gestion des Commandes
                    </h1>
                    <p className="text-slate-500 text-base font-medium mt-1">
                      Tableau de bord • {orders.length} commande{orders.length > 1 ? 's' : ''} • Page {currentPage}/{totalPages}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Vue Switcher */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={`gap-2 ${viewMode === 'table' ? 'bg-slate-900 text-white' : ''}`}
                  >
                    <LayoutList className="h-4 w-4" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className={`gap-2 ${viewMode === 'kanban' ? 'bg-slate-900 text-white' : ''}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </Button>
                </div>

                <NotificationCenter />

                <Button onClick={debouncedRefresh} disabled={loading} variant="outline" className="gap-2 hover:bg-slate-50">
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
                  <Button className="gap-2 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 shadow-lg" disabled={exporting} onClick={handleExportCSV}>
                    <Download className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
                    {exporting ? 'Export...' : 'Exporter'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques Améliorées avec Animations */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Total Commandes */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Total Commandes
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                          {statistics.totalOrders}
                        </p>
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          +{statistics.ordersCount?.today || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">aujourd'hui</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenus */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-emerald-200">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Revenus
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                          {formatCurrency(statistics.revenue?.total || 0)}
                        </p>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-medium">+12%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{formatCurrency(statistics.revenue?.monthly || 0)} ce mois</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* En attente */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-amber-200">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        En attente
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold bg-gradient-to-br from-amber-600 to-amber-400 bg-clip-text text-transparent">
                          {statistics.ordersByStatus?.pending || 0}
                        </p>
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                          Urgent
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">à traiter</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payées */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payées
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent">
                          {(statistics as any)?.paidOrders || 0}
                        </p>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs font-medium">OK</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">paiement validé</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Livrées */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-200">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Livrées
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                          {statistics.ordersByStatus?.delivered || 0}
                        </p>
                        <div className="flex items-center gap-1 text-indigo-600">
                          <Home className="h-3 w-3" />
                          <span className="text-xs font-medium">OK</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">finalisées</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Home className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertes modernes */}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-gradient-to-r from-red-50 to-transparent">
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

          {/* Filtres améliorés */}
          <Card className="mb-8 border-2 border-slate-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher par numéro..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-80 border-slate-200 focus:border-slate-400"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                    <SelectTrigger className="w-full sm:w-48 border-slate-200">
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

          {/* Vue Table ou Kanban */}
          {viewMode === 'table' ? (
            /* VUE TABLE */
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg">
                      <LayoutList className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Vue Tableau</CardTitle>
                      <CardDescription>Gestion détaillée des commandes</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-base px-4 py-2">
                    {orders.length} total
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
                      <p className="text-slate-500 font-medium text-lg">Chargement des commandes...</p>
                    </div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                    <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Package className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-600 mb-2">Aucune commande</h3>
                    <p className="text-sm text-center max-w-md">
                      Aucune commande ne correspond à vos critères de recherche.
                      Essayez de modifier vos filtres.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50 border-b-2 border-slate-200">
                          <TableHead className="font-semibold text-slate-900">Commande</TableHead>
                          <TableHead className="font-semibold text-slate-900">Client</TableHead>
                          <TableHead className="font-semibold text-slate-900">Articles</TableHead>
                          <TableHead className="font-semibold text-slate-900">Paiement</TableHead>
                          <TableHead className="font-semibold text-slate-900">Statut</TableHead>
                          <TableHead className="font-semibold text-slate-900">Montant</TableHead>
                          <TableHead className="font-semibold text-slate-900">Contact</TableHead>
                          <TableHead className="font-semibold text-slate-900">Livraison</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow
                            key={order.id}
                            className="group hover:bg-slate-50/80 transition-all border-b border-slate-100 cursor-pointer"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-slate-900 opacity-60"></div>
                                <div className="space-y-1">
                                  <p className="font-mono text-sm font-semibold text-slate-900">
                                    #{order.orderNumber}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border-2 border-slate-200">
                                  <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-xs font-bold">
                                    {getCustomerInitials(order)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-slate-900 text-sm truncate">
                                    {getCustomerDisplayName(order)}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate max-w-40">
                                    {getCustomerEmail(order)}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-3">
                                {/* Product Preview */}
                                {order.orderItems && order.orderItems.length > 0 && (() => {
                                  const firstItem = order.orderItems[0];
                                  const enriched = firstItem.enrichedVendorProduct;

                                  // Extract mockup URL
                                  let mockupUrl = firstItem.mockupUrl;
                                  if (!mockupUrl && enriched?.images?.primaryImageUrl) {
                                    mockupUrl = enriched.images.primaryImageUrl;
                                  }
                                  if (!mockupUrl && firstItem.product?.imageUrl) {
                                    mockupUrl = firstItem.product.imageUrl;
                                  }

                                  // Extract design URL
                                  const hasDesign = enriched?.designApplication?.hasDesign || false;
                                  let designUrl: string | null = null;
                                  if (hasDesign && enriched?.designApplication?.designUrl) {
                                    designUrl = enriched.designApplication.designUrl;
                                  }

                                  // Extract design position
                                  let designPosition = firstItem.savedDesignPosition || undefined;
                                  if (!designPosition && enriched?.designPositions && enriched.designPositions.length > 0) {
                                    const pos = enriched.designPositions[0].position;
                                    designPosition = {
                                      x: pos.x,
                                      y: pos.y,
                                      scale: pos.scale,
                                      rotation: pos.rotation || 0
                                    };
                                  }

                                  // Extract delimitation
                                  let delimitation = firstItem.delimitation || null;
                                  if (!delimitation && enriched?.designDelimitations && enriched.designDelimitations.length > 0) {
                                    const delim = enriched.designDelimitations[0];
                                    if (delim.delimitations && delim.delimitations.length > 0) {
                                      const firstDelim = delim.delimitations[0];
                                      delimitation = {
                                        x: firstDelim.x,
                                        y: firstDelim.y,
                                        width: firstDelim.width,
                                        height: firstDelim.height,
                                        coordinateType: firstDelim.coordinateType || 'PERCENTAGE'
                                      };
                                    }
                                  }

                                  return (
                                    <EnrichedOrderProductPreview
                                      product={{
                                        id: firstItem.productId || firstItem.id,
                                        name: firstItem.product?.name || enriched?.vendorName || 'Produit',
                                        quantity: firstItem.quantity,
                                        unitPrice: firstItem.unitPrice || 0,
                                        colorName: firstItem.colorVariation?.name || firstItem.color,
                                        colorCode: firstItem.colorVariation?.colorCode,
                                        size: firstItem.size,
                                        mockupImageUrl: mockupUrl,
                                        designImageUrl: hasDesign ? designUrl : null,
                                        designPosition: designPosition,
                                        delimitation: delimitation || undefined,
                                        vendorProductId: firstItem.vendorProductId || enriched?.id
                                      }}
                                      className="w-12 h-12 flex-shrink-0"
                                    />
                                  );
                                })()}

                                {/* Article count */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-900">
                                      {(order as any).itemsCount || order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} article{((order as any).itemsCount || order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0) > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <Badge className={`${getPaymentStatusColor((order as any).payment_info?.status || 'PENDING')} text-xs border font-medium`}>
                                  <span className="mr-1">
                                    {(order as any).payment_info?.status_icon || '⏳'}
                                  </span>
                                  {(order as any).payment_info?.status_text || 'En attente'}
                                </Badge>
                                <div className="text-xs text-slate-500">
                                  {formatPaymentMethod((order as any).payment_info?.method || order.paymentMethod || 'Non spécifié')}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge className={`${getStatusColor(order.status)} border-0 font-semibold px-3 py-1.5`}>
                                <div className="flex items-center gap-1.5">
                                  {getStatusIcon(order.status)}
                                  {getStatusLabel(order.status)}
                                </div>
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="font-bold text-slate-900 text-base">
                                {formatCurrency(order.totalAmount)}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1 max-w-48">
                                <div className="flex items-center gap-1 text-xs text-slate-600">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate font-medium">
                                    {getCustomerPhone(order)}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1 text-xs text-slate-500">
                                  <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span className="truncate leading-tight">
                                    {getFormattedShippingAddress(order)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Calendar className="h-3 w-3" />
                                  <div>
                                    <span className="text-sm font-medium">
                                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2 justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => viewOrderDetails(order.id)}
                                      className="h-9 w-9 p-0 hover:bg-slate-900 hover:text-white transition-colors"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir les détails</TooltipContent>
                                </Tooltip>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-slate-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
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
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
          ) : (
            /* VUE KANBAN */
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg">
                        <LayoutGrid className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Vue Kanban</CardTitle>
                        <CardDescription>Glissez-déposez pour changer les statuts</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-base px-4 py-2">
                      {orders.length} total
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                  {loading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
                        <p className="text-slate-500 font-medium text-lg">Chargement des commandes...</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex gap-6 overflow-x-auto pb-4 px-2"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#94a3b8 #e2e8f0'
                      }}
                    >
                      {KANBAN_COLUMNS.map((column) => (
                        <KanbanColumn
                          key={column.id}
                          column={column}
                          orders={ordersByStatus[column.id] || []}
                          onView={viewOrderDetails}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <DragOverlay>
                {activeId ? (
                  <div className="rotate-6 scale-105">
                    {(() => {
                      const orderIdMatch = activeId.match(/order-(\d+)/);
                      if (!orderIdMatch) return null;
                      const orderId = parseInt(orderIdMatch[1]);
                      const order = orders.find(o => o.id === orderId);
                      if (!order) return null;
                      return <KanbanCard order={order} onView={viewOrderDetails} />;
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* Pagination ultra-moderne */}
          {viewMode === 'table' && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">Page {currentPage} sur {totalPages}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{orders.length} commandes affichées</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="hover:bg-slate-900 hover:text-white transition-colors"
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
                      className={currentPage === page ? "bg-slate-900 hover:bg-slate-800" : "hover:bg-slate-100"}
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
                  className="hover:bg-slate-900 hover:text-white transition-colors"
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
