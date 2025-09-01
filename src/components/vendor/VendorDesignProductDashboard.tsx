import React, { useState, useEffect } from 'react';
import { useVendorDesignProduct } from '../../hooks/useVendorDesignProduct';
import { VendorDesignProductCreator } from './VendorDesignProductCreator';
import { VendorDesignProductsList } from './VendorDesignProductsList';
import { VendorDesignProductStatus, VendorDesignProductResponse } from '../../types/vendorDesignProduct';

interface VendorDesignProductDashboardProps {
  className?: string;
}

export const VendorDesignProductDashboard: React.FC<VendorDesignProductDashboardProps> = ({
  className = '',
}) => {
  const { 
    designProducts, 
    loading, 
    error, 
    loadDesignProducts, 
    updateDesignProduct, 
    deleteDesignProduct,
    updateStatus,
    clearError 
  } = useVendorDesignProduct();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'analytics'>('list');
  const [selectedProduct, setSelectedProduct] = useState<VendorDesignProductResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<VendorDesignProductStatus | ''>('');
  const [editingProduct, setEditingProduct] = useState<VendorDesignProductResponse | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Chargement initial
  useEffect(() => {
    loadDesignProducts();
  }, [loadDesignProducts]);

  // Statistiques
  const stats = React.useMemo(() => {
    const total = designProducts.length;
    const draft = designProducts.filter(dp => dp.status === VendorDesignProductStatus.DRAFT).length;
    const published = designProducts.filter(dp => dp.status === VendorDesignProductStatus.PUBLISHED).length;
    const pending = designProducts.filter(dp => dp.status === VendorDesignProductStatus.PENDING_VALIDATION).length;
    const validated = designProducts.filter(dp => dp.status === VendorDesignProductStatus.VALIDATED).length;
    const rejected = designProducts.filter(dp => dp.status === VendorDesignProductStatus.REJECTED).length;

    return { total, draft, published, pending, validated, rejected };
  }, [designProducts]);

  // Gestion des onglets
  const handleTabChange = (tab: 'list' | 'create' | 'analytics') => {
    setActiveTab(tab);
    setSelectedProduct(null);
    setEditingProduct(null);
  };

  // Gestion de la création réussie
  const handleCreateSuccess = (designProduct: VendorDesignProductResponse) => {
    setActiveTab('list');
    // Recharger la liste pour voir le nouveau produit
    loadDesignProducts();
  };

  // Gestion de l'édition
  const handleEdit = (designProduct: VendorDesignProductResponse) => {
    setEditingProduct(designProduct);
    setActiveTab('create');
  };

  // Actions en lot
  const handleBulkStatusChange = async (newStatus: VendorDesignProductStatus) => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map(id => updateStatus(id, newStatus))
      );
      setSelectedIds([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Erreur lors du changement en lot:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} design(s)-produit(s) ?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map(id => deleteDesignProduct(id))
      );
      setSelectedIds([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
    }
  };

  // Sélection pour actions en lot
  const handleSelectAll = () => {
    if (selectedIds.length === designProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(designProducts.map(dp => dp.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Designs-Produits</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => loadDesignProducts()}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? '🔄 Chargement...' : '🔄 Actualiser'}
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-800">{stats.draft}</div>
            <div className="text-sm text-yellow-600">Brouillons</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-800">{stats.published}</div>
            <div className="text-sm text-green-600">Publiés</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-800">{stats.pending}</div>
            <div className="text-sm text-orange-600">En attente</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-800">{stats.validated}</div>
            <div className="text-sm text-blue-600">Validés</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejetés</div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleTabChange('list')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Liste ({stats.total})
          </button>
          <button
            onClick={() => handleTabChange('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ Créer nouveau
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Analytiques
          </button>
        </div>
      </div>

      {/* Message d'erreur global */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Contenu des onglets */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Actions en lot */}
          {designProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    {selectedIds.length === designProducts.length ? '🔲 Tout désélectionner' : '☑️ Tout sélectionner'}
                  </button>
                  
                  {selectedIds.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedIds.length} sélectionné(s)
                      </span>
                      <button
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                      >
                        Actions
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtre par statut */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as VendorDesignProductStatus | '')}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="">Tous les statuts</option>
                  <option value={VendorDesignProductStatus.DRAFT}>Brouillons</option>
                  <option value={VendorDesignProductStatus.PUBLISHED}>Publiés</option>
                  <option value={VendorDesignProductStatus.PENDING_VALIDATION}>En attente</option>
                  <option value={VendorDesignProductStatus.VALIDATED}>Validés</option>
                  <option value={VendorDesignProductStatus.REJECTED}>Rejetés</option>
                </select>
              </div>

              {/* Menu des actions en lot */}
              {showBulkActions && selectedIds.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Changer le statut pour {selectedIds.length} élément(s):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBulkStatusChange(VendorDesignProductStatus.DRAFT)}
                      className="text-xs bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                    >
                      Brouillon
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange(VendorDesignProductStatus.PUBLISHED)}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    >
                      Publier
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange(VendorDesignProductStatus.PENDING_VALIDATION)}
                      className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                    >
                      En attente
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Liste des designs-produits */}
          <VendorDesignProductsList
            onEdit={handleEdit}
            selectedIds={selectedIds}
            onSelectItem={handleSelectItem}
            filterStatus={filterStatus}
          />
        </div>
      )}

      {activeTab === 'create' && (
        <VendorDesignProductCreator
          productId={editingProduct?.productId || 1} // Exemple avec productId=1
          onSuccess={handleCreateSuccess}
          onCancel={() => setActiveTab('list')}
          editingProduct={editingProduct}
        />
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytiques des Designs-Produits</h2>
          
          {/* Graphique de répartition par statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Répartition par Statut</h3>
              <div className="space-y-3">
                {[
                  { status: 'DRAFT', label: 'Brouillons', count: stats.draft, color: 'bg-gray-400' },
                  { status: 'PUBLISHED', label: 'Publiés', count: stats.published, color: 'bg-green-400' },
                  { status: 'PENDING_VALIDATION', label: 'En attente', count: stats.pending, color: 'bg-yellow-400' },
                  { status: 'VALIDATED', label: 'Validés', count: stats.validated, color: 'bg-blue-400' },
                  { status: 'REJECTED', label: 'Rejetés', count: stats.rejected, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activité récente */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Activité Récente</h3>
              <div className="space-y-3">
                {designProducts
                  .slice()
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 5)
                  .map((dp) => (
                    <div key={dp.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={dp.designUrl} 
                          alt={dp.name || 'Design'} 
                          className="w-8 h-8 rounded object-cover"
                        />
                        <span className="text-gray-700">{dp.name || 'Sans nom'}</span>
                      </div>
                      <span className="text-gray-500">
                        {new Date(dp.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Actions Rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => loadDesignProducts(VendorDesignProductStatus.DRAFT)}
                className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Voir tous les brouillons ({stats.draft})
              </button>
              <button
                onClick={() => loadDesignProducts(VendorDesignProductStatus.PENDING_VALIDATION)}
                className="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Voir en attente ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Créer un nouveau design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDesignProductDashboard; 