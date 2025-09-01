import React, { useState, useEffect } from 'react';
import { useCascadeValidation } from '../../hooks/useCascadeValidationNew';
import { ProductStatusBadge } from '../../components/cascade/ProductStatusBadgeNew';
import { PostValidationActionSelector } from '../../components/cascade/PostValidationActionSelectorNew';
import { PublishButton } from '../../components/cascade/PublishButtonNew';

export const VendorProductsPage: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    updatePostValidationAction, 
    publishProduct,
    refreshAllProducts 
  } = useCascadeValidation();

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh toutes les 30 secondes pour détecter les changements de cascade
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAllProducts();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshAllProducts]);

  const handleActionChange = async (productId: number, action: any) => {
    const result = await updatePostValidationAction(productId, action);
    if (!result.success) {
      alert(`Erreur: ${result.error}`);
    }
  };

  const handlePublish = async (productId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await publishProduct(productId);
      if (!result.success) {
        return { success: false, error: result.message || 'Erreur lors de la publication' };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">⏳ Chargement des produits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erreur:</strong> {error}
        <button 
          onClick={() => refreshAllProducts()}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Produits</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Actualisation automatique</span>
          </label>
          <button
            onClick={() => refreshAllProducts()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          <p className="text-gray-400 text-sm mt-2">
            Créez votre premier produit pour commencer
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {product.vendorName}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {product.vendorDescription}
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-lg font-bold text-green-600">
                      {(product.vendorPrice / 100).toFixed(2)} €
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.vendorStock}
                    </span>
                  </div>
                </div>
                <ProductStatusBadge product={product} />
              </div>

              {/* Sélecteur d'action si le produit n'est pas encore validé */}
              {!product.isValidated && product.status === 'PENDING' && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <PostValidationActionSelector
                    currentAction={product.postValidationAction}
                    onActionChange={(action) => handleActionChange(product.id, action)}
                  />
                </div>
              )}

              {/* Bouton de publication si validé et en brouillon */}
              <div className="flex justify-end mb-4">
                <PublishButton 
                  product={product} 
                  onPublish={handlePublish}
                />
              </div>

              {/* Informations de validation */}
              {product.isValidated && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    ✅ Validé le {new Date(product.validatedAt!).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Action configurée: {
                      product.postValidationAction === 'AUTO_PUBLISH' 
                        ? '📢 Publication automatique' 
                        : '📝 Publication manuelle'
                    }
                  </p>
                </div>
              )}

              {/* Métadonnées */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span>Modifié le {new Date(product.updatedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 