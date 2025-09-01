// Composant exemple pour le tableau de bord des produits vendeur (V3)

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  PostValidationAction, 
  VendorProduct, 
  VendorPublishDto,
  VendorProductStatus 
} from '../types/cascadeValidation';
import { useCascadeValidation } from '../hooks/useCascadeValidation';
import { ProductStatusBadge } from './ProductStatusBadge';
import { PostValidationActionSelector } from './PostValidationActionSelector';
import { PublishButton } from './PublishButton';

export const VendorProductsDashboard: React.FC = () => {
  const {
    loading,
    products,
    error,
    updatePostValidationAction,
    publishValidatedProduct,
    createVendorProduct,
    refreshProducts,
    stats
  } = useCascadeValidation();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<VendorPublishDto>>({
    vendorName: '',
    vendorDescription: '',
    vendorPrice: 0,
    vendorStock: 0,
    baseProductId: 1,
    postValidationAction: PostValidationAction.AUTO_PUBLISH,
    selectedColors: [],
    selectedSizes: [],
    finalImagesBase64: { design: '' },
    productStructure: {}
  });

  const handleCreateProduct = async () => {
    if (!newProduct.vendorName || !newProduct.vendorPrice || !newProduct.finalImagesBase64?.design) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const result = await createVendorProduct(newProduct as VendorPublishDto);
    if (result) {
      setShowCreateForm(false);
      setNewProduct({
        vendorName: '',
        vendorDescription: '',
        vendorPrice: 0,
        vendorStock: 0,
        baseProductId: 1,
        postValidationAction: PostValidationAction.AUTO_PUBLISH,
        selectedColors: [],
        selectedSizes: [],
        finalImagesBase64: { design: '' },
        productStructure: {}
      });
      toast.success('Produit créé avec succès !');
    }
  };

  const handleActionChange = async (productId: number, newAction: PostValidationAction) => {
    const result = await updatePostValidationAction(productId, newAction);
    if (result) {
      toast.success('Action post-validation mise à jour');
    }
  };

  const handlePublish = async (productId: number) => {
    const result = await publishValidatedProduct(productId);
    if (result) {
      toast.success('Produit publié avec succès !');
    }
  };

  const getProductCount = (status: VendorProductStatus) => {
    return products.filter(p => p.status === status).length;
  };

  const getValidatedDraftsCount = () => {
    return products.filter(p => p.status === 'DRAFT' && p.isValidated).length;
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🛍️ Mes Produits</h1>
        <p className="text-gray-600">Gérez vos produits et leurs actions post-validation</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
          <div className="text-sm text-gray-500">Total produits</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{getProductCount('PENDING')}</div>
          <div className="text-sm text-gray-500">En attente</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{getProductCount('PUBLISHED')}</div>
          <div className="text-sm text-gray-500">Publiés</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{getProductCount('DRAFT')}</div>
          <div className="text-sm text-gray-500">Brouillons</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{getValidatedDraftsCount()}</div>
          <div className="text-sm text-gray-500">Prêts à publier</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nouveau Produit</span>
          </button>
          <button
            onClick={refreshProducts}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Créer un nouveau produit</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={newProduct.vendorName}
                  onChange={(e) => setNewProduct({...newProduct, vendorName: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: T-shirt Dragon Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.vendorDescription}
                  onChange={(e) => setNewProduct({...newProduct, vendorDescription: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description du produit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (centimes) *
                  </label>
                  <input
                    type="number"
                    value={newProduct.vendorPrice}
                    onChange={(e) => setNewProduct({...newProduct, vendorPrice: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newProduct.vendorStock}
                    onChange={(e) => setNewProduct({...newProduct, vendorStock: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du design *
                </label>
                <input
                  type="text"
                  value={newProduct.finalImagesBase64?.design}
                  onChange={(e) => setNewProduct({
                    ...newProduct, 
                    finalImagesBase64: { design: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://res.cloudinary.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action après validation
                </label>
                <PostValidationActionSelector
                  value={newProduct.postValidationAction || PostValidationAction.AUTO_PUBLISH}
                  onChange={(action) => setNewProduct({...newProduct, postValidationAction: action})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Produits ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M18 24a6 6 0 11-12 0 6 6 0 0112 0zm-6-4v4m0 4h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun produit</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer votre premier produit.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {products.map((product) => (
              <div key={product.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{product.vendorName}</h3>
                    <p className="text-sm text-gray-500">{product.vendorDescription}</p>
                  </div>
                  <ProductStatusBadge status={product.status as any} isValidated={product.isValidated} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Prix:</span>
                    <p className="font-medium">{(product.vendorPrice / 100).toFixed(2)} €</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Stock:</span>
                    <p className="font-medium">{product.vendorStock}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Design ID:</span>
                    <p className="font-medium">{product.designId || 'Non défini'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action post-validation:
                    </label>
                    <PostValidationActionSelector
                      value={product.postValidationAction}
                      onChange={(action) => handleActionChange(product.id, action)}
                      disabled={product.status === 'PUBLISHED'}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    {product.status === 'DRAFT' && product.isValidated && (
                      <PublishButton
                        product={product}
                        onPublish={handlePublish}
                        loading={loading}
                      />
                    )}
                    
                    {product.validatedAt && (
                      <div className="text-xs text-gray-500">
                        Validé le: {new Date(product.validatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProductsDashboard; 
 
 
 
 