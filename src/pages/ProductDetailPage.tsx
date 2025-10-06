import React, { useState, useEffect } from 'react';
import { 
  Edit, Trash2, Package, CheckCircle, XCircle,
  ArrowLeft, Heart, Share2, Info, RefreshCw, Palette
} from 'lucide-react';

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { AspectRatio } from "../components/ui/aspect-ratio";
import { Separator } from "../components/ui/separator";
import { Product } from '../schemas/product.schema';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchProductById } from '../services/api';
import { ProductDiagnostic } from '../components/ProductDiagnostic';

// Interface pour les dimensions d'une taille
interface SizeDimensions {
  width?: string;
  height?: string;
  depth?: string;
}

// Interface pour la taille de produit avec des champs supplémentaires
interface ProductSize {
  id: number;
  name: string;
  description?: string;
  stock?: number;
  dimensions?: SizeDimensions;
}

// Extension de l'interface Product pour inclure les champs personnalisés
interface ExtendedProduct extends Omit<Product, 'sizes'> {
  customDesign?: {
    name: string;
    description: string;
    image?: string;
    base64Image?: string;
  };
  designImages?: { url: string; file: File }[];
  designName?: string | null;
  designDescription?: string | null;
  designImageUrl?: string | null;
  sizes: ProductSize[];
}

// Helper functions
const getStatusBadge = (status: string) => {
  const isPublished = status === 'PUBLISHED' || 
                     status === 'published' || 
                     status?.toUpperCase?.() === 'PUBLISHED';
                     
  if (isPublished) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0">Publié</Badge>;
  }
  return <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">Brouillon</Badge>;
};

const getStockLabel = (stock: number) => {
  if (stock <= 0) {
    return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0">Rupture</Badge>;
  } else if (stock < 10) {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-0">{stock} en stock</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0">{stock} en stock</Badge>;
};

const getCategoryLabel = (category: any) => {
  if (typeof category === 'object' && category?.name) {
    return category.name;
  }
  return category;
};

interface ProductDetailPageProps {
  products?: ExtendedProduct[];
  isDarkMode?: boolean;
  onEdit?: (product: ExtendedProduct) => void;
  onDelete?: (id: number) => void;
}

const findBlackColorIndex = (colors: any[]) => {
  if (!colors || colors.length === 0) return 0;
  
  const blackIndex = colors.findIndex(
    c => c.name?.toLowerCase() === 'noir' || 
         c.hexCode === '#000000' || 
         c.hexCode === '#000'
  );
  
  return blackIndex >= 0 ? blackIndex : 0;
};

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  products = [],
  isDarkMode = false,
  onEdit,
  onDelete
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const backPath = isAdminRoute ? '/admin/products' : '/products';
  
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);
  const [selectedViewIndex, setSelectedViewIndex] = useState<number | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        if (id && products.length > 0) {
          const productId = parseInt(id, 10);
          const product = products.find(p => p.id === productId);
          if (product) {
            setSelectedProduct(product);
          } else {
            setError("Produit non trouvé dans la liste");
            navigate(backPath);
          }
        } else if (id) {
          const productData = await fetchProductById(id);
          setSelectedProduct(productData as ExtendedProduct);
        }
      } catch (err) {
        setError("Erreur lors du chargement du produit");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, products, navigate, backPath]);

  // Set default color
  useEffect(() => {
    if (selectedProduct && selectedProduct.colors && selectedProduct.colors.length > 0 && selectedColorIndex === null) {
      const blackIndex = findBlackColorIndex(selectedProduct.colors);
      setSelectedColorIndex(blackIndex);
    }
  }, [selectedProduct, selectedColorIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-spin" />
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Chargement du produit...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Veuillez patienter ou revenir à la liste des produits</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate(backPath)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  if (error || !selectedProduct) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(backPath)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux produits
          </Button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-red-800">
                ❌ Produit {id} introuvable
              </h2>
              <p className="text-red-600 mt-1">
                {error || "Le produit que vous recherchez n'est pas disponible ou n'existe pas."}
              </p>
            </div>
          </div>
          
          <div className="text-sm text-red-600">
            <strong>Causes possibles :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>ID de produit inexistant</li>
              <li>Mauvaise route utilisée (produit de base vs vendeur)</li>
              <li>Problème d'authentification</li>
              <li>Produit supprimé ou en brouillon</li>
            </ul>
          </div>
        </div>
        
        {/* Composant de diagnostic automatique */}
        {id && <ProductDiagnostic productId={parseInt(id)} />}
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(backPath)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Produits
          </Button>
          <span className="text-gray-500 dark:text-gray-400">/</span>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {selectedProduct.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onEdit(selectedProduct)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(selectedProduct.id || 0);
                navigate(backPath);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
              </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Product header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedProduct.name}
                </h2>
                {getStatusBadge(selectedProduct.status)}
              </div>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedProduct.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedProduct.price.toLocaleString()} CFA
              </div>
              {getStockLabel(selectedProduct.stock)}
            </div>
          </div>
        </div>

        {/* Tabs content */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-800 px-6">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="colors">Couleurs</TabsTrigger>
              <TabsTrigger value="sizes">Tailles</TabsTrigger>
              <TabsTrigger value="views">Vues</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Overview tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main image */}
              <div className="md:col-span-2 space-y-6">
                <AspectRatio ratio={1} className="bg-gray-50 rounded-lg overflow-hidden">
                  {selectedProduct.imageUrl ? (
                        <img
                      src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="w-full h-full object-contain p-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                          }}
                        />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col">
                      <Package className="h-20 w-20 text-gray-300" />
                      <p className="text-gray-400 mt-4">Aucune image disponible</p>
                      </div>
                  )}
                </AspectRatio>
                          </div>

              {/* Product details */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedProduct.price.toLocaleString()} CFA
                        </h3>
                        <p className="text-sm text-gray-500">Prix TTC</p>
                      </div>
                      {getStockLabel(selectedProduct.stock)}
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Catégorie</p>
                        <p className="font-medium text-gray-900">
                          {getCategoryLabel(selectedProduct.category)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Statut</p>
                        <div>
                          {getStatusBadge(selectedProduct.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Sizes */}
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Tailles disponibles</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.map((size, index) => (
                            <Badge key={index} variant="outline" className="bg-gray-50">
                              {size.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 rounded-lg bg-blue-50 text-blue-800">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">
                          Produit disponible dans plusieurs variations. Consultez les onglets pour plus de détails.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => navigate(backPath)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux produits
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Favoris
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Colors tab */}
          <TabsContent value="colors" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium text-gray-900">Couleurs disponibles</h3>
                <Badge variant="outline">
                  {selectedProduct.colors ? selectedProduct.colors.length : 0} couleurs
                </Badge>
              </div>
              
              {selectedProduct.colors && selectedProduct.colors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedProduct.colors.map((color, index) => (
                    <Card
                      key={index}
                      className={`overflow-hidden ${
                        selectedColorIndex === index ? 'ring-2 ring-black' : ''
                      } cursor-pointer transition-all`}
                      onClick={() => setSelectedColorIndex(index)}
                    >
                      <div className="h-40 w-full flex items-center justify-center">
                        {color.imageUrl ? (
                          <img
                            src={color.imageUrl}
                            alt={color.name}
                            className="max-h-full max-w-full object-contain p-4"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full"
                            style={{ backgroundColor: color.hexCode || '#999' }}
                          />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{color.name}</h4>
                          {selectedColorIndex === index && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        {color.hexCode && (
                          <p className="text-sm text-gray-500 mt-1">{color.hexCode}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
                  <Palette className="h-16 w-16 text-gray-300 mb-4" />
                  <h4 className="text-xl text-gray-900 font-medium mb-2">
                    Aucune couleur disponible
                  </h4>
                  <p className="text-gray-600 max-w-md">
                    Ce produit n'a pas de couleurs ou variations de couleur définies.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Sizes tab */}
          <TabsContent value="sizes" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium text-gray-900">Tailles disponibles</h3>
                <Badge variant="outline">
                  {selectedProduct.sizes ? selectedProduct.sizes.length : 0} tailles
                </Badge>
            </div>
            
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedProduct.sizes.map((size, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
            <div>
                            <h4 className="text-lg font-medium text-gray-900">{size.name}</h4>
                            {size.description && (
                              <p className="text-sm text-gray-500 mt-1">{size.description}</p>
                            )}
                          </div>
                          {size.stock !== undefined && (
                            <Badge className={size.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {size.stock > 0 ? `Stock: ${size.stock}` : 'Rupture'}
                            </Badge>
                          )}
            </div>
            
                        {size.dimensions && (
                          <div className="mt-3 p-3 rounded-md bg-gray-50">
                            <p className="text-xs text-gray-500 mb-2">Dimensions</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              {size.dimensions.width && (
                                <div>
                                  <p className="text-xs text-gray-500">Largeur</p>
                                  <p className="font-medium text-gray-900">{size.dimensions.width}</p>
                                </div>
                              )}
                              {size.dimensions.height && (
                                <div>
                                  <p className="text-xs text-gray-500">Hauteur</p>
                                  <p className="font-medium text-gray-900">{size.dimensions.height}</p>
                                </div>
                              )}
                              {size.dimensions.depth && (
            <div>
                                  <p className="text-xs text-gray-500">Profondeur</p>
                                  <p className="font-medium text-gray-900">{size.dimensions.depth}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
                  <Package className="h-16 w-16 text-gray-300 mb-4" />
                  <h4 className="text-xl text-gray-900 font-medium mb-2">
                    Aucune taille disponible
                  </h4>
                  <p className="text-gray-600 max-w-md">
                    Ce produit n'a pas de tailles définies.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Views tab */}
          <TabsContent value="views" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-medium text-gray-900">Vues disponibles</h3>
                <Badge variant="outline">
                  {selectedProduct.views ? selectedProduct.views.length : 0} vues
                </Badge>
              </div>
              
              {selectedProduct.views && selectedProduct.views.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedProduct.views.map((view, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-48 w-full">
                        <img
                          src={view.imageUrl}
                          alt={`Vue ${view.viewType}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/300x200/cccccc/333333?text=Vue+non+disponible';
                          }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900">{view.viewType}</h4>
                            {view.description && (
                          <p className="text-sm text-gray-500 mt-1">{view.description}</p>
                            )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
                  <Package className="h-16 w-16 text-gray-300 mb-4" />
                  <h4 className="text-xl text-gray-900 font-medium mb-2">
                    Aucune vue disponible
                  </h4>
                  <p className="text-gray-600 max-w-md">
                    Ce produit n'a pas de vues définies.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetailPage; 