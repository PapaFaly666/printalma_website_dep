import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Eye, 
  Edit, 
  Trash2, 
  Upload,
  Filter,
  Search,
  RefreshCw,
  Plus,
  ExternalLink
} from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { PostValidationActionSelector } from '../PostValidationActionSelector';
import { ProductStatusBadgeIntegrated } from '../cascade/ProductStatusBadgeIntegrated';
import { useVendorProductsWithDeduplication } from '../../hooks/useVendorProductsWithDeduplication';
import { VendorProduct, PostValidationAction } from '../../types/cascadeValidation';
import { toast } from 'sonner';

type FilterType = 'all' | 'PUBLISHED' | 'DRAFT' | 'PENDING';

export const VendorProductsList: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    loading,
    error,
    stats,
    loadProducts,
    publishDraft,
    updatePostValidationAction,
    refreshProducts
  } = useVendorProductsWithDeduplication();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created' | 'updated'>('updated');

  // Produits filtrés et recherchés
  const filteredProducts = React.useMemo(() => {
    let result = products;

    // Filtre par statut
    if (filter !== 'all') {
      result = result.filter(product => product.status === filter);
    }

    // Recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.vendorName.toLowerCase().includes(search) ||
        product.vendorDescription.toLowerCase().includes(search)
      );
    }

    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.vendorName.localeCompare(b.vendorName);
        case 'price':
          return a.vendorPrice - b.vendorPrice;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [products, filter, searchTerm, sortBy]);

  const handlePublishDraft = async (productId: number) => {
    const result = await publishDraft(productId);
    if (result.success) {
      toast.success('✅ Produit publié avec succès !');
    }
  };

  const handleActionChange = async (productId: number, action: PostValidationAction) => {
    try {
      await updatePostValidationAction(productId, action);
    } catch (error) {
      console.error('Erreur mise à jour action:', error);
    }
  };

  const getFilterButtons = () => {
    const buttons: Array<{ key: FilterType; label: string; count: number; color: string }> = [
      { key: 'all', label: 'Tous', count: stats.totalProducts, color: 'bg-gray-100 text-gray-800' },
      { key: 'PUBLISHED', label: 'Publiés', count: stats.publishedProducts, color: 'bg-green-100 text-green-800' },
      { key: 'DRAFT', label: 'Brouillons', count: stats.draftProducts, color: 'bg-blue-100 text-blue-800' },
      { key: 'PENDING', label: 'En attente', count: stats.pendingProducts, color: 'bg-orange-100 text-orange-800' }
    ];

    return buttons.map(button => (
      <Button
        key={button.key}
        variant={filter === button.key ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter(button.key)}
        className="flex items-center gap-2"
      >
        {button.label}
        <Badge variant="secondary" className={`${button.color} text-xs`}>
          {button.count}
        </Badge>
      </Button>
    ));
  };

  const ProductCard: React.FC<{ product: VendorProduct }> = ({ product }) => {
    const [actionChanging, setActionChanging] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const handleLocalActionChange = async (action: PostValidationAction) => {
      setActionChanging(true);
      try {
        await handleActionChange(product.id, action);
      } finally {
        setActionChanging(false);
      }
    };

    const handleLocalPublish = async () => {
      setPublishing(true);
      try {
        await handlePublishDraft(product.id);
      } finally {
        setPublishing(false);
      }
    };

    // Permettre la publication de tous les brouillons (validés ou non)
    const canPublish = product.status === 'DRAFT';
    const isValidatedDraft = product.status === 'DRAFT' && product.isValidated;

    return (
      <Card key={product.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          {/* En-tête avec statut */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {product.vendorName}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.vendorDescription}
              </p>
            </div>
            <ProductStatusBadgeIntegrated product={product} />
          </div>

          {/* Informations du produit */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Prix</p>
              <p className="font-medium text-lg">
                {(product.vendorPrice / 100).toFixed(2)} €
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock</p>
              <p className="font-medium">
                {product.vendorStock} unités
              </p>
            </div>
          </div>

          {/* Informations du design */}
          {product.designId && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Design ID: {product.designId}</span>
              </div>
              {product.designCloudinaryUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={product.designCloudinaryUrl}
                    alt="Design"
                    className="w-12 h-12 object-contain border rounded"
                  />
                  <div className="flex-1">
                    {/* Suppression des libellés de statut du design pour éviter la redondance */}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action post-validation (pour les produits en attente) */}
          {product.status === 'PENDING' && (
            <div className="mb-4 p-3 border rounded-lg">
              <p className="text-sm font-medium mb-2">Action après validation :</p>
              <PostValidationActionSelector
                value={product.postValidationAction}
                onChange={handleLocalActionChange}
                disabled={actionChanging}
              />
            </div>
          )}

          {/* Alerte pour les brouillons non validés */}
          {canPublish && !isValidatedDraft && (
            <div className="mb-4 p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">⚠️ Brouillon non validé</p>
              <p className="text-xs text-orange-700 mt-1">
                Ce produit n'a pas encore été validé par l'admin, mais vous pouvez le publier sous votre responsabilité.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/vendor/products/${product.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/vendor/products/${product.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>

            <div className="flex space-x-2">
              {/* Bouton publier pour tous les brouillons */}
              {canPublish && (
                <Button
                  size="sm"
                  onClick={handleLocalPublish}
                  disabled={publishing}
                  className={`${
                    isValidatedDraft 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
                  title={isValidatedDraft ? 'Publier (validé)' : 'Publier (non validé)'}
                >
                  {publishing ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {isValidatedDraft ? 'Publier' : 'Publier quand même'}
                </Button>
              )}

              {/* Bouton changer action pour les produits en attente */}
              {product.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLocalActionChange(
                    product.postValidationAction === PostValidationAction.AUTO_PUBLISH 
                      ? PostValidationAction.TO_DRAFT 
                      : PostValidationAction.AUTO_PUBLISH
                  )}
                  disabled={actionChanging}
                  title="Changer l'action après validation"
                >
                  {actionChanging ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-1" />
                  )}
                  Action
                </Button>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Créé: {new Date(product.createdAt).toLocaleDateString()}</span>
              <span>Modifié: {new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
          <p className="text-gray-600">
            {stats.totalProducts} produit{stats.totalProducts > 1 ? 's' : ''} 
            {stats.validatedDrafts > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                • {stats.validatedDrafts} prêt{stats.validatedDrafts > 1 ? 's' : ''} à publier
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProducts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => navigate('/vendor/products/create')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats.validatedDrafts > 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            Vous avez {stats.validatedDrafts} produit{stats.validatedDrafts > 1 ? 's' : ''} 
            validé{stats.validatedDrafts > 1 ? 's' : ''} en brouillon prêt{stats.validatedDrafts > 1 ? 's' : ''} à publier !
          </AlertDescription>
        </Alert>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Boutons de filtre */}
          <div className="flex flex-wrap gap-2">
            {getFilterButtons()}
          </div>

          {/* Recherche et tri */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Dernière modification</option>
              <option value="created">Date de création</option>
              <option value="name">Nom</option>
              <option value="price">Prix</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Chargement des produits...</p>
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm || filter !== 'all' 
              ? 'Aucun produit ne correspond à vos critères'
              : 'Vous n\'avez pas encore créé de produits'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <Button
              onClick={() => navigate('/vendor/products/create')}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Créer votre premier produit
            </Button>
          )}
        </div>
      )}

      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}; 
 
 
 
 
 