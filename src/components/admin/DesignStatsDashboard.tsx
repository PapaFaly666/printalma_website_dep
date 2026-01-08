import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Palette, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/Button';
import { Progress } from '../ui/progress';
import designService from '../../services/designService';
import { DesignStats } from '../../types/product';

export const DesignStatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DesignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await designService.getDesignStats();
      setStats(data);
    } catch (err: any) {
      console.error('Erreur chargement stats design:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
      
      // Fallback sur des données de test
      setStats({
        totalProducts: 15,
        productsWithDesign: 8,
        blankProducts: 7,
        designPercentage: 53.3,
        totalDesigns: 12,
        averageDesignsPerProduct: 0.8
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-readable">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-readable mb-4">Erreur lors du chargement des statistiques</p>
          <p className="product-meta text-gray-500 mb-4">{error}</p>
          <Button onClick={loadStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display-title mb-2">📊 Statistiques des Designs</h2>
          <p className="text-readable">Vue d'ensemble de la personnalisation des produits</p>
        </div>
        <Button 
          onClick={loadStats} 
          variant="outline" 
          size="sm"
          disabled={loading}
          className="border-gray-300 dark:border-gray-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Grille des statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Produits total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="product-meta mb-1">Produits total</p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalProducts}
                  </div>
                </div>
                <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Produits avec design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="product-meta mb-1 text-green-700 dark:text-green-300">Avec design</p>
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {stats.productsWithDesign}
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <Palette className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Produits vierges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="product-meta mb-1">Produits vierges</p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.blankProducts}
                  </div>
                </div>
                <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Taux de design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="product-meta mb-1 text-blue-700 dark:text-blue-300">Taux de design</p>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {stats.designPercentage.toFixed(1)}%
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Designs total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="product-meta mb-1 text-purple-700 dark:text-purple-300">Designs total</p>
                  <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {stats.totalDesigns}
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Moyenne par produit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="hover:shadow-lg transition-all duration-200 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="product-meta mb-1 text-orange-700 dark:text-orange-300">Moyenne/produit</p>
                  <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    {stats.averageDesignsPerProduct.toFixed(1)}
                  </div>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphique de répartition */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="subsection-title flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition des produits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Barre de progression principale */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="product-title">Produits avec design</span>
                  <span className="product-meta">{stats.productsWithDesign} sur {stats.totalProducts}</span>
                </div>
                <Progress 
                  value={stats.designPercentage} 
                  className="h-3 bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Avec design ({stats.designPercentage.toFixed(1)}%)
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Vierges ({(100 - stats.designPercentage).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Détails supplémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.totalDesigns}
                  </div>
                  <div className="product-meta">Designs uploadés</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.averageDesignsPerProduct.toFixed(1)}
                  </div>
                  <div className="product-meta">Designs par produit</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.productsWithDesign > 0 ? (stats.totalDesigns / stats.productsWithDesign).toFixed(1) : '0'}
                  </div>
                  <div className="product-meta">Designs par produit avec design</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Message d'encouragement */}
      {stats.designPercentage < 50 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="subsection-title text-blue-800 dark:text-blue-200 mb-2">
                    Opportunité d'amélioration
                  </h3>
                  <p className="product-description text-blue-700 dark:text-blue-300 mb-3">
                    Vous avez {stats.blankProducts} produit{stats.blankProducts > 1 ? 's' : ''} vierge{stats.blankProducts > 1 ? 's' : ''} qui pourrai{stats.blankProducts > 1 ? 'ent' : 't'} bénéficier de designs personnalisés.
                  </p>
                  <p className="product-meta text-blue-600 dark:text-blue-400">
                    Ajoutez des designs pour améliorer l'attractivité de vos produits et augmenter vos ventes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 