import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  Settings,
  Users,
  Activity,
  Plus,
  Search,
  Filter,
  Package,
  CheckCircle,
  AlertCircle,
  Truck,
  TrendingUp,
  X
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Slider } from '../../components/ui/slider';

import ZoneManagementPanel from '../../components/admin/delivery/ZoneManagementPanel';
import DeliverySettingsSection from '../../components/admin/delivery/DeliverySettingsSection';
import TransporterManagementSection from '../../components/admin/delivery/TransporterManagementSection';
import DeliveryTrackingDashboard from '../../components/admin/delivery/DeliveryTrackingDashboard';
import ProductPreviewModal from '../../components/admin/delivery/ProductPreviewModal';

// Types
interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  price: number;
  estimatedTime: string;
  isActive: boolean;
  deliveryType: 'standard' | 'express' | 'scheduled';
}

interface DeliverySettings {
  cashOnDelivery: boolean;
  mobileMoneyOnDelivery: boolean;
  scheduledDelivery: boolean;
  transporterManagement: boolean;
  baseFee: number;
  expressFee: number;
  perDistanceFee: number;
}

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

const DeliveryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('zones');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // États pour les zones de livraison
  const [zones, setZones] = useState<DeliveryZone[]>([
    { id: '1', name: 'Dakar Centre', cities: ['Dakar', 'Plateau'], price: 1500, estimatedTime: '2-4h', isActive: true, deliveryType: 'standard' },
    { id: '2', name: 'Dakar Banlieue', cities: ['Pikine', 'Guédiawaye'], price: 2000, estimatedTime: '3-6h', isActive: true, deliveryType: 'standard' },
    { id: '3', name: 'Région de Thiès', cities: ['Thiès', 'Mbour'], price: 3000, estimatedTime: '6-12h', isActive: false, deliveryType: 'express' },
  ]);

  // États pour les paramètres de livraison
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    cashOnDelivery: true,
    mobileMoneyOnDelivery: true,
    scheduledDelivery: false,
    transporterManagement: false,
    baseFee: 1500,
    expressFee: 500,
    perDistanceFee: 100
  });

  // États pour les transporteurs
  const [transporters, setTransporters] = useState<Transporter[]>([
    { id: '1', name: 'Alpha Diallo', avatar: '', phone: '+221771234567', email: 'alpha@transport.sn', status: 'active', rating: 4.5, zones: ['1'], totalDeliveries: 156, avgDeliveryTime: '25 min', successRate: 98.5, joinedAt: '2023-01-15' },
    { id: '2', name: 'Fatou Sow', avatar: '', phone: '+221772345678', email: 'fatou@transport.sn', status: 'busy', rating: 4.8, zones: ['1', '2'], totalDeliveries: 203, avgDeliveryTime: '22 min', successRate: 99.2, joinedAt: '2023-02-20' },
    { id: '3', name: 'Mamadou Ba', avatar: '', phone: '+221773456789', email: 'mamadou@transport.sn', status: 'inactive', rating: 4.2, zones: ['2'], totalDeliveries: 89, avgDeliveryTime: '30 min', successRate: 95.8, joinedAt: '2023-03-10' },
  ]);

  const handleAddZone = () => {
    // Logique pour ajouter une nouvelle zone
    const newZone: DeliveryZone = {
      id: Date.now().toString(),
      name: 'Nouvelle Zone',
      cities: [],
      price: 0,
      estimatedTime: '2-4h',
      isActive: true,
      deliveryType: 'standard'
    };
    setZones([...zones, newZone]);
  };

  const handleUpdateZone = (updatedZone: DeliveryZone) => {
    setZones(zones.map(zone => zone.id === updatedZone.id ? updatedZone : zone));
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter(zone => zone.id !== zoneId));
  };

  const stats = {
    activeZones: zones.filter(z => z.isActive).length,
    totalTransporters: transporters.length,
    activeTransporters: transporters.filter(t => t.status === 'active').length,
    avgDeliveryTime: '25 min'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black rounded-2xl">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Delivery Management</h1>
                <p className="text-gray-500">Configurez et gérez tous les paramètres de livraison</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                <Activity className="w-4 h-4 mr-2" />
                Rapport
              </Button>
              <Button onClick={() => setProductModalOpen(true)} className="bg-black hover:bg-gray-800 text-white">
                <Package className="w-4 h-4 mr-2" />
                Test Livraison
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Zones Actives</p>
                  <p className="text-2xl font-bold text-black">{stats.activeZones}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Transporteurs</p>
                  <p className="text-2xl font-bold text-black">{stats.totalTransporters}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Disponibles</p>
                  <p className="text-2xl font-bold text-black">{stats.activeTransporters}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Temps Moyen</p>
                  <p className="text-2xl font-bold text-black">{stats.avgDeliveryTime}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-1 rounded-2xl">
            <TabsTrigger value="zones" className="data-[state=active]:bg-white rounded-xl data-[state=active]:shadow-sm">
              <MapPin className="w-4 h-4 mr-2" />
              Zones
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white rounded-xl data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="transporters" className="data-[state=active]:bg-white rounded-xl data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" />
              Transporteurs
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-white rounded-xl data-[state=active]:shadow-sm">
              <Activity className="w-4 h-4 mr-2" />
              Suivi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zones" className="space-y-6">
            <ZoneManagementPanel
              zones={zones}
              onUpdateZone={handleUpdateZone}
              onDeleteZone={handleDeleteZone}
              onAddZone={handleAddZone}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <DeliverySettingsSection
              settings={deliverySettings}
              onSettingsChange={setDeliverySettings}
            />
          </TabsContent>

          <TabsContent value="transporters" className="space-y-6">
            <TransporterManagementSection
              transporters={transporters}
              zones={zones}
              onTransportersChange={setTransporters}
              enabled={deliverySettings.transporterManagement}
            />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <DeliveryTrackingDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <Button
          onClick={handleAddZone}
          className="w-14 h-14 rounded-full bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Product Preview Modal */}
      <ProductPreviewModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
      />
    </div>
  );
};

export default DeliveryManagementPage;