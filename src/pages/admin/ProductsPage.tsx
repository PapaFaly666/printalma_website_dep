import React from 'react';
import { ProductListModern } from '../../components/admin/ProductListModern';
import { useProductsModern } from '../../hooks/useProductsModern';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ProductsPage: React.FC = () => {
  const { products, loading, error, refetch, deleteProduct } = useProductsModern();
  const navigate = useNavigate();

  const handleEditProduct = (product: any) => {
    navigate(`/admin/products/${product.id}/edit`);
  };

  const handleViewProduct = (product: any) => {
    // Le modal de détails s'ouvre automatiquement dans ProductListModern
    console.log('Affichage des détails du produit:', product);
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id);
      toast.success('Produit supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
      onRefresh={refetch}
    />
  );
}; 