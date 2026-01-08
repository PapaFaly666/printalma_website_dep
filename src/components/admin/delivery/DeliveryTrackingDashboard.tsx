import React, { useState } from 'react';
import {
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Users,
  Activity,
  MoreVertical,
  Eye,
  Calendar,
  Navigation
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Progress } from '../../../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';

interface Delivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAvatar: string;
  transporterName: string;
  transporterAvatar: string;
  status: 'pending' | 'preparing' | 'on_way' | 'delivered' | 'delayed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: string;
  actualTime?: string;
  origin: string;
  destination: string;
  distance: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber: string;
}

const DeliveryTrackingDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  // Données simulées pour les livraisons
  const deliveries: Delivery[] = [
    {
      id: '1',
      orderNumber: 'CMD-2024-001',
      customerName: 'Awa Sow',
      customerAvatar: '',
      transporterName: 'Alpha Diallo',
      transporterAvatar: '',
      status: 'on_way',
      priority: 'high',
      estimatedTime: '25 min',
      origin: 'Plateau, Dakar',
      destination: 'Mermoz, Dakar',
      distance: '3.2 km',
      price: 1500,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:15:00Z',
      trackingNumber: 'DLV-001-ABCD'
    },
    {
      id: '2',
      orderNumber: 'CMD-2024-002',
      customerName: 'Mamadou Ba',
      customerAvatar: '',
      transporterName: 'Fatou Sow',
      transporterAvatar: '',
      status: 'delivered',
      priority: 'medium',
      estimatedTime: '45 min',
      actualTime: '38 min',
      origin: 'Pikine, Dakar',
      destination: 'Biscuiterie, Dakar',
      distance: '8.5 km',
      price: 2000,
      createdAt: '2024-01-15T09:15:00Z',
      updatedAt: '2024-01-15T10:38:00Z',
      trackingNumber: 'DLV-002-EFGH'
    },
    {
      id: '3',
      orderNumber: 'CMD-2024-003',
      customerName: 'Khady Ndiaye',
      customerAvatar: '',
      transporterName: 'Mamadou Ba',
      transporterAvatar: '',
      status: 'preparing',
      priority: 'low',
      estimatedTime: '30 min',
      origin: 'Guédiawaye, Dakar',
      destination: 'Almadies, Dakar',
      distance: '12.3 km',
      price: 2500,
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:20:00Z',
      trackingNumber: 'DLV-003-IJKL'
    },
    {
      id: '4',
      orderNumber: 'CMD-2024-004',
      customerName: 'Ibrahim Fall',
      customerAvatar: '',
      transporterName: 'Alpha Diallo',
      transporterAvatar: '',
      status: 'delayed',
      priority: 'urgent',
      estimatedTime: '20 min',
      origin: 'Thiaroye, Dakar',
      destination: 'Ouakam, Dakar',
      distance: '5.7 km',
      price: 1800,
      createdAt: '2024-01-15T08:45:00Z',
      updatedAt: '2024-01-15T09:30:00Z',
      trackingNumber: 'DLV-004-MNOP'
    },
    {
      id: '5',
      orderNumber: 'CMD-2024-005',
      customerName: 'Mariame Diop',
      customerAvatar: '',
      transporterName: '',
      transporterAvatar: '',
      status: 'pending',
      priority: 'medium',
      estimatedTime: '35 min',
      origin: 'Grand Yoff, Dakar',
      destination: 'Sacré-Cœur, Dakar',
      distance: '6.8 km',
      price: 1700,
      createdAt: '2024-01-15T11:45:00Z',
      updatedAt: '2024-01-15T11:45:00Z',
      trackingNumber: 'DLV-005-QRST'
    }
  ];

  // Filtrer et trier les livraisons
  const filteredDeliveries = deliveries
    .filter(delivery => {
      const matchesSearch = delivery.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || delivery.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'priority':
          return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
        case 'estimated_time':
          return parseInt(a.estimatedTime) - parseInt(b.estimatedTime);
        default:
          return 0;
      }
    });

  // Calculer les statistiques
  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    preparing: deliveries.filter(d => d.status === 'preparing').length,
    onWay: deliveries.filter(d => d.status === 'on_way').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    delayed: deliveries.filter(d => d.status === 'delayed').length,
    urgent: deliveries.filter(d => d.priority === 'urgent').length
  };

  const getPriorityOrder = (priority: string): number => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[priority as keyof typeof priorityOrder] || 0;
  };

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'on_way':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'delayed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: Delivery['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'on_way':
        return <Truck className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: Delivery['status']) => {
    switch (status) {
      case 'delivered':
        return 'Livrée';
      case 'on_way':
        return 'En cours';
      case 'preparing':
        return 'Préparation';
      case 'pending':
        return 'En attente';
      case 'delayed':
        return 'Retardée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: Delivery['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (priority: Delivery['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Basse';
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-black">{stats.total}</p>
              </div>
              <Package className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">En attente</p>
                <p className="text-lg font-bold text-gray-600">{stats.pending}</p>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Préparation</p>
                <p className="text-lg font-bold text-yellow-600">{stats.preparing}</p>
              </div>
              <Package className="w-4 h-4 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">En cours</p>
                <p className="text-lg font-bold text-blue-600">{stats.onWay}</p>
              </div>
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Livrées</p>
                <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Retardées</p>
                <p className="text-lg font-bold text-red-600">{stats.delayed}</p>
              </div>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Preview */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-gray-600" />
            Carte de suivi des livraisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
            <div className="text-center">
              <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-700 mb-1">Carte de suivi en temps réel</h4>
              <p className="text-sm text-gray-500">
                Cette fonctionnalité sera bientôt disponible avec l'intégration Google Maps
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Timeline */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-gray-600" />
            Timeline des livraisons du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveries.slice(0, 5).map((delivery, index) => (
              <div key={delivery.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    delivery.status === 'delivered' ? 'bg-green-500' :
                    delivery.status === 'on_way' ? 'bg-blue-500' :
                    delivery.status === 'delayed' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  {index < 4 && <div className="w-0.5 h-16 bg-gray-200 mt-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-black">{delivery.orderNumber}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(delivery.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {delivery.origin} → {delivery.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une livraison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="preparing">Préparation</SelectItem>
                <SelectItem value="on_way">En cours</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="delayed">Retardée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="priority">Priorité</SelectItem>
                <SelectItem value="estimated_time">Temps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <Card className="border-gray-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Commande</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Client</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Transporteur</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Statut</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Priorité</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Trajet</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Temps</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Prix</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-black">{delivery.orderNumber}</p>
                        <p className="text-xs text-gray-500">{delivery.trackingNumber}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={delivery.customerAvatar} alt={delivery.customerName} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {delivery.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">{delivery.customerName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {delivery.transporterName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={delivery.transporterAvatar} alt={delivery.transporterName} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {delivery.transporterName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900">{delivery.transporterName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={`border ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        <span className="ml-1">{getStatusLabel(delivery.status)}</span>
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={`${getPriorityColor(delivery.priority)}`}>
                        {getPriorityLabel(delivery.priority)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900">
                        <p>{delivery.origin}</p>
                        <p className="text-gray-500">→ {delivery.destination}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{delivery.estimatedTime}</p>
                        {delivery.actualTime && (
                          <p className="text-green-600">{delivery.actualTime}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-black">{delivery.price.toLocaleString()} FCFA</span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryTrackingDashboard;