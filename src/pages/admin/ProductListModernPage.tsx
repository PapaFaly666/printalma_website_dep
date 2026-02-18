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
    // Redirection vers la page d'édition dédiée
    navigate(`/admin/products/${product.id}/edit`);
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
      <div className="min-h-screen p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductListModern
      products={products}
      loading={loading}
      onEditProduct={handleEditProduct}
      onViewProduct={handleViewProduct}
      onDeleteProduct={handleDeleteProduct}
      onRefresh={handleRefresh}
      onAddProduct={handleAddProduct}
    />
  );
}; 