import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Package,
  Search,
  Grid,
  List,
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  isReadyProduct: boolean;
  mainImage?: string;
  colorVariations?: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      url: string;
    }>;
  }>;
  categories?: any[];
  sizes?: Array<{
    id: number;
    sizeName: string;
  }>;
}

interface Theme {
  id: number;
  name: string;
  description: string;
  coverImage?: string;
  category?: string;
  status: string;
  productCount?: number;
}

const PublicThemeProductsPage: React.FC = () => {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [theme, setTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  const isThemesList = location.pathname === '/themes';

  useEffect(() => {
    if (isThemesList) {
      fetchThemes();
    } else if (themeId) {
      fetchTheme();
      fetchThemeProducts();
    }
  }, [themeId, isThemesList]);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/themes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData && responseData.data) {
        let themesData = [];
        
        if (Array.isArray(responseData.data)) {
          themesData = responseData.data;
        } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
          themesData = responseData.data.data;
        } else if (responseData.data.success && responseData.data.data && Array.isArray(responseData.data.data)) {
          themesData = responseData.data.data;
        }
        
        // Filtrer uniquement les thèmes actifs et avec des produits
        const activeThemes = themesData.filter((theme: Theme) => 
          theme.status === 'active' && theme.productCount && theme.productCount > 0
        );
        
        setThemes(activeThemes);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes:', error);
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTheme = async () => {
    try {
      const response = await fetch(`/api/themes/${themeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData && responseData.data) {
        setTheme(responseData.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const fetchThemeProducts = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/themes/${themeId}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData && responseData.data) {
        let productsData = [];
        
        if (Array.isArray(responseData.data)) {
          productsData = responseData.data;
        } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
          productsData = responseData.data.data;
        } else if (responseData.data.success && responseData.data.data && Array.isArray(responseData.data.data)) {
          productsData = responseData.data.data;
        }
        
        // Filtrer uniquement les produits publiés
        const publishedProducts = productsData.filter((product: Product) => 
          product.status === 'PUBLISHED' && product.isReadyProduct === true
        );
        
        setProducts(publishedProducts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      const matchesSize = selectedSizes.length === 0 || 
                         (product.sizes && product.sizes.some(size => selectedSizes.includes(size.sizeName)));
      
      return matchesSearch && matchesPrice && matchesSize;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price);
  };

  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes?.map(s => s.sizeName) || [])));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Page de liste des thèmes
  if (isThemesList) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header moderne */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Tous les thèmes</h1>
                  <p className="text-gray-600 text-sm">Découvrez nos collections thématiques</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{themes.length} thème(s)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {themes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun thème disponible
              </h3>
              <p className="text-gray-600">
                Aucun thème n'est actuellement disponible.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme, index) => (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-sm cursor-pointer"
                    onClick={() => navigate(`/themes/${theme.id}`)}
                  >
                    <div className="relative">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={theme.coverImage || "/api/placeholder/800/400"}
                          alt={`Thème ${theme.name}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6">
                          <div className="mb-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-sm">
                              {theme.category || 'Collection'}
                            </Badge>
                          </div>

                          <h3 className="text-xl lg:text-2xl font-medium text-white mb-2">
                            {theme.name}
                          </h3>

                          <p className="text-white/80 text-sm mb-3 line-clamp-2">
                            {theme.description}
                          </p>

                          <div className="flex items-center justify-between transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <span className="text-white text-sm">{theme.productCount} produit(s)</span>
                            <div className="flex items-center">
                              <span className="text-white text-sm">Découvrir</span>
                              <ChevronRight className="ml-1 w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Page de produits d'un thème spécifique
  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thème non trouvé</h2>
            <p className="text-gray-600 mb-4">Le thème que vous recherchez n'existe pas.</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderne */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{theme.name}</h1>
                <p className="text-gray-600 text-sm">{theme.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">{filteredAndSortedProducts.length} produit(s)</p>
              </div>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Favoris
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec sidebar moderne */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filtres */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtres</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Recherche */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Tri */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nom</SelectItem>
                          <SelectItem value="price-asc">Prix croissant</SelectItem>
                          <SelectItem value="price-desc">Prix décroissant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Plage de prix */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 50000])}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tailles */}
                    {allSizes.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tailles</label>
                        <div className="space-y-2">
                          {allSizes.map((size) => (
                            <label key={size} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedSizes.includes(size)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSizes([...selectedSizes, size]);
                                  } else {
                                    setSelectedSizes(selectedSizes.filter(s => s !== size));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{size}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre d'outils */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex border border-gray-300 rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {filteredAndSortedProducts.length} produit(s)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Liste des produits */}
            <AnimatePresence mode="wait">
              {filteredAndSortedProducts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun produit trouvé
                  </h3>
                  <p className="text-gray-600">
                    Aucun produit ne correspond à vos critères de recherche.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="products"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                  }
                >
                  {filteredAndSortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-sm">
                        <div className="relative">
                          <div className="relative aspect-square overflow-hidden bg-gray-100">
                            <img
                              src={product.mainImage || product.colorVariations?.[0]?.images?.[0]?.url || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                            
                            {/* Actions rapides */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <Button size="sm" variant="secondary" className="w-8 h-8 p-0 rounded-full">
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="secondary" className="w-8 h-8 p-0 rounded-full">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Badge nouveau */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-blue-600 text-white text-xs">
                                Nouveau
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {product.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-xl text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">4.5</span>
                            </div>
                          </div>

                          {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-1">
                                {product.sizes.slice(0, 4).map((size) => (
                                  <Badge key={size.id} variant="outline" className="text-xs">
                                    {size.sizeName}
                                  </Badge>
                                ))}
                                {product.sizes.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.sizes.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => navigate(`/products/${product.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-shrink-0"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicThemeProductsPage; 