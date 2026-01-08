import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Package, 
  Palette,
  Ruler,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  Zap
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

interface VendorProductDetail {
  id: number;
  vendorId: number;
  baseProductId: number;
  price: number;
  status: 'PUBLISHED' | 'DRAFT';
  vendorName: string;
  vendorDescription: string;
  vendorStock: number;
  basePriceAdmin: number;
  designUrl: string;
  mockupUrl?: string;
  originalDesignUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  baseProduct: {
    id: number;
    name: string;
    price: number;
    status: string;
    description: string;
    categories: Array<{
      id: number;
      name: string;
    }>;
  };
  
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    vendeurType: string;
    fullName: string;
    status: boolean;
    createdAt: string;
  };
  
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
  
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  
  images: {
    total: number;
    colorImages: Array<{
      id: number;
      vendorProductId: number;
      colorId: number;
      colorName: string;
      colorCode: string;
      imageType: string;
      cloudinaryUrl: string;
      cloudinaryPublicId: string;
      originalImageKey: string;
      width: number | null;
      height: number | null;
      fileSize: number;
      format: string;
      uploadedAt: string;
      createdAt: string;
      updatedAt: string;
    }>;
    defaultImages: Array<any>;
    primaryImageUrl: string;
    imageUrls: string[];
  };
  
  metadata: {
    profitMargin: number;
    profitPercentage: number;
    totalValue: number;
    averageImageSize: number;
    designQuality: string;
    lastModified: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Helper functions optimisées
const getStatusBadge = (status: string) => {
  const isPublished = status === 'PUBLISHED';
  if (isPublished) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
        Publié
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-medium">
      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
      Brouillon
    </Badge>
  );
};

const getStockLabel = (stock: number) => {
  if (stock <= 0) {
    return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 font-medium">Rupture de stock</Badge>;
  } else if (stock < 10) {
    return <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-medium">Stock faible ({stock})</Badge>;
  }
  return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium">{stock} en stock</Badge>;
};

// Fonction pour optimiser les URLs d'images Cloudinary
const getOptimizedImageUrl = (url: string, width = 800, quality = 'auto') => {
  if (!url) return url;
  
  // Si c'est une URL Cloudinary, on ajoute les transformations
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},q_${quality},f_auto,dpr_auto/${parts[1]}`;
    }
  }
  return url;
};

export const VendorProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<VendorProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductDetails(parseInt(id));
    }
  }, [id]);

  const fetchProductDetails = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Produit introuvable');
        } else if (response.status === 403) {
          throw new Error('Accès refusé');
        } else if (response.status === 401) {
          throw new Error('Vous devez être connecté');
        }
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setProduct(result.data);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMessage);
      console.error('❌ Error fetching product details:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    toast.info('Redirection vers l\'édition...');
    // TODO: Navigate to edit page
  };

  const handleDelete = async () => {
    if (!product || !confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendor/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Produit supprimé avec succès');
        navigate('/vendeur/products');
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      console.error('❌ Error deleting product:', err);
    }
  };

  // Formatage des prix en CFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('XOF', 'CFA');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement du produit</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Produit non disponible"}
          </h2>
          <p className="text-gray-600 mb-8">
            Le produit que vous recherchez n'est pas disponible.
          </p>
          <Button 
            onClick={() => navigate('/vendeur/products')}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* En-tête professionnel */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/vendeur/products')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mes Produits
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900">
                {product.vendorName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="border-gray-300 hover:border-gray-400"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
          
          {/* Badges de statut */}
          <div className="flex items-center gap-4 mt-4">
            {getStatusBadge(product.status)}
            {getStockLabel(product.vendorStock)}
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              ID: {product.id}
            </Badge>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs professionnels */}
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-gray-200 px-8 bg-gray-50">
              <TabsList className="bg-transparent h-14 gap-8">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-lg px-6 py-2 text-sm font-medium transition-all"
                >
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger 
                  value="design" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-lg px-6 py-2 text-sm font-medium transition-all"
                >
                  Design & Images
                </TabsTrigger>
                <TabsTrigger 
                  value="variations" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-lg px-6 py-2 text-sm font-medium transition-all"
                >
                  Variations
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-lg px-6 py-2 text-sm font-medium transition-all"
                >
                  Performance
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Onglet Vue d'ensemble */}
            <TabsContent value="overview" className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 p-8">
                {/* Images haute qualité */}
                <div className="lg:col-span-3">
                  <div className="sticky top-8 space-y-6">
                    {/* Image principale optimisée */}
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src={getOptimizedImageUrl(
                          (product.images?.imageUrls?.[selectedImageIndex]) || 
                          product.images?.primaryImageUrl || 
                          product.designUrl,
                          1200,
                          'auto:best'
                        )}
                        alt={product.vendorName}
                        className="w-full h-full object-contain p-8"
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.src = getOptimizedImageUrl(product.designUrl, 1200);
                        }}
                      />
                    </div>

                    {/* Miniatures haute qualité */}
                    {product.images?.imageUrls && product.images.imageUrls.length > 1 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Vues disponibles
                        </h4>
                        <ScrollArea className="w-full">
                          <div className="flex space-x-4 pb-4">
                            {product.images.imageUrls.map((url, idx) => (
                              <button
                                key={idx}
                                className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 ${
                                  selectedImageIndex === idx 
                                    ? 'ring-2 ring-gray-900 ring-offset-2 shadow-lg' 
                                    : 'hover:shadow-md hover:scale-105'
                                }`}
                                onClick={() => setSelectedImageIndex(idx)}
                              >
                                <img
                                  src={getOptimizedImageUrl(url, 200, 'auto:good')}
                                  alt={`Vue ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                {selectedImageIndex === idx && (
                                  <div className="absolute inset-0 bg-gray-900/10 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-white drop-shadow-lg" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations produit */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Prix et informations principales */}
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-white">
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-baseline gap-3 mb-2">
                            <h2 className="text-4xl font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </h2>
                            <span className="text-lg text-gray-500 line-through">
                              {formatPrice(product.basePriceAdmin)}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            {product.vendorDescription}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        {/* Métriques importantes */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-900">
                              {formatPrice(product.metadata?.totalValue || 0)}
                            </div>
                            <div className="text-sm text-blue-700 font-medium">
                              Valeur stock
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <Package className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900">
                              {product.vendorStock}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">
                              Unités en stock
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions principales */}
                  <div className="space-y-4">
                    <Button
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-medium"
                      onClick={() => window.open(getOptimizedImageUrl(product.designUrl, 2000, 'auto:best'), '_blank')}
                    >
                      <Eye className="h-5 w-5 mr-3" />
                      Voir le design en haute résolution
                    </Button>
                    
                    {product.mockupUrl && (
                      <Button
                        variant="outline"
                        className="w-full border-gray-300 hover:bg-gray-50 py-3 text-base font-medium"
                        onClick={() => window.open(getOptimizedImageUrl(product.mockupUrl!, 2000, 'auto:best'), '_blank')}
                      >
                        <Download className="h-5 w-5 mr-3" />
                        Télécharger le mockup HD
                      </Button>
                    )}
                  </div>

                  {/* Informations produit de base */}
                  <Card className="border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Produit de base</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.baseProduct?.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{product.baseProduct?.description}</p>
                        </div>
                        
                        {product.baseProduct?.categories && product.baseProduct.categories.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Catégories</div>
                            <div className="flex flex-wrap gap-2">
                              {product.baseProduct.categories.map((category) => (
                                <Badge key={category.id} variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                  {category.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Design & Images */}
            <TabsContent value="design" className="p-0">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Design & Galerie</h2>
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                    {product.images?.total || 0} images
                  </Badge>
                </div>

                {/* Design principal */}
                <Card className="border-gray-200 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Image design principale */}
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
                        <img
                          src={getOptimizedImageUrl(product.designUrl, 1000, 'auto:best')}
                          alt="Design principal"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                          loading="eager"
                        />
                      </div>
                      
                      {/* Informations design */}
                      <div className="p-8 space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">Design personnalisé</h3>
                          <p className="text-gray-600 leading-relaxed">{product.vendorDescription}</p>
                        </div>

                        {/* Actions design */}
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-gray-900 hover:bg-gray-800"
                            onClick={() => window.open(getOptimizedImageUrl(product.designUrl, 3000, 'auto:best'), '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir en ultra haute résolution
                          </Button>
                          
                          {product.originalDesignUrl && product.originalDesignUrl !== product.designUrl && (
                            <Button
                              variant="outline"
                              className="w-full border-gray-300"
                              onClick={() => window.open(getOptimizedImageUrl(product.originalDesignUrl!, 3000, 'auto:best'), '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Design source original
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Galerie d'images par couleur */}
                {product.images?.colorImages && product.images.colorImages.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Galerie par couleur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.images.colorImages.map((img) => (
                        <Card key={img.id} className="border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                            <img
                              src={getOptimizedImageUrl(img.cloudinaryUrl, 800, 'auto:good')}
                              alt={img.colorName}
                              className="max-w-full max-h-full object-contain rounded-lg"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/cccccc/333333?text=Image';
                              }}
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: img.colorCode }}
                              />
                              <h4 className="font-semibold text-gray-900">{img.colorName}</h4>
                              <Badge variant="outline" className="text-xs bg-gray-50">
                                {img.imageType}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                              <div>
                                <span className="font-medium">Résolution:</span>
                                <br />
                                {img.width && img.height ? `${img.width}×${img.height}px` : 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Taille:</span>
                                <br />
                                {formatFileSize(img.fileSize)}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(getOptimizedImageUrl(img.cloudinaryUrl, 2000, 'auto:best'), '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir en HD
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Variations */}
            <TabsContent value="variations" className="p-0">
              <div className="p-8 space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">Couleurs et Tailles</h2>

                {/* Couleurs disponibles */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Couleurs disponibles</h3>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                      {product.selectedColors ? product.selectedColors.length : 0} couleurs
                    </Badge>
                  </div>
                  
                  {product.selectedColors && product.selectedColors.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {product.selectedColors.map((color, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                  selectedColorIndex === index 
                                    ? 'ring-2 ring-gray-900 ring-offset-2 shadow-lg' 
                                    : 'hover:scale-105'
                                }`}
                                onClick={() => setSelectedColorIndex(index)}
                              >
                                <div className="aspect-square p-4">
                                  <div
                                    className="w-full h-full rounded-lg border-2 border-gray-200 shadow-inner"
                                    style={{ backgroundColor: color.colorCode }}
                                  />
                                </div>
                                <CardContent className="p-3 text-center">
                                  <h4 className="font-medium text-gray-900 text-sm mb-1">{color.name}</h4>
                                  <p className="text-xs text-gray-500 font-mono">{color.colorCode}</p>
                                  {selectedColorIndex === index && (
                                    <Badge className="mt-2 bg-gray-900 text-white text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Sélectionnée
                                    </Badge>
                                  )}
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>{color.name} - {color.colorCode}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune couleur configurée</h3>
                      <p className="text-gray-500">Ce produit n'a pas de variations de couleur.</p>
                    </div>
                  )}
                </div>

                {/* Tailles disponibles */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Tailles disponibles</h3>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                      {product.selectedSizes ? product.selectedSizes.length : 0} tailles
                    </Badge>
                  </div>
                  
                  {product.selectedSizes && product.selectedSizes.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {product.selectedSizes.map((size, index) => (
                        <Card key={index} className="text-center hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Ruler className="h-6 w-6 text-gray-600" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{size.sizeName}</h4>
                            <Badge variant="outline" className="bg-gray-50 text-xs">
                              ID: {size.id}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune taille configurée</h3>
                      <p className="text-gray-500">Ce produit n'a pas de variations de taille.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Onglet Performance */}
            <TabsContent value="analytics" className="p-0">
              <div className="p-8 space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">Performance & Analyses</h2>
                
                {/* Métriques principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-emerald-900 mb-2">
                        {formatPrice(product.metadata?.profitMargin || 0)}
                      </h3>
                      <p className="text-emerald-700 font-medium mb-1">Marge par vente</p>
                      <Badge className="bg-emerald-600 text-white">
                        {(product.metadata?.profitPercentage || 0).toFixed(1)}% de profit
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-blue-900 mb-2">
                        {formatPrice(product.metadata?.totalValue || 0)}
                      </h3>
                      <p className="text-blue-700 font-medium mb-1">Valeur totale du stock</p>
                      <Badge className="bg-blue-600 text-white">
                        {product.vendorStock} unités
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-amber-900 mb-2">
                        {product.metadata?.designQuality || 'N/A'}
                      </h3>
                      <p className="text-amber-700 font-medium mb-1">Score qualité design</p>
                      <Badge className="bg-amber-600 text-white">
                        Évaluation IA
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Détails techniques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Informations temporelles */}
                  <Card className="border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-gray-600" />
                        Chronologie
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Créé le</span>
                          <span className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-1 rounded">
                            {new Date(product.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Dernière modification</span>
                          <span className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-1 rounded">
                            {new Date(product.updatedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {product.metadata?.lastModified && (
                          <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600 font-medium">Dernière activité</span>
                            <span className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-1 rounded">
                              {new Date(product.metadata.lastModified).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommandations */}
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <Zap className="h-6 w-6 text-blue-600" />
                      Recommandations d'optimisation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-800">💡 Améliorer les performances</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Ajouter plus de variations de couleurs</li>
                          <li>• Optimiser la description du produit</li>
                          <li>• Créer des images mockup supplémentaires</li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-800">📈 Augmenter les ventes</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Ajuster le prix selon la demande</li>
                          <li>• Promouvoir sur les réseaux sociaux</li>
                          <li>• Créer des bundles avec d'autres produits</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 