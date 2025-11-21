import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Package,
  Truck,
  DollarSign,
  Search,
  TrendingUp
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
import { useCities, useRegions, useInternationalZones, useTransporteurs, useZoneTarifs } from '../../hooks/useDelivery';
import { City, Region, InternationalZone, Transporteur, ZoneTarif } from '../../services/deliveryApiService';

// Local interface for DeliveryZone (not in API)
interface DeliveryZone {
  id: string;
  name: string;
  cities: City[];
  deliveryTime: string;
  coverage: string;
  isFree: boolean;
  price?: number;
}

const ZonesLivraisonPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dakar-ville');
  const [searchTerm, setSearchTerm] = useState('');
  const [banlieueSearchTerm, setBanlieueSearchTerm] = useState('');

  // Utiliser les hooks pour les vraies données
  const { cities: dakarVilleCities, loading: dakarLoading, error: dakarError, createCity, updateCity, deleteCity, toggleCityStatus } = useCities('dakar-ville');
  const { cities: banlieueCities, loading: banlieueLoading, error: banlieueError } = useCities('banlieue');
  const { regions, loading: regionsLoading } = useRegions();
  const { zones: internationalZones, loading: zonesLoading } = useInternationalZones();
  const { transporteurs, loading: transporteursLoading } = useTransporteurs();
  const { tarifs: zoneTarifs, loading: tarifsLoading } = useZoneTarifs();
    { id: '1', name: 'Plateau', category: 'Centre', status: 'active', price: 0, isFree: true },
    { id: '2', name: 'Médina', category: 'Centre', status: 'active', price: 0, isFree: true },
    { id: '3', name: 'Point E', category: 'Centre', status: 'active', price: 0, isFree: true },
    { id: '4', name: 'Fann', category: 'Centre', status: 'active', price: 0, isFree: true },
    { id: '5', name: 'HLM', category: 'Résidentiel', status: 'active', price: 1500, isFree: false },
    { id: '6', name: 'Ouakam', category: 'Résidentiel', status: 'active', price: 1500, isFree: false },
    { id: '7', name: 'Ngor', category: 'Résidentiel', status: 'active', price: 2000, isFree: false },
    { id: '8', name: 'Yoff', category: 'Résidentiel', status: 'active', price: 1500, isFree: false },
    { id: '9', name: 'Sacré-Coeur', category: 'Résidentiel', status: 'active', price: 1000, isFree: false },
    { id: '10', name: 'Mermoz', category: 'Résidentiel', status: 'active', price: 1000, isFree: false },
    { id: '11', name: 'Almadies', category: 'Résidentiel', status: 'active', price: 2500, isFree: false },
    { id: '12', name: 'Pikine', category: 'Populaire', status: 'active', price: 2000, isFree: false },
    { id: '13', name: 'Guédiawaye', category: 'Populaire', status: 'active', price: 2500, isFree: false },
    { id: '14', name: 'Parcelles Assainies', category: 'Populaire', status: 'active', price: 1800, isFree: false },
    { id: '15', name: 'Grand Yoff', category: 'Populaire', status: 'active', price: 1500, isFree: false },
    { id: '16', name: 'Liberté 6', category: 'Résidentiel', status: 'active', price: 1000, isFree: false },
    { id: '17', name: 'Grand-Dakar', category: 'Populaire', status: 'active', price: 1200, isFree: false },
    { id: '18', name: 'Fass', category: 'Populaire', status: 'active', price: 800, isFree: false },
    { id: '19', name: 'Colobane', category: 'Centre', status: 'active', price: 0, isFree: true },
  ]);

  const dakarVille: DeliveryZone = {
    id: '1',
    name: 'Dakar Ville',
    cities: dakarVilleCities,
    deliveryTime: '24-48 heures',
    coverage: 'Toutes les villes de Dakar (sauf banlieue)',
    isFree: true,
  };

  // Données de démonstration pour Banlieue
  const [banlieueCities, setBanlieueCities] = useState<City[]>([
    {
      id: 'b1',
      name: 'Pikine',
      category: 'Banlieue',
      status: 'active',
      price: 2000,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b2',
      name: 'Guédiawaye',
      category: 'Banlieue',
      status: 'active',
      price: 1800,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b3',
      name: 'Thiaroye-sur-Mer',
      category: 'Banlieue',
      status: 'active',
      price: 2200,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b4',
      name: 'Keur Massar',
      category: 'Banlieue',
      status: 'active',
      price: 2000,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b5',
      name: 'Biscuiterie',
      category: 'Banlieue',
      status: 'active',
      price: 1800,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b6',
      name: 'Malika',
      category: 'Banlieue',
      status: 'active',
      price: 2500,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b7',
      name: 'Rufisque',
      category: 'Banlieue',
      status: 'active',
      price: 2200,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b8',
      name: 'Bakar',
      category: 'Banlieue',
      status: 'active',
      price: 2500,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b9',
      name: 'Sébikhotane',
      category: 'Banlieue',
      status: 'active',
      price: 2000,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
    {
      id: 'b10',
      name: 'Yeumbeul',
      category: 'Banlieue',
      status: 'active',
      price: 2000,
      isFree: false,
      deliveryTimeMin: 48,
      deliveryTimeMax: 72,
      deliveryTimeUnit: 'heures'
    },
  ]);

  const banlieue: DeliveryZone = {
    id: '2',
    name: 'Banlieue',
    cities: banlieueCities,
    deliveryTime: '48-72 heures',
    coverage: 'Toutes les villes de la banlieue de Dakar',
    isFree: false,
  };

  // Données des 13 régions du Sénégal (sans Dakar)
  const [regions, setRegions] = useState<Region[]>([
    {
      id: 'r1',
      name: 'Diourbel',
      status: 'active',
      price: 3000,
      deliveryTimeMin: 72,
      deliveryTimeMax: 120,
      deliveryTimeUnit: 'heures',
      mainCities: 'Diourbel, Touba, Mbacké, Bambey'
    },
    {
      id: 'r2',
      name: 'Fatick',
      status: 'active',
      price: 3500,
      deliveryTimeMin: 72,
      deliveryTimeMax: 120,
      deliveryTimeUnit: 'heures',
      mainCities: 'Fatick, Kaolack, Foundiougne, Sokone'
    },
    {
      id: 'r3',
      name: 'Kaffrine',
      status: 'active',
      price: 4000,
      deliveryTimeMin: 96,
      deliveryTimeMax: 144,
      deliveryTimeUnit: 'heures',
      mainCities: 'Kaffrine, Koungheul, Malem Hodar, Birkelane'
    },
    {
      id: 'r4',
      name: 'Kaolack',
      status: 'active',
      price: 5000,
      deliveryTimeMin: 96,
      deliveryTimeMax: 144,
      deliveryTimeUnit: 'heures',
      mainCities: 'Kaolack, Kahone, Nioro, Gandel'
    },
    {
      id: 'r5',
      name: 'Kédougou',
      status: 'active',
      price: 8000,
      deliveryTimeMin: 120,
      deliveryTimeMax: 168,
      deliveryTimeUnit: 'heures',
      mainCities: 'Kédougou, Saraya, Salemata, Bandafassi'
    },
    {
      id: 'r6',
      name: 'Kolda',
      status: 'active',
      price: 7000,
      deliveryTimeMin: 120,
      deliveryTimeMax: 168,
      deliveryTimeUnit: 'heures',
      mainCities: 'Kolda, Vélingara, Médina Yoro Foulah, Dinda Boko'
    },
    {
      id: 'r7',
      name: 'Louga',
      status: 'active',
      price: 4500,
      deliveryTimeMin: 72,
      deliveryTimeMax: 120,
      deliveryTimeUnit: 'heures',
      mainCities: 'Louga, Linguère, Kébémer, Sagatta'
    },
    {
      id: 'r8',
      name: 'Matam',
      status: 'active',
      price: 7500,
      deliveryTimeMin: 120,
      deliveryTimeMax: 168,
      deliveryTimeUnit: 'heures',
      mainCities: 'Matam, Kanel, Ogo, Saint-Louis'
    },
    {
      id: 'r9',
      name: 'Saint-Louis',
      status: 'active',
      price: 6000,
      deliveryTimeMin: 96,
      deliveryTimeMax: 144,
      deliveryTimeUnit: 'heures',
      mainCities: 'Saint-Louis, Richard Toll, Dagana, Podor'
    },
    {
      id: 'r10',
      name: 'Sédhiou',
      status: 'active',
      price: 6500,
      deliveryTimeMin: 120,
      deliveryTimeMax: 168,
      deliveryTimeUnit: 'heures',
      mainCities: 'Sédhiou, Goudomp, Karantaba, Marsassoum'
    },
    {
      id: 'r11',
      name: 'Tambacounda',
      status: 'active',
      price: 5500,
      deliveryTimeMin: 96,
      deliveryTimeMax: 144,
      deliveryTimeUnit: 'heures',
      mainCities: 'Tambacounda, Bakel, Goudiry, Missirah'
    },
    {
      id: 'r12',
      name: 'Thiès',
      status: 'active',
      price: 4000,
      deliveryTimeMin: 72,
      deliveryTimeMax: 120,
      deliveryTimeUnit: 'heures',
      mainCities: 'Thiès, Mbour, Tivaouane, Joal'
    },
    {
      id: 'r13',
      name: 'Ziguinchor',
      status: 'active',
      price: 6000,
      deliveryTimeMin: 120,
      deliveryTimeMax: 168,
      deliveryTimeUnit: 'heures',
      mainCities: 'Ziguinchor, Bignona, Oussouye, Sédhiou'
    }
  ]);

  // États pour la modification des régions
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isEditRegionModalOpen, setIsEditRegionModalOpen] = useState(false);

  // Liste des pays du monde pour l'autocomplete
  const allCountries = [
    'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola', 'Antigua-et-Barbuda',
    'Arabie Saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche', 'Azerbaïdjan', 'Bahamas', 'Bahreïn',
    'Bangladesh', 'Barbade', 'Belgique', 'Belize', 'Bénin', 'Bhoutan', 'Biélorussie', 'Bolivie', 'Bosnie-Herzégovine',
    'Botswana', 'Brésil', 'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi', 'Cambodge', 'Cameroun', 'Canada',
    'Cap-Vert', 'République Centrafricaine', 'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores', 'Congo', 'Corée du Nord',
    'Corée du Sud', 'Costa Rica', 'Côte d\'Ivoire', 'Croatie', 'Cuba', 'Danemark', 'Djibouti', 'Dominique',
    'Égypte', 'Émirats Arabes Unis', 'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'États-Unis', 'Ethiopie', 'Fidji',
    'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie', 'Ghana', 'Grèce', 'Grenade', 'Guatemala', 'Guinée',
    'Guinée-Bissau', 'Guyana', 'Haïti', 'Honduras', 'Hongrie', 'Inde', 'Indonésie', 'Iran', 'Iraq', 'Irlande',
    'Islande', 'Israël', 'Italie', 'Jamaïque', 'Japon', 'Jordanie', 'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati',
    'Koweït', 'Laos', 'Lesotho', 'Lettonie', 'Liban', 'Liberia', 'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg',
    'Macédoine du Nord', 'Madagascar', 'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc', 'Marshall',
    'Maurice', 'Mauritanie', 'Mexique', 'Micronésie', 'Moldavie', 'Monaco', 'Mongolie', 'Monténégro', 'Mozambique',
    'Myanmar', 'Namibie', 'Nauru', 'Népal', 'Nicaragua', 'Niger', 'Nigéria', 'Norvège', 'Nouvelle-Zélande', 'Oman',
    'Ouganda', 'Ouzbékistan', 'Pakistan', 'Palaos', 'Panama', 'Papouasie-Nouvelle-Guinée', 'Paraguay', 'Pays-Bas', 'Pérou',
    'Philippines', 'Pologne', 'Portugal', 'Qatar', 'Roumanie', 'Royaume-Uni', 'Russie', 'Rwanda', 'Saint-Kitts-et-Nevis',
    'Sainte-Lucie', 'Saint-Marin', 'Saint-Vincent-et-les-Grenadines', 'Salomon', 'Samoa', 'Saint-Marin', 'Sao Tomé-et-Principe',
    'Arabie Saoudite', 'Sénégal', 'Serbie', 'Seychelles', 'Sierra Leone', 'Singapour', 'Slovaquie', 'Slovénie', 'Somalie',
    'Soudan', 'Soudan du Sud', 'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Swaziland', 'Syrie', 'Tadjikistan',
    'Tanzanie', 'Thaïlande', 'Timor-Leste', 'Togo', 'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turquie', 'Turkménistan',
    'Tuvalu', 'Ukraine', 'Uruguay', 'Vanuatu', 'Vatican', 'Venezuela', 'Vietnam', 'Yémen', 'Zambie', 'Zimbabwe'
  ];

  // Données des zones internationales
  const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([
    {
      id: 'z1',
      name: 'Zone Europe',
      countries: ['France', 'Allemagne', 'Belgique', 'Suisse', 'Italie', 'Espagne', 'Pays-Bas', 'Portugal', 'Autriche', 'Luxembourg'],
      status: 'active',
      price: 15000,
      deliveryTimeMin: 3,
      deliveryTimeMax: 7
    },
    {
      id: 'z2',
      name: 'Zone Amérique du Nord',
      countries: ['États-Unis', 'Canada'],
      status: 'active',
      price: 20000,
      deliveryTimeMin: 5,
      deliveryTimeMax: 10
    },
    {
      id: 'z3',
      name: 'Zone Asie',
      countries: ['Chine', 'Japon', 'Inde', 'Corée du Sud', 'Singapour', 'Thaïlande', 'Malaisie', 'Indonésie', 'Philippines'],
      status: 'active',
      price: 25000,
      deliveryTimeMin: 7,
      deliveryTimeMax: 14
    }
  ]);

  // États pour la gestion des zones internationales
  const [selectedZone, setSelectedZone] = useState<InternationalZone | null>(null);
  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    countries: [] as string[],
    status: 'active' as 'active' | 'inactive',
    price: 10000,
    deliveryTimeMin: 3,
    deliveryTimeMax: 7
  });
  const [countryInput, setCountryInput] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

  // États pour les transporteurs
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([
    {
      id: '1',
      name: 'DHL Express',
      logoUrl: 'https://www.dhl.com/content/dam/dhl/global/core/images/g3/logo-dhl-express.svg',
      deliveryZones: ['Zone Afrique de l\'Ouest', 'Zone Europe'],
      status: 'active'
    },
    {
      id: '2',
      name: 'FedEx',
      logoUrl: 'https://www.fedex.com/content/dam/fedex-com/logos/fedex-logo-primary.svg',
      deliveryZones: ['Zone Europe', 'Zone Amérique du Nord'],
      status: 'active'
    }
  ]);

  const [isAddTransporteurModalOpen, setIsAddTransporteurModalOpen] = useState(false);
  const [isEditTransporteurModalOpen, setIsEditTransporteurModalOpen] = useState(false);
  const [selectedTransporteur, setSelectedTransporteur] = useState<Transporteur | null>(null);
  const [newTransporteur, setNewTransporteur] = useState<Transporteur>({
    id: '',
    name: '',
    logoUrl: '',
    deliveryZones: [],
    status: 'active'
  });

  // États pour les tarifs
  const [zoneTarifs, setZoneTarifs] = useState<ZoneTarif[]>([
    {
      id: '1',
      zoneId: '1',
      zoneName: 'Zone Afrique de l\'Ouest',
      transporteurId: '1',
      transporteurName: 'DHL Express',
      prixTransporteur: 15000,
      prixStandardInternational: 20000,
      delaiLivraisonMin: 3,
      delaiLivraisonMax: 7,
      status: 'active'
    },
    {
      id: '2',
      zoneId: '2',
      zoneName: 'Zone Europe',
      transporteurId: '1',
      transporteurName: 'DHL Express',
      prixTransporteur: 35000,
      prixStandardInternational: 45000,
      delaiLivraisonMin: 5,
      delaiLivraisonMax: 10,
      status: 'active'
    }
  ]);

  const [isAddTarifModalOpen, setIsAddTarifModalOpen] = useState(false);
  const [isEditTarifModalOpen, setIsEditTarifModalOpen] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState<ZoneTarif | null>(null);
  const [newTarif, setNewTarif] = useState<Omit<ZoneTarif, 'id'>>({
    zoneId: '',
    zoneName: '',
    transporteurId: '',
    transporteurName: '',
    prixTransporteur: 0,
    prixStandardInternational: 0,
    delaiLivraisonMin: 1,
    delaiLivraisonMax: 1,
    status: 'active'
  });

  // Statistiques
  const stats = {
    total: dakarVilleCities.length,
    active: dakarVilleCities.filter(c => c.status === 'active').length,
    inactive: dakarVilleCities.filter(c => c.status === 'inactive').length,
    free: dakarVilleCities.filter(c => c.isFree).length,
  };

  const banlieueStats = {
    total: banlieueCities.length,
    active: banlieueCities.filter(c => c.status === 'active').length,
    inactive: banlieueCities.filter(c => c.status === 'inactive').length,
    free: banlieueCities.filter(c => c.isFree).length,
  };

  // Filtrer les villes par recherche
  const filteredCities = dakarVilleCities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrer les villes de banlieue par recherche
  const filteredBanlieueCities = banlieueCities.filter(city =>
    city.name.toLowerCase().includes(banlieueSearchTerm.toLowerCase())
  );

  // Grouper les villes par catégorie
  const citiesByCategory = filteredCities.reduce((acc, city) => {
    if (!acc[city.category]) {
      acc[city.category] = [];
    }
    acc[city.category].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  // Grouper les villes de banlieue par catégorie
  const banlieueCitiesByCategory = filteredBanlieueCities.reduce((acc, city) => {
    if (!acc[city.category]) {
      acc[city.category] = [];
    }
    acc[city.category].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  // Formatage du temps de livraison
  const formatDeliveryTime = (city: City) => {
    if (!city.deliveryTimeMin || !city.deliveryTimeMax) return 'Non défini';
    const unit = city.deliveryTimeUnit || 'heures';
    return `${city.deliveryTimeMin}-${city.deliveryTimeMax} ${unit}`;
  };

  // Formatage du temps de livraison pour régions
  const formatRegionDeliveryTime = (region: Region) => {
    return `${region.deliveryTimeMin}-${region.deliveryTimeMax} ${region.deliveryTimeUnit}`;
  };

  // Handlers pour les régions
  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region);
    setIsEditRegionModalOpen(true);
  };

  const handleUpdateRegion = () => {
    if (selectedRegion) {
      setRegions(
        regions.map(r =>
          r.id === selectedRegion.id ? selectedRegion : r
        )
      );
      setIsEditRegionModalOpen(false);
      setSelectedRegion(null);
    }
  };

  const handleToggleRegionStatus = (regionId: string) => {
    setRegions(
      regions.map(r =>
        r.id === regionId
          ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' }
          : r
      )
    );
  };

  // Handlers pour les zones internationales
  const handleCountryInputChange = (value: string) => {
    setCountryInput(value);
    if (value.length > 0) {
      const filtered = allCountries.filter(country =>
        country.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limiter à 8 suggestions
      setFilteredCountries(filtered);
      setShowCountrySuggestions(true);
    } else {
      setShowCountrySuggestions(false);
    }
  };

  const handleAddCountry = (country: string) => {
    if (!newZone.countries.includes(country)) {
      setNewZone({
        ...newZone,
        countries: [...newZone.countries, country]
      });
    }
    setCountryInput('');
    setShowCountrySuggestions(false);
  };

  const handleRemoveCountry = (countryToRemove: string) => {
    setNewZone({
      ...newZone,
      countries: newZone.countries.filter(country => country !== countryToRemove)
    });
  };

  const handleEditZone = (zone: InternationalZone) => {
    setSelectedZone(zone);
    setIsEditZoneModalOpen(true);
  };

  const handleUpdateZone = () => {
    if (selectedZone) {
      setInternationalZones(
        internationalZones.map(z =>
          z.id === selectedZone.id ? selectedZone : z
        )
      );
      setIsEditZoneModalOpen(false);
      setSelectedZone(null);
    }
  };

  const handleAddZone = () => {
    if (newZone.name && newZone.countries.length > 0) {
      const zone: InternationalZone = {
        id: Date.now().toString(),
        name: newZone.name,
        countries: newZone.countries,
        status: newZone.status,
        price: newZone.price,
        deliveryTimeMin: newZone.deliveryTimeMin,
        deliveryTimeMax: newZone.deliveryTimeMax
      };
      setInternationalZones([...internationalZones, zone]);
      setNewZone({
        name: '',
        countries: [],
        status: 'active',
        price: 10000,
        deliveryTimeMin: 3,
        deliveryTimeMax: 7
      });
      setIsAddZoneModalOpen(false);
    }
  };

  const handleToggleZoneStatus = (zoneId: string) => {
    setInternationalZones(
      internationalZones.map(z =>
        z.id === zoneId
          ? { ...z, status: z.status === 'active' ? 'inactive' : 'active' }
          : z
      )
    );
  };

  const handleDeleteInternationalZone = (zoneId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette zone internationale ? Cette action est irréversible.')) {
      setInternationalZones(internationalZones.filter(z => z.id !== zoneId));
    }
  };

  // Fonctions pour les transporteurs
  const handleAddTransporteur = () => {
    if (newTransporteur.name && newTransporteur.deliveryZones.length > 0) {
      const transporteur: Transporteur = {
        ...newTransporteur,
        id: Date.now().toString()
      };
      setTransporteurs([...transporteurs, transporteur]);
      setNewTransporteur({
        id: '',
        name: '',
        logoUrl: '',
        deliveryZones: [],
        status: 'active'
      });
      setIsAddTransporteurModalOpen(false);
    }
  };

  const handleEditTransporteur = (transporteur: Transporteur) => {
    setSelectedTransporteur(transporteur);
    setIsEditTransporteurModalOpen(true);
  };

  const handleUpdateTransporteur = () => {
    if (selectedTransporteur && selectedTransporteur.deliveryZones.length > 0) {
      setTransporteurs(
        transporteurs.map(t =>
          t.id === selectedTransporteur.id ? selectedTransporteur : t
        )
      );
      setIsEditTransporteurModalOpen(false);
      setSelectedTransporteur(null);
    }
  };

  const handleToggleTransporteurStatus = (transporteurId: string) => {
    setTransporteurs(
      transporteurs.map(t =>
        t.id === transporteurId
          ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' }
          : t
      )
    );
  };

  const handleDeleteTransporteur = (transporteurId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce transporteur ? Cette action est irréversible.')) {
      setTransporteurs(transporteurs.filter(t => t.id !== transporteurId));
    }
  };

  // Fonctions pour les tarifs
  const handleAddTarif = () => {
    if (newTarif.zoneId && newTarif.transporteurId) {
      const tarif: ZoneTarif = {
        ...newTarif,
        id: Date.now().toString()
      };
      setZoneTarifs([...zoneTarifs, tarif]);
      setNewTarif({
        zoneId: '',
        zoneName: '',
        transporteurId: '',
        transporteurName: '',
        prixTransporteur: 0,
        prixStandardInternational: 0,
        delaiLivraisonMin: 1,
        delaiLivraisonMax: 1,
        status: 'active'
      });
      setIsAddTarifModalOpen(false);
    }
  };

  const handleEditTarif = (tarif: ZoneTarif) => {
    setSelectedTarif(tarif);
    setIsEditTarifModalOpen(true);
  };

  const handleUpdateTarif = () => {
    if (selectedTarif) {
      setZoneTarifs(
        zoneTarifs.map(t =>
          t.id === selectedTarif.id ? selectedTarif : t
        )
      );
      setIsEditTarifModalOpen(false);
      setSelectedTarif(null);
    }
  };

  const handleToggleTarifStatus = (tarifId: string) => {
    setZoneTarifs(
      zoneTarifs.map(t =>
        t.id === tarifId
          ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' }
          : t
      )
    );
  };

  const handleDeleteTarif = (tarifId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tarif ? Cette action est irréversible.')) {
      setZoneTarifs(zoneTarifs.filter(t => t.id !== tarifId));
    }
  };

  const handleZoneChange = (zoneId: string) => {
    const zone = internationalZones.find(z => z.id === zoneId);
    if (zone) {
      setNewTarif({
        ...newTarif,
        zoneId,
        zoneName: zone.name
      });
    }
  };

  const handleTransporteurChange = (transporteurId: string) => {
    const transporteur = transporteurs.find(t => t.id === transporteurId);
    if (transporteur) {
      setNewTarif({
        ...newTarif,
        transporteurId,
        transporteurName: transporteur.name
      });
    }
  };

  // Handlers
  const handleAddCity = () => {
    const city: City = {
      id: Date.now().toString(),
      name: newCity.name,
      category: newCity.category,
      status: newCity.status,
      price: newCity.isFree ? 0 : newCity.price,
      isFree: newCity.isFree,
    };
    setDakarVilleCities([...dakarVilleCities, city]);
    setNewCity({
      name: '',
      category: 'Centre',
      status: 'active',
      isFree: true,
      price: 0,
    });
    setIsAddCityModalOpen(false);
  };

  const handleEditCity = (city: City) => {
    setSelectedCity(city);
    setIsEditCityModalOpen(true);
  };

  const handleUpdateCity = () => {
    if (selectedCity) {
      setDakarVilleCities(
        dakarVilleCities.map(c =>
          c.id === selectedCity.id ? selectedCity : c
        )
      );
      setIsEditCityModalOpen(false);
      setSelectedCity(null);
    }
  };

  const handleToggleCityStatus = (cityId: string) => {
    setDakarVilleCities(
      dakarVilleCities.map(c =>
        c.id === cityId
          ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
          : c
      )
    );
  };

  const handleDeleteCity = (cityId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) {
      setDakarVilleCities(dakarVilleCities.filter(c => c.id !== cityId));
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Centre':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Résidentiel':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Populaire':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handlers pour Banlieue
  const [isAddBanlieueCityModalOpen, setIsAddBanlieueCityModalOpen] = useState(false);
  const [isEditBanlieueCityModalOpen, setIsEditBanlieueCityModalOpen] = useState(false);
  const [selectedBanlieueCity, setSelectedBanlieueCity] = useState<City | null>(null);

  const handleAddBanlieueCity = () => {
    const city: City = {
      id: Date.now().toString(),
      name: newBanlieueCity.name,
      category: newBanlieueCity.category,
      status: newBanlieueCity.status,
      price: newBanlieueCity.isFree ? 0 : newBanlieueCity.price,
      isFree: newBanlieueCity.isFree,
      deliveryTimeMin: newBanlieueCity.deliveryTimeMin,
      deliveryTimeMax: newBanlieueCity.deliveryTimeMax,
      deliveryTimeUnit: newBanlieueCity.deliveryTimeUnit,
    };
    setBanlieueCities([...banlieueCities, city]);
    setNewBanlieueCity({
      name: '',
      category: 'Banlieue',
      status: 'active',
      isFree: false,
      price: 1500,
      deliveryTimeMin: 24,
      deliveryTimeMax: 48,
      deliveryTimeUnit: 'heures',
    });
    setIsAddBanlieueCityModalOpen(false);
  };

  const handleEditBanlieueCity = (city: City) => {
    setSelectedBanlieueCity(city);
    setIsEditBanlieueCityModalOpen(true);
  };

  const handleUpdateBanlieueCity = () => {
    if (selectedBanlieueCity) {
      setBanlieueCities(
        banlieueCities.map(c =>
          c.id === selectedBanlieueCity.id ? selectedBanlieueCity : c
        )
      );
      setIsEditBanlieueCityModalOpen(false);
      setSelectedBanlieueCity(null);
    }
  };

  const handleToggleBanlieueCityStatus = (cityId: string) => {
    setBanlieueCities(
      banlieueCities.map(c =>
        c.id === cityId
          ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
          : c
      )
    );
  };

  const handleDeleteBanlieueCity = (cityId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) {
      setBanlieueCities(banlieueCities.filter(c => c.id !== cityId));
    }
  };

  // Validation functions
  const validateDeliveryTime = (min: number, max: number, unit: 'heures' | 'jours' = 'heures'): boolean => {
    const maxLimit = unit === 'heures' ? 720 : 30; // 720 heures ou 30 jours
    return min > 0 && max >= min && max <= maxLimit;
  };

  const validatePrice = (price: number): boolean => {
    return price >= 0 && price <= 50000; // Prix max 50,000 FCFA
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header minimaliste */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-normal text-gray-900">Zones de livraison</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration des zones et délais de livraison</p>
        </div>

        {/* Navigation minimaliste */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b border-gray-200">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger
                value="dakar-ville"
                className="px-1 py-4 text-sm text-gray-700 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent rounded-none transition-none"
              >
                Dakar Ville
              </TabsTrigger>
              <TabsTrigger
                value="banlieue"
                className="px-1 py-4 text-sm text-gray-700 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent rounded-none transition-none"
              >
                Banlieue
              </TabsTrigger>
              <TabsTrigger
                value="regions"
                className="px-1 py-4 text-sm text-gray-700 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent rounded-none transition-none"
              >
                Régions
              </TabsTrigger>
              <TabsTrigger
                value="zones"
                className="px-1 py-4 text-sm text-gray-700 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent rounded-none transition-none"
              >
                Zones
              </TabsTrigger>
              <TabsTrigger
                value="transporteurs"
                className="px-1 py-4 text-sm text-gray-700 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent rounded-none transition-none"
              >
                Transporteurs
              </TabsTrigger>
              <TabsTrigger
                value="tarifs"
                className="px-1 py-4 text-sm text-gray-700 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent rounded-none transition-none"
              >
                Tarifs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dakar Ville Tab */}
          <TabsContent value="dakar-ville" className="space-y-6">
            {/* Zone principale Dakar Ville - Design minimaliste */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{dakarVille.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Délai : {dakarVille.deliveryTime} • {dakarVille.coverage}
                  </p>
                  {dakarVille.isFree && (
                    <span className="inline-block mt-2 text-xs text-gray-600">Livraison gratuite</span>
                  )}
                </div>
                <button
                  onClick={() => setIsAddCityModalOpen(true)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                  Ajouter une ville
                </button>
              </div>

              {/* Statistiques minimalistes */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Total villes</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">{stats.active}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Actives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">{stats.inactive}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inactives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">{stats.free}</p>
                  <p className="text-xs text-gray-500 mt-1">Gratuites</p>
                </div>
              </div>
            </div>

            {/* Gestion des villes - Design minimaliste */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Villes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600 w-64"
                  />
                </div>
              </div>

              {/* Tableau minimaliste */}
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Ville</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Catégorie</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Prix</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Statut</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(citiesByCategory).map(([category, cities]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-4 py-2 text-xs font-medium text-gray-700">
                            {category} ({cities.length})
                          </td>
                        </tr>
                        {cities.map(city => (
                          <tr key={city.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{city.name}</td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {city.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {city.isFree ? (
                                <span className="text-gray-500">Gratuit</span>
                              ) : (
                                `${city.price.toLocaleString()} FCFA`
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${city.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                                <span className="text-sm text-gray-700">
                                  {city.status === 'active' ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditCity(city)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleCityStatus(city.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  {city.status === 'active' ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCity(city.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Autres onglets (placeholder) */}
          <TabsContent value="banlieue" className="space-y-6">
            {/* Zone principale Banlieue - Design minimaliste */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{banlieue.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Délai : {banlieue.deliveryTime} • {banlieue.coverage}
                  </p>
                  {!banlieue.isFree && (
                    <span className="inline-block mt-2 text-xs text-gray-600">Livraison payante</span>
                  )}
                </div>
                <button
                  onClick={() => setIsAddBanlieueCityModalOpen(true)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                  Ajouter une ville
                </button>
              </div>

              {/* Statistiques minimalistes */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">{banlieueStats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Total villes</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">{banlieueStats.active}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Actives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">{banlieueStats.inactive}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inactives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">{banlieueStats.free}</p>
                  <p className="text-xs text-gray-500 mt-1">Gratuites</p>
                </div>
              </div>
            </div>

            {/* Gestion des villes de Banlieue - Design minimaliste */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Villes de banlieue</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={banlieueSearchTerm}
                    onChange={(e) => setBanlieueSearchTerm(e.target.value)}
                    className="pl-9 border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600 w-64"
                  />
                </div>
              </div>

              {/* Tableau minimaliste */}
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Ville</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Catégorie</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Délai</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Prix</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Statut</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(banlieueCitiesByCategory).map(([category, cities]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-2 text-xs font-medium text-gray-700">
                            {category} ({cities.length})
                          </td>
                        </tr>
                        {cities.map(city => (
                          <tr key={city.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{city.name}</td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {city.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDeliveryTime(city)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {city.isFree ? (
                                <span className="text-gray-500">Gratuit</span>
                              ) : (
                                `${city.price.toLocaleString()} FCFA`
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${city.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                                <span className="text-sm text-gray-700">
                                  {city.status === 'active' ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditBanlieueCity(city)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleBanlieueCityStatus(city.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  {city.status === 'active' ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteBanlieueCity(city.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            {/* En-tête des régions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Régions du Sénégal</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configuration des tarifs et délais de livraison par région
                  </p>
                </div>
              </div>

              {/* Statistiques des régions */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">{regions.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total régions</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">
                      {regions.filter(r => r.status === 'active').length}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Actives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">
                      {regions.filter(r => r.status === 'inactive').length}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inactives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">
                      {regions.filter(r => r.price === 0).length}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Gratuites</p>
                </div>
              </div>
            </div>

            {/* Tableau des régions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Liste des régions</h3>

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Région</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Délai livraison</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Prix</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Villes principales</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Statut</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {regions.map(region => (
                      <tr key={region.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{region.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatRegionDeliveryTime(region)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {region.price === 0 ? (
                            <span className="text-gray-500">Gratuit</span>
                          ) : (
                            `${region.price.toLocaleString()} FCFA`
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="truncate max-w-xs inline-block" title={region.mainCities}>
                            {region.mainCities}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${region.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                            <span className="text-sm text-gray-700">
                              {region.status === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditRegion(region)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleRegionStatus(region.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {region.status === 'active' ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            {/* En-tête des zones internationales */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Zones Internationales</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configuration des tarifs et délais de livraison internationaux
                  </p>
                </div>
                <button
                  onClick={() => setIsAddZoneModalOpen(true)}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                  Ajouter une zone
                </button>
              </div>

              {/* Statistiques des zones internationales */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">{internationalZones.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total zones</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">
                      {internationalZones.filter(z => z.status === 'active').length}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Actives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <p className="text-2xl font-normal text-gray-900">
                      {internationalZones.filter(z => z.status === 'inactive').length}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inactives</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-2xl font-normal text-gray-900">
                    {internationalZones.reduce((total, zone) => total + zone.countries.length, 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total pays</p>
                </div>
              </div>
            </div>

            {/* Tableau des zones internationales */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Liste des zones internationales</h3>

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Zone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Délai livraison</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Prix</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Pays inclus</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-700">Statut</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {internationalZones.map(zone => (
                      <tr key={zone.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{zone.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {zone.deliveryTimeMin}-{zone.deliveryTimeMax} jours
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {zone.price.toLocaleString()} FCFA
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="truncate max-w-xs inline-block" title={zone.countries.join(', ')}>
                            {zone.countries.length} pays
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${zone.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                            <span className="text-sm text-gray-700">
                              {zone.status === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditZone(zone)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleZoneStatus(zone.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {zone.status === 'active' ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteInternationalZone(zone.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Supprimer la zone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transporteurs">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Transporteurs disponibles</h3>
                <Button
                  onClick={() => setIsAddTransporteurModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus size={16} />
                  Ajouter un transporteur
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transporteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zones de livraison
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transporteurs.map((transporteur) => (
                      <tr key={transporteur.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {transporteur.logoUrl ? (
                              <img
                                src={transporteur.logoUrl}
                                alt={transporteur.name}
                                className="h-10 w-10 object-contain mr-3"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/40x40/cccccc/666666?text=LOGO';
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded-md mr-3 flex items-center justify-center">
                                <Truck className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transporteur.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {transporteur.deliveryZones.map((zone, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {zone}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transporteur.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transporteur.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditTransporteur(transporteur)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleTransporteurStatus(transporteur.id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {transporteur.status === 'active' ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteTransporteur(transporteur.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tarifs">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Tarifs par zone et transporteur</h3>
                <Button
                  onClick={() => setIsAddTarifModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus size={16} />
                  Ajouter un tarif
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transporteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix transporteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix standard international
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Délai livraison
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zoneTarifs.map((tarif) => (
                      <tr key={tarif.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {tarif.zoneName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {transporteurs.find(t => t.id === tarif.transporteurId)?.logoUrl ? (
                              <img
                                src={transporteurs.find(t => t.id === tarif.transporteurId)?.logoUrl}
                                alt={tarif.transporteurName}
                                className="h-8 w-8 object-contain mr-2"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/32x32/cccccc/666666?text=LOGO';
                                }}
                              />
                            ) : (
                              <div className="h-8 w-8 bg-gray-100 rounded mr-2 flex items-center justify-center">
                                <Truck className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <div className="text-sm text-gray-900">
                              {tarif.transporteurName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {tarif.prixTransporteur.toLocaleString()} FCFA
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {tarif.prixStandardInternational.toLocaleString()} FCFA
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {tarif.delaiLivraisonMin}-{tarif.delaiLivraisonMax} jours
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tarif.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tarif.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditTarif(tarif)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleTarifStatus(tarif.id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {tarif.status === 'active' ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteTarif(tarif.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {zoneTarifs.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun tarif défini</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Commencez par ajouter un tarif pour une zone et un transporteur.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Ajouter une ville - Design minimaliste */}
      <Dialog open={isAddCityModalOpen} onOpenChange={setIsAddCityModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Ajouter une ville
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city-name" className="text-sm font-medium text-gray-700">
                Nom
              </Label>
              <Input
                id="city-name"
                value={newCity.name}
                onChange={e => setNewCity({ ...newCity, name: e.target.value })}
                className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                placeholder="Nom de la ville"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city-category" className="text-sm font-medium text-gray-700">
                Catégorie
              </Label>
              <Select
                value={newCity.category}
                onValueChange={value => setNewCity({ ...newCity, category: value })}
              >
                <SelectTrigger id="city-category" className="border-gray-300 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Centre">Centre</SelectItem>
                  <SelectItem value="Résidentiel">Résidentiel</SelectItem>
                  <SelectItem value="Populaire">Populaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Livraison gratuite
              </Label>
              <Switch
                checked={newCity.isFree}
                onCheckedChange={(checked) =>
                  setNewCity({ ...newCity, isFree: checked, price: checked ? 0 : newCity.price })
                }
              />
            </div>

            {!newCity.isFree && (
              <div className="space-y-2">
                <Label htmlFor="city-price" className="text-sm font-medium text-gray-700">
                  Prix (FCFA)
                </Label>
                <Input
                  id="city-price"
                  type="number"
                  value={newCity.price || ''}
                  onChange={e => setNewCity({ ...newCity, price: parseInt(e.target.value) || 0 })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  placeholder="0"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Activer immédiatement
              </Label>
              <Switch
                checked={newCity.status === 'active'}
                onCheckedChange={(checked) =>
                  setNewCity({ ...newCity, status: checked ? 'active' : 'inactive' })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsAddCityModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleAddCity}
              disabled={!newCity.name}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier une ville - Design minimaliste */}
      <Dialog open={isEditCityModalOpen} onOpenChange={setIsEditCityModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Modifier la ville
            </DialogTitle>
          </DialogHeader>
          {selectedCity && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city-name" className="text-sm font-medium text-gray-700">
                  Nom
                </Label>
                <Input
                  id="edit-city-name"
                  value={selectedCity.name}
                  onChange={e => setSelectedCity({ ...selectedCity, name: e.target.value })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-city-category" className="text-sm font-medium text-gray-700">
                  Catégorie
                </Label>
                <Select
                  value={selectedCity.category}
                  onValueChange={value => setSelectedCity({ ...selectedCity, category: value })}
                >
                  <SelectTrigger id="edit-city-category" className="border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Centre">Centre</SelectItem>
                    <SelectItem value="Résidentiel">Résidentiel</SelectItem>
                    <SelectItem value="Populaire">Populaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Livraison gratuite
                </Label>
                <Switch
                  checked={selectedCity.isFree}
                  onCheckedChange={(checked) =>
                    setSelectedCity({ ...selectedCity, isFree: checked, price: checked ? 0 : selectedCity.price })
                  }
                />
              </div>

              {!selectedCity.isFree && (
                <div className="space-y-2">
                  <Label htmlFor="edit-city-price" className="text-sm font-medium text-gray-700">
                    Prix (FCFA)
                  </Label>
                  <Input
                    id="edit-city-price"
                    type="number"
                    value={selectedCity.price || ''}
                    onChange={e => setSelectedCity({ ...selectedCity, price: parseInt(e.target.value) || 0 })}
                    className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Ville active
                </Label>
                <Switch
                  checked={selectedCity.status === 'active'}
                  onCheckedChange={(checked) =>
                    setSelectedCity({ ...selectedCity, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsEditCityModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleUpdateCity}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajouter une ville de Banlieue - Design minimaliste */}
      <Dialog open={isAddBanlieueCityModalOpen} onOpenChange={setIsAddBanlieueCityModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Ajouter une ville de banlieue
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banlieue-city-name" className="text-sm font-medium text-gray-700">
                Nom
              </Label>
              <Input
                id="banlieue-city-name"
                value={newBanlieueCity.name}
                onChange={e => setNewBanlieueCity({ ...newBanlieueCity, name: e.target.value })}
                className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                placeholder="Nom de la ville"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banlieue-city-category" className="text-sm font-medium text-gray-700">
                Catégorie
              </Label>
              <Select
                value={newBanlieueCity.category}
                onValueChange={value => setNewBanlieueCity({ ...newBanlieueCity, category: value })}
              >
                <SelectTrigger id="banlieue-city-category" className="border-gray-300 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Banlieue">Banlieue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Délai de livraison
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="delivery-min" className="text-xs text-gray-500">
                    Min
                  </Label>
                  <Input
                    id="delivery-min"
                    type="number"
                    value={newBanlieueCity.deliveryTimeMin || ''}
                    onChange={e => setNewBanlieueCity({
                      ...newBanlieueCity,
                      deliveryTimeMin: parseInt(e.target.value) || 1
                    })}
                    className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-max" className="text-xs text-gray-500">
                    Max
                  </Label>
                  <Input
                    id="delivery-max"
                    type="number"
                    value={newBanlieueCity.deliveryTimeMax || ''}
                    onChange={e => setNewBanlieueCity({
                      ...newBanlieueCity,
                      deliveryTimeMax: parseInt(e.target.value) || 2
                    })}
                    className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                    min={newBanlieueCity.deliveryTimeMin || 1}
                  />
                </div>
              </div>
              <Select
                value={newBanlieueCity.deliveryTimeUnit}
                onValueChange={value => setNewBanlieueCity({
                  ...newBanlieueCity,
                  deliveryTimeUnit: value as 'heures' | 'jours'
                })}
              >
                <SelectTrigger className="border-gray-300 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heures">Heures</SelectItem>
                  <SelectItem value="jours">Jours</SelectItem>
                </SelectContent>
              </Select>
              {!validateDeliveryTime(newBanlieueCity.deliveryTimeMin, newBanlieueCity.deliveryTimeMax, newBanlieueCity.deliveryTimeUnit) && (
                <p className="text-xs text-red-600">
                  Le délai maximum doit être supérieur ou égal au minimum
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Livraison gratuite
              </Label>
              <Switch
                checked={newBanlieueCity.isFree}
                onCheckedChange={(checked) =>
                  setNewBanlieueCity({ ...newBanlieueCity, isFree: checked, price: checked ? 0 : newBanlieueCity.price })
                }
              />
            </div>

            {!newBanlieueCity.isFree && (
              <div className="space-y-2">
                <Label htmlFor="banlieue-city-price" className="text-sm font-medium text-gray-700">
                  Prix (FCFA)
                </Label>
                <Input
                  id="banlieue-city-price"
                  type="number"
                  value={newBanlieueCity.price || ''}
                  onChange={e => setNewBanlieueCity({ ...newBanlieueCity, price: parseInt(e.target.value) || 0 })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  placeholder="0"
                />
                {!validatePrice(newBanlieueCity.price) && (
                  <p className="text-xs text-red-600">
                    Le prix doit être entre 0 et 50,000 FCFA
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Activer immédiatement
              </Label>
              <Switch
                checked={newBanlieueCity.status === 'active'}
                onCheckedChange={(checked) =>
                  setNewBanlieueCity({ ...newBanlieueCity, status: checked ? 'active' : 'inactive' })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsAddBanlieueCityModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleAddBanlieueCity}
              disabled={
                !newBanlieueCity.name ||
                !validateDeliveryTime(newBanlieueCity.deliveryTimeMin, newBanlieueCity.deliveryTimeMax, newBanlieueCity.deliveryTimeUnit) ||
                (!newBanlieueCity.isFree && !validatePrice(newBanlieueCity.price))
              }
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier une ville de Banlieue - Design minimaliste */}
      <Dialog open={isEditBanlieueCityModalOpen} onOpenChange={setIsEditBanlieueCityModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Modifier la ville de banlieue
            </DialogTitle>
          </DialogHeader>
          {selectedBanlieueCity && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-banlieue-city-name" className="text-sm font-medium text-gray-700">
                  Nom
                </Label>
                <Input
                  id="edit-banlieue-city-name"
                  value={selectedBanlieueCity.name}
                  onChange={e => setSelectedBanlieueCity({ ...selectedBanlieueCity, name: e.target.value })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-banlieue-city-category" className="text-sm font-medium text-gray-700">
                  Catégorie
                </Label>
                <Select
                  value={selectedBanlieueCity.category}
                  onValueChange={value => setSelectedBanlieueCity({ ...selectedBanlieueCity, category: value })}
                >
                  <SelectTrigger id="edit-banlieue-city-category" className="border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Banlieue">Banlieue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Délai de livraison
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-delivery-min" className="text-xs text-gray-500">
                      Min
                    </Label>
                    <Input
                      id="edit-delivery-min"
                      type="number"
                      value={selectedBanlieueCity.deliveryTimeMin || ''}
                      onChange={e => setSelectedBanlieueCity({
                        ...selectedBanlieueCity,
                        deliveryTimeMin: parseInt(e.target.value) || 1
                      })}
                      className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-delivery-max" className="text-xs text-gray-500">
                      Max
                    </Label>
                    <Input
                      id="edit-delivery-max"
                      type="number"
                      value={selectedBanlieueCity.deliveryTimeMax || ''}
                      onChange={e => setSelectedBanlieueCity({
                        ...selectedBanlieueCity,
                        deliveryTimeMax: parseInt(e.target.value) || 2
                      })}
                      className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                      min={selectedBanlieueCity.deliveryTimeMin || 1}
                    />
                  </div>
                </div>
                <Select
                  value={selectedBanlieueCity.deliveryTimeUnit || 'heures'}
                  onValueChange={value => setSelectedBanlieueCity({
                    ...selectedBanlieueCity,
                    deliveryTimeUnit: value as 'heures' | 'jours'
                  })}
                >
                  <SelectTrigger className="border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heures">Heures</SelectItem>
                    <SelectItem value="jours">Jours</SelectItem>
                  </SelectContent>
                </Select>
                {!validateDeliveryTime(selectedBanlieueCity.deliveryTimeMin || 1, selectedBanlieueCity.deliveryTimeMax || 2, selectedBanlieueCity.deliveryTimeUnit || 'heures') && (
                  <p className="text-xs text-red-600">
                    Le délai maximum doit être supérieur ou égal au minimum
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Livraison gratuite
                </Label>
                <Switch
                  checked={selectedBanlieueCity.isFree}
                  onCheckedChange={(checked) =>
                    setSelectedBanlieueCity({ ...selectedBanlieueCity, isFree: checked, price: checked ? 0 : selectedBanlieueCity.price })
                  }
                />
              </div>

              {!selectedBanlieueCity.isFree && (
                <div className="space-y-2">
                  <Label htmlFor="edit-banlieue-city-price" className="text-sm font-medium text-gray-700">
                    Prix (FCFA)
                  </Label>
                  <Input
                    id="edit-banlieue-city-price"
                    type="number"
                    value={selectedBanlieueCity.price || ''}
                    onChange={e => setSelectedBanlieueCity({ ...selectedBanlieueCity, price: parseInt(e.target.value) || 0 })}
                    className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  />
                  {!validatePrice(selectedBanlieueCity.price) && (
                    <p className="text-xs text-red-600">
                      Le prix doit être entre 0 et 50,000 FCFA
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Ville active
                </Label>
                <Switch
                  checked={selectedBanlieueCity.status === 'active'}
                  onCheckedChange={(checked) =>
                    setSelectedBanlieueCity({ ...selectedBanlieueCity, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsEditBanlieueCityModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleUpdateBanlieueCity}
              disabled={
                !selectedBanlieueCity ||
                !validateDeliveryTime(selectedBanlieueCity.deliveryTimeMin || 1, selectedBanlieueCity.deliveryTimeMax || 2, selectedBanlieueCity.deliveryTimeUnit || 'heures') ||
                (!selectedBanlieueCity.isFree && !validatePrice(selectedBanlieueCity.price))
              }
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier une région - Design minimaliste */}
      <Dialog open={isEditRegionModalOpen} onOpenChange={setIsEditRegionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Modifier la région
            </DialogTitle>
          </DialogHeader>
          {selectedRegion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Nom de la région
                </Label>
                <Input
                  value={selectedRegion.name}
                  disabled
                  className="border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Délai de livraison
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">
                      Min
                    </Label>
                    <Input
                      type="number"
                      value={selectedRegion.deliveryTimeMin}
                      onChange={e => setSelectedRegion({
                        ...selectedRegion,
                        deliveryTimeMin: parseInt(e.target.value) || 1
                      })}
                      className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Max
                    </Label>
                    <Input
                      type="number"
                      value={selectedRegion.deliveryTimeMax}
                      onChange={e => setSelectedRegion({
                        ...selectedRegion,
                        deliveryTimeMax: parseInt(e.target.value) || 2
                      })}
                      className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                      min={selectedRegion.deliveryTimeMin || 1}
                    />
                  </div>
                </div>
                <Select
                  value={selectedRegion.deliveryTimeUnit}
                  onValueChange={value => setSelectedRegion({
                    ...selectedRegion,
                    deliveryTimeUnit: value as 'heures' | 'jours'
                  })}
                >
                  <SelectTrigger className="border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heures">Heures</SelectItem>
                    <SelectItem value="jours">Jours</SelectItem>
                  </SelectContent>
                </Select>
                {!validateDeliveryTime(selectedRegion.deliveryTimeMin || 1, selectedRegion.deliveryTimeMax || 2, selectedRegion.deliveryTimeUnit || 'heures') && (
                  <p className="text-xs text-red-600">
                    Le délai maximum doit être supérieur ou égal au minimum
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Prix de livraison (FCFA)
                </Label>
                <Input
                  type="number"
                  value={selectedRegion.price}
                  onChange={e => setSelectedRegion({ ...selectedRegion, price: parseInt(e.target.value) || 0 })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  min="0"
                  max="50000"
                />
                {!validatePrice(selectedRegion.price) && (
                  <p className="text-xs text-red-600">
                    Le prix doit être entre 0 et 50,000 FCFA
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Villes principales (séparées par des virgules)
                </Label>
                <textarea
                  value={selectedRegion.mainCities}
                  onChange={e => setSelectedRegion({ ...selectedRegion, mainCities: e.target.value })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600 w-full h-20 resize-none p-2"
                  placeholder="Ex: Dakar, Plateau, Médina"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Région active
                </Label>
                <Switch
                  checked={selectedRegion.status === 'active'}
                  onCheckedChange={(checked) =>
                    setSelectedRegion({ ...selectedRegion, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsEditRegionModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleUpdateRegion}
              disabled={
                !selectedRegion ||
                !validateDeliveryTime(selectedRegion.deliveryTimeMin || 1, selectedRegion.deliveryTimeMax || 2, selectedRegion.deliveryTimeUnit || 'heures') ||
                !validatePrice(selectedRegion.price)
              }
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajouter une zone internationale - Design minimaliste */}
      <Dialog open={isAddZoneModalOpen} onOpenChange={setIsAddZoneModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Ajouter une zone internationale
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zone-name" className="text-sm font-medium text-gray-700">
                Nom de la zone
              </Label>
              <Input
                id="zone-name"
                value={newZone.name}
                onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                placeholder="Ex: Zone Europe, Zone Asie"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Pays inclus
              </Label>
              <div className="relative">
                <Input
                  value={countryInput}
                  onChange={e => handleCountryInputChange(e.target.value)}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Commencer à taper un pays..."
                  onFocus={() => setShowCountrySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
                />
                {showCountrySuggestions && filteredCountries.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto z-10">
                    {filteredCountries.map((country, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 first:rounded-t-md"
                        onClick={() => handleAddCountry(country)}
                      >
                        {country}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {newZone.countries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newZone.countries.map((country, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                    >
                      {country}
                      <button
                        onClick={() => handleRemoveCountry(country)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Délai de livraison (en jours)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">
                    Min
                  </Label>
                  <Input
                    type="number"
                    value={newZone.deliveryTimeMin}
                    onChange={e => setNewZone({ ...newZone, deliveryTimeMin: parseInt(e.target.value) || 1 })}
                    className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Max
                  </Label>
                  <Input
                    type="number"
                    value={newZone.deliveryTimeMax}
                    onChange={e => setNewZone({ ...newZone, deliveryTimeMax: parseInt(e.target.value) || 2 })}
                    className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                    min={newZone.deliveryTimeMin || 1}
                  />
                </div>
              </div>
              {newZone.deliveryTimeMax < newZone.deliveryTimeMin && (
                <p className="text-xs text-red-600">
                  Le délai maximum doit être supérieur ou égal au minimum
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Prix de livraison (FCFA)
              </Label>
              <Input
                type="number"
                value={newZone.price}
                onChange={e => setNewZone({ ...newZone, price: parseInt(e.target.value) || 0 })}
                className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                placeholder="10000"
                min="0"
                max="100000"
              />
              {newZone.price < 0 || newZone.price > 100000 ? (
                <p className="text-xs text-red-600">
                  Le prix doit être entre 0 et 100,000 FCFA
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Prix recommandé: 10,000 - 50,000 FCFA selon la zone
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Zone active
              </Label>
              <Switch
                checked={newZone.status === 'active'}
                onCheckedChange={(checked) =>
                  setNewZone({ ...newZone, status: checked ? 'active' : 'inactive' })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsAddZoneModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleAddZone}
              disabled={
                !newZone.name ||
                newZone.countries.length === 0 ||
                newZone.deliveryTimeMax < newZone.deliveryTimeMin ||
                newZone.price < 0 || newZone.price > 100000
              }
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ajouter la zone
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier une zone internationale - Design minimaliste */}
      <Dialog open={isEditZoneModalOpen} onOpenChange={setIsEditZoneModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-gray-200 rounded-lg p-6">
          <DialogHeader className="space-y-2 pb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Modifier la zone internationale
            </DialogTitle>
          </DialogHeader>
          {selectedZone && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Nom de la zone
                </Label>
                <Input
                  value={selectedZone.name}
                  onChange={e => setSelectedZone({ ...selectedZone, name: e.target.value })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Pays inclus ({selectedZone.countries.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedZone.countries.map((country, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                    >
                      {country}
                      <button
                        onClick={() => setSelectedZone({
                          ...selectedZone,
                          countries: selectedZone.countries.filter((_, i) => i !== index)
                        })}
                        className="text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Note: Pour ajouter un pays, supprimez la zone et recréez-la
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Délai de livraison (en jours)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">
                      Min
                    </Label>
                    <Input
                      type="number"
                      value={selectedZone.deliveryTimeMin}
                      onChange={e => setSelectedZone({ ...selectedZone, deliveryTimeMin: parseInt(e.target.value) || 1 })}
                      className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Max
                    </Label>
                    <Input
                      type="number"
                      value={selectedZone.deliveryTimeMax}
                      onChange={e => setSelectedZone({ ...selectedZone, deliveryTimeMax: parseInt(e.target.value) || 2 })}
                      className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                      min={selectedZone.deliveryTimeMin || 1}
                    />
                  </div>
                </div>
                {selectedZone.deliveryTimeMax < selectedZone.deliveryTimeMin && (
                  <p className="text-xs text-red-600">
                    Le délai maximum doit être supérieur ou égal au minimum
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Prix de livraison (FCFA)
                </Label>
                <Input
                  type="number"
                  value={selectedZone.price}
                  onChange={e => setSelectedZone({ ...selectedZone, price: parseInt(e.target.value) || 0 })}
                  className="border-gray-300 rounded-md focus:border-blue-600 focus:ring-blue-600"
                  min="0"
                  max="100000"
                />
                {selectedZone.price < 0 || selectedZone.price > 100000 ? (
                  <p className="text-xs text-red-600">
                    Le prix doit être entre 0 et 100,000 FCFA
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Prix recommandé: 10,000 - 50,000 FCFA selon la zone
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Zone active
                </Label>
                <Switch
                  checked={selectedZone.status === 'active'}
                  onCheckedChange={(checked) =>
                    setSelectedZone({ ...selectedZone, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4">
            <button
              onClick={() => setIsEditZoneModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleUpdateZone}
              disabled={
                !selectedZone ||
                selectedZone.countries.length === 0 ||
                selectedZone.deliveryTimeMax < selectedZone.deliveryTimeMin ||
                selectedZone.price < 0 || selectedZone.price > 100000
              }
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Transporteur */}
      <Dialog open={isAddTransporteurModalOpen} onOpenChange={setIsAddTransporteurModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un transporteur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau transporteur avec ses informations de base et ses zones de livraison
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transporteur-name">Nom du transporteur</Label>
                <Input
                  id="transporteur-name"
                  value={newTransporteur.name}
                  onChange={(e) => setNewTransporteur({ ...newTransporteur, name: e.target.value })}
                  placeholder="DHL Express, FedEx, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="transporteur-logo">URL du logo (optionnel)</Label>
                <Input
                  id="transporteur-logo"
                  value={newTransporteur.logoUrl}
                  onChange={(e) => setNewTransporteur({ ...newTransporteur, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.svg"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="transporteur-status">Statut</Label>
              <Select
                value={newTransporteur.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setNewTransporteur({ ...newTransporteur, status: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Zones de livraison disponibles *</Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                Sélectionnez au moins une zone de livraison (obligatoire)
              </p>
              <div className="space-y-2">
                {internationalZones.map((zone) => (
                  <label key={zone.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newTransporteur.deliveryZones.includes(zone.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTransporteur({
                            ...newTransporteur,
                            deliveryZones: [...newTransporteur.deliveryZones, zone.name]
                          });
                        } else {
                          setNewTransporteur({
                            ...newTransporteur,
                            deliveryZones: newTransporteur.deliveryZones.filter(z => z !== zone.name)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{zone.name}</span>
                    <span className="text-xs text-gray-500">({zone.countries.length} pays)</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTransporteurModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddTransporteur}
              disabled={!newTransporteur.name || newTransporteur.deliveryZones.length === 0}
            >
              Ajouter le transporteur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modification Transporteur */}
      <Dialog open={isEditTransporteurModalOpen} onOpenChange={setIsEditTransporteurModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le transporteur</DialogTitle>
            <DialogDescription>
              Modifiez les informations du transporteur
            </DialogDescription>
          </DialogHeader>
          {selectedTransporteur && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-transporteur-name">Nom du transporteur</Label>
                  <Input
                    id="edit-transporteur-name"
                    value={selectedTransporteur.name}
                    onChange={(e) => setSelectedTransporteur({ ...selectedTransporteur, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-transporteur-logo">URL du logo (optionnel)</Label>
                  <Input
                    id="edit-transporteur-logo"
                    value={selectedTransporteur.logoUrl}
                    onChange={(e) => setSelectedTransporteur({ ...selectedTransporteur, logoUrl: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-transporteur-status">Statut</Label>
                <Select
                  value={selectedTransporteur.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setSelectedTransporteur({ ...selectedTransporteur, status: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Zones de livraison *</Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Sélectionnez au moins une zone de livraison (obligatoire)
                </p>
                <div className="space-y-2">
                  {internationalZones.map((zone) => (
                    <label key={zone.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTransporteur.deliveryZones.includes(zone.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransporteur({
                              ...selectedTransporteur,
                              deliveryZones: [...selectedTransporteur.deliveryZones, zone.name]
                            });
                          } else {
                            setSelectedTransporteur({
                              ...selectedTransporteur,
                              deliveryZones: selectedTransporteur.deliveryZones.filter(z => z !== zone.name)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{zone.name}</span>
                      <span className="text-xs text-gray-500">({zone.countries.length} pays)</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTransporteurModalOpen(false);
                setSelectedTransporteur(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateTransporteur}
              disabled={!selectedTransporteur?.name || selectedTransporteur?.deliveryZones.length === 0}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Tarif */}
      <Dialog open={isAddTarifModalOpen} onOpenChange={setIsAddTarifModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un tarif</DialogTitle>
            <DialogDescription>
              Définissez les tarifs pour une zone et un transporteur spécifiques
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tarif-zone">Zone de livraison *</Label>
              <Select value={newTarif.zoneId} onValueChange={handleZoneChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionnez une zone" />
                </SelectTrigger>
                <SelectContent>
                  {internationalZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} ({zone.countries.length} pays)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tarif-transporteur">Transporteur *</Label>
              <Select value={newTarif.transporteurId} onValueChange={handleTransporteurChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionnez un transporteur" />
                </SelectTrigger>
                <SelectContent>
                  {transporteurs.filter(t => t.status === 'active').map((transporteur) => (
                    <SelectItem key={transporteur.id} value={transporteur.id}>
                      {transporteur.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prix-transporteur">Prix transporteur (FCFA)</Label>
                <Input
                  id="prix-transporteur"
                  type="number"
                  value={newTarif.prixTransporteur}
                  onChange={(e) => setNewTarif({ ...newTarif, prixTransporteur: parseInt(e.target.value) || 0 })}
                  placeholder="15000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="prix-standard">Prix standard (FCFA)</Label>
                <Input
                  id="prix-standard"
                  type="number"
                  value={newTarif.prixStandardInternational}
                  onChange={(e) => setNewTarif({ ...newTarif, prixStandardInternational: parseInt(e.target.value) || 0 })}
                  placeholder="20000"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delai-min">Délai min (jours)</Label>
                <Input
                  id="delai-min"
                  type="number"
                  min="1"
                  value={newTarif.delaiLivraisonMin}
                  onChange={(e) => setNewTarif({ ...newTarif, delaiLivraisonMin: parseInt(e.target.value) || 1 })}
                  placeholder="3"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="delai-max">Délai max (jours)</Label>
                <Input
                  id="delai-max"
                  type="number"
                  min="1"
                  value={newTarif.delaiLivraisonMax}
                  onChange={(e) => setNewTarif({ ...newTarif, delaiLivraisonMax: parseInt(e.target.value) || 1 })}
                  placeholder="7"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tarif-status">Statut</Label>
              <Select
                value={newTarif.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setNewTarif({ ...newTarif, status: value })
                }
              >
                <SelectTrigger className="mt-1">
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
              onClick={() => setIsAddTarifModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddTarif}
              disabled={!newTarif.zoneId || !newTarif.transporteurId}
            >
              Ajouter le tarif
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modification Tarif */}
      <Dialog open={isEditTarifModalOpen} onOpenChange={setIsEditTarifModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le tarif</DialogTitle>
            <DialogDescription>
              Modifiez les tarifs pour cette zone et ce transporteur
            </DialogDescription>
          </DialogHeader>
          {selectedTarif && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-tarif-zone">Zone de livraison</Label>
                <Select
                  value={selectedTarif.zoneId}
                  onValueChange={(value) => {
                    const zone = internationalZones.find(z => z.id === value);
                    if (zone) {
                      setSelectedTarif({
                        ...selectedTarif,
                        zoneId: value,
                        zoneName: zone.name
                      });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {internationalZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name} ({zone.countries.length} pays)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-tarif-transporteur">Transporteur</Label>
                <Select
                  value={selectedTarif.transporteurId}
                  onValueChange={(value) => {
                    const transporteur = transporteurs.find(t => t.id === value);
                    if (transporteur) {
                      setSelectedTarif({
                        ...selectedTarif,
                        transporteurId: value,
                        transporteurName: transporteur.name
                      });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transporteurs.map((transporteur) => (
                      <SelectItem key={transporteur.id} value={transporteur.id}>
                        {transporteur.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-prix-transporteur">Prix transporteur (FCFA)</Label>
                  <Input
                    id="edit-prix-transporteur"
                    type="number"
                    value={selectedTarif.prixTransporteur}
                    onChange={(e) => setSelectedTarif({ ...selectedTarif, prixTransporteur: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-prix-standard">Prix standard (FCFA)</Label>
                  <Input
                    id="edit-prix-standard"
                    type="number"
                    value={selectedTarif.prixStandardInternational}
                    onChange={(e) => setSelectedTarif({ ...selectedTarif, prixStandardInternational: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-delai-min">Délai min (jours)</Label>
                  <Input
                    id="edit-delai-min"
                    type="number"
                    min="1"
                    value={selectedTarif.delaiLivraisonMin}
                    onChange={(e) => setSelectedTarif({ ...selectedTarif, delaiLivraisonMin: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-delai-max">Délai max (jours)</Label>
                  <Input
                    id="edit-delai-max"
                    type="number"
                    min="1"
                    value={selectedTarif.delaiLivraisonMax}
                    onChange={(e) => setSelectedTarif({ ...selectedTarif, delaiLivraisonMax: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-tarif-status">Statut</Label>
                <Select
                  value={selectedTarif.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setSelectedTarif({ ...selectedTarif, status: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTarifModalOpen(false);
                setSelectedTarif(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateTarif}
              disabled={!selectedTarif?.zoneId || !selectedTarif?.transporteurId}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZonesLivraisonPage;
