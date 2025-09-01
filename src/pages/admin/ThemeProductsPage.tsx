import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  X, 
  Check,
  Package,
  Tag,
  DollarSign,
  Eye,
  Upload,
  FileText,
  Settings,
  ArrowLeft,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Palette,
  Target,
  Ruler
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../../utils/apiHelpers';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  isReadyProduct: boolean;
  mainImage?: string;
  addedToThemeAt?: string;
  categories: any[];
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    productId: number;
    images: Array<{
      id: number;
      view: string;
      url: string;
      publicId: string;
      naturalWidth: number | null;
      naturalHeight: number | null;
    }>;
  }>;
  sizes: Array<{
    id: number;
    productId: number;
    sizeName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Theme {
  id: number;
  name: string;
  description: string;
  status: string;
  productCount: number;
  createdAt?: string;
}

// Composant pour afficher une image de produit
const ProductImageDisplay: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}> = ({ src, alt, className = "", onError }) => {
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setImageError(false);
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  if (imageError) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        <Package className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

// Composant de carte de produit avec slider de couleurs
const ProductCardWithColorSlider: React.FC<{
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  isAlreadyAdded?: boolean;
}> = ({ product, isSelected, onToggle, isAlreadyAdded = false }) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const currentColor = product.colorVariations && product.colorVariations.length > 0 
    ? product.colorVariations[selectedColorIndex] 
    : null;
  const currentImage = currentColor?.images && currentColor.images.length > 0
    ? currentColor.images[selectedImageIndex]
    : null;

  const nextColor = () => {
    if (!product.colorVariations || product.colorVariations.length === 0) return;
    setSelectedColorIndex((prev) => 
      prev === product.colorVariations.length - 1 ? 0 : prev + 1
    );
    setSelectedImageIndex(0);
  };

  const prevColor = () => {
    if (!product.colorVariations || product.colorVariations.length === 0) return;
    setSelectedColorIndex((prev) => 
      prev === 0 ? product.colorVariations.length - 1 : prev - 1
    );
    setSelectedImageIndex(0);
  };

  const nextImage = () => {
    if (currentColor?.images && currentColor.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === currentColor.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (currentColor?.images && currentColor.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? currentColor.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isSelected
          ? 'ring-2 ring-black bg-black text-white'
          : isAlreadyAdded
          ? 'ring-1 ring-gray-300 bg-gray-50 opacity-75 cursor-not-allowed'
          : 'hover:ring-1 hover:ring-gray-400 bg-white cursor-pointer'
      }`}
      onClick={isAlreadyAdded ? undefined : onToggle}
    >
      <CardContent className="p-0">
        {/* Image du produit avec navigation */}
        <div className="relative">
          <div className="relative w-full h-56 overflow-hidden bg-gray-100">
            {currentImage ? (
              <ProductImageDisplay
                src={currentImage.url}
                alt={`${product.name} - ${currentColor?.name || 'Produit'}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : product.mainImage ? (
              <ProductImageDisplay
                src={product.mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Navigation des images */}
            {currentColor?.images && currentColor.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Indicateur de sélection */}
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            )}

            {/* Badge "Déjà ajouté" */}
            {isAlreadyAdded && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-gray-900 text-white text-xs font-medium px-3 py-1">
                  <Check className="h-3 w-3 mr-1" />
                  Déjà ajouté
                </Badge>
              </div>
            )}
          </div>

          {/* Navigation des couleurs */}
          {product.colorVariations && product.colorVariations.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevColor();
                  }}
                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                
                <div className="flex gap-1">
                  {product.colorVariations.map((color, index) => (
                    <button
                      key={`color-${color.id || index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedColorIndex(index);
                        setSelectedImageIndex(0);
                      }}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        index === selectedColorIndex 
                          ? 'border-black scale-110' 
                          : 'border-gray-300 hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextColor();
                  }}
                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Informations du produit */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className={`font-semibold text-lg mb-1 ${
              isSelected ? 'text-white' : 'text-gray-900'
            }`}>
              {product.name}
            </h4>
            <p className={`text-sm line-clamp-2 ${
              isSelected ? 'text-gray-200' : 'text-gray-600'
            }`}>
              {product.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`font-bold text-lg ${
              isSelected ? 'text-white' : 'text-gray-900'
            }`}>
              {product.price.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'XOF'
              })}
            </span>
            <Badge 
              variant={product.status === 'PUBLISHED' ? 'default' : 'secondary'}
              className={`text-xs font-medium ${
                product.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs bg-black text-white border-black"
            >
              ✅ Produit prêt
            </Badge>
            {product.categories && product.categories.length > 0 && product.categories[0] && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                {typeof product.categories[0] === 'string' 
                  ? product.categories[0].split(' > ').pop() || product.categories[0]
                  : product.categories[0]?.name || 'Catégorie'
                }
              </Badge>
            )}
          </div>
          
          {/* Tailles disponibles */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Ruler className="w-3 h-3 text-gray-500" />
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Tailles disponibles:
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.sizes.slice(0, 4).map((size, index) => (
                  <Badge 
                    key={size.id} 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${
                      isSelected 
                        ? 'border-gray-400 text-gray-200' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {size.sizeName}
                  </Badge>
                ))}
                {product.sizes.length > 4 && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${
                      isSelected 
                        ? 'border-gray-400 text-gray-200 bg-gray-800' 
                        : 'border-gray-300 text-gray-700 bg-gray-50'
                    }`}
                  >
                    +{product.sizes.length - 4} autres
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Informations supplémentaires */}
          <div className={`text-xs space-y-1 ${
            isSelected ? 'text-gray-300' : 'text-gray-500'
          }`}>
            {product.colorVariations && product.colorVariations.length > 0 && (
              <div className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span className="font-medium">Couleurs:</span> {product.colorVariations.length}
              </div>
            )}
            {product.mainImage && !product.colorVariations && (
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span className="font-medium">Image principale disponible</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les produits ajoutés au thème avec bouton de suppression
const ProductCardWithRemove: React.FC<{
  product: Product;
  onRemove: (productId: number) => void;
}> = ({ product, onRemove }) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const currentColor = product.colorVariations && product.colorVariations.length > 0 
    ? product.colorVariations[selectedColorIndex] 
    : null;
  const currentImage = currentColor?.images && currentColor.images.length > 0
    ? currentColor.images[selectedImageIndex]
    : null;

  const nextColor = () => {
    if (!product.colorVariations || product.colorVariations.length === 0) return;
    setSelectedColorIndex((prev) => 
      prev === product.colorVariations.length - 1 ? 0 : prev + 1
    );
    setSelectedImageIndex(0);
  };

  const prevColor = () => {
    if (!product.colorVariations || product.colorVariations.length === 0) return;
    setSelectedColorIndex((prev) => 
      prev === 0 ? product.colorVariations.length - 1 : prev - 1
    );
    setSelectedImageIndex(0);
  };

  const nextImage = () => {
    if (currentColor?.images && currentColor.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === currentColor.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (currentColor?.images && currentColor.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? currentColor.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white">
      <CardContent className="p-0">
        {/* Bouton de suppression */}
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(product.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Image du produit avec navigation */}
        <div className="relative">
          <div className="relative w-full h-56 overflow-hidden bg-gray-100">
            {currentImage ? (
              <ProductImageDisplay
                src={currentImage.url}
                alt={`${product.name} - ${currentColor?.name || 'Produit'}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : product.mainImage ? (
              <ProductImageDisplay
                src={product.mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Navigation des images */}
            {currentColor?.images && currentColor.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Badge "Ajouté au thème" */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-black text-white text-xs font-medium px-3 py-1">
                <Check className="h-3 w-3 mr-1" />
                Ajouté
              </Badge>
            </div>
          </div>

          {/* Navigation des couleurs */}
          {product.colorVariations && product.colorVariations.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevColor();
                  }}
                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                
                <div className="flex gap-1">
                  {product.colorVariations.map((color, index) => (
                    <button
                      key={`color-${color.id || index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedColorIndex(index);
                        setSelectedImageIndex(0);
                      }}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        index === selectedColorIndex 
                          ? 'border-black scale-110' 
                          : 'border-gray-300 hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextColor();
                  }}
                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Informations du produit */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-lg mb-1 text-gray-900">
              {product.name}
            </h4>
            <p className="text-sm line-clamp-2 text-gray-600">
              {product.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-gray-900">
              {product.price.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'XOF'
              })}
            </span>
            <Badge 
              variant={product.status === 'PUBLISHED' ? 'default' : 'secondary'}
              className="text-xs font-medium"
            >
              {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs bg-black text-white border-black"
            >
              ✅ Produit prêt
            </Badge>
            {product.categories && product.categories.length > 0 && product.categories[0] && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                {typeof product.categories[0] === 'string' 
                  ? product.categories[0].split(' > ').pop() || product.categories[0]
                  : product.categories[0]?.name || 'Catégorie'
                }
              </Badge>
            )}
          </div>
          
          {/* Tailles disponibles */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Ruler className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Tailles disponibles:
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.sizes.slice(0, 4).map((size, index) => (
                  <Badge 
                    key={size.id} 
                    variant="outline" 
                    className="text-xs px-2 py-1 border-gray-300 text-gray-700"
                  >
                    {size.sizeName}
                  </Badge>
                ))}
                {product.sizes.length > 4 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-1 border-gray-300 text-gray-700 bg-gray-50"
                  >
                    +{product.sizes.length - 4} autres
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Informations supplémentaires */}
          <div className="text-xs space-y-1 text-gray-500">
            {product.colorVariations && product.colorVariations.length > 0 && (
              <div className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span className="font-medium">Couleurs:</span> {product.colorVariations.length}
              </div>
            )}
            {product.mainImage && !product.colorVariations && (
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span className="font-medium">Image principale disponible</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ThemeProductsPage: React.FC = () => {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'existing' | 'added'>('existing');
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  
  // États pour les produits existants
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'mockup'>('ready'); // Par défaut, afficher les produits prêts

  // États pour les produits ajoutés au thème
  const [themeProducts, setThemeProducts] = useState<Product[]>([]);
  const [loadingThemeProducts, setLoadingThemeProducts] = useState(false);
  const [themeProductsPagination, setThemeProductsPagination] = useState({
    total: 0,
    limit: 12,
    offset: 0,
    hasMore: false
  });
  const [themeProductsFilters, setThemeProductsFilters] = useState({
    status: 'all',
    search: '',
    sort: 'createdAt',
    order: 'desc'
  });

  // Fonction pour vérifier si un produit est déjà ajouté au thème
  const isProductAlreadyAdded = (productId: number): boolean => {
    return themeProducts.some(themeProduct => themeProduct.id === productId);
  };

  // Charger les données du thème
  useEffect(() => {
    if (themeId && !isNaN(parseInt(themeId))) {
      fetchTheme();
      fetchProducts();
      fetchThemeProducts();
    } else {
      console.error('themeId invalide:', themeId);
      toast.error('ID de thème invalide');
    }
  }, [themeId]);

  // Recharger les produits quand les filtres changent
  useEffect(() => {
    if (activeTab === 'existing') {
      fetchProducts();
    }
  }, [activeTab, filterType, searchTerm]);

  const fetchTheme = async () => {
    try {
      console.log('🔍 Chargement du thème:', themeId);
      const response = await apiGet(`/api/themes/${themeId}`);
      
      console.log('📡 Réponse API thème:', response);
      
      // Vérifier si la réponse est valide
      if (response && response.data) {
        setTheme(response.data);
        console.log('✅ Thème chargé avec succès:', response.data);
      } else if (response && (response.data as any)?.success) {
        // Si la réponse indique un succès mais pas de données
        console.warn('⚠️ Réponse API sans données:', response);
        toast.error('Erreur: Réponse API invalide pour le thème');
      } else {
        console.error('❌ Réponse API invalide pour le thème:', response);
        toast.error('Erreur lors du chargement du thème');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du thème:', error);
      
      // Afficher plus de détails sur l'erreur
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
      }
      
      toast.error('Erreur lors du chargement du thème');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Construire les paramètres de recherche
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      // Toujours filtrer par produits prêts et publiés uniquement
      params.append('isReadyProduct', 'true');
      params.append('status', 'PUBLISHED');
      
      const apiUrl = `/api/products?${params.toString()}`;
      console.log('🔍 Chargement des produits prêts publiés:', apiUrl);
      
      const response = await apiGet(apiUrl);
      
      console.log('📦 Produits chargés:', response);
      
      if (response && Array.isArray(response.data)) {
        // Filtrer côté client pour s'assurer que seuls les produits prêts et publiés sont affichés
        const readyPublishedProducts = response.data.filter(product => 
          product.isReadyProduct === true && product.status === 'PUBLISHED'
        );
        setProducts(readyPublishedProducts);
        console.log('✅ Produits prêts publiés chargés avec succès:', readyPublishedProducts.length);
      } else {
        console.warn('⚠️ Réponse API invalide pour les produits:', response);
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des produits:', error);
      setProducts([]);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const fetchThemeProducts = async (newFilters = {}) => {
    try {
      setLoadingThemeProducts(true);
      
      // Construire les paramètres de requête selon le guide
      const params = new URLSearchParams();
      
      // Filtres de base
      if (searchTerm) params.append('search', searchTerm);
      if (themeProductsFilters.status !== 'all') params.append('status', themeProductsFilters.status);
      
      // Paramètres de pagination et tri
      params.append('limit', '12');
      params.append('offset', '0');
      params.append('sort', 'createdAt');
      params.append('order', 'desc');
      
      // Ajouter les nouveaux filtres
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const apiUrl = `/api/themes/${themeId}/products?${params.toString()}`;
      console.log('🔍 Chargement des produits du thème:', apiUrl);
      
      const response = await apiGet(apiUrl);
      
      console.log('📦 Produits du thème chargés:', response);
      
      // Gérer la structure de réponse correcte
      if (response && response.data) {
        const responseData = response.data;
        
        // Vérifier si la réponse a la structure attendue
        if (responseData.success && Array.isArray(responseData.data)) {
          setThemeProducts(responseData.data);
          setThemeProductsPagination(responseData.pagination || {
            total: responseData.data.length,
            limit: 12,
            offset: 0,
            hasMore: false
          });
          console.log('✅ Produits du thème chargés avec succès:', responseData.data.length);
        } else if (Array.isArray(responseData)) {
          // Fallback pour l'ancienne structure
          setThemeProducts(responseData);
          setThemeProductsPagination({
            total: responseData.length,
            limit: 12,
            offset: 0,
            hasMore: false
          });
          console.log('✅ Produits du thème chargés avec succès (ancienne structure):', responseData.length);
        } else {
          console.warn('⚠️ Réponse API invalide pour les produits du thème:', response);
          setThemeProducts([]);
          setThemeProductsPagination({
            total: 0,
            limit: 12,
            offset: 0,
            hasMore: false
          });
        }
      } else {
        console.warn('⚠️ Réponse API invalide pour les produits du thème:', response);
        setThemeProducts([]);
        setThemeProductsPagination({
          total: 0,
          limit: 12,
          offset: 0,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des produits du thème:', error);
      setThemeProducts([]);
      setThemeProductsPagination({
        total: 0,
        limit: 12,
        offset: 0,
        hasMore: false
      });
      toast.error('Erreur lors du chargement des produits du thème');
    } finally {
      setLoadingThemeProducts(false);
    }
  };

  const toggleProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleAddProducts = async () => {
    try {
      // Ajouter les produits existants sélectionnés
      if (selectedProducts.size > 0) {
        const productIds = Array.from(selectedProducts);
        await apiPost(`/api/themes/${themeId}/products`, { productIds });
        toast.success(`${productIds.length} produit(s) ajouté(s) au thème`);
      }

      // Recharger les données
      await fetchTheme();
      await fetchThemeProducts();
      setSelectedProducts(new Set());
      
      toast.success('Opération terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits:', error);
      toast.error('Erreur lors de l\'ajout des produits');
    }
  };

  const removeProductFromTheme = async (productId: number) => {
    try {
      await apiPost(`/api/themes/${themeId}/products/remove`, { productId });
      toast.success('Produit retiré du thème');
      
      // Recharger les produits du thème
      await fetchThemeProducts();
      await fetchTheme();
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Chargement du thème...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'existing' | 'added')} className="w-full">
            <div className="p-6 border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="existing" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">
                  <Search className="h-4 w-4" />
                  Produits prêts publiés
                </TabsTrigger>
                <TabsTrigger value="added" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">
                  <Check className="h-4 w-4" />
                  Produits ajoutés au thème
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Onglet Produits existants */}
            <TabsContent value="existing" className="p-6">
              <div className="flex flex-col h-full">
                {/* Filtres et recherche */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un produit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={fetchProducts}
                        className="flex items-center gap-2 border-gray-300 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                        Actualiser
                      </Button>
                    </div>
                  </div>
                  
                  {/* Message informatif */}
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-gray-600" />
                      <span>
                        Les produits avec le badge "Déjà ajouté" sont déjà présents dans ce thème et ne peuvent pas être sélectionnés.
                      </span>
                    </div>
                  </div>
                  
                  {/* Statistiques */}
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                    <span className="font-medium">Total: {products.length} produits prêts publiés</span>
                    <span>Sélectionnés: {selectedProducts.size}</span>
                    <span className="text-black font-semibold">
                      Déjà ajoutés: {products.filter(p => isProductAlreadyAdded(p.id)).length}
                    </span>
                  </div>
                </div>

                {/* Liste des produits */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Chargement...</p>
                    </div>
                  ) : !Array.isArray(products) || products.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Aucun produit prêt publié trouvé
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Aucun produit prêt publié ne correspond à vos critères de recherche.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <ProductCardWithColorSlider
                          key={product.id}
                          product={product}
                          isSelected={selectedProducts.has(product.id)}
                          onToggle={() => toggleProduct(product.id)}
                          isAlreadyAdded={isProductAlreadyAdded(product.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Onglet Produits ajoutés au thème */}
            <TabsContent value="added" className="p-6">
              <div className="flex flex-col h-full">
                {/* En-tête du thème */}
                {theme && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg mb-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {theme.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {theme.description}
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>📦 {theme.productCount || 0} produit(s) dans ce thème</span>
                        <span>📅 Créé le {new Date(theme.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filtres et recherche avancés */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Recherche */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un produit..."
                        value={themeProductsFilters.search}
                        onChange={(e) => {
                          setThemeProductsFilters(prev => ({ ...prev, search: e.target.value }));
                          // Debounce pour éviter trop d'appels API
                          setTimeout(() => {
                            fetchThemeProducts({ search: e.target.value, offset: 0 });
                          }, 300);
                        }}
                        className="pl-10"
                      />
                    </div>

                    {/* Filtre par statut */}
                    <div>
                      <Select 
                        value={themeProductsFilters.status} 
                        onValueChange={(value) => {
                          setThemeProductsFilters(prev => ({ ...prev, status: value }));
                          fetchThemeProducts({ status: value, offset: 0 });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="READY">Prêts</SelectItem>
                          <SelectItem value="DRAFT">Brouillons</SelectItem>
                          <SelectItem value="PUBLISHED">Publiés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tri */}
                    <div>
                      <Select 
                        value={themeProductsFilters.sort} 
                        onValueChange={(value) => {
                          setThemeProductsFilters(prev => ({ ...prev, sort: value }));
                          fetchThemeProducts({ sort: value, offset: 0 });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nom</SelectItem>
                          <SelectItem value="price">Prix</SelectItem>
                          <SelectItem value="createdAt">Date de création</SelectItem>
                          <SelectItem value="addedToThemeAt">Date d'ajout au thème</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ordre de tri */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOrder = themeProductsFilters.order === 'asc' ? 'desc' : 'asc';
                          setThemeProductsFilters(prev => ({ ...prev, order: newOrder }));
                          fetchThemeProducts({ order: newOrder, offset: 0 });
                        }}
                        className="flex items-center gap-2"
                      >
                        {themeProductsFilters.order === 'asc' ? '↑' : '↓'}
                        {themeProductsFilters.order === 'asc' ? 'Croissant' : 'Décroissant'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setThemeProductsFilters({
                            status: 'all',
                            search: '',
                            sort: 'createdAt',
                            order: 'desc'
                          });
                          fetchThemeProducts({ offset: 0 });
                        }}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Actualiser
                      </Button>
                    </div>
                  </div>
                  
                  {/* Statistiques détaillées */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {themeProducts.length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Produits affichés</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {themeProducts.filter(p => p.status === 'PUBLISHED').length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Publiés</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {themeProducts.filter(p => p.status === 'DRAFT').length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Brouillons</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {themeProducts.filter(p => p.isReadyProduct).length}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Produits prêts</div>
                    </div>
                  </div>
                </div>

                {/* Liste des produits */}
                <div className="flex-1 overflow-y-auto">
                  {loadingThemeProducts ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Chargement des produits du thème...</p>
                    </div>
                  ) : !Array.isArray(themeProducts) || themeProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Aucun produit trouvé dans ce thème
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Aucun produit ne correspond à vos critères de recherche dans ce thème.
                      </p>
                      <Button
                        onClick={() => {
                          setThemeProductsFilters({
                            status: 'all',
                            search: '',
                            sort: 'createdAt',
                            order: 'desc'
                          });
                          fetchThemeProducts({ offset: 0 });
                        }}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {themeProducts.map((product) => (
                          <ProductCardWithRemove
                            key={product.id}
                            product={product}
                            onRemove={removeProductFromTheme}
                          />
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {themeProductsPagination.hasMore && (
                        <div className="mt-8 text-center">
                          <Button
                            onClick={() => {
                              const newOffset = themeProductsPagination.offset + themeProductsPagination.limit;
                              setThemeProductsPagination(prev => ({ ...prev, offset: newOffset }));
                              fetchThemeProducts({ offset: newOffset });
                            }}
                            disabled={loadingThemeProducts}
                            variant="outline"
                            className="px-8 py-3"
                          >
                            {loadingThemeProducts ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Chargement...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Charger plus de produits
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {themeProducts.length} sur {themeProductsPagination.total} produits
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer avec compteurs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedProducts.size} produit(s) prêt(s) existant(s) sélectionné(s)
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/themes')}
              className="border-gray-300 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleAddProducts}
              disabled={selectedProducts.size === 0}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter {selectedProducts.size} produit(s) prêt(s)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeProductsPage; 
 