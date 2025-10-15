import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Package2,
  Search,
  Filter,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { LoadingSpinner } from '../../components/ui/loading';
import { toast } from 'sonner';
import {
  fetchProductsWithStock,
  updateSizeStock,
  rechargeStock,
  stockIn,
  stockOut,
  getStockHistory,
  ProductStock,
  ColorVariation,
  ColorImage,
  SizeStock,
  StockMovement,
  StockMovementType
} from '../../services/stockService';

export default function AdminStockManagement() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<{ [key: string]: string }>({});
  const [adjustingStock, setAdjustingStock] = useState<string | null>(null);
  const [rechargingStock, setRechargingStock] = useState<string | null>(null);

  // États pour l'historique
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyPerPage = 20;

  // États pour les mouvements de stock
  const [movementQuantity, setMovementQuantity] = useState<{ [key: string]: string }>({});
  const [movementReason, setMovementReason] = useState<{ [key: string]: string }>({});
  const [processingMovement, setProcessingMovement] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Charger les produits depuis la base de données
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProductsWithStock();
      setProducts(data);
      setFilteredProducts(data);
      return data; // Retourner les données pour les utiliser immédiatement
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les produits
  useEffect(() => {
    let filtered = [...products];

    // Filtre de recherche
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre de catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filtre de stock
    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.totalStock < 20);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => p.totalStock === 0);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, stockFilter, products]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Ouvrir le modal de détail
  const handleProductClick = (product: ProductStock) => {
    // Les stocks sont déjà chargés depuis l'API
    setSelectedProduct(product);
    setIsModalOpen(true);
    // Charger l'historique
    loadStockHistory(product.id);
  };

  // Gérer le productId depuis l'URL
  useEffect(() => {
    const productId = searchParams.get('productId');
    if (productId && products.length > 0) {
      const targetProduct = products.find(p => p.id === parseInt(productId));
      if (targetProduct) {
        handleProductClick(targetProduct);
      }
    }
  }, [searchParams, products]);

  // Charger l'historique de stock
  const loadStockHistory = async (productId: number, page: number = 1) => {
    try {
      setLoadingHistory(true);
      const offset = (page - 1) * historyPerPage;
      const { movements, total } = await getStockHistory(productId, {
        limit: historyPerPage,
        offset
      });
      setStockHistory(movements);
      setHistoryTotal(total);
      setHistoryPage(page);
    } catch (error) {
      console.error('Error loading stock history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Entrée de stock
  const handleStockIn = async (
    productId: number,
    colorId: number,
    sizeName: string,
    key: string
  ) => {
    const quantity = parseInt(movementQuantity[key] || '0');
    const reason = movementReason[key] || '';

    if (quantity <= 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }

    setProcessingMovement(key);

    try {
      await stockIn(productId, colorId, sizeName, quantity, reason);

      // Recharger les produits
      const updatedData = await loadProducts();

      // Réinitialiser les champs
      setMovementQuantity({ ...movementQuantity, [key]: '' });
      setMovementReason({ ...movementReason, [key]: '' });

      // Mettre à jour le produit sélectionné
      if (selectedProduct?.id === productId) {
        const updatedProduct = updatedData.find(p => p.id === productId);
        if (updatedProduct) {
          setSelectedProduct(updatedProduct);
        }
        // Recharger l'historique
        loadStockHistory(productId, historyPage);
      }

      toast.success(`+${quantity} unités ajoutées`, {
        description: 'Entrée de stock enregistrée'
      });
    } catch (error) {
      console.error('Error stock IN:', error);
      toast.error('Erreur lors de l\'entrée de stock');
    } finally {
      setProcessingMovement(null);
    }
  };

  // Sortie de stock
  const handleStockOut = async (
    productId: number,
    colorId: number,
    sizeName: string,
    currentStock: number,
    key: string
  ) => {
    const quantity = parseInt(movementQuantity[key] || '0');
    const reason = movementReason[key] || '';

    if (quantity <= 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }

    if (quantity > currentStock) {
      toast.error(`Stock insuffisant (disponible: ${currentStock})`);
      return;
    }

    setProcessingMovement(key);

    try {
      await stockOut(productId, colorId, sizeName, quantity, reason);

      // Recharger les produits
      const updatedData = await loadProducts();

      // Réinitialiser les champs
      setMovementQuantity({ ...movementQuantity, [key]: '' });
      setMovementReason({ ...movementReason, [key]: '' });

      // Mettre à jour le produit sélectionné
      if (selectedProduct?.id === productId) {
        const updatedProduct = updatedData.find(p => p.id === productId);
        if (updatedProduct) {
          setSelectedProduct(updatedProduct);
        }
        // Recharger l'historique
        loadStockHistory(productId, historyPage);
      }

      toast.success(`-${quantity} unités retirées`, {
        description: 'Sortie de stock enregistrée'
      });
    } catch (error) {
      console.error('Error stock OUT:', error);
      toast.error('Erreur lors de la sortie de stock');
    } finally {
      setProcessingMovement(null);
    }
  };

  // Ajuster le stock (+ ou -)
  const handleStockAdjust = async (
    productId: number,
    colorId: number,
    sizeId: number,
    currentStock: number,
    delta: number
  ) => {
    const newStock = Math.max(0, currentStock + delta);
    const key = `${productId}-${colorId}-${sizeId}`;

    setAdjustingStock(key);

    try {
      // Mettre à jour via API
      await updateSizeStock(productId, colorId, sizeId, newStock);

      // Recharger les produits depuis le backend pour avoir les données à jour
      const updatedData = await loadProducts();

      // Mettre à jour le produit sélectionné immédiatement avec les nouvelles données
      if (selectedProduct?.id === productId) {
        const updatedProduct = updatedData.find(p => p.id === productId);
        if (updatedProduct) {
          setSelectedProduct(updatedProduct);
        }
      }

      // Toast de succès
      toast.success(
        delta > 0
          ? `Stock augmenté de ${delta}`
          : `Stock réduit de ${Math.abs(delta)}`,
        { duration: 2000 }
      );
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    } finally {
      setAdjustingStock(null);
    }
  };

  // Recharger le stock
  const handleRecharge = async (
    productId: number,
    colorId: number,
    sizeId: number
  ) => {
    const key = `${productId}-${colorId}-${sizeId}`;
    const amount = parseInt(rechargeAmount[key] || '0');

    if (amount <= 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }

    setRechargingStock(key);

    try {
      // Mettre à jour via API
      await rechargeStock(productId, colorId, sizeId, amount);

      // Recharger les produits depuis le backend pour avoir les données à jour
      const updatedData = await loadProducts();

      // Réinitialiser le champ
      setRechargeAmount({ ...rechargeAmount, [key]: '' });

      // Mettre à jour le produit sélectionné immédiatement avec les nouvelles données
      if (selectedProduct?.id === productId) {
        const updatedProduct = updatedData.find(p => p.id === productId);
        if (updatedProduct) {
          setSelectedProduct(updatedProduct);
        }
      }

      // Toast de succès avec animation
      toast.success(`+${amount} unités ajoutées au stock`, {
        duration: 3000,
        description: 'Le stock a été rechargé avec succès'
      });
    } catch (error) {
      console.error('Error recharging stock:', error);
      toast.error('Erreur lors du rechargement du stock', {
        description: 'Veuillez réessayer ultérieurement'
      });
    } finally {
      setRechargingStock(null);
    }
  };

  // Composant pour le slider de couleurs
  const ColorSlider = ({ colorVariations }: { colorVariations: ColorVariation[] }) => {
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const currentColor = colorVariations[currentColorIndex];

    const nextColor = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentColorIndex((prev) => (prev + 1) % colorVariations.length);
      setCurrentImageIndex(0);
    };

    const prevColor = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentColorIndex((prev) => (prev - 1 + colorVariations.length) % colorVariations.length);
      setCurrentImageIndex(0);
    };

    const nextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentColor && currentColor.images.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % currentColor.images.length);
      }
    };

    const prevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentColor && currentColor.images.length > 0) {
        setCurrentImageIndex((prev) => (prev - 1 + currentColor.images.length) % currentColor.images.length);
      }
    };

    if (!currentColor || !currentColor.images || currentColor.images.length === 0) {
      return (
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Image avec contrôles */}
        <div className="relative w-24 h-24 group">
          <img
            src={currentColor.images[currentImageIndex]?.url}
            alt={`${currentColor.name} - ${currentColor.images[currentImageIndex]?.view}`}
            className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
          />

          {/* Contrôles d'images (si plusieurs images) */}
          {currentColor.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </>
          )}

          {/* Indicateur d'image */}
          {currentColor.images.length > 1 && (
            <Badge
              variant="outline"
              className="absolute top-1 right-1 text-xs bg-white/90 dark:bg-gray-800/90 px-1 py-0"
            >
              {currentImageIndex + 1}/{currentColor.images.length}
            </Badge>
          )}
        </div>

        {/* Contrôles de couleurs */}
        <div className="flex items-center gap-2">
          {colorVariations.length > 1 && (
            <button
              onClick={prevColor}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: currentColor.colorCode }}
              title={currentColor.name}
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {currentColor.name}
            </span>
            {colorVariations.length > 1 && (
              <Badge variant="outline" className="text-xs ml-1">
                {currentColorIndex + 1}/{colorVariations.length}
              </Badge>
            )}
          </div>

          {colorVariations.length > 1 && (
            <button
              onClick={nextColor}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <Package2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Gestion de Stock
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gérez les stocks de tous vos mockups en temps réel
                </p>
              </div>
            </div>
            <Button
              onClick={loadProducts}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtre catégorie */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre stock */}
              <div>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les stocks</SelectItem>
                    <SelectItem value="low">Stock faible (&lt; 20)</SelectItem>
                    <SelectItem value="out">Rupture de stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total produits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {products.length}
                  </p>
                </div>
                <Package2 className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stock total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {products.reduce((sum, p) => sum + p.totalStock, 0)}
                  </p>
                </div>
                <RefreshCw className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Stock faible</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {products.filter(p => p.totalStock < 20 && p.totalStock > 0).length}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table des produits */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Image principale
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Nom produit
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Catégorie
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Sous-catégorie
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Couleurs disponibles
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Stock total
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Image principale */}
                      <td className="px-6 py-4">
                        {product.mainImage ? (
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>

                      {/* Nom */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                      </td>

                      {/* Catégorie */}
                      <td className="px-6 py-4">
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </td>

                      {/* Sous-catégorie */}
                      <td className="px-6 py-4">
                        {product.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {product.subcategory}
                          </Badge>
                        )}
                      </td>

                      {/* Slider couleurs */}
                      <td className="px-6 py-4">
                        <ColorSlider colorVariations={product.colorVariations} />
                      </td>

                      {/* Stock total */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant={
                              product.totalStock === 0
                                ? 'destructive'
                                : product.totalStock < 20
                                ? 'secondary'
                                : 'default'
                            }
                            className="text-base font-bold px-3"
                          >
                            {product.totalStock}
                          </Badge>
                          {product.totalStock < 20 && product.totalStock > 0 && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </td>

                      {/* Bouton gérer */}
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProductClick(product)}
                        >
                          Gérer
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun produit trouvé
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Modal de détail produit */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Package2 className="h-6 w-6 text-blue-600" />
                {selectedProduct?.name}
              </DialogTitle>
              <DialogDescription>
                Gérez les variations de couleur et les tailles de ce produit
              </DialogDescription>
            </DialogHeader>

            {selectedProduct && (
              <div className="mt-4">
                {/* Info catégorie */}
                <div className="mb-6 flex items-center gap-2">
                  {selectedProduct.category && (
                    <Badge variant="outline">{selectedProduct.category}</Badge>
                  )}
                  {selectedProduct.subcategory && (
                    <>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline">{selectedProduct.subcategory}</Badge>
                    </>
                  )}
                </div>

                {/* Onglets principaux : Gestion | Historique */}
                <Tabs defaultValue="manage" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="manage" className="flex items-center gap-2">
                      <Package2 className="h-4 w-4" />
                      Gestion du stock
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historique
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Gestion du stock */}
                  <TabsContent value="manage">
                    {/* Variations de couleur */}
                    <Tabs defaultValue={selectedProduct.colorVariations[0]?.id.toString()}>
                      <TabsList className="mb-4">
                        {selectedProduct.colorVariations.map((color) => (
                          <TabsTrigger key={color.id} value={color.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: color.colorCode }}
                              />
                              {color.name}
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                  {selectedProduct.colorVariations.map((color) => (
                    <TabsContent key={color.id} value={color.id.toString()}>
                      {/* Images */}
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        {color.images.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.url}
                              alt={img.view}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                            />
                            <Badge
                              variant="outline"
                              className="absolute bottom-2 left-2 text-xs bg-white/90 dark:bg-gray-800/90"
                            >
                              {img.view}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {/* Table des tailles et stocks */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                Taille
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                                Stock
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white" colSpan={2}>
                                Mouvement de stock
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                                Motif (optionnel)
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {color.sizes.map((size) => {
                              const key = `${selectedProduct.id}-${color.id}-${size.id}`;
                              // S'assurer que sizeName est une string
                              const sizeName = typeof size.sizeName === 'string'
                                ? size.sizeName
                                : ((size.sizeName as any)?.name || String(size.sizeName));

                              return (
                                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    {sizeName}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge
                                      variant={
                                        size.stock === 0
                                          ? 'destructive'
                                          : size.stock < 10
                                          ? 'secondary'
                                          : 'default'
                                      }
                                      className="text-base font-bold px-3"
                                    >
                                      {size.stock}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3" colSpan={2}>
                                    <div className="flex items-center justify-center gap-2">
                                      <Input
                                        type="number"
                                        placeholder="Quantité"
                                        value={movementQuantity[key] || ''}
                                        onChange={(e) =>
                                          setMovementQuantity({
                                            ...movementQuantity,
                                            [key]: e.target.value
                                          })
                                        }
                                        className="w-24 text-center"
                                        min="1"
                                        disabled={processingMovement === key}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      type="text"
                                      placeholder="Ex: Réception fournisseur"
                                      value={movementReason[key] || ''}
                                      onChange={(e) =>
                                        setMovementReason({
                                          ...movementReason,
                                          [key]: e.target.value
                                        })
                                      }
                                      className="w-full"
                                      disabled={processingMovement === key}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() =>
                                          handleStockIn(selectedProduct.id, color.id, sizeName, key)
                                        }
                                        disabled={!movementQuantity[key] || processingMovement === key}
                                        className="bg-green-600 hover:bg-green-700"
                                        title="Entrée de stock (réception)"
                                      >
                                        {processingMovement === key ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ArrowUpCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          handleStockOut(selectedProduct.id, color.id, sizeName, size.stock, key)
                                        }
                                        disabled={!movementQuantity[key] || size.stock === 0 || processingMovement === key}
                                        title="Sortie de stock"
                                      >
                                        {processingMovement === key ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ArrowDownCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                    </Tabs>
                  </TabsContent>

                  {/* Tab: Historique des mouvements */}
                  <TabsContent value="history">
                    {loadingHistory ? (
                      <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : stockHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Aucun mouvement de stock enregistré
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  Couleur
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  Taille
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                                  Quantité
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                                  Motif
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {stockHistory.map((movement) => (
                                <motion.tr
                                  key={movement.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      variant={movement.type === 'IN' ? 'default' : 'destructive'}
                                      className="flex items-center gap-1 w-fit"
                                    >
                                      {movement.type === 'IN' ? (
                                        <>
                                          <TrendingUp className="h-3 w-3" />
                                          Entrée
                                        </>
                                      ) : (
                                        <>
                                          <TrendingDown className="h-3 w-3" />
                                          Sortie
                                        </>
                                      )}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {movement.colorName}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {movement.sizeName}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`font-bold ${
                                        movement.type === 'IN'
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}
                                    >
                                      {movement.type === 'IN' ? '+' : '-'}
                                      {movement.quantity}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                    {movement.reason || '-'}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination de l'historique */}
                        {historyTotal > historyPerPage && (
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Affichage de {(historyPage - 1) * historyPerPage + 1} à{' '}
                              {Math.min(historyPage * historyPerPage, historyTotal)} sur {historyTotal} mouvements
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadStockHistory(selectedProduct!.id, historyPage - 1)}
                                disabled={historyPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Précédent
                              </Button>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {historyPage} / {Math.ceil(historyTotal / historyPerPage)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadStockHistory(selectedProduct!.id, historyPage + 1)}
                                disabled={historyPage >= Math.ceil(historyTotal / historyPerPage)}
                              >
                                Suivant
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
