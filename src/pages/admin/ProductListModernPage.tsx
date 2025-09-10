import React from 'react';
import { ProductListModern } from '../../components/admin/ProductListModern';
import { useProductsModern } from '../../hooks/useProductsModern';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ProductListModernPage: React.FC = () => {
  const { products, loading, error, refetch, deleteProduct } = useProductsModern();
  const navigate = useNavigate();

  const handleAddProduct = () => {
    console.log('➕ Ajouter un nouveau produit');
    navigate('/admin/add-product');
    toast.info('Redirection vers l\'ajout de produit');
  };

  const handleEditProduct = (product: any) => {
    console.log('✏️ Modifier le produit:', product);
    // Redirection vers la page d'ajout avec les données du produit pour édition
    navigate(`/admin/add-product?edit=${product.id}`, { state: { editProduct: product } });
    toast.info(`Modification de "${product.name}"`);
  };

  const handleViewProduct = (product: any) => {
    console.log('👁️ Voir le produit:', product);
    // Redirection vers les détails du produit  
    navigate(`/admin/products/${product.id}`);
    toast.info(`Affichage des détails de "${product.name}"`);
  };


  const handleDeleteProduct = async (id: number) => {
    console.log('🗑️ Supprimer le produit ID:', id);
    try {
      await deleteProduct(id);
      toast.success('Produit supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Actualiser la liste');
    refetch();
    toast.info('Liste des produits actualisée');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ProductListModern
          products={products}
          loading={loading}
          onEditProduct={handleEditProduct}
          onViewProduct={handleViewProduct}
          onDeleteProduct={handleDeleteProduct}
          onRefresh={handleRefresh}
          onAddProduct={handleAddProduct}
        />
      </div>
    </div>
  );
}; 