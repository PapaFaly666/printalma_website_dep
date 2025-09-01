import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductListModern } from '../../components/admin/ProductListModern';
import { Button } from '../../components/ui/button';
import { apiGet, apiPatch, apiDelete, is404Error } from '../../utils/apiHelpers';
import { Plus, Package } from 'lucide-react';

// Types pour les produits prêts
interface ReadyProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
  colorVariationId: number;
  delimitations: any[];
  customDesign: any;
}

interface ReadyColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ReadyProductImage[];
}

interface ReadyProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED';
  description: string;
  createdAt: string;
  updatedAt: string;
  isValidated: boolean;
  validatedAt: string | null;
  validatedBy: string | null;
  rejectionReason: string | null;
  submittedForValidationAt: string | null;
  isDelete: boolean;
  isReadyProduct: boolean;
  hasCustomDesigns: boolean;
  designsMetadata: {
    totalDesigns: number;
    lastUpdated: string | null;
  };
  categories: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  sizes: Array<{
    id: number;
    productId: number;
    sizeName: string;
  }>;
  colorVariations: ReadyColorVariation[];
}

const ReadyProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ReadyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointError, setEndpointError] = useState(false);
  const navigate = useNavigate();

  // Charger les produits prêts
  const fetchReadyProducts = async () => {
    setLoading(true);
    try {
      // Utiliser l'endpoint correct pour le port 3004 (sans préfixe /api)
      const result = await apiGet('https://printalma-back-dep.onrender.com/products?isReadyProduct=true');
      
      if (result.error) {
        if (is404Error(result.error)) {
          toast.error('L\'endpoint des produits n\'est pas encore disponible côté backend');
          setProducts([]);
        } else {
          toast.error(result.error);
        }
        return;
      }

      // Le backend fait déjà le filtrage, on utilise directement les données
      if (result.data && Array.isArray(result.data)) {
        console.log('✅ Produits prêts chargés:', result.data.length);
        setProducts(result.data);
      } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
        // Structure imbriquée: {data: {data: [...], success: true}}
        console.log('✅ Produits prêts chargés (structure imbriquée):', result.data.data.length);
        setProducts(result.data.data);
      } else {
        console.warn('⚠️ Structure de réponse invalide:', result);
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors du chargement des produits prêts');
    } finally {
      setLoading(false);
    }
  };

  // Publier un produit prêt
  const handlePublishProduct = async (id: number) => {
    try {
      const result = await apiPatch(`https://printalma-back-dep.onrender.com/products/${id}`, {
        status: 'published'
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Produit publié avec succès');
      fetchReadyProducts();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la publication');
    }
  };

  // Supprimer un produit prêt
  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit prêt ?')) {
      return;
    }

    try {
      const result = await apiDelete(`https://printalma-back-dep.onrender.com/products/${id}`);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Produit supprimé avec succès');
      fetchReadyProducts();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  // Éditer un produit prêt
  const handleEditProduct = (product: ReadyProduct) => {
    navigate(`/admin/ready-products/${product.id}/edit`);
  };

  // Voir un produit prêt
  const handleViewProduct = (product: ReadyProduct) => {
    navigate(`/admin/ready-products/${product.id}`);
  };

  // Ajouter un nouveau produit prêt
  const handleAddProduct = () => {
    navigate('/admin/ready-products/create');
  };

  // Charger les produits au montage du composant
  useEffect(() => {
    fetchReadyProducts();
  }, []);

  return (
    <div className="p-6">
      {endpointError ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Endpoint non disponible
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              L'endpoint des produits prêts n'est pas encore implémenté côté backend. 
              L'interface est prête mais nécessite l'implémentation des endpoints API.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Endpoints requis :
              </p>
              <ul className="text-sm text-gray-500 text-left max-w-xs mx-auto">
                <li>• GET /products/ready</li>
                <li>• POST /products/ready</li>
                <li>• GET /products/ready/:id</li>
                <li>• PATCH /products/ready/:id</li>
                <li>• DELETE /products/ready/:id</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <ProductListModern
          products={products}
          loading={loading}
          onEditProduct={handleEditProduct}
          onViewProduct={handleViewProduct}
          onDeleteProduct={handleDeleteProduct}
          onPublishProduct={handlePublishProduct}
          onRefresh={fetchReadyProducts}
          onAddProduct={handleAddProduct}
          title="Produits Prêts"
          showAddButton={true}
          addButtonText="Nouveau produit prêt"
          emptyStateTitle="Aucun produit prêt disponible"
          emptyStateDescription="Vous n'avez pas encore créé de produits prêts. Ces produits sont prêts à l'emploi et ne nécessitent pas de délimitations."
          emptyStateButtonText="Créer mon premier produit prêt"
        />
      )}
    </div>
  );
};

export default ReadyProductsPage; 