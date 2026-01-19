import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Frame,
  Eye,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  MoreVertical,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import posterService from '../../services/posterService';
import designService from '../../services/designService';

// Type Design basé sur VendorDesignsPage
interface Design {
  id: number;
  vendorId: number;
  name: string;
  description?: string;
  price: number;
  themeId: number;
  categoryId?: number;
  themeName?: string;
  imageUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  isPublished: boolean;
  isPending: boolean;
  isDraft: boolean;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  validatedAt?: string;
  validatorName?: string;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  publishedAt?: string;
  isDelete: boolean;
  views: number;
  likes: number;
  earnings: number;
  usageCount: number;
  tags: string[];
  products?: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Service pour récupérer les designs du vendeur (même approche que VendorDesignsPage)
class VendorDesignService {
  private apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/vendor/designs`;

  private getFetchOptions(method: string = 'GET', body?: any): RequestInit {
    const options: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    return options;
  }

  private async handleError(response: Response) {
    if (response.ok) return;

    let errorData;
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      errorData = await response.json();
      errorMessage = `HTTP ${response.status}: ${errorData.message || (errorData.error ? `${errorData.error}: ${JSON.stringify(errorData.details || {})}` : JSON.stringify(errorData))}`;
    } catch (e) {
      // Ignore si le body n'est pas JSON
    }

    throw new Error(errorMessage);
  }

  async getMyDesigns(filters: {
    offset?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { designs: Design[]; pagination: any; stats: any } }> {
    const params = new URLSearchParams();
    if (filters.offset !== undefined) params.append('offset', filters.offset.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${this.apiUrl}?${params}`,
      this.getFetchOptions('GET')
    );

    await this.handleError(response);
    const result = await response.json();

    return {
      success: result.success,
      data: {
        designs: result.data.designs.map((design: any) => ({
          ...design,
          validationStatus: design.isValidated ? 'VALIDATED' :
                          design.isPending ? 'PENDING' :
                          design.isDraft ? 'DRAFT' : 'DRAFT',
          views: design.views || 0,
          likes: design.likes || 0,
          earnings: design.earnings || 0,
          usageCount: design.linkedProducts || 0,
          price: design.price || 0,
          dimensions: design.dimensions || { width: 0, height: 0 },
          fileSize: design.fileSize || 0
        })),
        pagination: result.data.pagination,
        stats: result.data.stats
      }
    };
  }
}

const vendorDesignService = new VendorDesignService();

// Types basés sur PosterProduct
interface PosterProduct {
  id: number;
  vendorId: number;
  designId: number;
  name: string;
  description: string | null;
  sku: string;
  formatId: string;
  width: number;
  height: number;
  finish: 'MAT' | 'GLOSSY' | 'CANVAS' | 'FINE_ART';
  frame: 'NO_FRAME' | 'BLACK_FRAME' | 'WHITE_FRAME' | 'WOOD_FRAME' | 'GOLD_FRAME';
  imageUrl: string | null;
  finalPrice: number;
  stockQuantity: number;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  design?: Design;
  createdAt: string;
  updatedAt: string;
}

// Formats disponibles
const POSTER_FORMATS = [
  { id: 'A5', name: 'A5', width: 14.8, height: 21.0 },
  { id: 'A4', name: 'A4', width: 21.0, height: 29.7 },
  { id: 'A3', name: 'A3', width: 29.7, height: 42.0 },
  { id: 'A2', name: 'A2', width: 42.0, height: 59.4 },
  { id: 'A1', name: 'A1', width: 59.4, height: 84.1 },
  { id: '30x40', name: '30×40 cm', width: 30.0, height: 40.0 },
  { id: '40x50', name: '40×50 cm', width: 40.0, height: 50.0 },
  { id: '50x70', name: '50×70 cm', width: 50.0, height: 70.0 },
  { id: '70x100', name: '70×100 cm', width: 70.0, height: 100.0 },
];

enum PosterStatus {
  ALL = 'ALL',
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export const VendorPostersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [posters, setPosters] = useState<PosterProduct[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PosterStatus>(PosterStatus.ALL);
  const [filterFormat, setFilterFormat] = useState<string>('ALL');
  const [filteredPosters, setFilteredPosters] = useState<PosterProduct[]>([]);

  // États pour les modales
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [posterToDelete, setPosterToDelete] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<PosterProduct | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingPosterId, setCreatingPosterId] = useState<string | number | null>(null);

  // Calculer les stats
  const stats = posters.length > 0 ? {
    total: posters.length,
    pending: posters.filter(p => p.status === 'PENDING').length,
    validated: posters.filter(p => p.status === 'VALIDATED').length,
    rejected: posters.filter(p => p.status === 'REJECTED').length,
    archived: posters.filter(p => p.status === 'ARCHIVED').length,
  } : {
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0,
    archived: 0,
  };

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🚀 [Posters] Début du chargement des données...');

      const postersResponse = await posterService.getVendorPosters().catch(err => {
        console.error('❌ [Posters] Erreur chargement posters:', err);
        return [];
      });

      console.log('📦 [Posters] Posters chargés:', postersResponse.length);

      const designsResponse = await designService.getDesigns({ status: 'all', limit: 500 });

      console.log('📦 [Posters] Réponse designs complète:', designsResponse);
      console.log('📦 [Posters] Designs chargés:', designsResponse.designs?.length || 0);
      console.log('📦 [Posters] Type de designsResponse:', typeof designsResponse);
      console.log('📦 [Posters] Clés de designsResponse:', Object.keys(designsResponse));

      setPosters(postersResponse);

      // Filtrer uniquement les designs validés et publiés (EXACTEMENT comme les stickers)
      const allDesigns = designsResponse.designs || [];
      console.log('📦 [Posters] Tous les designs:', allDesigns.map((d: Design) => ({
        id: d.id,
        name: d.name,
        isPublished: d.isPublished,
        isValidated: d.isValidated,
        isPending: d.isPending,
        isDraft: d.isDraft
      })));

      const validatedDesigns = allDesigns.filter((design: Design) => {
        const isValid = design.isPublished === true || design.isValidated === true;
        console.log(`Design "${design.name}":`, {
          isPublished: design.isPublished,
          isValidated: design.isValidated,
          result: isValid ? '✅ VALIDE' : '❌ NON VALIDE'
        });
        return isValid;
      });

      console.log('✅ [Posters] Designs validés trouvés:', validatedDesigns.length);
      setDesigns(validatedDesigns);
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de charger les données'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Créer un poster à partir d'un design (configuration par défaut simple)
  const handleCreatePoster = async (design: Design) => {
    try {
      setCreatingPosterId(design.id);

      // Configuration par défaut : A4, Mat, Sans cadre
      const format = { id: 'A4', width: 21.0, height: 29.7, basePrice: 800 };
      const finish = 'MAT';
      const frame = 'NO_FRAME';

      // Calcul du prix
      const finishMultiplier = 1.0; // Mat = 1.0
      const framePrice = 0; // NO_FRAME = 0
      const designPrice = design.price || 0;
      const basePrice = format.basePrice * finishMultiplier;
      const totalPrice = Math.round(basePrice + framePrice + designPrice);

      console.log('💰 [Posters] Calcul prix:', {
        basePrice: format.basePrice,
        finishMultiplier,
        framePrice,
        designPrice,
        total: totalPrice
      });

      // Payload pour l'API
      const posterPayload = {
        designId: design.id,
        name: `Poster ${format.id} - ${design.name}`,
        description: design.description || `Poster personnalisé avec le design ${design.name}`,
        formatId: format.id,
        width: format.width,
        height: format.height,
        finish: finish,
        frame: frame,
        price: totalPrice,
        stockQuantity: 20
      };

      console.log('📦 [Posters] Création poster:', posterPayload);

      // Toast de chargement
      toast.loading('⏳ Génération du poster en cours...', {
        id: 'creating-poster',
        description: 'Le serveur génère l\'image du poster...'
      });

      // Appel API
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      const response = await fetch(`${API_BASE_URL}/vendor/posters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(posterPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Posters] Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || `Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [Posters] Poster créé:', result);

      toast.dismiss('creating-poster');
      toast.success(`✅ Poster créé: ${posterPayload.name}`, {
        description: `Prix: ${totalPrice.toLocaleString()} FCFA - Format ${format.id}`,
        duration: 4000
      });

      // Fermer le dialog et recharger la liste
      setCreateDialogOpen(false);
      await loadData();

    } catch (error: any) {
      console.error('❌ [Posters] Erreur création:', error);
      toast.dismiss('creating-poster');
      toast.error('Erreur lors de la création du poster', {
        description: error.message || 'Impossible de créer le poster'
      });
    } finally {
      setCreatingPosterId(null);
    }
  };

  // Filtrer les posters
  useEffect(() => {
    let filtered = [...posters];

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(poster =>
        poster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (poster.description && poster.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        poster.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (filterStatus !== PosterStatus.ALL) {
      filtered = filtered.filter(poster => poster.status === filterStatus);
    }

    // Filtrer par format
    if (filterFormat !== 'ALL') {
      filtered = filtered.filter(poster => poster.formatId === filterFormat);
    }

    setFilteredPosters(filtered);
  }, [posters, searchTerm, filterStatus, filterFormat]);

  // Helper pour obtenir le badge de statut
  const getPosterStatusInfo = (poster: PosterProduct) => {
    switch (poster.status) {
      case 'VALIDATED':
        return {
          badge: <Badge className="bg-green-100 text-green-800 border-green-300">✅ Validé</Badge>,
          explanation: "Ce poster a été validé par l'administration et est disponible à la vente."
        };
      case 'PENDING':
        return {
          badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ En attente</Badge>,
          explanation: "Ce poster est en attente de validation par l'administration."
        };
      case 'REJECTED':
        return {
          badge: <Badge className="bg-red-100 text-red-800 border-red-300">❌ Rejeté</Badge>,
          explanation: "Ce poster a été rejeté par l'administration."
        };
      case 'ARCHIVED':
        return {
          badge: <Badge className="bg-gray-100 text-gray-800 border-gray-300">📦 Archivé</Badge>,
          explanation: "Ce poster est archivé et n'est plus visible."
        };
      default:
        return {
          badge: <Badge variant="secondary">Inconnu</Badge>,
          explanation: "Statut inconnu."
        };
    }
  };

  // Supprimer un poster
  const confirmDelete = async () => {
    if (!posterToDelete) return;

    try {
      await posterService.deletePoster(posterToDelete);
      toast.success('Poster supprimé avec succès');
      loadData();
      setDeleteModalOpen(false);
      setPosterToDelete(null);
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le poster'
      });
    }
  };

  const handleViewDetails = (poster: PosterProduct) => {
    setSelectedPoster(poster);
    setDetailsModalOpen(true);
  };

  // Poster Card Component
  const PosterCard: React.FC<{ poster: PosterProduct }> = ({ poster }) => {
    const statusInfo = getPosterStatusInfo(poster);
    const format = POSTER_FORMATS.find(f => f.id === poster.formatId);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="overflow-hidden border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg bg-white">
          <div className="relative aspect-[3/4] overflow-hidden">
            {poster.imageUrl ? (
              <img
                src={poster.imageUrl}
                alt={poster.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
                <Frame className="h-16 w-16 text-purple-300" />
              </div>
            )}

            {/* Badge de statut */}
            <div className="absolute top-2 left-2">
              {statusInfo.badge}
            </div>

            {/* Actions rapides */}
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                  <DropdownMenuItem
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(poster)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={() => {
                      setPosterToDelete(poster.id);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{poster.name}</h3>
                {poster.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{poster.description}</p>
                )}
              </div>

              {/* Détails techniques */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-3 w-3" />
                <span>{format?.name || poster.formatId}</span>
                <span>•</span>
                <span>{poster.width}×{poster.height} cm</span>
              </div>

              {/* Prix */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {poster.finalPrice.toLocaleString()} FCFA
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {poster.stockQuantity}
                </span>
              </div>

              {/* SKU */}
              <div className="text-xs text-gray-400">
                SKU: {poster.sku}
              </div>

              {/* Explication statut */}
              {poster.status === 'PENDING' && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      {statusInfo.explanation}
                    </p>
                  </div>
                </div>
              )}

              {poster.status === 'VALIDATED' && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700">
                      {statusInfo.explanation}
                    </p>
                  </div>
                </div>
              )}

              {poster.status === 'REJECTED' && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                      {statusInfo.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-black">
                  Mes Tableaux/Posters
                </h1>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                  Créez et vendez vos designs en format poster haute qualité
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un poster
              </Button>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 border-gray-200 hover:border-black transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-black">{stats.total}</p>
                  </div>
                  <Frame className="h-6 w-6 text-gray-400" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 border-gray-200 hover:border-black transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-black">{stats.pending}</p>
                  </div>
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 border-gray-200 hover:border-black transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Validés</p>
                    <p className="text-2xl font-bold text-black">{stats.validated}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 border-gray-200 hover:border-black transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rejetés</p>
                    <p className="text-2xl font-bold text-black">{stats.rejected}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-4xl">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher vos posters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                />
              </div>

              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PosterStatus)}>
                <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value={PosterStatus.ALL}>Tous les statuts</SelectItem>
                  <SelectItem value={PosterStatus.PENDING}>En attente</SelectItem>
                  <SelectItem value={PosterStatus.VALIDATED}>Validés</SelectItem>
                  <SelectItem value={PosterStatus.REJECTED}>Rejetés</SelectItem>
                  <SelectItem value={PosterStatus.ARCHIVED}>Archivés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="ALL">Tous les formats</SelectItem>
                  {POSTER_FORMATS.map(format => (
                    <SelectItem key={format.id} value={format.id}>{format.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </motion.div>
          ) : filteredPosters.length > 0 ? (
            <motion.div
              key="posters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredPosters.map((poster) => (
                <PosterCard key={poster.id} poster={poster} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <Frame className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== PosterStatus.ALL || filterFormat !== 'ALL'
                  ? 'Aucun poster trouvé'
                  : 'Créez votre premier poster'
                }
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== PosterStatus.ALL || filterFormat !== 'ALL'
                  ? 'Essayez de modifier vos filtres de recherche ou créez un nouveau poster.'
                  : 'Commencez par créer des designs, puis transformez-les en posters.'
                }
              </p>
              {filterStatus === PosterStatus.ALL && filterFormat === 'ALL' && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier poster
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de création de poster */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-black">Créer un nouveau poster</DialogTitle>
            <DialogDescription className="text-gray-600">
              Sélectionnez un design et configurez votre poster
            </DialogDescription>
          </DialogHeader>

          {designs.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">
                Vous devez d'abord créer et publier des designs avant de pouvoir créer des posters.
              </p>
              <Button
                onClick={() => {
                  setCreateDialogOpen(false);
                  navigate('/vendeur/designs');
                }}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Aller à Mes Designs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Sélectionnez un design parmi vos {designs.length} designs publiés pour créer un poster.
              </p>
              <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {designs.slice(0, 12).map((design) => (
                  <button
                    key={design.id}
                    onClick={() => handleCreatePoster(design)}
                    disabled={creatingPosterId === design.id}
                    className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={design.thumbnailUrl || design.imageUrl}
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                        <p className="text-xs font-medium truncate">{design.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {designs.length > 12 && (
                <p className="text-sm text-gray-500 text-center">
                  Et {designs.length - 12} autres designs disponibles...
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails du poster */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-black">Détails du poster</DialogTitle>
            <DialogDescription className="text-gray-600">
              Informations complètes sur votre poster
            </DialogDescription>
          </DialogHeader>

          {selectedPoster && (
            <div className="space-y-6">
              {/* Image du poster */}
              <div className="flex justify-center">
                {selectedPoster.imageUrl ? (
                  <img
                    src={selectedPoster.imageUrl}
                    alt={selectedPoster.name}
                    className="max-w-full h-64 object-contain rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
                    <Frame className="h-16 w-16 text-purple-300" />
                  </div>
                )}
              </div>

              {/* Informations du poster */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <p className="mt-1 text-gray-900">{selectedPoster.name}</p>
                  </div>

                  {selectedPoster.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-gray-700">{selectedPoster.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">SKU</label>
                    <p className="mt-1 text-gray-700">{selectedPoster.sku}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <div className="mt-1">{getPosterStatusInfo(selectedPoster).badge}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Format</label>
                    <p className="mt-1 text-gray-700">
                      {selectedPoster.width} × {selectedPoster.height} cm
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Prix</label>
                    <p className="mt-1 text-gray-900 font-semibold">
                      {selectedPoster.finalPrice.toLocaleString()} FCFA
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Stock</label>
                    <p className="mt-1 text-gray-700">{selectedPoster.stockQuantity} unités</p>
                  </div>
                </div>
              </div>

              {/* Date de création */}
              <div className="pt-4 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-700">Date de création</label>
                <p className="mt-1 text-gray-700">
                  {new Date(selectedPoster.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsModalOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>Voulez-vous vraiment supprimer ce poster ?</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <div className="text-sm text-red-800">
                  <p className="font-medium">Attention :</p>
                  <p>Cette action est irréversible.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer définitivement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPostersPage;
