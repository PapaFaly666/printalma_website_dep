import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Package,
  Truck,
  DollarSign,
  Search,
  TrendingUp,
  Loader2,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useToast } from '../../components/ui/use-toast';
import { formatPriceInFRF as formatPrice } from '../../utils/priceUtils';
import deliveryService, {
  type City,
  type Region,
  type InternationalZone,
  type CreateCityPayload,
  type CreateRegionPayload,
  type CreateInternationalZonePayload,
} from '../../services/deliveryService';
import { CityModal, RegionModal, ZoneModal } from '../../components/admin/DeliveryModals';

const ZonesLivraisonPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dakar-ville');

  // États de chargement
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États des données
  const [cities, setCities] = useState<City[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([]);

  // États des modaux - Villes
  const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
  const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityFormData, setCityFormData] = useState<CreateCityPayload>({
    name: '',
    category: 'Centre',
    zoneType: 'dakar-ville',
    status: 'active',
    price: 0,
    isFree: true,
    deliveryTimeMin: 24,
    deliveryTimeMax: 48,
    deliveryTimeUnit: 'heures',
  });

  // États des modaux - Régions
  const [isAddRegionModalOpen, setIsAddRegionModalOpen] = useState(false);
  const [isEditRegionModalOpen, setIsEditRegionModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionFormData, setRegionFormData] = useState<CreateRegionPayload>({
    name: '',
    status: 'active',
    price: 2000,
    deliveryTimeMin: 3,
    deliveryTimeMax: 5,
    deliveryTimeUnit: 'jours',
    mainCities: '',
  });

  // États des modaux - Zones Internationales
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<InternationalZone | null>(null);
  const [zoneFormData, setZoneFormData] = useState<CreateInternationalZonePayload>({
    name: '',
    countries: [],
    status: 'active',
    price: 15000,
    deliveryTimeMin: 7,
    deliveryTimeMax: 14,
  });
  const [countryInput, setCountryInput] = useState('');

  // État de recherche
  const [searchTerm, setSearchTerm] = useState('');

  // États de chargement pour les opérations de sauvegarde
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📦 [ZonesLivraison] Chargement des données...');

      const [citiesData, regionsData, zonesData] = await Promise.all([
        deliveryService.getCities(),
        deliveryService.getRegions(),
        deliveryService.getInternationalZones(),
      ]);

      setCities(citiesData);
      setRegions(regionsData);
      setInternationalZones(zonesData);

      console.log('✅ [ZonesLivraison] Données chargées:', {
        cities: citiesData.length,
        regions: regionsData.length,
        zones: zonesData.length,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur chargement:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les zones de livraison',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // GESTION DES VILLES (CITIES)
  // ========================================

  const handleAddCity = async () => {
    try {
      setIsSavingCity(true);
      console.log('➕ [ZonesLivraison] Ajout ville:', cityFormData);

      const newCity = await deliveryService.createCity(cityFormData);
      setCities(prev => [...prev, newCity]);

      toast({
        title: 'Succès',
        description: `Ville "${newCity.name}" ajoutée avec succès`,
      });

      setIsAddCityModalOpen(false);
      resetCityForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur ajout ville:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ajouter la ville',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleEditCity = async () => {
    if (!selectedCity) return;

    try {
      setIsSavingCity(true);
      console.log('✏️ [ZonesLivraison] Modification ville:', selectedCity.id, cityFormData);

      const updatedCity = await deliveryService.updateCity(selectedCity.id, cityFormData);
      setCities(prev => prev.map(c => c.id === selectedCity.id ? updatedCity : c));

      toast({
        title: 'Succès',
        description: `Ville "${updatedCity.name}" modifiée avec succès`,
      });

      setIsEditCityModalOpen(false);
      setSelectedCity(null);
      resetCityForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur modification ville:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier la ville',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleDeleteCity = async (city: City) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${city.name}" ?`)) return;

    try {
      console.log('🗑️ [ZonesLivraison] Suppression ville:', city.id);

      await deliveryService.deleteCity(city.id);
      setCities(prev => prev.filter(c => c.id !== city.id));

      toast({
        title: 'Succès',
        description: `Ville "${city.name}" supprimée avec succès`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur suppression ville:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de supprimer la ville',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCityStatus = async (city: City) => {
    try {
      console.log('🔄 [ZonesLivraison] Toggle statut ville:', city.id);

      const updatedCity = await deliveryService.toggleCityStatus(city.id);
      setCities(prev => prev.map(c => c.id === city.id ? updatedCity : c));

      toast({
        title: 'Succès',
        description: `Statut de "${city.name}" modifié`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur toggle statut ville:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const resetCityForm = () => {
    setCityFormData({
      name: '',
      category: 'Centre',
      zoneType: 'dakar-ville',
      status: 'active',
      price: 0,
      isFree: true,
      deliveryTimeMin: 24,
      deliveryTimeMax: 48,
      deliveryTimeUnit: 'heures',
    });
  };

  const openEditCityModal = (city: City) => {
    setSelectedCity(city);
    setCityFormData({
      name: city.name,
      category: city.category,
      zoneType: city.zoneType,
      status: city.status,
      price: parseFloat(city.price),
      isFree: city.isFree,
      deliveryTimeMin: city.deliveryTimeMin,
      deliveryTimeMax: city.deliveryTimeMax,
      deliveryTimeUnit: city.deliveryTimeUnit,
    });
    setIsEditCityModalOpen(true);
  };

  // ========================================
  // GESTION DES RÉGIONS
  // ========================================

  const handleAddRegion = async () => {
    try {
      setIsSavingRegion(true);
      console.log('➕ [ZonesLivraison] Ajout région:', regionFormData);

      const newRegion = await deliveryService.createRegion(regionFormData);
      setRegions(prev => [...prev, newRegion]);

      toast({
        title: 'Succès',
        description: `Région "${newRegion.name}" ajoutée avec succès`,
      });

      setIsAddRegionModalOpen(false);
      resetRegionForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur ajout région:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ajouter la région',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRegion(false);
    }
  };

  const handleEditRegion = async () => {
    if (!selectedRegion) return;

    try {
      setIsSavingRegion(true);
      console.log('✏️ [ZonesLivraison] Modification région:', selectedRegion.id, regionFormData);

      const updatedRegion = await deliveryService.updateRegion(selectedRegion.id, regionFormData);
      setRegions(prev => prev.map(r => r.id === selectedRegion.id ? updatedRegion : r));

      toast({
        title: 'Succès',
        description: `Région "${updatedRegion.name}" modifiée avec succès`,
      });

      setIsEditRegionModalOpen(false);
      setSelectedRegion(null);
      resetRegionForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur modification région:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier la région',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRegion(false);
    }
  };

  const handleDeleteRegion = async (region: Region) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${region.name}" ?`)) return;

    try {
      console.log('🗑️ [ZonesLivraison] Suppression région:', region.id);

      await deliveryService.deleteRegion(region.id);
      setRegions(prev => prev.filter(r => r.id !== region.id));

      toast({
        title: 'Succès',
        description: `Région "${region.name}" supprimée avec succès`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur suppression région:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de supprimer la région',
        variant: 'destructive',
      });
    }
  };

  const handleToggleRegionStatus = async (region: Region) => {
    try {
      console.log('🔄 [ZonesLivraison] Toggle statut région:', region.id);

      const updatedRegion = await deliveryService.toggleRegionStatus(region.id);
      setRegions(prev => prev.map(r => r.id === region.id ? updatedRegion : r));

      toast({
        title: 'Succès',
        description: `Statut de "${region.name}" modifié`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur toggle statut région:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const resetRegionForm = () => {
    setRegionFormData({
      name: '',
      status: 'active',
      price: 2000,
      deliveryTimeMin: 3,
      deliveryTimeMax: 5,
      deliveryTimeUnit: 'jours',
      mainCities: '',
    });
  };

  const openEditRegionModal = (region: Region) => {
    setSelectedRegion(region);
    setRegionFormData({
      name: region.name,
      status: region.status,
      price: parseFloat(region.price),
      deliveryTimeMin: region.deliveryTimeMin,
      deliveryTimeMax: region.deliveryTimeMax,
      deliveryTimeUnit: region.deliveryTimeUnit,
      mainCities: region.mainCities || '',
    });
    setIsEditRegionModalOpen(true);
  };

  // ========================================
  // GESTION DES ZONES INTERNATIONALES
  // ========================================

  const handleAddZone = async () => {
    try {
      setIsSavingZone(true);
      console.log('➕ [ZonesLivraison] Ajout zone internationale:', zoneFormData);

      const newZone = await deliveryService.createInternationalZone(zoneFormData);
      setInternationalZones(prev => [...prev, newZone]);

      toast({
        title: 'Succès',
        description: `Zone "${newZone.name}" ajoutée avec succès`,
      });

      setIsAddZoneModalOpen(false);
      resetZoneForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur ajout zone:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ajouter la zone',
        variant: 'destructive',
      });
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleEditZone = async () => {
    if (!selectedZone) return;

    try {
      setIsSavingZone(true);
      console.log('✏️ [ZonesLivraison] Modification zone:', selectedZone.id, zoneFormData);

      const updatedZone = await deliveryService.updateInternationalZone(selectedZone.id, zoneFormData);
      setInternationalZones(prev => prev.map(z => z.id === selectedZone.id ? updatedZone : z));

      toast({
        title: 'Succès',
        description: `Zone "${updatedZone.name}" modifiée avec succès`,
      });

      setIsEditZoneModalOpen(false);
      setSelectedZone(null);
      resetZoneForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur modification zone:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier la zone',
        variant: 'destructive',
      });
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleDeleteZone = async (zone: InternationalZone) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${zone.name}" ?`)) return;

    try {
      console.log('🗑️ [ZonesLivraison] Suppression zone:', zone.id);

      await deliveryService.deleteInternationalZone(zone.id);
      setInternationalZones(prev => prev.filter(z => z.id !== zone.id));

      toast({
        title: 'Succès',
        description: `Zone "${zone.name}" supprimée avec succès`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur suppression zone:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de supprimer la zone',
        variant: 'destructive',
      });
    }
  };

  const handleToggleZoneStatus = async (zone: InternationalZone) => {
    try {
      console.log('🔄 [ZonesLivraison] Toggle statut zone:', zone.id);

      const updatedZone = await deliveryService.toggleInternationalZoneStatus(zone.id);
      setInternationalZones(prev => prev.map(z => z.id === zone.id ? updatedZone : z));

      toast({
        title: 'Succès',
        description: `Statut de "${zone.name}" modifié`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur toggle statut zone:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const resetZoneForm = () => {
    setZoneFormData({
      name: '',
      countries: [],
      status: 'active',
      price: 15000,
      deliveryTimeMin: 7,
      deliveryTimeMax: 14,
    });
    setCountryInput('');
  };

  const openEditZoneModal = (zone: InternationalZone) => {
    setSelectedZone(zone);

    // Normaliser les pays en strings (gérer format objet ou string)
    const normalizedCountries = zone.countries.map(c =>
      typeof c === 'string' ? c : c.country
    );

    setZoneFormData({
      name: zone.name,
      countries: normalizedCountries,
      status: zone.status,
      price: parseFloat(zone.price),
      deliveryTimeMin: zone.deliveryTimeMin,
      deliveryTimeMax: zone.deliveryTimeMax,
    });
    setIsEditZoneModalOpen(true);
  };

  const addCountryToZone = () => {
    if (!countryInput.trim()) return;

    setZoneFormData(prev => ({
      ...prev,
      countries: [...prev.countries, countryInput.trim()]
    }));
    setCountryInput('');
  };

  const removeCountryFromZone = (country: string) => {
    setZoneFormData(prev => ({
      ...prev,
      countries: prev.countries.filter(c => c !== country)
    }));
  };

  // ========================================
  // FILTRAGE DES DONNÉES
  // ========================================

  const dakarVilleCities = cities.filter(c =>
    c.zoneType === 'dakar-ville' &&
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const banlieueCities = cities.filter(c =>
    c.zoneType === 'banlieue' &&
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRegions = regions.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredZones = internationalZones.filter(z =>
    z.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ========================================
  // STATISTIQUES
  // ========================================

  const stats = {
    totalCities: cities.length,
    activeCities: cities.filter(c => c.status === 'active').length,
    totalRegions: regions.length,
    activeRegions: regions.filter(r => r.status === 'active').length,
    totalZones: internationalZones.length,
    activeZones: internationalZones.filter(z => z.status === 'active').length,
  };

  // ========================================
  // RENDU
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Chargement des zones de livraison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadAllData}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zones de Livraison</h1>
          <p className="text-gray-600 mt-1">Gérez les villes, régions et zones internationales</p>
        </div>
        <Button onClick={loadAllData} variant="outline" size="sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Villes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCities}/{stats.totalCities}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Régions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRegions}/{stats.totalRegions}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Zones Intl.</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeZones}/{stats.totalZones}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dakar-ville">Dakar Ville ({dakarVilleCities.length})</TabsTrigger>
          <TabsTrigger value="banlieue">Banlieue ({banlieueCities.length})</TabsTrigger>
          <TabsTrigger value="regions">Régions ({filteredRegions.length})</TabsTrigger>
          <TabsTrigger value="international">International ({filteredZones.length})</TabsTrigger>
        </TabsList>

        {/* ========================================
            TAB: DAKAR VILLE
            ======================================== */}
        <TabsContent value="dakar-ville" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCityFormData(prev => ({ ...prev, zoneType: 'dakar-ville' }));
              setIsAddCityModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ville
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dakarVilleCities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Aucune ville trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  dakarVilleCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{city.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {city.isFree ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Gratuit
                          </Badge>
                        ) : (
                          <span className="font-semibold">{formatPrice(parseFloat(city.price))}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {city.deliveryTimeMin && city.deliveryTimeMax ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {city.deliveryTimeMin}-{city.deliveryTimeMax} {city.deliveryTimeUnit}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={city.status === 'active' ? 'default' : 'secondary'}>
                          {city.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Switch
                            checked={city.status === 'active'}
                            onCheckedChange={() => handleToggleCityStatus(city)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCityModal(city)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCity(city)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ========================================
            TAB: BANLIEUE
            ======================================== */}
        <TabsContent value="banlieue" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCityFormData(prev => ({ ...prev, zoneType: 'banlieue' }));
              setIsAddCityModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ville
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banlieueCities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Aucune ville trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  banlieueCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{city.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {city.isFree ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Gratuit
                          </Badge>
                        ) : (
                          <span className="font-semibold">{formatPrice(parseFloat(city.price))}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {city.deliveryTimeMin && city.deliveryTimeMax ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {city.deliveryTimeMin}-{city.deliveryTimeMax} {city.deliveryTimeUnit}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={city.status === 'active' ? 'default' : 'secondary'}>
                          {city.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Switch
                            checked={city.status === 'active'}
                            onCheckedChange={() => handleToggleCityStatus(city)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCityModal(city)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCity(city)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ========================================
            TAB: RÉGIONS
            ======================================== */}
        <TabsContent value="regions" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddRegionModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une région
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Principales villes</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Aucune région trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell>
                        {region.mainCities ? (
                          <span className="text-sm text-gray-600">{region.mainCities}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatPrice(parseFloat(region.price))}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {region.deliveryTimeMin}-{region.deliveryTimeMax} {region.deliveryTimeUnit}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={region.status === 'active' ? 'default' : 'secondary'}>
                          {region.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Switch
                            checked={region.status === 'active'}
                            onCheckedChange={() => handleToggleRegionStatus(region)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditRegionModal(region)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRegion(region)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ========================================
            TAB: INTERNATIONAL
            ======================================== */}
        <TabsContent value="international" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddZoneModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une zone
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la zone</TableHead>
                  <TableHead>Pays couverts</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Aucune zone trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {zone.countries.slice(0, 3).map((country, idx) => {
                            // Gérer à la fois le format objet {id, zoneId, country} et string
                            const countryName = typeof country === 'string' ? country : country.country;
                            return (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {countryName}
                              </Badge>
                            );
                          })}
                          {zone.countries.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{zone.countries.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatPrice(parseFloat(zone.price))}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {zone.deliveryTimeMin}-{zone.deliveryTimeMax} jours
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                          {zone.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Switch
                            checked={zone.status === 'active'}
                            onCheckedChange={() => handleToggleZoneStatus(zone)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditZoneModal(zone)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteZone(zone)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================
          MODAUX
          ======================================== */}

      {/* Modal Ville - Ajout */}
      <CityModal
        isOpen={isAddCityModalOpen}
        onClose={() => {
          setIsAddCityModalOpen(false);
          resetCityForm();
        }}
        onSave={handleAddCity}
        formData={cityFormData}
        setFormData={setCityFormData}
        isEdit={false}
        isSaving={isSavingCity}
        disableZoneTypeChange={true}
      />

      {/* Modal Ville - Édition */}
      <CityModal
        isOpen={isEditCityModalOpen}
        onClose={() => {
          setIsEditCityModalOpen(false);
          setSelectedCity(null);
          resetCityForm();
        }}
        onSave={handleEditCity}
        formData={cityFormData}
        setFormData={setCityFormData}
        isEdit={true}
        isSaving={isSavingCity}
        disableZoneTypeChange={true}
      />

      {/* Modal Région - Ajout */}
      <RegionModal
        isOpen={isAddRegionModalOpen}
        onClose={() => {
          setIsAddRegionModalOpen(false);
          resetRegionForm();
        }}
        onSave={handleAddRegion}
        formData={regionFormData}
        setFormData={setRegionFormData}
        isEdit={false}
        isSaving={isSavingRegion}
      />

      {/* Modal Région - Édition */}
      <RegionModal
        isOpen={isEditRegionModalOpen}
        onClose={() => {
          setIsEditRegionModalOpen(false);
          setSelectedRegion(null);
          resetRegionForm();
        }}
        onSave={handleEditRegion}
        formData={regionFormData}
        setFormData={setRegionFormData}
        isEdit={true}
        isSaving={isSavingRegion}
      />

      {/* Modal Zone Internationale - Ajout */}
      <ZoneModal
        isOpen={isAddZoneModalOpen}
        onClose={() => {
          setIsAddZoneModalOpen(false);
          resetZoneForm();
        }}
        onSave={handleAddZone}
        formData={zoneFormData}
        setFormData={setZoneFormData}
        countryInput={countryInput}
        setCountryInput={setCountryInput}
        onAddCountry={addCountryToZone}
        onRemoveCountry={removeCountryFromZone}
        isEdit={false}
        isSaving={isSavingZone}
      />

      {/* Modal Zone Internationale - Édition */}
      <ZoneModal
        isOpen={isEditZoneModalOpen}
        onClose={() => {
          setIsEditZoneModalOpen(false);
          setSelectedZone(null);
          resetZoneForm();
        }}
        onSave={handleEditZone}
        formData={zoneFormData}
        setFormData={setZoneFormData}
        countryInput={countryInput}
        setCountryInput={setCountryInput}
        onAddCountry={addCountryToZone}
        onRemoveCountry={removeCountryFromZone}
        isEdit={true}
        isSaving={isSavingZone}
      />
    </div>
  );
};

export default ZonesLivraisonPage;
