import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Package, 
  Image as ImageIcon,
  Palette,
  Ruler,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Settings,
  Paintbrush
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

interface AdminProductDetail {
  id: number;
  name: string;
  price: number;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;

  // ✅ NEW: FK-based category system
  categoryId?: number | null;
  subCategoryId?: number | null;
  variationId?: number | null;
  category?: {
    id: number;
    name: string;
    level: number;
  } | null;
  subCategory?: {
    id: number;
    name: string;
    level: number;
  } | null;
  variation?: {
    id: number;
    name: string;
    level: number;
  } | null;

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
      url: string;
      viewType: string;
      delimitations: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: 'PERCENTAGE' | 'PIXEL';
      }>;
    }>;
  }>;

  images: {
    total: number;
    imageUrls: string[];
    primaryImageUrl: string;
  };
  
  metadata: {
    totalVariations: number;
    averagePrice: number;
    lastModified: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

// Helper functions
const getStatusBadge = (status: string) => {
  const isActive = status.toLowerCase() === 'active';
  if (isActive) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
        Actif
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-medium">
      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
      Inactif
    </Badge>
  );
};

// Fonction pour optimiser les URLs d'images Cloudinary
const getOptimizedImageUrl = (url: string, width = 800, quality = 'auto') => {
  if (!url) return url;
  
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},q_${quality},f_auto,dpr_auto/${parts[1]}`;
    }
  }
  return url;
};

export const AdminProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
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

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
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

      const data = await response.json();
      
      if (data) {
        setProduct({
          ...data,
          images: {
            total: data.colorVariations?.reduce((acc: number, cv: any) => acc + (cv.images?.length || 0), 0) || 0,
            imageUrls: data.colorVariations?.flatMap((cv: any) => cv.images?.map((img: any) => img.url) || []) || [],
            primaryImageUrl: data.colorVariations?.[0]?.images?.[0]?.url || ''
          },
          metadata: {
            totalVariations: data.colorVariations?.length || 0,
            averagePrice: data.price || 0,
            lastModified: data.updatedAt || data.createdAt
          }
        });
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
    navigate(`/admin/products/${id}/edit`);
  };

  const handleEditMockup = () => {
    navigate(`/admin/products/${id}/mockup-edit`);
  };

  const handleDelete = async () => {
    if (!product || !confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Produit supprimé avec succès');
        navigate('/admin/products');
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
            onClick={() => navigate('/admin/products')}
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
                onClick={() => navigate('/admin/products')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Produits
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900">
                {product.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleEditMockup}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
              >
                <Paintbrush className="h-4 w-4 mr-2" />
                Modifier Mockups
              </Button>
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
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              ID: {product.id}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-300">
              {product.metadata.totalVariations} variations
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
                  value="variations" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-lg px-6 py-2 text-sm font-medium transition-all"
                >
                  Variations & Mockups
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-lg px-6 py-2 text-sm font-medium transition-all"
                >
                  Configuration
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
                          product.images?.imageUrls?.[selectedImageIndex] || 
                          product.images?.primaryImageUrl,
                          1200,
                          'auto:best'
                        )}
                        alt={product.name}
                        className="w-full h-full object-contain p-8"
                        loading="eager"
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
                          <div className="flex items-baseline gap-3 mb-4">
                            <h2 className="text-4xl font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </h2>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        {/* Métriques importantes */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-900">
                              {product.metadata.totalVariations}
                            </div>
                            <div className="text-sm text-blue-700 font-medium">
                              Variations
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <ImageIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900">
                              {product.images.total}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">
                              Images
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions principales */}
                  <div className="space-y-4">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
                      onClick={handleEditMockup}
                    >
                      <Paintbrush className="h-5 w-5 mr-3" />
                      Modifier les Mockups
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 hover:bg-gray-50 py-3 text-base font-medium"
                      onClick={handleEdit}
                    >
                      <Edit className="h-5 w-5 mr-3" />
                      Modifier le produit
                    </Button>
                  </div>

                  {/* Catégories et tailles */}
                  <Card className="border-gray-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* ✅ NEW: FK-based category hierarchy display */}
                        {(product.category || product.subCategory || product.variation) && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Hiérarchie de catégories</h4>
                            <div className="flex flex-wrap gap-2 items-center">
                              {product.category && (
                                <>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                    {product.category.name}
                                  </Badge>
                                  {product.subCategory && <span className="text-gray-400">›</span>}
                                </>
                              )}
                              {product.subCategory && (
                                <>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                                    {product.subCategory.name}
                                  </Badge>
                                  {product.variation && <span className="text-gray-400">›</span>}
                                </>
                              )}
                              {product.variation && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  {product.variation.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {product.sizes && product.sizes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Tailles</h4>
                            <div className="flex flex-wrap gap-2">
                              {product.sizes.map((size) => (
                                <Badge key={size.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                  {size.sizeName}
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

            {/* Onglet Variations & Mockups */}
            <TabsContent value="variations" className="p-8">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Couleurs et Mockups</h2>
                  <Button
                    onClick={handleEditMockup}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Paintbrush className="h-4 w-4 mr-2" />
                    Modifier les mockups
                  </Button>
                </div>

                {/* Grille des variations de couleur */}
                {product.colorVariations && product.colorVariations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {product.colorVariations.map((color) => (
                      <Card key={color.id} className="border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gray-50 p-4">
                          {color.images && color.images.length > 0 ? (
                            <img
                              src={getOptimizedImageUrl(color.images[0].url, 400, 'auto:good')}
                              alt={color.name}
                              className="w-full h-full object-contain rounded-lg"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <h4 className="font-semibold text-gray-900">{color.name}</h4>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-4">
                            <p>{color.images?.length || 0} image(s) mockup</p>
                            <p className="font-mono text-xs">{color.colorCode}</p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleEditMockup}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune variation configurée</h3>
                    <p className="text-gray-500 mb-4">Ce produit n'a pas de variations de couleur.</p>
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Ajouter des variations
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Configuration */}
            <TabsContent value="settings" className="p-8">
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">Configuration du produit</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Nom:</span>
                          <p className="text-gray-900">{product.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Prix:</span>
                          <p className="text-gray-900">{formatPrice(product.price)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Statut:</span>
                          <div className="mt-1">{getStatusBadge(product.status)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Créé le:</span>
                          <p className="text-gray-900">{new Date(product.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Modifié le:</span>
                          <p className="text-gray-900">{new Date(product.updatedAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                      <div className="space-y-3">
                        <Button
                          onClick={handleEditMockup}
                          className="w-full bg-blue-600 hover:bg-blue-700 justify-start"
                        >
                          <Paintbrush className="h-4 w-4 mr-2" />
                          Modifier les mockups
                        </Button>
                        <Button
                          onClick={handleEdit}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier le produit
                        </Button>
                        <Button
                          onClick={() => window.open(`/products/${product.id}`, '_blank')}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir en boutique
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetailPage;