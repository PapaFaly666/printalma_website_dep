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
import Button from '../../components/ui/Button';
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
  type Transporteur,
  type ZoneTarif,
  type CreateCityPayload,
  type CreateRegionPayload,
  type CreateInternationalZonePayload,
  type CreateTransporteurPayload,
  type CreateZoneTarifPayload,
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
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [zoneTarifs, setZoneTarifs] = useState<ZoneTarif[]>([]);

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
    price: 0, // Prix défini par transporteur dans l'onglet Tarifs
    deliveryTimeMin: 7,
    deliveryTimeMax: 14,
  });
  const [countryInput, setCountryInput] = useState('');

  // États des modaux - Transporteurs
  const [isAddTransporteurModalOpen, setIsAddTransporteurModalOpen] = useState(false);
  const [isEditTransporteurModalOpen, setIsEditTransporteurModalOpen] = useState(false);
  const [selectedTransporteur, setSelectedTransporteur] = useState<Transporteur | null>(null);
  const [transporteurFormData, setTransporteurFormData] = useState<CreateTransporteurPayload>({
    name: '',
    logoUrl: '',
    deliveryZones: [],
    status: 'active',
  });

  // États des modaux - Tarifs de Zones
  const [isAddTarifModalOpen, setIsAddTarifModalOpen] = useState(false);
  const [isEditTarifModalOpen, setIsEditTarifModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState<ZoneTarif | null>(null);
  const [tarifFormData, setTarifFormData] = useState<CreateZoneTarifPayload>({
    zoneId: '',
    zoneName: '',
    transporteurId: '',
    transporteurName: '',
    prixTransporteur: 0,
    prixStandardInternational: 0,
    delaiLivraisonMin: 1,
    delaiLivraisonMax: 3,
    status: 'active',
  });

  // État de recherche
  const [searchTerm, setSearchTerm] = useState('');

  // États de chargement pour les opérations de sauvegarde
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);
  const [isSavingTransporteur, setIsSavingTransporteur] = useState(false);
  const [isSavingTarif, setIsSavingTarif] = useState(false);

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

      const [citiesData, regionsData, zonesData, transporteursData, tarifsData] = await Promise.all([
        deliveryService.getCities(),
        deliveryService.getRegions(),
        deliveryService.getInternationalZones(),
        deliveryService.getTransporteurs(),
        deliveryService.getZoneTarifs(),
      ]);

      setCities(citiesData);
      setRegions(regionsData);
      setInternationalZones(zonesData);
      setTransporteurs(transporteursData);
      setZoneTarifs(tarifsData);

      console.log('✅ [ZonesLivraison] Données chargées:', {
        cities: citiesData.length,
        regions: regionsData.length,
        zones: zonesData.length,
        transporteurs: transporteursData.length,
        tarifs: tarifsData.length,
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
      deliveryTimeUnit: region.deliveryTimeUnit as 'heures' | 'jours',
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
      price: 0, // Prix défini par transporteur dans l'onglet Tarifs
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
  // GESTION DES TRANSPORTEURS
  // ========================================

  const handleAddTransporteur = async () => {
    try {
      setIsSavingTransporteur(true);
      console.log('➕ [ZonesLivraison] Ajout transporteur:', transporteurFormData);

      const newTransporteur = await deliveryService.createTransporteur(transporteurFormData);
      setTransporteurs(prev => [...prev, newTransporteur]);

      toast({
        title: 'Succès',
        description: `Transporteur "${newTransporteur.name}" ajouté avec succès`,
      });

      setIsAddTransporteurModalOpen(false);
      resetTransporteurForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur ajout transporteur:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ajouter le transporteur',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTransporteur(false);
    }
  };

  const handleEditTransporteur = async () => {
    if (!selectedTransporteur) return;

    try {
      setIsSavingTransporteur(true);
      console.log('✏️ [ZonesLivraison] Modification transporteur:', selectedTransporteur.id, transporteurFormData);

      const updatedTransporteur = await deliveryService.updateTransporteur(selectedTransporteur.id, transporteurFormData);
      setTransporteurs(prev => prev.map(t => t.id === selectedTransporteur.id ? updatedTransporteur : t));

      toast({
        title: 'Succès',
        description: `Transporteur "${updatedTransporteur.name}" modifié avec succès`,
      });

      setIsEditTransporteurModalOpen(false);
      setSelectedTransporteur(null);
      resetTransporteurForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur modification transporteur:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le transporteur',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTransporteur(false);
    }
  };

  const handleDeleteTransporteur = async (transporteur: Transporteur) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${transporteur.name}" ?`)) return;

    try {
      console.log('🗑️ [ZonesLivraison] Suppression transporteur:', transporteur.id);

      await deliveryService.deleteTransporteur(transporteur.id);
      setTransporteurs(prev => prev.filter(t => t.id !== transporteur.id));

      toast({
        title: 'Succès',
        description: `Transporteur "${transporteur.name}" supprimé avec succès`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur suppression transporteur:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de supprimer le transporteur',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTransporteurStatus = async (transporteur: Transporteur) => {
    try {
      console.log('🔄 [ZonesLivraison] Toggle statut transporteur:', transporteur.id);

      const updatedTransporteur = await deliveryService.toggleTransporteurStatus(transporteur.id);
      setTransporteurs(prev => prev.map(t => t.id === transporteur.id ? updatedTransporteur : t));

      toast({
        title: 'Succès',
        description: `Statut de "${transporteur.name}" modifié`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur toggle statut transporteur:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const resetTransporteurForm = () => {
    setTransporteurFormData({
      name: '',
      logoUrl: '',
      deliveryZones: [],
      status: 'active',
    });
  };

  const openEditTransporteurModal = (transporteur: Transporteur) => {
    setSelectedTransporteur(transporteur);
    setTransporteurFormData({
      name: transporteur.name,
      logoUrl: transporteur.logoUrl || '',
      deliveryZones: transporteur.deliveryZones,
      status: transporteur.status,
    });
    setIsEditTransporteurModalOpen(true);
  };

  // ========================================
  // GESTION DES TARIFS DE ZONES
  // ========================================

  const handleAddTarif = async () => {
    try {
      setIsSavingTarif(true);
      console.log('➕ [ZonesLivraison] Ajout tarif:', tarifFormData);

      // Vérifier si un tarif existe déjà pour ce couple transporteur-zone
      const existingTarif = zoneTarifs.find(
        t => t.transporteurId === tarifFormData.transporteurId &&
             t.zoneId === tarifFormData.zoneId &&
             t.status === 'active'
      );

      if (existingTarif) {
        toast({
          title: 'Tarif existant',
          description: `Un tarif actif existe déjà pour "${tarifFormData.transporteurName}" vers "${tarifFormData.zoneName}". Voulez-vous le modifier ou le désactiver d'abord?`,
          variant: 'destructive',
        });
        setIsSavingTarif(false);
        return;
      }

      const newTarif = await deliveryService.createZoneTarif(tarifFormData);
      setZoneTarifs(prev => [...prev, newTarif]);

      // Mettre à jour automatiquement les zones couvertes du transporteur
      const transporteur = transporteurs.find(t => t.id === tarifFormData.transporteurId);
      if (transporteur && !transporteur.deliveryZones.includes(tarifFormData.zoneId)) {
        try {
          const updatedZones = [...transporteur.deliveryZones, tarifFormData.zoneId];
          const updatedTransporteur = await deliveryService.updateTransporteur(transporteur.id, {
            deliveryZones: updatedZones,
          });
          setTransporteurs(prev => prev.map(t => t.id === transporteur.id ? updatedTransporteur : t));
          console.log('✅ [ZonesLivraison] Zones couvertes du transporteur mises à jour:', updatedZones);
        } catch (updateErr) {
          console.warn('⚠️ [ZonesLivraison] Impossible de mettre à jour les zones du transporteur:', updateErr);
        }
      }

      toast({
        title: 'Succès',
        description: `Tarif pour "${newTarif.zoneName}" ajouté avec succès`,
      });

      setIsAddTarifModalOpen(false);
      resetTarifForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur ajout tarif:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible d\'ajouter le tarif',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTarif(false);
    }
  };

  const handleEditTarif = async () => {
    if (!selectedTarif) return;

    try {
      setIsSavingTarif(true);
      console.log('✏️ [ZonesLivraison] Modification tarif:', selectedTarif.id, tarifFormData);

      const updatedTarif = await deliveryService.updateZoneTarif(selectedTarif.id, tarifFormData);
      setZoneTarifs(prev => prev.map(t => t.id === selectedTarif.id ? updatedTarif : t));

      // Si le transporteur ou la zone a changé, mettre à jour les zones couvertes
      const transporteur = transporteurs.find(t => t.id === tarifFormData.transporteurId);
      if (transporteur && !transporteur.deliveryZones.includes(tarifFormData.zoneId)) {
        try {
          const updatedZones = [...transporteur.deliveryZones, tarifFormData.zoneId];
          const updatedTransporteur = await deliveryService.updateTransporteur(transporteur.id, {
            deliveryZones: updatedZones,
          });
          setTransporteurs(prev => prev.map(t => t.id === transporteur.id ? updatedTransporteur : t));
          console.log('✅ [ZonesLivraison] Zones couvertes du transporteur mises à jour:', updatedZones);
        } catch (updateErr) {
          console.warn('⚠️ [ZonesLivraison] Impossible de mettre à jour les zones du transporteur:', updateErr);
        }
      }

      toast({
        title: 'Succès',
        description: `Tarif pour "${updatedTarif.zoneName}" modifié avec succès`,
      });

      setIsEditTarifModalOpen(false);
      setSelectedTarif(null);
      resetTarifForm();
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur modification tarif:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le tarif',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTarif(false);
    }
  };

  const handleDeleteTarif = async (tarif: ZoneTarif) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tarif pour "${tarif.zoneName}" ?`)) return;

    try {
      console.log('🗑️ [ZonesLivraison] Suppression tarif:', tarif.id);

      await deliveryService.deleteZoneTarif(tarif.id);
      const updatedTarifs = zoneTarifs.filter(t => t.id !== tarif.id);
      setZoneTarifs(updatedTarifs);

      // Recalculer les zones couvertes du transporteur
      // Retirer la zone si c'était le dernier tarif pour cette zone + transporteur
      const transporteur = transporteurs.find(t => t.id === tarif.transporteurId);
      if (transporteur) {
        const hasOtherTarifsForZone = updatedTarifs.some(
          t => t.transporteurId === tarif.transporteurId && t.zoneId === tarif.zoneId
        );

        if (!hasOtherTarifsForZone && transporteur.deliveryZones.includes(tarif.zoneId)) {
          try {
            const updatedZones = transporteur.deliveryZones.filter(zoneId => zoneId !== tarif.zoneId);
            const updatedTransporteur = await deliveryService.updateTransporteur(transporteur.id, {
              deliveryZones: updatedZones,
            });
            setTransporteurs(prev => prev.map(t => t.id === transporteur.id ? updatedTransporteur : t));
            console.log('✅ [ZonesLivraison] Zone retirée des zones couvertes du transporteur');
          } catch (updateErr) {
            console.warn('⚠️ [ZonesLivraison] Impossible de mettre à jour les zones du transporteur:', updateErr);
          }
        }
      }

      toast({
        title: 'Succès',
        description: `Tarif pour "${tarif.zoneName}" supprimé avec succès`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur suppression tarif:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de supprimer le tarif',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTarifStatus = async (tarif: ZoneTarif) => {
    try {
      console.log('🔄 [ZonesLivraison] Toggle statut tarif:', tarif.id);

      const updatedTarif = await deliveryService.toggleZoneTarifStatus(tarif.id);
      setZoneTarifs(prev => prev.map(t => t.id === tarif.id ? updatedTarif : t));

      toast({
        title: 'Succès',
        description: `Statut du tarif pour "${tarif.zoneName}" modifié`,
      });
    } catch (err: any) {
      console.error('❌ [ZonesLivraison] Erreur toggle statut tarif:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const resetTarifForm = () => {
    setTarifFormData({
      zoneId: '',
      zoneName: '',
      transporteurId: '',
      transporteurName: '',
      prixTransporteur: 0,
      prixStandardInternational: 0,
      delaiLivraisonMin: 1,
      delaiLivraisonMax: 3,
      status: 'active',
    });
  };

  const openEditTarifModal = (tarif: ZoneTarif) => {
    setSelectedTarif(tarif);
    setTarifFormData({
      zoneId: tarif.zoneId,
      zoneName: tarif.zoneName,
      transporteurId: tarif.transporteurId,
      transporteurName: tarif.transporteurName,
      prixTransporteur: parseFloat(tarif.prixTransporteur),
      prixStandardInternational: parseFloat(tarif.prixStandardInternational),
      delaiLivraisonMin: tarif.delaiLivraisonMin,
      delaiLivraisonMax: tarif.delaiLivraisonMax,
      status: tarif.status,
    });
    setIsEditTarifModalOpen(true);
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

  const filteredTransporteurs = transporteurs.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTarifs = zoneTarifs.filter(t =>
    t.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transporteurName.toLowerCase().includes(searchTerm.toLowerCase())
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
    totalTransporteurs: transporteurs.length,
    activeTransporteurs: transporteurs.filter(t => t.status === 'active').length,
    totalTarifs: zoneTarifs.length,
    activeTarifs: zoneTarifs.filter(t => t.status === 'active').length,
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dakar-ville">Dakar Ville ({dakarVilleCities.length})</TabsTrigger>
          <TabsTrigger value="banlieue">Banlieue ({banlieueCities.length})</TabsTrigger>
          <TabsTrigger value="regions">Régions ({filteredRegions.length})</TabsTrigger>
          <TabsTrigger value="international">International ({filteredZones.length})</TabsTrigger>
          <TabsTrigger value="transporteurs">Transporteurs ({filteredTransporteurs.length})</TabsTrigger>
          <TabsTrigger value="tarifs">Tarifs ({filteredTarifs.length})</TabsTrigger>
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
                  <TableHead>Délai estimé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
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

        {/* ========================================
            TAB: TRANSPORTEURS
            ======================================== */}
        <TabsContent value="transporteurs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddTransporteurModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un transporteur
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Zones couvertes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransporteurs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Aucun transporteur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransporteurs.map((transporteur) => (
                    <TableRow key={transporteur.id}>
                      <TableCell className="font-medium">{transporteur.name}</TableCell>
                      <TableCell>
                        {transporteur.logoUrl ? (
                          <img
                            src={transporteur.logoUrl}
                            alt={transporteur.name}
                            className="h-8 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">Pas de logo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {transporteur.deliveryZones.length} zone(s)
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transporteur.status === 'active' ? 'default' : 'secondary'}>
                          {transporteur.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Switch
                            checked={transporteur.status === 'active'}
                            onCheckedChange={() => handleToggleTransporteurStatus(transporteur)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTransporteurModal(transporteur)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransporteur(transporteur)}
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
            TAB: TARIFS DE ZONES
            ======================================== */}
        <TabsContent value="tarifs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddTarifModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un tarif
            </Button>
          </div>

          {/* Regroupement par transporteur */}
          {transporteurs.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              Aucun transporteur disponible. Créez d'abord un transporteur dans l'onglet "Transporteurs".
            </Card>
          ) : (
            <div className="space-y-4">
              {transporteurs.map((transporteur) => {
                const transporteurTarifs = filteredTarifs.filter(t => t.transporteurId === transporteur.id);

                return (
                  <Card key={transporteur.id}>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-slate-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-blue-200">
                            {transporteur.logoUrl ? (
                              <img src={transporteur.logoUrl} alt={transporteur.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <Truck className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{transporteur.name}</h3>
                            <p className="text-sm text-gray-600">
                              {transporteurTarifs.length} zone{transporteurTarifs.length > 1 ? 's' : ''} configurée{transporteurTarifs.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant={transporteur.status === 'active' ? 'default' : 'secondary'}>
                          {transporteur.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>

                    {transporteurTarifs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p className="mb-3">Aucun tarif défini pour ce transporteur</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTarifFormData(prev => ({
                              ...prev,
                              transporteurId: transporteur.id,
                              transporteurName: transporteur.name,
                            }));
                            setIsAddTarifModalOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter un tarif
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Zone</TableHead>
                            <TableHead>Prix</TableHead>
                            <TableHead>Délai</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transporteurTarifs.map((tarif) => (
                            <TableRow key={tarif.id}>
                              <TableCell className="font-medium">{tarif.zoneName}</TableCell>
                              <TableCell>
                                <span className="font-semibold text-green-600">{formatPrice(parseFloat(tarif.prixTransporteur))}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  {tarif.delaiLivraisonMin}-{tarif.delaiLivraisonMax} jours
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={tarif.status === 'active' ? 'default' : 'secondary'}>
                                  {tarif.status === 'active' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-3">
                                  <Switch
                                    checked={tarif.status === 'active'}
                                    onCheckedChange={() => handleToggleTarifStatus(tarif)}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditTarifModal(tarif)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTarif(tarif)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
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

      {/* Modal Transporteur - Ajout */}
      <Dialog open={isAddTransporteurModalOpen} onOpenChange={setIsAddTransporteurModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un transporteur</DialogTitle>
            <DialogDescription>
              Créez un nouveau transporteur pour gérer les livraisons
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transporteur-name">Nom du transporteur *</Label>
              <Input
                id="transporteur-name"
                value={transporteurFormData.name}
                onChange={(e) => setTransporteurFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: DHL Express Sénégal"
              />
            </div>

            <div>
              <Label htmlFor="transporteur-logo">URL du logo</Label>
              <Input
                id="transporteur-logo"
                value={transporteurFormData.logoUrl}
                onChange={(e) => setTransporteurFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="transporteur-zones">Zones couvertes</Label>
              <div className="space-y-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                {internationalZones.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune zone internationale disponible</p>
                ) : (
                  internationalZones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`zone-${zone.id}`}
                        checked={transporteurFormData.deliveryZones.includes(zone.id)}
                        onChange={(e) => {
                          const zones = e.target.checked
                            ? [...transporteurFormData.deliveryZones, zone.id]
                            : transporteurFormData.deliveryZones.filter(id => id !== zone.id);
                          setTransporteurFormData(prev => ({ ...prev, deliveryZones: zones }));
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`zone-${zone.id}`} className="text-sm cursor-pointer">
                        {zone.name} ({zone.countries.length} pays)
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {transporteurFormData.deliveryZones.length} zone(s) sélectionnée(s)
              </p>
            </div>

            <div>
              <Label htmlFor="transporteur-status">Statut</Label>
              <Select
                value={transporteurFormData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setTransporteurFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTransporteurModalOpen(false);
                resetTransporteurForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAddTransporteur} disabled={isSavingTransporteur}>
              {isSavingTransporteur && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Transporteur - Édition */}
      <Dialog open={isEditTransporteurModalOpen} onOpenChange={setIsEditTransporteurModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le transporteur</DialogTitle>
            <DialogDescription>
              Modifiez les informations du transporteur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-transporteur-name">Nom du transporteur *</Label>
              <Input
                id="edit-transporteur-name"
                value={transporteurFormData.name}
                onChange={(e) => setTransporteurFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: DHL Express Sénégal"
              />
            </div>

            <div>
              <Label htmlFor="edit-transporteur-logo">URL du logo</Label>
              <Input
                id="edit-transporteur-logo"
                value={transporteurFormData.logoUrl}
                onChange={(e) => setTransporteurFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="edit-transporteur-zones">Zones couvertes</Label>
              <div className="space-y-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                {internationalZones.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune zone internationale disponible</p>
                ) : (
                  internationalZones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edit-zone-${zone.id}`}
                        checked={transporteurFormData.deliveryZones.includes(zone.id)}
                        onChange={(e) => {
                          const zones = e.target.checked
                            ? [...transporteurFormData.deliveryZones, zone.id]
                            : transporteurFormData.deliveryZones.filter(id => id !== zone.id);
                          setTransporteurFormData(prev => ({ ...prev, deliveryZones: zones }));
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`edit-zone-${zone.id}`} className="text-sm cursor-pointer">
                        {zone.name} ({zone.countries.length} pays)
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {transporteurFormData.deliveryZones.length} zone(s) sélectionnée(s)
              </p>
            </div>

            <div>
              <Label htmlFor="edit-transporteur-status">Statut</Label>
              <Select
                value={transporteurFormData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setTransporteurFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTransporteurModalOpen(false);
                setSelectedTransporteur(null);
                resetTransporteurForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleEditTransporteur} disabled={isSavingTransporteur}>
              {isSavingTransporteur && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tarif - Ajout */}
      <Dialog open={isAddTarifModalOpen} onOpenChange={setIsAddTarifModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un tarif de zone</DialogTitle>
            <DialogDescription>
              Définissez le tarif pour un transporteur sur une zone spécifique
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 1. Sélection du transporteur EN PREMIER */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tarif-transporteur-id">Transporteur *</Label>
                <Select
                  value={tarifFormData.transporteurId}
                  onValueChange={(value) => {
                    const transporteur = transporteurs.find(t => t.id === value);
                    setTarifFormData(prev => ({
                      ...prev,
                      transporteurId: value,
                      transporteurName: transporteur?.name || '',
                      // Réinitialiser la zone quand on change de transporteur
                      zoneId: '',
                      zoneName: '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {transporteurs.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tarif-transporteur-name">Nom transporteur</Label>
                <Input
                  id="tarif-transporteur-name"
                  value={tarifFormData.transporteurName}
                  disabled
                  placeholder="Automatique"
                />
              </div>
            </div>

            {/* 2. Sélection de la zone APRÈS (filtrée selon le transporteur) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tarif-zone-id">Zone internationale *</Label>
                <Select
                  value={tarifFormData.zoneId}
                  onValueChange={(value) => {
                    const zone = internationalZones.find(z => z.id === value);
                    setTarifFormData(prev => ({
                      ...prev,
                      zoneId: value,
                      zoneName: zone?.name || '',
                    }));
                  }}
                  disabled={!tarifFormData.transporteurId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      tarifFormData.transporteurId
                        ? "Sélectionner une zone"
                        : "Sélectionnez d'abord un transporteur"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Filtrer les zones selon le transporteur sélectionné
                      const selectedTransporteur = transporteurs.find(t => t.id === tarifFormData.transporteurId);
                      const availableZones = internationalZones.filter(z =>
                        selectedTransporteur?.deliveryZones?.includes(z.id)
                      );

                      if (availableZones.length === 0) {
                        return (
                          <div className="px-2 py-3 text-sm text-gray-500">
                            Aucune zone de couverture définie pour ce transporteur
                          </div>
                        );
                      }

                      return availableZones.map(z => {
                        // Vérifier si un tarif actif existe déjà pour cette zone
                        const hasActiveTarif = zoneTarifs.some(
                          t => t.transporteurId === tarifFormData.transporteurId &&
                               t.zoneId === z.id &&
                               t.status === 'active'
                        );

                        return (
                          <SelectItem key={z.id} value={z.id} disabled={hasActiveTarif}>
                            <div className="flex items-center justify-between w-full">
                              <span>{z.name} ({z.countries.length} pays)</span>
                              {hasActiveTarif && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Configuré
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tarif-zone-name">Nom de la zone</Label>
                <Input
                  id="tarif-zone-name"
                  value={tarifFormData.zoneName}
                  disabled
                  placeholder="Automatique"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tarif-prix-transporteur">Prix (XOF) *</Label>
              <Input
                id="tarif-prix-transporteur"
                type="number"
                value={tarifFormData.prixTransporteur}
                onChange={(e) => setTarifFormData(prev => ({ ...prev, prixTransporteur: parseFloat(e.target.value) }))}
                placeholder="3500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tarif-delai-min">Délai min (jours) *</Label>
                <Input
                  id="tarif-delai-min"
                  type="number"
                  value={tarifFormData.delaiLivraisonMin}
                  onChange={(e) => setTarifFormData(prev => ({ ...prev, delaiLivraisonMin: parseInt(e.target.value) }))}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="tarif-delai-max">Délai max (jours) *</Label>
                <Input
                  id="tarif-delai-max"
                  type="number"
                  value={tarifFormData.delaiLivraisonMax}
                  onChange={(e) => setTarifFormData(prev => ({ ...prev, delaiLivraisonMax: parseInt(e.target.value) }))}
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tarif-status">Statut</Label>
              <Select
                value={tarifFormData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setTarifFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTarifModalOpen(false);
                resetTarifForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAddTarif} disabled={isSavingTarif}>
              {isSavingTarif && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tarif - Édition */}
      <Dialog open={isEditTarifModalOpen} onOpenChange={setIsEditTarifModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le tarif de zone</DialogTitle>
            <DialogDescription>
              Modifiez le tarif pour cette zone et ce transporteur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tarif-zone-id">Zone internationale *</Label>
                <Select
                  value={tarifFormData.zoneId}
                  onValueChange={(value) => {
                    const zone = internationalZones.find(z => z.id === value);
                    setTarifFormData(prev => ({
                      ...prev,
                      zoneId: value,
                      zoneName: zone?.name || '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {internationalZones.map(z => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.name} ({z.countries.length} pays)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-tarif-zone-name">Nom de la zone</Label>
                <Input
                  id="edit-tarif-zone-name"
                  value={tarifFormData.zoneName}
                  disabled
                  placeholder="Automatique"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tarif-transporteur-id">ID transporteur *</Label>
                <Select
                  value={tarifFormData.transporteurId}
                  onValueChange={(value) => {
                    const transporteur = transporteurs.find(t => t.id === value);
                    setTarifFormData(prev => ({
                      ...prev,
                      transporteurId: value,
                      transporteurName: transporteur?.name || '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transporteurs.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-tarif-transporteur-name">Nom transporteur</Label>
                <Input
                  id="edit-tarif-transporteur-name"
                  value={tarifFormData.transporteurName}
                  disabled
                  placeholder="Automatique"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tarif-prix-transporteur">Prix transporteur (XOF) *</Label>
                <Input
                  id="edit-tarif-prix-transporteur"
                  type="number"
                  value={tarifFormData.prixTransporteur}
                  onChange={(e) => setTarifFormData(prev => ({ ...prev, prixTransporteur: parseFloat(e.target.value) }))}
                  placeholder="3500"
                />
              </div>

              <div>
                <Label htmlFor="edit-tarif-prix-standard">Prix standard (XOF) *</Label>
                <Input
                  id="edit-tarif-prix-standard"
                  type="number"
                  value={tarifFormData.prixStandardInternational}
                  onChange={(e) => setTarifFormData(prev => ({ ...prev, prixStandardInternational: parseFloat(e.target.value) }))}
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tarif-delai-min">Délai min (jours) *</Label>
                <Input
                  id="edit-tarif-delai-min"
                  type="number"
                  value={tarifFormData.delaiLivraisonMin}
                  onChange={(e) => setTarifFormData(prev => ({ ...prev, delaiLivraisonMin: parseInt(e.target.value) }))}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="edit-tarif-delai-max">Délai max (jours) *</Label>
                <Input
                  id="edit-tarif-delai-max"
                  type="number"
                  value={tarifFormData.delaiLivraisonMax}
                  onChange={(e) => setTarifFormData(prev => ({ ...prev, delaiLivraisonMax: parseInt(e.target.value) }))}
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-tarif-status">Statut</Label>
              <Select
                value={tarifFormData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setTarifFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTarifModalOpen(false);
                setSelectedTarif(null);
                resetTarifForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleEditTarif} disabled={isSavingTarif}>
              {isSavingTarif && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZonesLivraisonPage;
