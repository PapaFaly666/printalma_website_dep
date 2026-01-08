import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, Eye, Edit, Trash2, Tag, Package, DollarSign, CheckCircle, XCircle,
  ChevronRight, Image as ImageIcon, Palette, Box, ShoppingCart, ChevronLeft, 
  Pencil, ArrowLeft, ArrowRight, Plus, Minus, Heart, Share2, Info,
  Settings
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import Button from "./ui/Button";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { AspectRatio } from "./ui/aspect-ratio";
import { Separator } from "./ui/separator";
import { Product } from '../schemas/product.schema';

// Extension de l'interface Product pour inclure les champs personnalisés
interface ExtendedProduct extends Product {
  // Format de design personnalisé de l'application
  customDesign?: {
    name: string;
    description: string;
    image?: string;
    base64Image?: string;
  };
  designImages?: { url: string; file: File }[];
  
  // Format de design de l'API
  designName?: string | null;
  designDescription?: string | null;
  designImageUrl?: string | null;
}
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';

// Define the type for the outlet context
type ContextType = { isDarkMode: boolean };

export interface ProductTableProps {
  products: ExtendedProduct[];
  loading: boolean;
  searchTerm: string;
  currentCategory: string;
  onEdit: (product: ExtendedProduct) => void;
  onDelete: (id: number) => void;
  onDetail: (product: ExtendedProduct) => void;
  viewMode?: 'grid' | 'list';
}

const getStatusBadge = (status: string) => {
  // Vérifier différentes formes de statut "publié"
  const isPublished = status === 'PUBLISHED' || 
                     status === 'published' || 
                     status?.toUpperCase?.() === 'PUBLISHED';
                     
  if (isPublished) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0">Publié</Badge>;
  }
  return <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">Brouillon</Badge>;
};

// Fonction helper pour vérifier si un produit est publié
const isProductPublished = (status: string) => {
  return status === 'PUBLISHED' || 
         status === 'published' || 
         status?.toUpperCase?.() === 'PUBLISHED';
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

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  searchTerm,
  currentCategory,
  onEdit,
  onDelete,
  onDetail,
  viewMode = 'list'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedViewIndex, setSelectedViewIndex] = useState<number | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [productColorImages, setProductColorImages] = useState<Record<number, { selectedColor?: number }>>({});
  const { isDarkMode = false } = useOutletContext<ContextType>() || {};

  // Initialiser les couleurs par défaut au chargement des produits
  useEffect(() => {
    if (products.length > 0) {
      const initialColorState: Record<number, { selectedColor?: number }> = {};
      
      products.forEach(product => {
        if (product.id && product.colors && product.colors.length > 0) {
          initialColorState[product.id] = { selectedColor: 0 };
        }
      });
      
      setProductColorImages(initialColorState);
    }
  }, [products]);

  // Fonction pour obtenir l'image à afficher pour un produit et une couleur
  const getProductColorImage = (product: Product, colorIndex?: number) => {
    // Si une couleur spécifique est sélectionnée et qu'elle a une image, l'utiliser
    if (colorIndex !== undefined && colorIndex >= 0 && 
        product.colors && product.colors[colorIndex] && 
        product.colors[colorIndex].imageUrl) {
      return product.colors[colorIndex].imageUrl;
    }
    
    // Sinon, utiliser la première vue disponible
    if (product.views && product.views.length > 0) {
      return product.views[0].imageUrl;
    }
    
    // Si ni couleur ni vue n'est disponible, retourner null
    return null;
  };

  // Fonction pour gérer le clic sur une couleur
  const handleColorClick = (e: React.MouseEvent, product: Product, colorIndex: number) => {
    e.stopPropagation(); // Empêcher la propagation pour éviter d'ouvrir la boîte de dialogue
    
    // Mettre à jour l'état pour ce produit et cette couleur
    setProductColorImages(prev => ({
      ...prev,
      [product.id || 0]: {
        ...(prev[product.id || 0] || {}),
        selectedColor: colorIndex
      }
    }));
  };

  // Fonction de filtrage
  const filteredProducts = products.filter(product => {
    // Filtrage par terme de recherche
    const searchMatch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    // Filtrage par catégorie
    const categoryMatch = 
      currentCategory === 'all' || 
      (typeof product.category === 'object' 
        ? product.category?.name === currentCategory 
        : product.category === currentCategory);
    
    return searchMatch && categoryMatch;
  });

  // Afficher les vignettes de couleurs et vues pour un produit
  const renderColorSwatches = (product: Product) => {
    if (!product.colors || product.colors.length === 0) return null;
    
    return (
      <div className="flex space-x-1 mt-1">
        {product.colors.slice(0, 4).map((color, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer"
                  style={{ backgroundColor: color.hexCode || '#999' }}
                  onClick={(e) => handleColorClick(e, product, index)}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {color.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {product.colors.length > 4 && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">+{product.colors.length - 4}</Badge>
        )}
      </div>
    );
  };

  const renderSizeTags = (product: Product) => {
    if (!product.sizes || product.sizes.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {(product.sizes || []).slice(0, 5).map((size, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="text-[10px] h-5 px-1.5 bg-gray-50 dark:bg-gray-800"
          >
            {size.sizeName}
          </Badge>
        ))}
        {product.sizes.length > 5 && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">+{product.sizes.length - 5}</Badge>
        )}
      </div>
    );
  };

  const renderViewsThumbnails = (product: Product) => {
    if (!product.views || product.views.length === 0) return null;
    
    return (
      <div className="flex -space-x-2 mt-2">
        {product.views.slice(0, 3).map((view, index) => (
          <img
            key={index}
            src={view.imageUrl}
            alt={`Vue ${view.viewType}`}
            className="w-8 h-8 rounded-md object-cover border border-gray-200 dark:border-gray-700"
          />
        ))}
        {product.views.length > 3 && (
          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            +{product.views.length - 3}
          </div>
        )}
      </div>
    );
  };

  const showImageDialog = (product: Product) => {
    const detailPath = isAdminRoute ? `/admin/products/${product.id}` : `/products/${product.id}`;
    navigate(detailPath);
  };

  // Rendu du tableau en mode liste
  const renderListView = () => (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900">
          <TableRow>
            <TableHead className="w-[300px] font-medium">Produit</TableHead>
            <TableHead className="font-medium">Catégorie</TableHead>
            <TableHead className="font-medium">Prix</TableHead>
            <TableHead className="font-medium">Stock</TableHead>
            <TableHead className="font-medium">Statut</TableHead>
            <TableHead className="font-medium">Options</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-8 w-[250px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-10" /></TableCell>
              </TableRow>
            ))
          ) : filteredProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-500 dark:text-gray-400">
                Aucun produit trouvé
              </TableCell>
            </TableRow>
          ) : (
            filteredProducts.map((product) => (
              <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <TableCell>
                                      <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => showImageDialog(product)}
                      >
                        {(() => {
                          // Obtenir l'index de la couleur sélectionnée pour ce produit
                          const selectedColor = productColorImages[product.id || 0]?.selectedColor;
                          
                          // Vérifier si la couleur sélectionnée a une image
                          if (selectedColor !== undefined && 
                              product.colors && 
                              product.colors[selectedColor] && 
                              product.colors[selectedColor].imageUrl) {
                            return <img src={product.colors[selectedColor].imageUrl} alt={product.name} className="w-full h-full object-cover" />;
                          }
                          
                          // Si pas d'image de couleur, utiliser la première vue disponible
                          if (product.views && product.views.length > 0 && product.views[0].imageUrl) {
                            return <img src={product.views[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />;
                          }
                          
                          // S'il n'y a pas de couleurs avec des images ou de vues, mais qu'il y a des couleurs, 
                          // afficher un arrière-plan avec la couleur
                          if (product.colors && product.colors.length > 0 && product.colors[0].hexCode) {
                            return (
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ backgroundColor: product.colors[0].hexCode || '#999' }}
                              >
                                <span className="text-xs font-bold text-white">
                                  {product.colors[0].name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            );
                          }
                          
                          // En dernier recours, afficher l'icône
                          return <Package className="w-6 h-6 text-gray-400" />;
                        })()}
                      </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[250px] truncate">
                        {product.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {renderColorSwatches(product)}
                        {renderViewsThumbnails(product)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900 whitespace-nowrap">
                    {getCategoryLabel(product.category)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {product.price.toLocaleString()} CFA
                </TableCell>
                <TableCell>
                  {getStockLabel(product.stock)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(product.status)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {renderSizeTags(product)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Modifier</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => onDelete(product.id || 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Rendu en mode grille
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {loading ? (
        Array(8).fill(0).map((_, index) => (
          <Card key={index} className="overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="aspect-square bg-gray-100 dark:bg-gray-900">
              <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : filteredProducts.length === 0 ? (
        <div className="col-span-full h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Aucun produit trouvé
        </div>
      ) : (
        filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className="overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
          >
            <div 
              className="aspect-square bg-gray-100 dark:bg-gray-900 relative cursor-pointer group"
              onClick={() => showImageDialog(product)}
            >
              {(() => {
                // Obtenir l'index de la couleur sélectionnée pour ce produit
                const selectedColor = productColorImages[product.id || 0]?.selectedColor;
                
                // Vérifier si la couleur sélectionnée a une image
                if (selectedColor !== undefined && 
                    product.colors && 
                    product.colors[selectedColor] && 
                    product.colors[selectedColor].imageUrl) {
                  return <img src={product.colors[selectedColor].imageUrl} alt={product.name} className="w-full h-full object-cover" />;
                }
                
                // Si pas d'image de couleur, utiliser la première vue disponible
                if (product.views && product.views.length > 0 && product.views[0].imageUrl) {
                  return <img src={product.views[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />;
                }
                
                // S'il n'y a pas de couleurs avec des images ou de vues, mais qu'il y a des couleurs, 
                // afficher un arrière-plan avec la couleur
                if (product.colors && product.colors.length > 0 && product.colors[0].hexCode) {
                  return (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: product.colors[0].hexCode || '#999' }}
                    >
                      <span className="text-xl font-bold text-white">
                        {product.colors[0].name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  );
                }
                
                // En dernier recours, afficher l'icône
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                );
              })()}
              
              {/* Info en survol */}
              <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-white font-medium mb-1">{product.name}</div>
                <div className="text-gray-200 text-sm line-clamp-2 mb-2">{product.description}</div>
                <div className="flex gap-2">
                  {product.design && (
                    <Badge className="bg-black text-white">Design personnalisé</Badge>
                  )}
                  {product.views && product.views.length > 0 && (
                    <Badge className="bg-white text-black">{product.views.length} vues</Badge>
                  )}
                </div>
              </div>
              
              {/* Indicateurs */}
              <div className="absolute top-2 right-2">
                {product.stock <= 0 && (
                  <Badge className="bg-red-500 text-white">Rupture</Badge>
                )}
                {product.stock > 0 && product.stock < 10 && (
                  <Badge className="bg-amber-500 text-white">Stock faible</Badge>
                )}
              </div>
              
              {/* Couleurs disponibles */}
              {product.colors && product.colors.length > 0 && (
                <div className="absolute bottom-2 left-2 flex -space-x-1.5">
                  {product.colors.slice(0, 5).map((color, index) => (
                    <div 
                      key={index}
                      className={`w-6 h-6 rounded-full border-2 ${
                        productColorImages[product.id || 0]?.selectedColor === index 
                          ? 'border-black dark:border-white ring-2 ring-black dark:ring-white' 
                          : 'border-white dark:border-gray-800'
                      }`}
                      style={{ backgroundColor: color.hexCode || '#999' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorClick(e, product, index);
                      }}
                    />
                  ))}
                  {product.colors.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs border-2 border-white dark:border-gray-700">
                      +{product.colors.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getCategoryLabel(product.category)}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{product.price.toLocaleString()} CFA</div>
                  {getStatusBadge(product.status)}
                </div>
              </div>
              
              {/* Tailles */}
              {renderSizeTags(product)}
            </CardContent>
            
            <CardFooter className="p-3 pt-0 flex justify-between border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id || 0);
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );

  // Dialogue de visualisation des images
  const renderImageDialog = () => (
    <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
      <DialogContent className={`max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1200px] p-0 ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border rounded-lg overflow-y-auto max-h-[95vh] sm:max-h-[90vh]`}>
        {selectedProduct && (
          <div>
            {/* En-tête du dialog avec le nom du produit */}
            <DialogHeader className={`px-6 py-5 border-b ${
              isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'
            } sticky top-0 z-10`}>
              <div className="flex items-center justify-between">
                <DialogTitle className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedProduct.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isProductPublished(selectedProduct.status) ? "default" : "outline"}
                    className={
                      isProductPublished(selectedProduct.status)
                        ? `${isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`
                        : `${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}`
                    }
                  >
                    {isProductPublished(selectedProduct.status) ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
              </div>
              <DialogDescription className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              } mt-1`}>
                {selectedProduct.description}
              </DialogDescription>
            </DialogHeader>
            
            {/* Corps du modal avec onglets */}
            <Tabs 
              defaultValue={
                // Si le produit a un design personnalisé, on affiche directement l'onglet design
                (selectedProduct.designImageUrl ||
                 selectedProduct.designName ||
                 selectedProduct.views?.some(v => (v.viewType as any) === 'DESIGN') ||
                 selectedProduct.design?.imageUrl ||
                 selectedProduct.customDesign?.base64Image ||
                 (selectedProduct.designImages && selectedProduct.designImages.length > 0))
                ? "design" : "overview"
              } 
              className="w-full">
              <div className={`px-6 border-b ${
                isDarkMode ? 'border-gray-800' : 'border-gray-100'
              }`}>
                <TabsList className="bg-transparent h-14 p-0 w-full justify-start gap-8">
                  <TabsTrigger 
                    value="overview" 
                    className={`data-[state=active]:${
                      isDarkMode ? 'border-white text-white' : 'border-black text-black'
                    } border-b-2 border-transparent rounded-none px-2 py-4 text-base ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Aperçu
                  </TabsTrigger>
                  <TabsTrigger 
                    value="colors" 
                    className={`data-[state=active]:${
                      isDarkMode ? 'border-white text-white' : 'border-black text-black'
                    } border-b-2 border-transparent rounded-none px-2 py-4 text-base ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Couleurs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sizes" 
                    className={`data-[state=active]:${
                      isDarkMode ? 'border-white text-white' : 'border-black text-black'
                    } border-b-2 border-transparent rounded-none px-2 py-4 text-base ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Tailles
                  </TabsTrigger>
                  <TabsTrigger 
                    value="views" 
                    className={`data-[state=active]:${
                      isDarkMode ? 'border-white text-white' : 'border-black text-black'
                    } border-b-2 border-transparent rounded-none px-2 py-4 text-base ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-g-0ray-800'
                    }`}
                  >
                    Vues
                  </TabsTrigger>
                  <TabsTrigger 
                    value="design" 
                    className={`data-[state=active]:${
                      isDarkMode ? 'border-white text-white' : 'border-black text-black'
                    } border-b-2 border-transparent rounded-none px-2 py-4 text-base ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Design
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Onglet Aperçu */}
              <TabsContent value="overview" className="p-8 focus-visible:outline-none focus-visible:ring">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Section gauche: image principale */}
                  <div className="space-y-8">
                    <AspectRatio ratio={1} className={`${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } rounded-lg border overflow-hidden shadow-sm`}>
                      {/* Hiérarchie de recherche d'images:
                        1. Vue actuellement sélectionnée
                        2. Vue DESIGN spécifique
                        3. Première vue disponible
                        4. Image de design standard
                        5. Image customDesign.base64Image
                        6. Placeholder
                      */}
                      {(() => {
                        // 1. Vue actuellement sélectionnée
                        if (selectedViewIndex !== null && selectedProduct.views && 
                            selectedProduct.views[selectedViewIndex] && 
                            selectedProduct.views[selectedViewIndex].imageUrl) {
                          return (
                            <img
                              src={selectedProduct.views[selectedViewIndex].imageUrl}
                              alt={selectedProduct.name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          );
                        }
                        
                        // 2. Vue DESIGN spécifique
                        const designView = selectedProduct.views?.find(v => 
                          // Utilisation de 'as any' pour éviter l'erreur de type
                          (v.viewType as any) === 'DESIGN'
                        );
                        if (designView?.imageUrl) {
                          return (
                            <img
                              src={designView.imageUrl}
                              alt={`Design de ${selectedProduct.name}`}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          );
                        }
                        
                        // 3. Première vue disponible
                        if (selectedProduct.views && selectedProduct.views.length > 0 && 
                            selectedProduct.views[0].imageUrl) {
                          return (
                            <img
                              src={selectedProduct.views[0].imageUrl}
                              alt={selectedProduct.name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          );
                        }
                        
                        // 4. Image design standard
                        if (selectedProduct.design?.imageUrl) {
                          return (
                            <img
                              src={selectedProduct.design.imageUrl}
                              alt={selectedProduct.name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          );
                        }
                        
                        // 5. Image customDesign.base64Image
                        if (selectedProduct.customDesign?.base64Image) {
                          return (
                            <img
                              src={selectedProduct.customDesign.base64Image}
                              alt={`Design personnalisé de ${selectedProduct.name}`}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          );
                        }
                        
                        // 6. Placeholder par défaut
                        // AJOUT PRIORITÉ COULEUR SÉLECTIONNÉE
                        if (
                          selectedColorIndex !== null &&
                          selectedProduct.colors &&
                          selectedProduct.colors[selectedColorIndex] &&
                          selectedProduct.colors[selectedColorIndex].imageUrl
                        ) {
                          return (
                            <img
                              src={selectedProduct.colors[selectedColorIndex].imageUrl}
                              alt={selectedProduct.colors[selectedColorIndex].name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          );
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center flex-col">
                            <Package className={`h-24 w-24 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-4`}>Aucune image disponible</p>
                          </div>
                        );
                      })()}
                    </AspectRatio>

                    {/* Miniatures des vues */}
                    {selectedProduct.views && selectedProduct.views.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Vues disponibles</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${
                                isDarkMode 
                                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                              onClick={() => {
                                if (selectedViewIndex === null) {
                                  setSelectedViewIndex(selectedProduct.views.length - 1);
                                } else {
                                  setSelectedViewIndex(
                                    selectedViewIndex === 0 
                                      ? selectedProduct.views.length - 1 
                                      : selectedViewIndex - 1
                                  );
                                }
                              }}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${
                                isDarkMode 
                                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                              onClick={() => {
                                if (selectedViewIndex === null) {
                                  setSelectedViewIndex(1 % selectedProduct.views.length);
                                } else {
                                  setSelectedViewIndex(
                                    (selectedViewIndex + 1) % selectedProduct.views.length
                                  );
                                }
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap">
                          <div className="flex gap-3">
                            {selectedProduct.views.map((view, idx) => (
                              <div
                                key={idx}
                                className={`w-24 h-24 rounded-lg ${
                                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                                } border p-1 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                                  selectedViewIndex === idx 
                                    ? isDarkMode 
                                      ? 'border-white ring-2 ring-white ring-opacity-20' 
                                      : 'border-black ring-2 ring-black ring-opacity-20'
                                    : isDarkMode
                                      ? 'border-gray-700 hover:border-gray-500'
                                      : 'border-gray-200 hover:border-gray-400'
                                }`}
                                onClick={() => setSelectedViewIndex(idx)}
                              >
                                <img
                                  src={view.imageUrl}
                                  alt={`Vue ${view.viewType}`}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/cccccc/333333?text=N/A';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    )}

                    {/* Badge des couleurs */}
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div className={`${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } rounded-lg p-4 border`}>
                        <p className={`text-base font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        } mb-3`}>Couleurs disponibles</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedProduct.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className={`group relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all
                                ${selectedColorIndex === idx 
                                  ? isDarkMode
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' 
                                    : 'ring-2 ring-black ring-offset-2 ring-offset-white'
                                  : isDarkMode
                                    ? 'hover:ring-1 hover:ring-gray-600 hover:ring-offset-1'
                                    : 'hover:ring-1 hover:ring-gray-400 hover:ring-offset-1'
                                }`}
                              onClick={() => {
                                setSelectedColorIndex(idx);
                                setSelectedViewIndex(null); // Pour forcer l'affichage de la couleur
                              }}
                            >
                              {color.imageUrl ? (
                                <img
                                  src={color.imageUrl}
                                  alt={color.name}
                                  className={`w-10 h-10 rounded-full object-cover border ${
                                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                  }`}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    const div = document.createElement('div');
                                    div.className = `w-10 h-10 rounded-full border ${
                                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                    }`;
                                    div.style.backgroundColor = color.hexCode || '#999';
                                    (e.target as HTMLImageElement).parentNode?.replaceChild(div, e.target as HTMLImageElement);
                                  }}
                                />
                              ) : (
                                <div 
                                  className={`w-10 h-10 rounded-full border ${
                                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                  }`}
                                  style={{ backgroundColor: color.hexCode || '#999' }}
                                />
                              )}
                              <span className={`absolute pointer-events-none bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap 
                                ${isDarkMode ? 'bg-gray-700' : 'bg-gray-900'} text-white text-xs font-medium rounded-md px-2 py-1 opacity-0 
                                group-hover:opacity-100 transition-opacity z-10`}>
                                {color.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section droite: détails du produit */}
                  <div className={`space-y-7 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  } rounded-lg p-6 border h-fit`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-3xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedProduct.price.toLocaleString()} CFA
                        </h3>
                        <Badge 
                          className={
                            selectedProduct.stock > 10 
                              ? isDarkMode ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800" 
                              : selectedProduct.stock > 0 
                                ? isDarkMode ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-800"
                                : isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800"
                          }
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          {selectedProduct.stock > 0 ? `${selectedProduct.stock} en stock` : "Rupture de stock"}
                        </Badge>
                      </div>
                      <Separator className={`my-5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>

                    <div className="space-y-2">
                      <p className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Description</p>
                      <div className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-h-32 overflow-y-auto pr-2 custom-scrollbar`}>
                        <p>{selectedProduct.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Catégorie</p>
                        <div className="flex items-center">
                          <Tag className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-2`} />
                          <span className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {getCategoryLabel(selectedProduct.category)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Statut</p>
                        <div className="flex items-center">
                          {isProductPublished(selectedProduct.status) ? (
                            <Badge className={isDarkMode ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"}>
                              Publié
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`${
                              isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-300'
                            }`}>
                              Brouillon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className={isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} />

                    {/* Design personnalisé */}
                    {(selectedProduct.designImageUrl || selectedProduct.designName || selectedProduct.design || selectedProduct.customDesign) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                          <p className={`font-medium text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Design personnalisé</p>
                        </div>
                        <div className={`flex gap-4 ${
                          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        } p-3 rounded-lg border`}>
                          <div className={`w-20 h-20 rounded-md ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          } p-1 flex items-center justify-center border overflow-hidden`}>
                            {(() => {
                              // Priorité 0: format API avec designImageUrl
                              if (selectedProduct.designImageUrl) {
                                return (
                                  <img
                                    src={selectedProduct.designImageUrl}
                                    alt={selectedProduct.designName || "Design personnalisé"}
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/cccccc/333333?text=Design';
                                    }}
                                  />
                                );
                              }
                              
                              // Priorité 1: image du design standard
                              if (selectedProduct.design?.imageUrl) {
                                return (
                                  <img
                                    src={selectedProduct.design.imageUrl}
                                    alt={selectedProduct.design.name}
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/cccccc/333333?text=Design';
                                    }}
                                  />
                                );
                              }
                              
                              // Priorité 2: vue de type DESIGN
                              const designView = selectedProduct.views?.find(v => (v.viewType as any) === 'DESIGN');
                              if (designView?.imageUrl) {
                                return (
                                  <img
                                    src={designView.imageUrl}
                                    alt="Design"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/cccccc/333333?text=Design';
                                    }}
                                  />
                                );
                              }
                              
                              // Priorité 3: base64Image du customDesign
                              if (selectedProduct.customDesign?.base64Image) {
                                return (
                                  <img
                                    src={selectedProduct.customDesign.base64Image}
                                    alt="Design personnalisé"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/cccccc/333333?text=Design';
                                    }}
                                  />
                                );
                              }
                              
                              // Priorité 4: designImages
                              if (selectedProduct.designImages && selectedProduct.designImages.length > 0) {
                                return (
                                  <img
                                    src={selectedProduct.designImages[0].url}
                                    alt="Design personnalisé"
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/cccccc/333333?text=Design';
                                    }}
                                  />
                                );
                              }
                              
                              // Fallback
                              return null;
                            })()}
                          </div>
                          <div>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} text-base`}>
                              {selectedProduct.designName || 
                               selectedProduct.design?.name || 
                               selectedProduct.customDesign?.name || 
                               "Design personnalisé"}
                            </p>
                            {(selectedProduct.designDescription || selectedProduct.design?.description || selectedProduct.customDesign?.description) && (
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mt-1`}>
                                {selectedProduct.designDescription || 
                                 selectedProduct.design?.description || 
                                 selectedProduct.customDesign?.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Options disponibles */}
                    <div className={`${
                      isDarkMode ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'
                    } border rounded-lg p-4`}>
                      <div className="flex gap-2 items-start">
                        <Info className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0 mt-0.5`} />
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Exploration du produit</p>
                          <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} mt-1`}>
                            Utilisez les onglets ci-dessus pour explorer les couleurs, tailles et vues disponibles pour ce produit.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Couleurs */}
              <TabsContent value="colors" className="p-8 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Couleurs disponibles</h3>
                    <Badge variant="outline" className={`px-3 py-1 text-base ${
                      isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}>
                      {selectedProduct.colors ? selectedProduct.colors.length : 0} couleurs
                    </Badge>
                  </div>

                  {selectedProduct.colors && selectedProduct.colors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProduct.colors.map((color, index) => (
                        <div 
                          key={index}
                          className={`${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                          } rounded-lg border p-4 cursor-pointer transition-all
                            ${selectedColorIndex === index 
                              ? isDarkMode 
                                ? 'border-white ring-1 ring-white' 
                                : 'border-black ring-1 ring-black'
                              : isDarkMode
                                ? 'border-gray-700 hover:border-gray-600' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          onClick={() => setSelectedColorIndex(index)}
                        >
                          <div className="flex gap-4 items-center">
                            <div className="flex-shrink-0">
                              <div className="h-16 w-16 rounded-lg overflow-hidden flex items-center justify-center">
                                {color.imageUrl ? (
                                  <div className="h-full w-full relative">
                                    <img
                                      src={color.imageUrl}
                                      alt={color.name}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).onerror = null;
                                        const div = document.createElement('div');
                                        div.className = 'absolute inset-0 flex items-center justify-center';
                                        div.style.backgroundColor = color.hexCode || '#999';
                                        const colorName = document.createElement('span');
                                        colorName.className = 'text-xs font-medium text-white';
                                        colorName.innerText = color.name.charAt(0).toUpperCase();
                                        div.appendChild(colorName);
                                        (e.target as HTMLImageElement).parentNode?.appendChild(div);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className="h-full w-full flex items-center justify-center"
                                    style={{ backgroundColor: color.hexCode || '#999' }}
                                  >
                                    <span className="text-xs font-medium text-white">
                                      {color.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{color.name}</p>
                              {color.hexCode && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color.hexCode }}
                                  ></div>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {color.hexCode}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-10 text-center ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } rounded-lg border`}>
                      <Palette className={`h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
                      <h4 className={`text-xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-medium mb-2`}>Aucune couleur disponible</h4>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                        Ce produit n'a pas de couleurs ou variations de couleur définies.
                      </p>
                    </div>
                  )}

                  {selectedColorIndex !== null && selectedProduct.colors && selectedProduct.colors[selectedColorIndex] && (
                    <div className={`mt-6 ${
                      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    } rounded-lg border p-6`}>
                      <h4 className={`text-lg font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      } mb-4`}>
                        Couleur sélectionnée : {selectedProduct.colors[selectedColorIndex].name}
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className={`w-full sm:w-1/3 aspect-square rounded-lg overflow-hidden ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        } border`}>
                          {selectedProduct.colors[selectedColorIndex].imageUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={selectedProduct.colors[selectedColorIndex].imageUrl}
                                alt={selectedProduct.colors[selectedColorIndex].name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  const div = document.createElement('div');
                                  div.className = 'absolute inset-0 flex items-center justify-center';
                                  div.style.backgroundColor = selectedProduct.colors[selectedColorIndex].hexCode || '#999';
                                  const colorName = document.createElement('span');
                                  colorName.className = 'text-2xl font-bold text-white';
                                  colorName.innerText = selectedProduct.colors[selectedColorIndex].name.charAt(0).toUpperCase();
                                  div.appendChild(colorName);
                                  (e.target as HTMLImageElement).parentNode?.appendChild(div);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: selectedProduct.colors[selectedColorIndex].hexCode || '#999' }}
                            >
                              <span className="text-2xl font-bold text-white">
                                {selectedProduct.colors[selectedColorIndex].name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-full sm:w-2/3 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`${
                              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                            } rounded-lg p-3 border`}>
                              <p className={`text-xs uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Nom de la couleur</p>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} text-lg`}>{selectedProduct.colors[selectedColorIndex].name}</p>
                            </div>
                            {selectedProduct.colors[selectedColorIndex].hexCode && (
                              <div className={`${
                                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                              } rounded-lg p-3 border`}>
                                <p className={`text-xs uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Code hexadécimal</p>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`w-5 h-5 rounded-full border ${
                                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                    }`}
                                    style={{ backgroundColor: selectedProduct.colors[selectedColorIndex].hexCode }}
                                  ></div>
                                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.colors[selectedColorIndex].hexCode}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={`p-4 ${
                            isDarkMode ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'
                          } border rounded-lg`}>
                            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                              Cette couleur est disponible pour le produit <span className="font-medium">{selectedProduct.name}</span>. 
                              Les images peuvent légèrement varier du produit réel.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Onglet Tailles */}
              <TabsContent value="sizes" className="p-8 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tailles disponibles</h3>
                    <Badge variant="outline" className={`px-3 py-1 text-base ${
                      isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}>
                      {selectedProduct.sizes ? selectedProduct.sizes.length : 0} tailles
                    </Badge>
                  </div>

                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {selectedProduct.sizes.map((size, index) => (
                        <div
                          key={index}
                          className={`${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          } rounded-lg border p-6 flex items-center justify-center h-24 transition-all hover:${
                            isDarkMode ? 'border-gray-600' : 'border-gray-300'
                          }`}
                        >
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} text-2xl`}>{size.sizeName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-12 text-center ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } rounded-lg border`}>
                      <Tag className={`h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
                      <h4 className={`text-xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-medium mb-2`}>Aucune taille disponible</h4>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                        Ce produit n'a pas de tailles définies.
                      </p>
                    </div>
                  )}

                  <div className={`mt-6 ${
                    isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  } rounded-lg border p-6`}>
                    <div className="flex gap-4 items-start">
                      <Info className={`h-6 w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Guide des tailles</p>
                        <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Les tailles peuvent varier en fonction du type de vêtement et du fabricant. 
                          Consultez le guide des tailles complet pour plus de détails.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Design spécial */}
              <TabsContent value="design" className="p-8 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Design du produit</h3>
                    <Badge variant="outline" className={`px-3 py-1 text-base ${
                      isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}>
                      Design personnalisé
                    </Badge>
                  </div>

                  {/* Grande image du design */}
                  <div className="flex flex-col items-center justify-center">
                    <div className={`aspect-square w-full max-w-lg mx-auto ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } rounded-lg overflow-hidden border mb-6`}>
                      {(() => {
                        // DEBUG LOG
                        console.log('DEBUG DESIGN IMAGE', {
                          designImageUrl: selectedProduct.designImageUrl,
                          customDesign: selectedProduct.customDesign,
                          designImages: selectedProduct.designImages,
                          views: selectedProduct.views,
                          design: selectedProduct.design,
                        });
                        // 1. API
                        if (selectedProduct.designImageUrl) {
                          return (
                            <img
                              src={selectedProduct.designImageUrl}
                              alt={selectedProduct.designName || "Design personnalisé"}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Design+non+disponible';
                              }}
                            />
                          );
                        }
                        // 2. base64 local
                        if (selectedProduct.customDesign?.base64Image) {
                          return (
                            <img
                              src={selectedProduct.customDesign.base64Image}
                              alt="Design personnalisé"
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Design+non+disponible';
                              }}
                            />
                          );
                        }
                        // 3. designImages local
                        if (selectedProduct.designImages && selectedProduct.designImages.length > 0) {
                          return (
                            <img
                              src={selectedProduct.designImages[0].url}
                              alt="Design personnalisé"
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Design+non+disponible';
                              }}
                            />
                          );
                        }
                        // 4. vue DESIGN
                        const designView = selectedProduct.views?.find(v => (v.viewType as any) === 'DESIGN');
                        if (designView?.imageUrl) {
                          return (
                            <img
                              src={designView.imageUrl}
                              alt="Design du produit"
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Design+non+disponible';
                              }}
                            />
                          );
                        }
                        // 5. design standard
                        if (selectedProduct.design?.imageUrl) {
                          return (
                            <img
                              src={selectedProduct.design.imageUrl}
                              alt={selectedProduct.design.name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/cccccc/333333?text=Design+non+disponible';
                              }}
                            />
                          );
                        }
                        // Fallback
                        return (
                          <div className="w-full h-full flex items-center justify-center flex-col">
                            <ImageIcon className={`h-24 w-24 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-4`}>Aucun design disponible</p>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Informations du design */}
                    <div className={`w-full max-w-lg ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } rounded-lg p-4 border`}>
                      <h4 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                        {selectedProduct.designName || 
                         selectedProduct.design?.name || 
                         selectedProduct.customDesign?.name || 
                         "Design personnalisé"}
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedProduct.designDescription || 
                         selectedProduct.design?.description || 
                         selectedProduct.customDesign?.description || 
                         "Aucune description disponible"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Vues */}
              <TabsContent value="views" className="p-8 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vues du produit</h3>
                    <Badge variant="outline" className={`px-3 py-1 text-base ${
                      isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}>
                      {selectedProduct.views ? selectedProduct.views.length : 0} vues
                    </Badge>
                  </div>

                  {selectedProduct.views && selectedProduct.views.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {selectedProduct.views.map((view, index) => (
                        <div 
                          key={index}
                          className={`${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                          } rounded-lg border p-4 cursor-pointer transition-all
                            ${selectedViewIndex === index 
                              ? isDarkMode 
                                ? 'border-white ring-1 ring-white' 
                                : 'border-black ring-1 ring-black'
                              : isDarkMode
                                ? 'border-gray-700 hover:border-gray-600' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          onClick={() => setSelectedViewIndex(index)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} text-lg`}>Vue {view.viewType}</p>
                            <Badge className={`${
                              isDarkMode 
                                ? 'bg-gray-700 text-gray-200 border-gray-600' 
                                : 'bg-gray-200 text-gray-800 border-gray-300'
                            } px-3 py-1`}>{view.viewType}</Badge>
                          </div>
                          <div className={`aspect-video rounded-lg overflow-hidden ${
                            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'
                          } mb-3 border`}>
                            <img
                              src={view.imageUrl}
                              alt={`Vue ${view.viewType}`}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/cccccc/333333?text=Image+non+disponible';
                              }}
                            />
                          </div>
                          {view.description && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>{view.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-12 text-center ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } rounded-lg border`}>
                      <ImageIcon className={`h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
                      <h4 className={`text-xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} font-medium mb-2`}>Aucune vue disponible</h4>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
                        Ce produit n'a pas de vues multiples définies.
                      </p>
                    </div>
                  )}

                  {selectedViewIndex !== null && selectedProduct.views && selectedProduct.views[selectedViewIndex] && (
                    <div className={`mt-6 ${
                      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    } rounded-lg border p-6`}>
                      <h4 className={`font-medium text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                        Vue sélectionnée : {selectedProduct.views[selectedViewIndex].viewType}
                      </h4>
                      <div className={`aspect-video w-full max-w-3xl mx-auto ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } rounded-lg overflow-hidden border mb-4`}>
                        <img
                          src={selectedProduct.views[selectedViewIndex].imageUrl}
                          alt={`Vue ${selectedProduct.views[selectedViewIndex].viewType}`}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/cccccc/333333?text=Image+non+disponible';
                          }}
                        />
                      </div>
                      <div className={`${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      } rounded-lg p-4 border`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1 uppercase`}>Type de vue</p>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            isDarkMode 
                              ? 'bg-gray-700 text-gray-200 border-gray-600' 
                              : 'bg-gray-200 text-gray-800 border-gray-300'
                          } px-3 py-1`}>
                            {selectedProduct.views[selectedViewIndex].viewType}
                          </Badge>
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {selectedProduct.views[selectedViewIndex].description || 'Aucune description disponible'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Boutons d'action */}
            <DialogFooter className={`px-6 py-5 border-t ${
              isDarkMode ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImageDialogOpen(false);
                      if (selectedProduct) {
                        onEdit(selectedProduct);
                      }
                    }}
                    className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    className={`text-red-600 ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'}`}
                    onClick={() => {
                      setIsImageDialogOpen(false);
                      if (selectedProduct && selectedProduct.id !== undefined) {
                        onDelete(selectedProduct.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setIsImageDialogOpen(false)}
                  >
                    Fermer
                  </Button>
                  <Button
                    variant="default"
                    className={`w-full sm:w-auto ${
                      isDarkMode 
                        ? 'bg-white hover:bg-gray-200 text-black' 
                        : 'bg-black hover:bg-gray-800 text-white'
                    }`}
                    onClick={() => {
                      setIsImageDialogOpen(false);
                      onDetail(selectedProduct);
                    }}
                  >
                    Voir tous les détails
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      {viewMode === 'list' ? renderListView() : renderGridView()}
      {renderImageDialog()}
      
      {/* Compteur de résultats */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        {loading ? 'Chargement des produits...' : `${filteredProducts.length} produit(s) affiché(s)`}
      </div>
    </div>
  );
};

export default ProductTable;
