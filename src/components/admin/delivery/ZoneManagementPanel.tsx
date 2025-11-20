import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  price: number;
  estimatedTime: string;
  isActive: boolean;
  deliveryType: 'standard' | 'express' | 'scheduled';
}

interface ZoneManagementPanelProps {
  zones: DeliveryZone[];
  onUpdateZone: (zone: DeliveryZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onAddZone: () => void;
}

const ZoneManagementPanel: React.FC<ZoneManagementPanelProps> = ({
  zones,
  onUpdateZone,
  onDeleteZone,
  onAddZone
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Extraire les villes uniques pour le filtre
  const allCities = Array.from(new Set(zones.flatMap(zone => zone.cities))).sort();

  // Filtrer et trier les zones
  const filteredZones = zones
    .filter(zone => {
      const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = filterCity === 'all' || zone.cities.includes(filterCity);
      const matchesStatus = filterStatus === 'all' ||
                           (filterStatus === 'active' && zone.isActive) ||
                           (filterStatus === 'inactive' && !zone.isActive);
      const matchesType = filterType === 'all' || zone.deliveryType === filterType;

      return matchesSearch && matchesCity && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'time':
          return a.estimatedTime.localeCompare(b.estimatedTime);
        default:
          return 0;
      }
    });

  const handleToggleZone = (zone: DeliveryZone) => {
    onUpdateZone({ ...zone, isActive: !zone.isActive });
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
  };

  const handleSaveZone = () => {
    if (editingZone) {
      onUpdateZone(editingZone);
      setEditingZone(null);
    }
  };

  const deliveryTypeColors = {
    standard: 'bg-gray-100 text-gray-700',
    express: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-purple-100 text-purple-700'
  };

  const deliveryTypeLabels = {
    standard: 'Standard',
    express: 'Express',
    scheduled: 'Programmé'
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une zone ou une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-200"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
            {showFilters && <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>

          <Button onClick={onAddZone} className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une Zone
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ville</label>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Toutes les villes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {allCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Statut</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="scheduled">Programmé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Trier par</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Nom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                    <SelectItem value="time">Temps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredZones.map((zone) => (
          <Card key={zone.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-black">{zone.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${deliveryTypeColors[zone.deliveryType]}`}>
                        {deliveryTypeLabels[zone.deliveryType]}
                      </Badge>
                      {zone.isActive ? (
                        <Badge className="text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Switch
                    checked={zone.isActive}
                    onCheckedChange={() => handleToggleZone(zone)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditZone(zone)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteZone(zone.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Villes couvertes</p>
                <div className="flex flex-wrap gap-1">
                  {zone.cities.map((city, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 rounded"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Tarif</p>
                    <p className="font-semibold text-black">{zone.price.toLocaleString()} FCFA</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Délai</p>
                    <p className="font-semibold text-black">{zone.estimatedTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Zone Dialog */}
      <Dialog open={!!editingZone} onOpenChange={() => setEditingZone(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la zone</DialogTitle>
          </DialogHeader>

          {editingZone && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nom de la zone</label>
                <Input
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Villes</label>
                <Input
                  value={editingZone.cities.join(', ')}
                  onChange={(e) => setEditingZone({
                    ...editingZone,
                    cities: e.target.value.split(',').map(city => city.trim()).filter(Boolean)
                  })}
                  className="border-gray-200"
                  placeholder="Séparez les villes par des virgules"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Prix (FCFA)</label>
                <Input
                  type="number"
                  value={editingZone.price}
                  onChange={(e) => setEditingZone({ ...editingZone, price: parseInt(e.target.value) || 0 })}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Temps de livraison</label>
                <Input
                  value={editingZone.estimatedTime}
                  onChange={(e) => setEditingZone({ ...editingZone, estimatedTime: e.target.value })}
                  className="border-gray-200"
                  placeholder="ex: 2-4h"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingZone(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveZone} className="bg-black hover:bg-gray-800 text-white">
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZoneManagementPanel;