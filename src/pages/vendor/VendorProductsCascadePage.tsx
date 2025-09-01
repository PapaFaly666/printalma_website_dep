import React, { useState } from 'react';
import { useCascadeValidation } from '../../hooks/useCascadeValidation';
import { ProductCard } from '../../components/cascade/ProductCard';
import { VendorProduct, PostValidationAction } from '../../types/cascadeValidation';
import { 
  Loader2, 
  RefreshCw, 
  Plus, 
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';

export const VendorProductsCascadePage: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    stats,
    refreshProducts,
    updatePostValidationAction, 
    publishValidatedProduct
  } = useCascadeValidation();

  const [refreshing, setRefreshing] = useState(false);

  const handleActionChange = async (productId: number, action: PostValidationAction) => {
    const result = await updatePostValidationAction(productId, action);
    if (!result) {
      alert('Erreur lors de la mise à jour de l\'action');
    }
  };

  const handlePublish = async (productId: number) => {
    try {
      const result = await publishValidatedProduct(productId);
      if (result) {
        return { success: true, message: 'Produit publié avec succès' };
      } else {
        return { success: false, error: 'Erreur lors de la publication' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la publication' };
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  };

  const handleEdit = (product: VendorProduct) => {
    console.log('Éditer le produit:', product);
    // TODO: Implémenter la navigation vers le formulaire d'édition
  };

  const handleDelete = (productId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      console.log('Supprimer le produit:', productId);
      // TODO: Implémenter la suppression
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: {
    icon: React.ComponentType<any>;
    title: string;
    value: number;
    color: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Mes Produits
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gérez vos produits avec le système de validation en cascade
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <button
                onClick={() => console.log('Créer un nouveau produit')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                Nouveau produit
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            title="Total"
            value={stats?.total ?? 0}
            color="bg-gray-500"
          />
          <StatCard
            icon={Clock}
            title="En attente"
            value={stats?.pending ?? 0}
            color="bg-yellow-500"
          />
          <StatCard
            icon={CheckCircle}
            title="Publiés"
            value={stats?.published ?? 0}
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Prêts à publier"
            value={stats?.readyToPublish ?? 0}
            color="bg-blue-500"
          />
        </div>

        {/* Gestion des erreurs */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Une erreur est survenue
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !refreshing && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Chargement des produits...
            </span>
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous n'avez pas encore créé de produits. Commencez par créer votre premier produit.
            </p>
            <button
              onClick={() => console.log('Créer un nouveau produit')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Créer mon premier produit
            </button>
          </div>
        )}

        {/* Liste des produits */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onActionChange={handleActionChange}
                onPublish={handlePublish}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 