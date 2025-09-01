import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Search, Filter, Grid, List, TrendingUp, ShoppingBag, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { BestSellerCard } from '../components/BestSellerCard';
import { useBestSellers } from '../hooks/useBestSellers';
import { BestSellerProduct } from '../types/bestSellers';
import { useNavigate } from 'react-router-dom';

interface BestSellersPageProps {
  className?: string;
}

export const BestSellersPage: React.FC<BestSellersPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minSales, setMinSales] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'rank' | 'sales' | 'revenue'>('rank');

  const { data: bestSellers, loading, error, stats, fetchData: refetch } = useBestSellers({ 
    limit: 100 // Récupérer plus de produits pour le filtrage
  });

  // 🏆 NOUVEAU: Trier et filtrer les produits selon la documentation
  const filteredAndSortedProducts = useMemo(() => {
    if (!Array.isArray(bestSellers)) return [];

    let filtered = [...bestSellers];

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        (product as any).vendorName?.toLowerCase().includes(term) ||
        (product as any).adminProduct?.name?.toLowerCase().includes(term) ||
        product.vendor.shopName?.toLowerCase().includes(term) ||
        (product as any).adminProduct?.categories?.some((cat: any) => cat.name.toLowerCase().includes(term))
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.baseProduct.categories.includes(selectedCategory)
      );
    }

    // Filtre par nombre minimum de ventes
    if (minSales > 0) {
      filtered = filtered.filter(product => product.totalQuantitySold >= minSales);
    }

    // Tri selon la documentation
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          // Priorité 1: rank (1 = meilleur)
          return a.rank - b.rank;
        
        case 'sales':
          return b.totalQuantitySold - a.totalQuantitySold;
        
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        
        default:
          return 0;
      }
    });

    // 🏆 NOUVEAU: Debug log pour vérifier le tri
    if (filtered.length > 0) {
      console.log('🏆 [BestSellersPage] Produits filtrés et triés:', filtered.map(p => ({
        name: p.vendor.name,
        rank: p.rank,
        sales: p.totalQuantitySold,
        sortBy
      })));
    }

    return filtered;
  }, [bestSellers, searchTerm, selectedCategory, minSales, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // 🏆 NOUVEAU: Récupérer les catégories uniques
  const uniqueCategories = useMemo(() => {
    if (!Array.isArray(bestSellers)) return [];
    
    const categories = new Set<string>();
    bestSellers.forEach(product => {
      product.baseProduct.categories.forEach(cat => {
        categories.add(cat);
      });
    });
    
    return Array.from(categories).sort();
  }, [bestSellers]);

  // 🏆 NOUVEAU: Fonctions pour les badges de rang
  const getRankColor = (rankNumber: number) => {
    if (rankNumber === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rankNumber === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600';
    if (rankNumber === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  const getRankIcon = (rankNumber: number) => {
    if (rankNumber === 1) return '🥇';
    if (rankNumber === 2) return '🥈';
    if (rankNumber === 3) return '🥉';
    return '🏆';
  };

  const handleProductView = (product: BestSellerProduct) => {
    navigate(`/vendor-product/${product.id}`);
  };

  const handleProductBuy = (product: BestSellerProduct) => {
    navigate(`/vendor-product/${product.id}?action=buy`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl font-semibold mb-4">
              Erreur lors du chargement des meilleures ventes
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </div>
            <Button onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                🏆 Meilleures Ventes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Découvrez nos produits les plus populaires
              </p>
            </div>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {stats.totalBestSellers}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Meilleures ventes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {stats.totalBestSellers}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Catégories</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {stats.totalRevenue}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vendeurs</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filtres et contrôles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Catégorie */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tri */}
            <Select value={sortBy} onValueChange={(value: 'rank' | 'sales' | 'revenue') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rang</SelectItem>
                <SelectItem value="sales">Nombre de ventes</SelectItem>
                <SelectItem value="revenue">Revenus</SelectItem>
              </SelectContent>
            </Select>

            {/* Vues */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedProducts.length} produit(s) trouvé(s)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} sur {totalPages}
            </div>
          </div>

          {/* Grille des produits */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BestSellerCard
                    product={product}
                    onView={handleProductView}
                    onBuy={handleProductBuy}
                    showRank={true}
                    showVendor={true}
                    showStats={true}
                    rank={product.rank || startIndex + index + 1}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            /* Vue liste */
            <div className="space-y-4">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Badge de rang */}
                        {product.rank && (
                          <div className="flex-shrink-0">
                            <Badge className={`${getRankColor(product.rank)} text-white border-0 font-bold px-3 py-1`}>
                              <span className="mr-1">{getRankIcon(product.rank)}</span>
                              <span>#{product.rank}</span>
                            </Badge>
                          </div>
                        )}

                        {/* Image */}
                        <div className="flex-shrink-0 w-24 h-24">
                          <BestSellerCard
                            product={product}
                            onView={handleProductView}
                            onBuy={handleProductBuy}
                            showRank={false}
                            showVendor={false}
                            showStats={false}
                            className="w-full h-full"
                          />
                        </div>

                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {product.vendor.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-bold text-orange-600">
                              {new Intl.NumberFormat('fr-SN', {
                                style: 'currency',
                                currency: 'XOF',
                                maximumFractionDigits: 0
                              }).format(product.price)}
                            </span>
                            <span>📊 {product.totalQuantitySold} ventes</span>
                            <span>💰 {product.totalRevenue.toLocaleString()} FCFA</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductView(product)}
                          >
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleProductBuy(product)}
                          >
                            Acheter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellersPage; 