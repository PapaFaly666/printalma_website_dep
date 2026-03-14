import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DesignFileChecker } from '../../components/vendor/DesignFileChecker';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Eye, 
  Edit3, 
  Trash2,  
  MoreVertical,
  Image as ImageIcon,
  DollarSign,
  Plus,
  Search,
  Grid,
  List,
  Share2,
  Download,
  CheckCircle,
  Clock,
  FileText,
  ArrowUpCircle,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { ExtendedVendorProfile } from '../../types/auth.types';
import { designCategoryService, DesignCategory } from '../../services/designCategoryService';
import DesignCategorySelector from '../../components/DesignCategorySelector';
import { useVendorDesigns } from '../../hooks/vendor';

// Types basés sur la documentation API
enum DesignStatus {
  ALL = 'ALL',
  PENDING = 'PENDING', 
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED'
}

interface Design {
  id: number;
  vendorId: number;
  name: string;
  description?: string;
  price: number;
  themeId: number;
  categoryId?: number; // Ajout de categoryId pour la compatibilité
  themeName?: string;
  imageUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };

  // Nouveaux statuts selon la documentation
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
  isDelete: boolean; // Ajout de isDelete

  // Métriques
  views: number;
  likes: number;
  earnings: number;
  usageCount: number;
  tags: string[];

  // Produits associés
  products?: Array<{
    id: number;
    name: string;
  }>;

  // Dates
  createdAt: string;
  updatedAt: string;
}

interface DesignsListResponse {
  success: boolean;
  data: {
    designs: Design[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    stats: {
      total: number;
      published: number;
      pending: number;
      draft: number;
      validated: number;
      rejected: number;
      totalEarnings: number;
      totalViews: number;
      totalLikes: number;
      totalUsage: number;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Service API mis à jour selon la documentation
class VendorDesignService {
  private apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/vendor/designs`;

  private getFetchOptions(method: string = 'GET', body?: any): RequestInit {
    const options: RequestInit = {
      method,
      credentials: 'include', // 🍪 IMPORTANT: Include cookies
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    // Ajouter le token d'authentification depuis localStorage
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
      // Utilise le message du backend si disponible
      errorMessage = `HTTP ${response.status}: ${errorData.message || (errorData.error ? `${errorData.error}: ${JSON.stringify(errorData.details || {})}` : JSON.stringify(errorData))}`;
    } catch (e) {
      // Ignore si le body n'est pas JSON, utilise le message par défaut
    }

    throw new Error(errorMessage);
  }
  
  // Endpoint selon l'API réelle
  async getMyDesigns(filters: {
    offset?: number;
    limit?: number;
  }): Promise<DesignsListResponse> {
    const params = new URLSearchParams();
    if (filters.offset !== undefined) params.append('offset', filters.offset.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${this.apiUrl}?${params}`,
      this.getFetchOptions('GET')
    );

    await this.handleError(response);
    const result = await response.json();

    // Transformer la réponse pour correspondre à l'interface attendue
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
        pagination: {
          currentPage: Math.floor((result.data.pagination.offset || 0) / (result.data.pagination.limit || 20)) + 1,
          totalPages: Math.ceil(result.data.pagination.total / (result.data.pagination.limit || 20)),
          totalItems: result.data.pagination.total,
          itemsPerPage: result.data.pagination.limit || 20
        },
        stats: {
          total: result.data.designs.length,
          published: result.data.designs.filter((d: any) => d.isValidated).length,
          pending: result.data.designs.filter((d: any) => d.isPending).length,
          draft: result.data.designs.filter((d: any) => d.isDraft).length,
          validated: result.data.designs.filter((d: any) => d.isValidated).length,
          rejected: 0, // L'API ne semble pas retourner de rejetés
          totalEarnings: result.data.designs.reduce((sum: number, d: any) => sum + (d.earnings || 0), 0),
          totalViews: result.data.designs.reduce((sum: number, d: any) => sum + (d.views || 0), 0),
          totalLikes: result.data.designs.reduce((sum: number, d: any) => sum + (d.likes || 0), 0),
          totalUsage: result.data.designs.reduce((sum: number, d: any) => sum + (d.linkedProducts || 0), 0)
        }
      }
    };
  }
  
  async submitForValidation(designId: number): Promise<ApiResponse<Design>> {
    const response = await fetch(`${this.apiUrl}/${designId}/submit-for-validation`, 
      this.getFetchOptions('POST', {})
    );
    
    await this.handleError(response);
    return response.json();
  }
  
  async uploadDesign(file: File, designData: any): Promise<ApiResponse<Design>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', designData.name);
    if (designData.description) formData.append('description', designData.description);
    formData.append('price', designData.price.toString());
    formData.append('themeId', designData.themeId.toString());
    if (designData.tags && designData.tags.length > 0) {
      formData.append('tags', designData.tags.join(','));
    }
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    await this.handleError(response);
    return response.json();
  }
  
  async deleteDesign(designId: number): Promise<ApiResponse<any>> {
    try {
      // Importer l'API des produits design vendeur pour supprimer les produits associés
      const { vendorDesignProductAPI } = await import('../../services/vendorDesignProductAPI');
      
      let deletedProductsCount = 0;
      
      try {
        // 1. Chercher et supprimer tous les VendorDesignProducts associés
        const allDesignProducts = await vendorDesignProductAPI.getDesignProducts();
        
        // Dans le contexte de cette page, chaque "design" dans la liste peut correspondre
        // à un VendorDesignProduct, donc nous cherchons par designUrl similaire
        const mainDesignProduct = allDesignProducts.find(dp => dp.id === designId);
        
        if (mainDesignProduct) {
          // Trouver tous les autres produits qui utilisent le même design (même designUrl)
          const associatedProducts = allDesignProducts.filter(dp => 
            dp.designUrl === mainDesignProduct.designUrl && dp.id !== designId
          );
          
          // Supprimer tous les produits associés (même designUrl)
          for (const product of associatedProducts) {
            await vendorDesignProductAPI.deleteDesignProduct(product.id);
            deletedProductsCount++;
          }
        }
      } catch (productsError) {
        console.warn('⚠️ Erreur lors de la suppression des produits associés:', productsError);
        // Continue quand même pour supprimer le design principal
      }
      
      // 2. Supprimer le design principal via l'API classique
      const response = await fetch(`${this.apiUrl}/${designId}`, 
        this.getFetchOptions('DELETE')
      );
      
      await this.handleError(response);
      const result = await response.json();
      
      // Enrichir la réponse avec le nombre de produits supprimés
      return {
        ...result,
        deletedProductsCount,
        message: deletedProductsCount > 0 
          ? `Design et ${deletedProductsCount} produit(s) associé(s) supprimé(s)`
          : result.message || 'Design supprimé avec succès'
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression complète:', error);
      // Fallback: essayer de supprimer juste le design principal
      const response = await fetch(`${this.apiUrl}/${designId}`, 
        this.getFetchOptions('DELETE')
      );
      
      await this.handleError(response);
      return response.json();
    }
  }
}

const vendorDesignService = new VendorDesignService();

// Wrapper pour la gestion d'erreurs avec cookies
const handleApiCall = async (apiCall: () => Promise<any>) => {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error: any) {
    const errorMessage = error.message || 'Erreur inconnue';
    const httpStatusMatch = errorMessage.match(/^HTTP (\d+):?/);
    const toastOptions: { duration: number; description?: string } = { duration: 8000 };

    if (httpStatusMatch) {
      const status = parseInt(httpStatusMatch[1], 10);
      let title = "Erreur";
      let description = errorMessage.replace(/^HTTP \d+:\s*/, '').trim();

      switch (status) {
        case 400:
          title = "Requête incorrecte";
          description = `Le serveur a indiqué une erreur. Détails : ${description}`;
          break;
        case 401:
          title = "Session expirée";
          description = "Veuillez vous reconnecter pour continuer.";
          window.location.href = '/login';
          break;
        case 403:
          title = "Accès refusé";
          description = "Vous n'avez pas les permissions nécessaires pour cette action.";
          break;
        case 404:
          title = "Non trouvé";
          description = "La ressource demandée n'a pas pu être trouvée.";
          break;
        case 409:
          title = "Conflit";
          description = `L'action ne peut pas être effectuée car elle entre en conflit avec l'état actuel. Détails : ${description}`;
          break;
        case 500:
          title = "Erreur du serveur";
          description = "Un problème est survenu sur nos serveurs. L'équipe technique a été notifiée.";
          break;
        default:
          title = `Erreur ${status}`;
          break;
      }
      toast.error(title, { ...toastOptions, description });
    } else {
      // Erreurs non-HTTP (ex: problème réseau)
      toast.error('Erreur de communication', { ...toastOptions, description: errorMessage });
    }
    
    return { success: false, error };
  }
};

type DesignStatusKey = 'PUBLISHED' | 'PENDING' | 'REJECTED' | 'VALIDATED' | 'DRAFT';

interface DesignStatusInfo {
  key: DesignStatusKey;
  badge: React.ReactNode;
  explanation: string;
}

const getDesignStatusInfo = (design: Design): DesignStatusInfo => {
  const validationStatus = design.validationStatus;

  // Hiérarchie basée sur la nouvelle documentation API
  
  // 1. Si validé -> automatiquement publié selon la doc
  if (validationStatus === 'VALIDATED' || design.isValidated) {
    return {
      key: 'VALIDATED',
      badge: <Badge className="bg-green-100 text-green-800 border-green-300">✅ Validé & Publié</Badge>,
      explanation: "Ce design a été validé par l'administration et est automatiquement publié."
    };
  }

  // 2. Si rejeté
  if (validationStatus === 'REJECTED' || design.rejectionReason) {
    return {
      key: 'REJECTED',
      badge: <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">❌ Rejeté</Badge>,
      explanation: design.rejectionReason 
        ? `Design rejeté. Raison: "${design.rejectionReason}". Vous pouvez le modifier et le re-soumettre.`
        : "Ce design a été rejeté par l'administration. Vous pouvez le modifier et le re-soumettre."
    };
  }

  // 3. Si en attente de validation
  if (validationStatus === 'PENDING' || design.isPending) {
    return {
      key: 'PENDING',
      badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ En attente</Badge>,
      explanation: "Ce design est en attente de validation par l'administration."
    };
  }

  // 4. Brouillon par défaut (nouveau design non soumis)
  return {
    key: 'DRAFT',
    badge: <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">📝 Brouillon</Badge>,
    explanation: "Ce design est en brouillon. Soumettez-le pour validation afin qu'il soit publié."
  };
};

export const VendorDesignsPage: React.FC = () => {
  const { user, isVendeur } = useAuth();
  const navigate = useNavigate();
  const [, setExtendedProfile] = useState<ExtendedVendorProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États principaux
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTheme, setFilterTheme] = useState<number | null>(null);
  const [themes, setThemes] = useState<DesignCategory[]>([]);
  const [filterStatus, setFilterStatus] = useState<DesignStatus>(DesignStatus.ALL);
  const [currentPage, setCurrentPage] = useState(1);

  // React Query pour les designs
  const designsQuery = useVendorDesigns(currentPage);
  const loading = designsQuery.isLoading;
  const isRefetching = designsQuery.isRefetching;
  const apiStatus = designsQuery.error ? 'offline' : (loading ? 'offline' : 'connected');

  const designs: Design[] = useMemo(
    () => designsQuery.data?.data?.designs || [],
    [designsQuery.data]
  );
  const pagination = useMemo(
    () => designsQuery.data?.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 },
    [designsQuery.data]
  );
  
  // États pour l'upload
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [designForm, setDesignForm] = useState({
    name: '',
    description: '',
    price: 0,
    themeId: 0,
    tags: [] as string[]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checkerFile, setCheckerFile] = useState<File | null>(null);
  const [fileIsValid, setFileIsValid] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Calculer les stats basées sur la réponse API (utilise les stats du backend)
  const stats = designs.length > 0 ? {
    total: designs.length,
    draft: designs.filter(d => !d.submittedForValidationAt && d.validationStatus !== 'VALIDATED' && d.validationStatus !== 'REJECTED').length,
    pendingValidation: designs.filter(d => d.validationStatus === 'PENDING').length,
    validated: designs.filter(d => d.validationStatus === 'VALIDATED').length,
    rejected: designs.filter(d => d.validationStatus === 'REJECTED').length,
    published: designs.filter(d => d.validationStatus === 'VALIDATED').length, // Validé = publié selon la doc
    totalEarnings: designs.reduce((sum, d) => sum + d.earnings, 0),
    totalViews: designs.reduce((sum, d) => sum + d.views, 0)
  } : {
    total: 0,
    draft: 0,
    pendingValidation: 0,
    validated: 0,
    rejected: 0,
    published: 0,
    totalEarnings: 0,
    totalViews: 0
  };

  // Charger les thèmes admin
  useEffect(() => {
    designCategoryService.getActiveCategories().then(setThemes).catch(console.error);
  }, []);

  // Filtrer les designs côté client
  const filteredDesigns = useMemo(() => {
    let filtered = [...designs];
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatus !== DesignStatus.ALL) {
      filtered = filtered.filter(d => {
        if (filterStatus === DesignStatus.VALIDATED) return d.validationStatus === 'VALIDATED' || d.isValidated;
        if (filterStatus === DesignStatus.PENDING) return d.validationStatus === 'PENDING' || d.isPending;
        if (filterStatus === DesignStatus.REJECTED) return d.validationStatus === 'REJECTED';
        return true;
      });
    }
    if (filterTheme !== null) {
      filtered = filtered.filter(d => d.themeId === filterTheme || d.categoryId === filterTheme);
    }
    return filtered;
  }, [designs, searchTerm, filterTheme, filterStatus]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user && isVendeur()) {
          const data = await authService.getExtendedVendorProfile();
          if (data.success) setExtendedProfile(data.vendor);
        }
      } catch (err) {
        console.error('Erreur chargement profil étendu:', err);
      }
    };

    fetchProfile();
  }, [user]);

  // Gestionnaires d'événements pour l'upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Toujours afficher le checker, même pour les fichiers invalides
    setCheckerFile(file);

    // Type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image.');
      return;
    }

    // Taille max 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5 Mo.');
      return;
    }

    // SVG : pas de vérification de dimensions
    if (file.type === 'image/svg+xml') {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setDesignForm(prev => ({ ...prev, name: file.name.split('.')[0] }));
      return;
    }

    // Vérification des dimensions (min 1000×1000 px)
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      URL.revokeObjectURL(objectUrl);

      if (w < 1000 || h < 1000) {
        toast.error(
          `Dimensions insuffisantes (${w}×${h}px). Minimum requis : 1000×1000px.`
        );
        return;
      }

      // DPI non accessible nativement dans le navigateur — vérification faite côté serveur
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDesignForm(prev => ({ ...prev, name: file.name.split('.')[0] }));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error('Impossible de lire le fichier image.');
    };
    img.src = objectUrl;
  };

  const handleUploadDesign = async () => {
    if (!selectedFile || !designForm.name.trim() || !designForm.themeId || designForm.themeId === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setUploadingDesign(true);

    // Préparer les données comme attendu par l'API
    const uploadData = {
      name: designForm.name.trim(),
      description: designForm.description?.trim() || '',
      price: designForm.price || 0,
      themeId: designForm.themeId,
      tags: designForm.tags || []
    };

    const { success } = await handleApiCall(() =>
      vendorDesignService.uploadDesign(selectedFile, uploadData)
    );

    if (success) {
      toast.success('Design créé en brouillon ! Soumettez-le pour validation pour qu\'il puisse être publié.');
      setIsUploadDialogOpen(false);
      resetUploadForm();
      designsQuery.refetch();
    }

    setUploadingDesign(false);
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setCheckerFile(null);
    setFileIsValid(false);
    setPreviewUrl('');
    setDesignForm({
      name: '',
      description: '',
      price: 0,
      themeId: 0,
      tags: []
    });
  };

  const handleSubmitForValidation = async (designId: number) => {
    const { success } = await handleApiCall(() =>
      vendorDesignService.submitForValidation(designId)
    );

    if (success) {
      toast.success('Design soumis pour validation avec succès !');
      designsQuery.refetch();
    }
  };


  // Helper pour obtenir le badge de statut
  const DesignCard: React.FC<{ design: Design }> = ({ design }) => {
    const statusInfo = getDesignStatusInfo(design);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="overflow-hidden border-gray-200 hover:border-[rgb(20,104,154)]/50 transition-all duration-300 hover:shadow-lg bg-white">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={design.thumbnailUrl || design.imageUrl}
                alt={design.name}
              className="w-full h-full object-cover"
            />

            {/* Badge de statut */}
            <div className="absolute top-2 left-2">
              {statusInfo.badge}
            </div>

            {/* Actions rapides */}
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 bg-gray-900/80 backdrop-blur-sm text-white hover:bg-gray-900 border border-white/20 shadow-lg rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                  <DropdownMenuItem
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(design)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={() => {
                      setDesignToDelete(design.id);
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
                <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
                {design.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{design.description}</p>
                )}
              </div>

              {/* Prix et métriques */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">
                  {design.price.toLocaleString()} FCFA
                </span>
                <div className="flex items-center space-x-3 text-gray-500">
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {design.views}
                  </span>
                  {design.earnings > 0 && (
                    <span className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {design.earnings.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions et explications selon le statut */}
              <div className="space-y-2">
                {/* Brouillon ou Rejeté -> Soumettre/Re-soumettre */}
                {(statusInfo.key === 'DRAFT' || statusInfo.key === 'REJECTED') && (
                  <div className="space-y-2">
                    <button
                      className="inline-flex items-center justify-center w-full font-medium transition-all duration-200 rounded-lg bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white px-3 py-1.5 text-sm gap-1.5"
                      onClick={() => handleSubmitForValidation(design.id)}
                    >
                      <ArrowUpCircle className="h-4 w-4" />
                      {statusInfo.key === 'REJECTED' ? 'Re-soumettre' : 'Soumettre pour validation'}
                    </button>
                    <div className={`p-2 border rounded-md ${statusInfo.key === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <p className={`text-xs ${statusInfo.key === 'REJECTED' ? 'text-red-700' : 'text-blue-700'}`}>
                        💡 {statusInfo.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* En attente */}
                {statusInfo.key === 'PENDING' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-yellow-800">En attente de validation</p>
                        <p className="text-xs text-yellow-700">
                          {statusInfo.explanation} Vous recevrez un email dès qu'il sera traité.
                        </p>
                        {design.submittedForValidationAt && (
                          <p className="text-xs text-yellow-600">
                            Soumis le {new Date(design.submittedForValidationAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Publié */}
                {statusInfo.key === 'PUBLISHED' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-green-800">Design publié</p>
                        <p className="text-xs text-green-700">{statusInfo.explanation}</p>
                        {design.validatedAt && (
                          <p className="text-xs text-green-600">
                            Validé le {new Date(design.validatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Approuvé/Validé - automatiquement publié selon la doc */}
                {statusInfo.key === 'VALIDATED' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-green-800">Design validé & publié</p>
                        <p className="text-xs text-green-700">{statusInfo.explanation}</p>
                        {design.validatedAt && (
                          <p className="text-xs text-green-600">
                            Validé le {new Date(design.validatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        {/* Afficher les produits liés */}
                        {design.products && design.products.length > 0 && (
                          <p className="text-xs text-green-600">
                            Lié à {design.products.length} produit(s): {design.products.map((p: any) => p.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {design.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {design.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-600">
                      {tag}
                    </Badge>
                  ))}
                  {design.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                      +{design.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  const handleViewDetails = (design: Design) => {
    setSelectedDesign(design);
    setDetailsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!designToDelete) return;
    
    const { success, data } = await handleApiCall(() => 
      vendorDesignService.deleteDesign(designToDelete)
    );
    
    if (success && data) {
      // Le message peut venir soit de data.message, soit être un message par défaut
      const message = data.message || 'Design supprimé avec succès !';
      toast.success(message);
      designsQuery.refetch(); // Recharger la liste complète des designs
    }
    setDeleteModalOpen(false);
    setDesignToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header style dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-6 py-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes Designs</h1>
              <p className="text-gray-600 text-sm">Créez, gérez et vendez vos designs en toute simplicité</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={apiStatus === 'connected' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${apiStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {apiStatus === 'connected' ? "Connectée" : "Mode hors ligne"}
              </Badge>
              <button
                onClick={() => designsQuery.refetch()}
                disabled={loading}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white px-3 py-1.5 text-sm gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau design</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="px-6 pb-8">
        {/* Stats + filtres + grille */}
        <div className="mb-8">

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: <ImageIcon className="h-4 w-4 text-[rgb(20,104,154)]" />, bg: 'bg-[rgb(20,104,154)]/10', color: 'text-gray-900', delay: 0.1 },
              { label: 'Brouillons', value: stats.draft, icon: <FileText className="h-4 w-4 text-gray-600" />, bg: 'bg-gray-100', color: 'text-gray-600', delay: 0.2 },
              { label: 'En attente', value: stats.pendingValidation, icon: <Clock className="h-4 w-4 text-yellow-600" />, bg: 'bg-yellow-100', color: 'text-yellow-600', delay: 0.3 },
              { label: 'Publiés', value: stats.published, icon: <CheckCircle className="h-4 w-4 text-green-600" />, bg: 'bg-green-100', color: 'text-green-600', delay: 0.4 },
              { label: 'Vues totales', value: stats.totalViews, icon: <Eye className="h-4 w-4 text-orange-500" />, bg: 'bg-orange-100', color: 'text-gray-900', delay: 0.5 },
              ...(stats.totalEarnings > 0 ? [{ label: 'Gains', value: `${stats.totalEarnings.toLocaleString()} F`, icon: <DollarSign className="h-4 w-4 text-emerald-600" />, bg: 'bg-emerald-100', color: 'text-emerald-700', delay: 0.6 }] : []),
            ].map(({ label, value, icon, bg, color, delay }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher vos designs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-lg border-gray-200 focus:border-[rgb(20,104,154)]"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as DesignStatus)}>
                <SelectTrigger className="w-full sm:w-48 rounded-lg border-gray-200 focus:border-[rgb(20,104,154)]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value={DesignStatus.ALL}>Tous les statuts</SelectItem>
                  <SelectItem value={DesignStatus.PENDING}>En attente validation</SelectItem>
                  <SelectItem value={DesignStatus.VALIDATED}>Validés</SelectItem>
                  <SelectItem value={DesignStatus.REJECTED}>Rejetés</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-full sm:w-48">
                <DesignCategorySelector
                  value={filterTheme}
                  onChange={setFilterTheme}
                  placeholder="Tous les thèmes"
                  showImages={false}
                  className="rounded-lg border-gray-200 focus:border-[rgb(20,104,154)]"
                />
              </div>
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
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
            </motion.div>
          ) : filteredDesigns.length > 0 ? (
            <motion.div
              key="designs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredDesigns.map((design) => (
                <DesignCard key={design.id} design={design} />
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
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== DesignStatus.ALL || filterTheme !== null
                  ? 'Aucun design trouvé'
                  : 'Créez votre premier design'
                }
            </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== DesignStatus.ALL || filterTheme !== null
                  ? 'Essayez de modifier vos filtres de recherche ou créez un nouveau design.'
                  : 'Commencez votre parcours créatif en téléchargeant votre premier design.'
              }
            </p>
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer mon premier design
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center mt-8 space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-[rgb(20,104,154)] text-white'
                        : 'border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}

        {/* Modal d'upload de design */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-black">Créer un nouveau design</DialogTitle>
              <DialogDescription className="text-gray-600">
                Téléchargez votre création et ajoutez les informations nécessaires
              </DialogDescription>
            </DialogHeader>

            {/* Workflow de validation info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900">Processus de validation</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>Votre design sera créé en <strong>brouillon</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>Soumettez-le pour <strong>validation admin</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>Une fois approuvé, il sera <strong>publié</strong></span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    📧 Vous recevrez un email de confirmation à chaque étape.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Zone de téléchargement */}
              <div className="space-y-4">
                <Label className="text-black font-medium">Fichier design *</Label>

                {!previewUrl ? (
                  <>
                    <div
                      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-black transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-2 text-center">
                        Glissez votre fichier ici ou cliquez pour sélectionner
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP — max 5 Mo
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Min. 1000×1000 px · Min. 100 DPI
                      </p>
                    </div>
                    <DesignFileChecker file={checkerFile} onValidationChange={setFileIsValid} />
                  </>
                ) : (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Aperçu"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Informations du design */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-black font-medium">Nom du design *</Label>
                  <Input
                    id="name"
                    value={designForm.name}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Logo moderne tech"
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-black font-medium">Description</Label>
                  <Input
                    id="description"
                    value={designForm.description}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre design..."
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <Label htmlFor="theme" className="text-black font-medium">Thème *</Label>
                  <DesignCategorySelector
                    value={designForm.themeId || null}
                    onChange={(themeId) => setDesignForm(prev => ({ ...prev, themeId: themeId || 0 }))}
                    required={true}
                    placeholder="Sélectionner un thème"
                    showImages={true}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-black font-medium">Prix (FCFA)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={designForm.price}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    placeholder="2500"
                    min="0"
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="space-x-2">
              <button
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  resetUploadForm();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUploadDesign}
                disabled={uploadingDesign || !selectedFile || !fileIsValid || !designForm.name.trim() || !designForm.themeId || designForm.themeId === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingDesign ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Créer le design
                  </>
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de détails du design */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-black">Détails du design</DialogTitle>
              <DialogDescription className="text-gray-600">
                Informations complètes sur votre design
              </DialogDescription>
            </DialogHeader>

            {selectedDesign && (
              <div className="space-y-6">
                {/* Image du design */}
                <div className="flex justify-center">
                  <img
                    src={selectedDesign.thumbnailUrl || selectedDesign.imageUrl}
                    alt={selectedDesign.name}
                    className="max-w-full h-64 object-contain rounded-lg border border-gray-200"
                  />
                </div>

                {/* Informations du design */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-black font-medium">Nom</Label>
                      <p className="mt-1 text-gray-700">{selectedDesign.name}</p>
                    </div>

                    {selectedDesign.description && (
                      <div>
                        <Label className="text-black font-medium">Description</Label>
                        <p className="mt-1 text-gray-700">{selectedDesign.description}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-black font-medium">Prix</Label>
                      <p className="mt-1 text-gray-700 font-semibold">{selectedDesign.price.toLocaleString()} FCFA</p>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Thème</Label>
                      <p className="mt-1 text-gray-700">{selectedDesign.themeName || 'Non spécifié'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-black font-medium">Statut</Label>
                      <div className="mt-1">{getDesignStatusInfo(selectedDesign).badge}</div>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Dimensions</Label>
                      <p className="mt-1 text-gray-700">
                        {selectedDesign.dimensions ?
                          `${selectedDesign.dimensions.width} x ${selectedDesign.dimensions.height} px` :
                          'Non disponible'
                        }
                      </p>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Taille du fichier</Label>
                      <p className="mt-1 text-gray-700">
                        {selectedDesign.fileSize ?
                          `${(selectedDesign.fileSize / 1024 / 1024).toFixed(2)} MB` :
                          'Non disponible'
                        }
                      </p>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Date de création</Label>
                      <p className="mt-1 text-gray-700">
                        {new Date(selectedDesign.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">{selectedDesign.views}</div>
                    <div className="text-sm text-gray-600">Vues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">{selectedDesign.likes}</div>
                    <div className="text-sm text-gray-600">J'aime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">{selectedDesign.usageCount}</div>
                    <div className="text-sm text-gray-600">Utilisations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">{selectedDesign.earnings?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-600">Gains (FCFA)</div>
                  </div>
                </div>

                {/* Tags */}
                {selectedDesign.tags && selectedDesign.tags.length > 0 && (
                  <div>
                    <Label className="text-black font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDesign.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="border-gray-300 text-gray-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white rounded-lg transition-colors"
              >
                Fermer
              </button>
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
              <p>Voulez-vous vraiment supprimer ce design ?</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-red-600 text-xs">!</span>
                  </div>
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Attention :</p>
                    <p>Cette action supprimera également tous les produits associés à ce design et est irréversible.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Supprimer définitivement
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>{/* end px-6 pb-8 */}
      </div>{/* end max-w-7xl */}
    </div>
  );
};