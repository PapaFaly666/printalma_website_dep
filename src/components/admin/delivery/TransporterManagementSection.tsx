import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  UserPlus,
  Settings,
  Trash2,
  TrendingUp,
  Activity,
  Filter
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Progress } from '../../../components/ui/progress';

interface Transporter {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'busy';
  rating: number;
  zones: string[];
  totalDeliveries: number;
  avgDeliveryTime: string;
  successRate: number;
  joinedAt: string;
}

interface DeliveryZone {
  id: string;
  name: string;
}

interface TransporterManagementSectionProps {
  transporters: Transporter[];
  zones: DeliveryZone[];
  onTransportersChange: (transporters: Transporter[]) => void;
  enabled: boolean;
}

const TransporterManagementSection: React.FC<TransporterManagementSectionProps> = ({
  transporters,
  zones,
  onTransportersChange,
  enabled
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);

  if (!enabled) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des transporteurs désactivée</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Activez la gestion des transporteurs dans les paramètres pour pouvoir ajouter,
          gérer et suivre les performances de vos livreurs.
        </p>
        <Button variant="outline" className="border-gray-200">
          <Settings className="w-4 h-4 mr-2" />
          Activer dans les paramètres
        </Button>
      </div>
    );
  }

  // Calculer les statistiques
  const stats = {
    total: transporters.length,
    active: transporters.filter(t => t.status === 'active').length,
    busy: transporters.filter(t => t.status === 'busy').length,
    inactive: transporters.filter(t => t.status === 'inactive').length,
    avgRating: transporters.length > 0
      ? (transporters.reduce((sum, t) => sum + t.rating, 0) / transporters.length).toFixed(1)
      : '0',
    totalDeliveries: transporters.reduce((sum, t) => sum + t.totalDeliveries, 0)
  };

  // Filtrer et trier les transporteurs
  const filteredTransporters = transporters
    .filter(transporter => {
      const matchesSearch = transporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transporter.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || transporter.status === filterStatus;
      const matchesZone = filterZone === 'all' || transporter.zones.includes(filterZone);

      return matchesSearch && matchesStatus && matchesZone;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'deliveries':
          return b.totalDeliveries - a.totalDeliveries;
        default:
          return 0;
      }
    });

  const handleStatusToggle = (transporterId: string, newStatus: Transporter['status']) => {
    const updatedTransporters = transporters.map(t =>
      t.id === transporterId ? { ...t, status: newStatus } : t
    );
    onTransportersChange(updatedTransporters);
  };

  const handleDeleteTransporter = (transporterId: string) => {
    const updatedTransporters = transporters.filter(t => t.id !== transporterId);
    onTransportersChange(updatedTransporters);
  };

  const getStatusColor = (status: Transporter['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'busy':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: Transporter['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3" />;
      case 'busy':
        return <AlertCircle className="w-3 h-3" />;
      case 'inactive':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: Transporter['status']) => {
    switch (status) {
      case 'active':
        return 'Disponible';
      case 'busy':
        return 'Occupé';
      case 'inactive':
        return 'Inactif';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-black">{stats.total}</p>
              </div>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Disponibles</p>
                <p className="text-xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Occupés</p>
                <p className="text-xl font-bold text-yellow-600">{stats.busy}</p>
              </div>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Note moyenne</p>
                <p className="text-xl font-bold text-black">{stats.avgRating} ⭐</p>
              </div>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Livraisons</p>
                <p className="text-xl font-bold text-black">{stats.totalDeliveries}</p>
              </div>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un transporteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filtrer:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Disponibles</SelectItem>
                <SelectItem value="busy">Occupés</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes zones</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="rating">Note</SelectItem>
                <SelectItem value="deliveries">Livraisons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setShowAddModal(true)} className="bg-black hover:bg-gray-800 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter Transporteur
          </Button>
        </div>
      </div>

      {/* Transporters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTransporters.map((transporter) => (
          <Card key={transporter.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={transporter.avatar} alt={transporter.name} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                      {transporter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-semibold text-black">{transporter.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${getStatusColor(transporter.status)}`}>
                        {getStatusIcon(transporter.status)}
                        <span className="ml-1">{getStatusLabel(transporter.status)}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{transporter.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusToggle(transporter.id, 'active')}>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Marquer disponible
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusToggle(transporter.id, 'busy')}>
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                      Marquer occupé
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusToggle(transporter.id, 'inactive')}>
                      <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                      Désactiver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteTransporter(transporter.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Temps moyen: {transporter.avgDeliveryTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>Livraisons: {transporter.totalDeliveries}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Taux de réussite: {transporter.successRate}%</span>
                </div>
              </div>

              {/* Success Rate Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Performance</span>
                  <span className="font-medium text-black">{transporter.successRate}%</span>
                </div>
                <Progress value={transporter.successRate} className="h-2" />
              </div>

              {/* Zones */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Zones couvertes</p>
                <div className="flex flex-wrap gap-1">
                  {transporter.zones.map((zoneId) => {
                    const zone = zones.find(z => z.id === zoneId);
                    return zone ? (
                      <Badge key={zoneId} variant="outline" className="text-xs border-gray-200">
                        {zone.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Contact info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>{transporter.email}</p>
                <p>{transporter.phone}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Transporter Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">Ajouter un transporteur</h3>
            <p className="text-gray-500 mb-6">
              Cette fonctionnalité sera bientôt disponible. Pour l'instant, ajoutez les transporteurs
              directement depuis la base de données ou contactez l'administrateur système.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button onClick={() => setShowAddModal(false)} className="bg-black hover:bg-gray-800 text-white">
                Compris
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransporterManagementSection;