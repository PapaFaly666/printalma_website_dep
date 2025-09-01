import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Package, 
  AlertCircle, 
  Loader2, 
  User, 
  Store,
  Filter,
  Eye,
  ExternalLink,
  ShoppingBag,
  TrendingUp,
  ArrowUpDown,
  ChevronDown,
  Calendar,
  DollarSign,
  Palette,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Tag,
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  FileX,
  Settings,
  MapPin,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import AdminProductDesignPreview from '../../components/admin/AdminProductDesignPreview';

const ITEMS_PER_PAGE = 20;

// Types basés sur la documentation
interface VendorProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT' | 'REJECTED';
  postValidationAction: string;
  adminProductName: string;
  adminProductDescription: string;
  adminProductPrice: number;
  designCloudinaryUrl?: string;
  designCloudinaryPublicId?: string;
  designPositioning?: string;
  designScale?: number;
  designApplicationMode?: string;
  designId?: number;
  
  // Nouvelles structures pour compatibilité avec AdminProductDesignPreview
  designApplication: {
    hasDesign: boolean;
    designUrl: string;
    designCloudinaryPublicId: string;
    positioning: string;
    scale: number;
    mode: string;
  };
  
  designPositions: Array<{
    vendorProductId: number;
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
    };
    createdAt: string;
    design: {
      id: number;
      name: string;
      imageUrl: string;
      cloudinaryPublicId: string;
      category: string;
    };
  }>;
  
  adminProduct: {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: string;
    categories: Array<{
      id: number;
      name: string;
      description: string;
    }>;
    sizes: Array<{
      id: number;
      sizeName: string;
    }>;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        view: string;
        url: string;
        publicId: string;
        naturalWidth: number;
        naturalHeight: number;
        viewType: string;
        delimitations: Array<{
          id: number;
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
          name: string;
          coordinateType: string;
        }>;
      }>;
    }>;
  };
  
  // Support pour les deux formats (simple et complexe)
  sizes?: string[];
  colors?: string[];
  selectedSizes?: Array<{
    id: number;
    sizeName: string;
  }>;
  selectedColors?: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shop_name?: string;
    phone?: string;
    country?: string;
    address?: string;
    profile_photo_url?: string;
    vendeur_type: string;
    status: boolean;
    created_at: string;
    last_login_at?: string;
  };
  
  baseProduct: {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: string;
    categories: Array<{
      id: number;
      name: string;
      description: string;
    }>;
    sizes: Array<{
      id: number;
      sizeName: string;
    }>;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        view: string;
        url: string;
        publicId: string;
        naturalWidth: number;
        naturalHeight: number;
        designUrl?: string;
        delimitations: Array<{
          id: number;
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
          name: string;
          coordinateType: string;
        }>;
      }>;
    }>;
  };
  
  validator: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  
  design?: {
    id: number;
    name: string;
    imageUrl: string;
    cloudinaryPublicId: string;
    category: string;
    format: string;
    isValidated: boolean;
    validatedAt?: string;
    vendor: {
      id: number;
      firstName: string;
      lastName: string;
      shop_name?: string;
    };
  };
  
  images: Array<{
    id: number;
    colorName: string;
    colorCode: string;
    imageType: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    width: number;
    height: number;
    fileSize: number;
    format: string;
  }>;
  
  designTransforms: Array<{
    id: number;
    designUrl: string;
    transforms: {
      scale: number;
      rotation: number;
      position: { x: number; y: number };
    };
    lastModified: string;
  }>;
  
  hasDesign: boolean;
  hasImages: boolean;
  hasPositions: boolean;
  hasTransforms: boolean;
  totalDesignLinks: number;
  statusDisplay: string;
  canBePublished: boolean;
  needsValidation: boolean;
}

interface ApiResponse {
  products: VendorProduct[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  stats: {
    totalProducts: number;
    pendingProducts: number;
    publishedProducts: number;
    draftProducts: number;
    rejectedProducts: number;
    validatedProducts: number;
    totalVendors: number;
    totalDesigns: number;
    totalImages: number;
    validationRate: string;
  };
}

interface FilterOptions {
  vendorId: string;
  status: 'all' | 'PENDING' | 'PUBLISHED' | 'DRAFT' | 'REJECTED';
  search: string;
  hasDesign: 'all' | 'with' | 'without';
  sortBy: 'price' | 'date' | 'vendor' | 'status';
  sortOrder: 'asc' | 'desc';
}

export const AdminVendorProductsPage: React.FC = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    vendorId: 'all',
    status: 'all',
    search: '',
    hasDesign: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApiResponse['pagination']>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE
  });
  const [stats, setStats] = useState<ApiResponse['stats']>({
    totalProducts: 0,
    pendingProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    rejectedProducts: 0,
    validatedProducts: 0,
    totalVendors: 0,
    totalDesigns: 0,
    totalImages: 0,
    validationRate: '0'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();

  // Fonction pour gérer la création de produit
  const handleCreateProduct = () => {
    console.log('🎯 Navigation vers création produit vendeur');
    try {
      navigate('/admin/vendor-products/create');
    } catch (error) {
      console.error('Erreur navigation:', error);
      toast.error('Erreur lors de la navigation');
    }
  };

  // Charger tous les produits avec l'endpoint admin
  const fetchAllVendorProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(filters.vendorId !== 'all' && { vendorId: filters.vendorId }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        includeDesigns: 'true',
        includeImages: 'true',
        includePositions: 'true',
        includeTransforms: 'true'
      });
      
      const res = await fetch(`${apiUrl}/vendor-product-validation/all-products?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ApiResponse = await res.json();
      
      let filteredProducts = data.products;

      // Filtres côté client
      if (filters.hasDesign !== 'all') {
        if (filters.hasDesign === 'with') {
          filteredProducts = filteredProducts.filter(p => p.hasDesign);
        } else if (filters.hasDesign === 'without') {
          filteredProducts = filteredProducts.filter(p => !p.hasDesign);
        }
      }

      // Tri côté client
      filteredProducts.sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sortBy) {
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'vendor':
            aValue = `${a.vendor.firstName} ${a.vendor.lastName}`;
            bValue = `${b.vendor.firstName} ${b.vendor.lastName}`;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'date':
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setProducts(filteredProducts);
      setPagination(data.pagination);
      setStats(data.stats);
      
      // Extraire la liste unique des vendeurs
      const uniqueVendors = Array.from(
        new Map(data.products.map(p => [p.vendor.id, p.vendor])).values()
      );
      setVendors(uniqueVendors);
      
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError('Impossible de charger les produits');
      toast.error('Erreur chargement produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVendorProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.vendorId, filters.status, filters.search]);

  useEffect(() => {
    // Re-trier quand les filtres de tri changent
    if (products.length > 0) {
      const sorted = [...products].sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sortBy) {
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'vendor':
            aValue = `${a.vendor.firstName} ${a.vendor.lastName}`;
            bValue = `${b.vendor.firstName} ${b.vendor.lastName}`;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'date':
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setProducts(sorted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy, filters.sortOrder, filters.hasDesign]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'sortBy' && key !== 'sortOrder' && key !== 'hasDesign') {
    setPage(1);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF', 
      maximumFractionDigits: 0 
    }).format(price || 0).replace('XOF', 'CFA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Publié
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
            <FileX className="w-3 h-3 mr-1" />
            Brouillon
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        );
      default:
    return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getDesignInfo = (product: VendorProduct) => {
    if (!product.hasDesign) {
    return (
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500">Sans design</p>
            <p className="text-xs text-gray-400">Produit de base</p>
                </div>
              </div>
      );
    }

    // Obtenir l'URL du design
    const designUrl = product.designApplication?.designUrl || 
                     product.designPositions?.[0]?.design?.imageUrl || 
                     product.design?.imageUrl || 
                     product.designCloudinaryUrl;
    
    // Obtenir le nom du design
    const designName = product.design?.name || 
                      product.designPositions?.[0]?.design?.name || 
                      'Design personnalisé';

    return (
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {designUrl ? (
            <img
              src={designUrl}
              alt={designName}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-blue-100 flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/></svg></div>';
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <Palette className="h-4 w-4 text-blue-600" />
                      </div>
          )}
                    </div>
                    <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {designName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {product.design?.category || 'Catégorie inconnue'}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            {product.designPositioning && (
              <span className="text-xs text-gray-500">
                {product.designPositioning}
              </span>
            )}
            {product.design?.isValidated && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓ Validé
              </span>
            )}
            {product.designScale && (
              <span className="text-xs text-gray-500">
                Échelle: {(product.designScale * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Fonctions utilitaires pour gérer les formats de couleurs et tailles
  const getProductColors = (product: VendorProduct) => {
    // Priorité : selectedColors > colors > baseProduct.colorVariations
    if (Array.isArray(product.selectedColors) && product.selectedColors.length > 0) {
      return product.selectedColors.map(color => ({
        name: color.name,
        colorCode: color.colorCode
      }));
    }
    
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors.map(color => ({
        name: color,
        colorCode: color // Utiliser le nom comme code couleur par défaut
      }));
    }
    
    if (Array.isArray(product.baseProduct?.colorVariations) && product.baseProduct.colorVariations.length > 0) {
      return product.baseProduct.colorVariations.map(color => ({
        name: color.name,
        colorCode: color.colorCode
      }));
    }
    
    return [];
  };

  const getProductSizesCount = (product: VendorProduct) => {
    // Priorité : selectedSizes > sizes > baseProduct.sizes
    if (Array.isArray(product.selectedSizes) && product.selectedSizes.length > 0) {
      return product.selectedSizes.length;
    }
    
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.length;
    }
    
    if (Array.isArray(product.baseProduct?.sizes) && product.baseProduct.sizes.length > 0) {
      return product.baseProduct.sizes.length;
    }
    
    return 0;
  };

  // Fonction pour ouvrir l'aperçu produit
  const handlePreviewProduct = (product: VendorProduct) => {
    setSelectedProduct(product);
    setShowPreviewModal(true);
  };

  // Fonction pour fermer l'aperçu
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setSelectedProduct(null);
  };

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'PUBLISHED', label: 'Publiés' },
    { value: 'DRAFT', label: 'Brouillons' },
    { value: 'REJECTED', label: 'Rejetés' }
  ];

  const designOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'with', label: 'Avec design' },
    { value: 'without', label: 'Sans design' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date de création' },
    { value: 'price', label: 'Prix' },
    { value: 'vendor', label: 'Vendeur' },
    { value: 'status', label: 'Statut' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec statistiques */}
      <div className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
                <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                  Produits des Vendeurs
                  </h1>
                <p className="text-sm text-gray-500">
                  {stats.totalProducts} produits • {stats.totalVendors} vendeurs • {stats.validationRate}% validés
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-3">
                <div className="flex items-center space-x-2 rounded-lg bg-green-50 px-3 py-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">
                    {stats.publishedProducts} publiés
                </span>
              </div>
                
                <div className="flex items-center space-x-2 rounded-lg bg-yellow-50 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-600">
                    {stats.pendingProducts} en attente
                  </span>
            </div>
                
                <div className="flex items-center space-x-2 rounded-lg bg-blue-50 px-3 py-1.5">
                  <Palette className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                    {stats.totalDesigns} designs
                </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                <span>Filtres</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={handleCreateProduct}
                className="flex items-center space-x-2 rounded-lg bg-black text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Créer produit pour vendeur</span>
                <span className="sm:hidden">Créer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Rechercher un produit, design, vendeur..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm placeholder:text-gray-500 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
          </div>
            </div>
            
        {/* Panneau de filtres */}
        {showFilters && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtre vendeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendeur
                </label>
              <select
                  value={filters.vendorId}
                  onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="all">Tous les vendeurs</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.firstName} {vendor.lastName}
                    </option>
                  ))}
              </select>
            </div>
            
              {/* Filtre statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre design */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design
                </label>
                <select
                  value={filters.hasDesign}
                  onChange={(e) => handleFilterChange('hasDesign', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {designOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
            </div>
            
              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
              <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>
            
              {/* Ordre de tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre
                </label>
            <button 
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>{filters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
            </button>
        </div>
            </div>
        </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Chargement des produits...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-3">
            <AlertCircle className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Erreur de chargement</h3>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-3">
            <Package className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Aucun produit trouvé</h3>
              <p className="text-sm text-gray-500">Modifiez vos filtres ou votre recherche</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vue Table Desktop */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit avec Design
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Informations Design
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendeur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <AdminProductDesignPreview
                                product={product}
                                showColorSlider={true}
                                size="md"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {product.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {getProductColors(product).length} couleurs
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {getProductSizesCount(product)} tailles
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getDesignInfo(product)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <img
                              src={product.vendor.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendor.firstName + ' ' + product.vendor.lastName)}&background=000000&color=ffffff&size=32`}
                              alt={product.vendor.firstName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.vendor.firstName} {product.vendor.lastName}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {product.vendor.shop_name || product.vendor.email}
                              </p>
                              <div className="flex items-center space-x-1 mt-1">
                                <span className="text-xs text-gray-500">{product.vendor.vendeur_type}</span>
                                {product.vendor.country && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{product.vendor.country}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          {product.adminProductPrice !== product.price && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(product.adminProductPrice)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {product.stock}
                          </span>
                          {product.baseProduct && (
                            <p className="text-xs text-gray-500">
                              Base: {product.baseProduct.stock}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.status)}
                          {product.needsValidation && (
                            <p className="text-xs text-orange-600 mt-1">Validation requise</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          {product.validatedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Validé le {new Date(product.validatedAt).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handlePreviewProduct(product)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Aperçu du produit"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => window.open(`/products/${product.id}`, '_blank')}
                              className="text-gray-400 hover:text-gray-600"
                              title="Ouvrir dans un nouvel onglet"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            {product.hasDesign && product.design && (
                              <button
                                onClick={() => navigate(`/admin/designs/${product.design?.id}`)}
                                className="text-blue-400 hover:text-blue-600"
                                title="Voir le design"
                              >
                                <Palette className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                    </div>
            </div>

            {/* Vue Cards Mobile/Tablet */}
            <div className="lg:hidden space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <AdminProductDesignPreview
                        product={product}
                        showColorSlider={true}
                        size="sm"
                      />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {product.description}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {getStatusBadge(product.status)}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-2">
                        <img
                          src={product.vendor.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendor.firstName + ' ' + product.vendor.lastName)}&background=000000&color=ffffff&size=24`}
                          alt={product.vendor.firstName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-600">
                          {product.vendor.firstName} {product.vendor.lastName}
                        </span>
                        </div>
                        
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{getProductColors(product).length} couleurs</span>
                          <span>•</span>
                          <span>{getProductSizesCount(product)} tailles</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePreviewProduct(product)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Aperçu du produit"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/products/${product.id}`, '_blank')}
                            className="text-gray-400 hover:text-gray-600"
                            title="Ouvrir dans un nouvel onglet"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          {product.hasDesign && product.design && (
                            <button
                              onClick={() => navigate(`/admin/designs/${product.design?.id}`)}
                              className="text-blue-400 hover:text-blue-600"
                              title="Voir le design"
                            >
                              <Palette className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Page {pagination.currentPage} sur {pagination.totalPages}</span>
              <span>•</span>
              <span>{pagination.totalItems} produits au total</span>
            </div>
            
            <div className="flex items-center space-x-2">
            <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.currentPage === 1}
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Précédent</span>
            </button>
            
            <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                  const isActive = pageNum === pagination.currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'aperçu produit */}
      {showPreviewModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Overlay */}
            <div
               className="fixed inset-0 bg-black/50 backdrop-blur-md transition-all duration-300"
               onClick={handleClosePreview}
             />

             {/* Modal */}
            <div className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white backdrop-blur-xl text-left shadow-2xl transition-all duration-300 animate-in zoom-in-95">
              {/* Header */}
              <div className="relative bg-gray-900 px-8 py-6 text-white">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Aperçu du produit
                      </h3>
                      <p className="text-sm text-gray-300">
                        {selectedProduct.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClosePreview}
                    className="rounded-xl bg-white/10 p-2 text-white transition-all hover:bg-white/20"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Aperçu visuel - Plus grand */}
                  <div className="xl:col-span-1 space-y-6">
                    {/* Produit avec design */}
                    <div className="bg-gray-50 rounded-2xl p-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                        Aperçu visuel
                      </h4>
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <AdminProductDesignPreview
                            product={selectedProduct}
                            showColorSlider={true}
                            size="lg"
                          />
                          {selectedProduct.hasDesign && (
                            <div className="absolute -top-2 -right-2">
                              <div className="bg-gray-900 text-white rounded-full p-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Statut et badges */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {getStatusBadge(selectedProduct.status)}
                        {selectedProduct.hasDesign && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                            <svg className="mr-1.5 h-2 w-2 fill-gray-500" viewBox="0 0 6 6">
                              <circle cx={3} cy={3} r={3} />
                            </svg>
                            Design incorporé
                          </span>
                        )}
                        {selectedProduct.design?.isValidated && (
                          <span className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                            ✓ Design validé
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Couleurs disponibles */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <h5 className="text-sm font-semibold text-gray-900 mb-4">Couleurs disponibles</h5>
                      <div className="flex flex-wrap gap-2">
                        {getProductColors(selectedProduct).slice(0, 8).map((color, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                              style={{ backgroundColor: color.colorCode }}
                              title={color.name}
                            />
                            <span className="text-xs text-gray-600">{color.name}</span>
                          </div>
                        ))}
                        {getProductColors(selectedProduct).length > 8 && (
                          <span className="text-xs text-gray-500">+{getProductColors(selectedProduct).length - 8} autres</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations détaillées */}
                  <div className="xl:col-span-2 space-y-6">
                    {/* Informations produit */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                        Informations produit
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom du produit</label>
                            <p className="text-lg font-medium text-gray-900 mt-1">{selectedProduct.name}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prix</label>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(selectedProduct.price)}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stock disponible</label>
                            <p className="text-lg font-medium text-gray-900 mt-1">{selectedProduct.stock} unités</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Couleurs</label>
                            <p className="text-lg font-medium text-gray-900 mt-1">{getProductColors(selectedProduct).length} disponibles</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tailles</label>
                            <p className="text-lg font-medium text-gray-900 mt-1">{getProductSizesCount(selectedProduct)} disponibles</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de création</label>
                            <p className="text-sm text-gray-600 mt-1">{new Date(selectedProduct.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informations vendeur */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                        Vendeur
                      </h4>
                      <div className="flex items-start space-x-4">
                        <img
                          src={selectedProduct.vendor.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.vendor.firstName + ' ' + selectedProduct.vendor.lastName)}&background=000000&color=ffffff&size=64`}
                          alt={selectedProduct.vendor.firstName}
                          className="h-16 w-16 rounded-2xl object-cover shadow-md"
                        />
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-gray-900">
                            {selectedProduct.vendor.firstName} {selectedProduct.vendor.lastName}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedProduct.vendor.shop_name || selectedProduct.vendor.email}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                              {selectedProduct.vendor.vendeur_type}
                            </span>
                            {selectedProduct.vendor.country && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                <MapPin className="mr-1 h-3 w-3" />
                                {selectedProduct.vendor.country}
                              </span>
                            )}
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${selectedProduct.vendor.status ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-800'}`}>
                              {selectedProduct.vendor.status ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Informations design */}
                    {selectedProduct.hasDesign && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                          Design
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          {getDesignInfo(selectedProduct)}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedProduct.description && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                          Description
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-6 flex justify-center">
                <button
                  onClick={handleClosePreview}
                  className="rounded-xl bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 