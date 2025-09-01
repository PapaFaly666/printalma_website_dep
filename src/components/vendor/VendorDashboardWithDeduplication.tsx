import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  FileText, 
  Upload,
  Eye,
  RefreshCw,
  Plus,
  BarChart3,
  Recycle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { useVendorProductsWithDeduplication } from '../../hooks/useVendorProductsWithDeduplication';
import { VendorProduct } from '../../types/cascadeValidation';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend 
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <div className={`text-sm font-medium ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.positive ? '+' : ''}{trend.value}
            </div>
            <div className="text-xs text-gray-500">{trend.label}</div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

interface RecentProductProps {
  product: VendorProduct;
  onView: (productId: number) => void;
  onPublish?: (productId: number) => void;
}

const RecentProductCard: React.FC<RecentProductProps> = ({ 
  product, 
  onView, 
  onPublish 
}) => {
  const canPublish = product.status === 'DRAFT';
  const isValidatedDraft = product.status === 'DRAFT' && product.isValidated;
  
  const getStatusColor = () => {
    switch (product.status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return product.isValidated ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    if (product.status === 'PUBLISHED') return 'Publié';
    if (product.status === 'DRAFT' && product.isValidated) return 'Prêt à publier';
    if (product.status === 'DRAFT' && !product.isValidated) return 'Brouillon (non validé)';
    if (product.status === 'PENDING') return 'En attente';
    return 'Brouillon';
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 truncate">{product.vendorName}</h4>
          <p className="text-sm text-gray-600 truncate">{product.vendorDescription}</p>
        </div>
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">
            {(product.vendorPrice / 100).toFixed(2)} €
          </span>
          {product.designId && (
            <div className="flex items-center gap-1">
              <Recycle className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-gray-500">ID: {product.designId}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(product.id)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          {canPublish && onPublish && (
            <Button
              size="sm"
              onClick={() => onPublish(product.id)}
              className={`${
                isValidatedDraft 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white`}
              title={isValidatedDraft ? 'Publier (validé)' : 'Publier (non validé)'}
            >
              <Upload className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const VendorDashboardWithDeduplication: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    loading,
    error,
    stats,
    publishDraft,
    refreshProducts
  } = useVendorProductsWithDeduplication();

  const [recentProducts, setRecentProducts] = useState<VendorProduct[]>([]);

  useEffect(() => {
    // Récupérer les 6 produits les plus récents
    const recent = [...products]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
    setRecentProducts(recent);
  }, [products]);

  const handleViewProduct = (productId: number) => {
    navigate(`/vendor/products/${productId}`);
  };

  const handlePublishProduct = async (productId: number) => {
    try {
      await publishDraft(productId);
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const getTotalRevenue = () => {
    return products
      .filter(p => p.status === 'PUBLISHED')
      .reduce((sum, p) => sum + (p.vendorPrice / 100), 0);
  };

  const getValidationRate = () => {
    if (stats.totalProducts === 0) return 0;
    return Math.round((stats.publishedProducts / stats.totalProducts) * 100);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Vendeur</h1>
          <p className="text-gray-600">
            Vue d'ensemble de vos produits et performances
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshProducts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/vendor/products/create')}>
            <Plus className="h-4 w-4 mr-1" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats.validatedDrafts > 0 && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.validatedDrafts}</strong> produit{stats.validatedDrafts > 1 ? 's' : ''} 
            validé{stats.validatedDrafts > 1 ? 's' : ''} en brouillon prêt{stats.validatedDrafts > 1 ? 's' : ''} à publier !
            <Button 
              size="sm" 
              className="ml-2" 
              onClick={() => navigate('/vendor/products?filter=DRAFT')}
            >
              Voir les brouillons
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {stats.draftProducts > 0 && stats.validatedDrafts === 0 && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Vous avez <strong>{stats.draftProducts}</strong> produit{stats.draftProducts > 1 ? 's' : ''} 
            en brouillon{stats.draftProducts > 1 ? 's' : ''}. Vous pouvez les publier même s'ils ne sont pas encore validés.
            <Button 
              size="sm" 
              className="ml-2" 
              onClick={() => navigate('/vendor/products?filter=DRAFT')}
            >
              Voir les brouillons
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Produits"
          value={stats.totalProducts}
          subtitle="Tous statuts confondus"
          icon={<Package className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
        />
        
        <StatCard
          title="Publiés"
          value={stats.publishedProducts}
          subtitle="Visibles par les clients"
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
        />
        
        <StatCard
          title="Brouillons"
          value={stats.draftProducts}
          subtitle={stats.validatedDrafts > 0 ? `${stats.validatedDrafts} prêts à publier` : 'En attente'}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
        />
        
        <StatCard
          title="En attente"
          value={stats.pendingProducts}
          subtitle="Validation admin"
          icon={<Clock className="h-5 w-5 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chiffre d'affaires potentiel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {getTotalRevenue().toFixed(2)} €
            </div>
            <p className="text-sm text-gray-600">
              Basé sur {stats.publishedProducts} produit{stats.publishedProducts > 1 ? 's' : ''} publié{stats.publishedProducts > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Taux de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {getValidationRate()}%
            </div>
            <Progress value={getValidationRate()} className="mb-2" />
            <p className="text-sm text-gray-600">
              {stats.publishedProducts} validés sur {stats.totalProducts} produits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              Efficacité designs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {products.filter(p => p.designId).length}
            </div>
            <p className="text-sm text-gray-600">
              Produits avec designs référencés
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Économie d'espace de stockage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par action post-validation */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des actions post-validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Publication automatique</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {stats.autoPublishPending}
              </div>
              <p className="text-sm text-green-600">
                Produits en attente de validation
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Publication manuelle</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.manualPublishPending}
              </div>
              <p className="text-sm text-blue-600">
                Iront en brouillon après validation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produits récents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produits récents</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/vendor/products')}
            >
              Voir tous
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-600 mt-2">Chargement...</p>
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Aucun produit créé</p>
              <Button 
                className="mt-2" 
                onClick={() => navigate('/vendor/products/create')}
              >
                Créer votre premier produit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProducts.map(product => (
                <RecentProductCard
                  key={product.id}
                  product={product}
                  onView={handleViewProduct}
                  onPublish={handlePublishProduct}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
 
 
 
 
 