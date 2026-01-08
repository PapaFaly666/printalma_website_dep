import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ModernPricingProductCard } from '../../components/vendor/ModernPricingProductCard';
import type { ModernPricingProduct } from '../../components/vendor/ModernPricingProductCard';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  SortDesc,
  TrendingUp,
  Eye,
  Grid3X3
} from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';

// Données de démonstration
const mockProducts: ModernPricingProduct[] = [
  {
    id: 1,
    vendorName: "T-Shirt Premium Design Wax",
    vendorDescription: "T-shirt en coton bio avec design traditionnel",
    price: 8500,
    status: 'PUBLISHED' as const,
    isValidated: true,
    colorVariations: [
      {
        id: 1,
        name: "Bleu Royal",
        colorCode: "#1e40af",
        images: [{
          id: 1,
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
          viewType: "FRONT",
          delimitations: [
            { x: 20, y: 25, width: 60, height: 40, coordinateType: 'PERCENTAGE' as const }
          ]
        }]
      },
      {
        id: 2,
        name: "Noir Classique",
        colorCode: "#000000",
        images: [{
          id: 2,
          url: "https://images.unsplash.com/photo-1583743814966-8936f37f8036?w=400",
          viewType: "FRONT",
          delimitations: [
            { x: 20, y: 25, width: 60, height: 40, coordinateType: 'PERCENTAGE' as const }
          ]
        }]
      }
    ],
    baseProduct: {
      name: "T-Shirt Basique Coton",
      type: "CLOTHING",
      categories: [
        { id: 1, name: "Vêtements" },
        { id: 2, name: "T-Shirts" }
      ]
    },
    designApplication: {
      designUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200",
      positioning: 'CENTER' as const,
      scale: 0.7
    },
    basePriceAdmin: 5000,
    vendorStock: 25,
    publishedAt: "2024-01-15T10:30:00Z",
    validatedAt: "2024-01-14T15:20:00Z"
  },
  {
    id: 2,
    vendorName: "Casquette Urbaine Motif",
    vendorDescription: "Casquette moderne avec motif urbain personnalisé",
    price: 6200,
    status: 'DRAFT' as const,
    isValidated: true,
    colorVariations: [{
      id: 3,
      name: "Rouge Cardinal",
      colorCode: "#dc2626",
      images: [{
        id: 3,
        url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400",
        viewType: "FRONT",
        delimitations: [
          { x: 15, y: 20, width: 70, height: 30, coordinateType: 'PERCENTAGE' as const }
        ]
      }]
    }],
    baseProduct: {
      name: "Casquette Baseball",
      type: "ACCESSORY",
      categories: [
        { id: 3, name: "Accessoires" },
        { id: 4, name: "Casquettes" }
      ]
    },
    designApplication: {
      designUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
      positioning: 'CENTER' as const,
      scale: 0.8
    },
    basePriceAdmin: 4000,
    vendorStock: 15,
    validatedAt: "2024-01-16T09:45:00Z"
  },
  {
    id: 3,
    vendorName: "Mug Céramique Personnalisé",
    vendorDescription: "Mug en céramique de haute qualité avec design personnalisé",
    price: 4800,
    status: 'PENDING' as const,
    isValidated: false,
    colorVariations: [{
      id: 4,
      name: "Blanc Éclatant",
      colorCode: "#ffffff",
      images: [{
        id: 4,
        url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400",
        viewType: "FRONT",
        delimitations: [
          { x: 25, y: 30, width: 50, height: 40, coordinateType: 'PERCENTAGE' as const }
        ]
      }]
    }],
    baseProduct: {
      name: "Mug Standard",
      type: "HOME",
      categories: [
        { id: 5, name: "Maison" },
        { id: 6, name: "Mugs" }
      ]
    },
    designApplication: {
      designUrl: "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=200",
      positioning: 'CENTER' as const,
      scale: 0.6
    },
    basePriceAdmin: 2500,
    vendorStock: 50
  }
];

export const ModernPricingDemo: React.FC = () => {
  const [products, setProducts] = useState<ModernPricingProduct[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { toast } = useToast();

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Gérer la mise à jour des prix
  const handlePriceUpdate = (id: number, newPrice: number, profit: number) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, price: newPrice }
        : product
    ));
    
    toast({
      title: "Prix mis à jour !",
      description: `Nouveau prix: ${new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0
      }).format(newPrice)} (Bénéfice: +${new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0
      }).format(profit)})`,
      duration: 3000,
    });
  };

  const handleView = (product: any) => {
    toast({
      title: "Aperçu du produit",
      description: `Ouverture de: ${product.vendorName}`,
    });
  };

  const handleEdit = (product: any) => {
    toast({
      title: "Modification",
      description: `Édition de: ${product.vendorName}`,
    });
  };

  const handleDelete = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Produit supprimé",
      description: "Le produit a été retiré de votre catalogue.",
      variant: "destructive"
    });
  };

  const handlePublish = (id: number) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, status: 'PUBLISHED' as const }
        : product
    ));
    toast({
      title: "Produit publié !",
      description: "Votre produit est maintenant visible par les clients.",
    });
  };

  // Statistiques
  const totalProducts = products.length;
  const publishedProducts = products.filter(p => p.status === 'PUBLISHED').length;
  const draftProducts = products.filter(p => p.status === 'DRAFT').length;
  const pendingProducts = products.filter(p => p.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ShoppingBag className="h-7 w-7 text-blue-600" />
                Mes Produits avec Pricing Moderne
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez vos produits avec un système de tarification avancé
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <TrendingUp className="h-4 w-4 mr-2" />
              Nouveau Produit
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Grid3X3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Publiés</p>
                    <p className="text-2xl font-bold text-green-600">{publishedProducts}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-600 hover:bg-green-100">
                    Live
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Brouillons</p>
                    <p className="text-2xl font-bold text-yellow-600">{draftProducts}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-600 hover:bg-yellow-100">
                    Draft
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
                    <p className="text-2xl font-bold text-purple-600">{pendingProducts}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100">
                    Pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PUBLISHED">Publiés</option>
                  <option value="DRAFT">Brouillons</option>
                  <option value="PENDING">En attente</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                <Button variant="outline" size="sm">
                  <SortDesc className="h-4 w-4 mr-2" />
                  Trier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ModernPricingProductCard
                product={product}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onPriceUpdate={handlePriceUpdate}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-auto">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Aucun produit ne correspond à vos critères de recherche.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    💡 Conseil de tarification
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Cliquez sur "Tarifs"</strong> sur chaque produit pour ajuster votre marge bénéficiaire. 
                    Le prix de revient reste fixe, mais vous pouvez modifier votre bénéfice net et voir 
                    le prix final se calculer automatiquement avec les pourcentages de marge.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-white/50">
                      Prix de revient: Fixe
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Bénéfice: Modifiable
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                      Prix final: Auto-calculé
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernPricingDemo;