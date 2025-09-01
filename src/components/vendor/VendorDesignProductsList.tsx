import React, { useState, useCallback } from 'react';
import { useVendorDesignProduct } from '../../hooks/useVendorDesignProduct';
import { VendorDesignProductStatus, VendorDesignProductResponse } from '../../types/vendorDesignProduct';

interface VendorDesignProductsListProps {
  onEdit?: (designProduct: VendorDesignProductResponse) => void;
  selectedIds?: number[];
  onSelectItem?: (id: number) => void;
  filterStatus?: VendorDesignProductStatus | '';
  className?: string;
}

const statusLabels = {
  [VendorDesignProductStatus.DRAFT]: 'Brouillon',
  [VendorDesignProductStatus.PUBLISHED]: 'Publié',
  [VendorDesignProductStatus.PENDING_VALIDATION]: 'En attente',
  [VendorDesignProductStatus.VALIDATED]: 'Validé',
  [VendorDesignProductStatus.REJECTED]: 'Rejeté',
};

const statusColors = {
  [VendorDesignProductStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [VendorDesignProductStatus.PUBLISHED]: 'bg-green-100 text-green-800',
  [VendorDesignProductStatus.PENDING_VALIDATION]: 'bg-yellow-100 text-yellow-800',
  [VendorDesignProductStatus.VALIDATED]: 'bg-blue-100 text-blue-800',
  [VendorDesignProductStatus.REJECTED]: 'bg-red-100 text-red-800',
};

export const VendorDesignProductsList: React.FC<VendorDesignProductsListProps> = ({
  onEdit,
  selectedIds = [],
  onSelectItem,
  filterStatus: externalFilterStatus,
  className = '',
}) => {
  const {
    designProducts,
    loading,
    error,
    loadDesignProducts,
    updateStatus,
    deleteDesignProduct,
    clearError,
  } = useVendorDesignProduct();

  const [selectedFilter, setSelectedFilter] = useState<VendorDesignProductStatus | ''>(externalFilterStatus || '');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Utiliser le filtre externe si fourni
  const activeFilter = externalFilterStatus || selectedFilter;

  // Filtrage et tri
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = designProducts;

    // Filtrage par statut
    if (activeFilter) {
      filtered = filtered.filter(dp => dp.status === activeFilter);
    }

    // Tri
    return filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [designProducts, activeFilter, sortBy, sortOrder]);

  // Gestion du changement de statut
  const handleStatusChange = useCallback(async (id: number, newStatus: VendorDesignProductStatus) => {
    try {
      await updateStatus(id, newStatus);
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  }, [updateStatus]);

  // Gestion de la suppression
  const handleDelete = useCallback(async (id: number, name?: string) => {
    const confirmMessage = name 
      ? `Êtes-vous sûr de vouloir supprimer le design "${name}" ?`
      : 'Êtes-vous sûr de vouloir supprimer ce design-produit ?';
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await deleteDesignProduct(id);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  }, [deleteDesignProduct]);

  // Rafraîchissement
  const handleRefresh = useCallback(() => {
    loadDesignProducts(activeFilter || undefined);
  }, [loadDesignProducts, activeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des designs-produits...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Mes Designs-Produits</h2>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Filtres et tri (si pas de filtre externe) */}
      {!externalFilterStatus && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtre par statut */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Statut:</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as VendorDesignProductStatus | '')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Trier par:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'updatedAt')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updatedAt">Date de modification</option>
                <option value="createdAt">Date de création</option>
                <option value="name">Nom</option>
              </select>
            </div>

            {/* Ordre de tri */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {/* Nombre total */}
            <span className="text-sm text-gray-500 ml-auto">
              {filteredAndSortedProducts.length} design{filteredAndSortedProducts.length > 1 ? 's' : ''}-produit{filteredAndSortedProducts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Liste des designs-produits */}
      <div className="divide-y divide-gray-200">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun design-produit trouvé</h3>
            <p className="text-gray-600">
              {activeFilter 
                ? `Aucun design-produit avec le statut "${statusLabels[activeFilter as VendorDesignProductStatus]}" trouvé.`
                : 'Commencez par créer votre premier design-produit.'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedProducts.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                {/* Checkbox de sélection */}
                {onSelectItem && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => onSelectItem(item.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                )}

                {/* Aperçu du design */}
                <div className="flex-shrink-0">
                  <img 
                    src={item.designUrl} 
                    alt={item.name || 'Design'} 
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                
                {/* Informations */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.name || 'Design sans nom'}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="truncate">
                      {item.product?.name || `Produit ID: ${item.productId}`}
                    </span>
                    <span className="mx-2">•</span>
                    <span>
                      Modifié le {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span>Position: {Math.round(item.positionX * 100)}%, {Math.round(item.positionY * 100)}%</span>
                    <span className="mx-2">•</span>
                    <span>Échelle: {Math.round(item.scale * 100)}%</span>
                    <span className="mx-2">•</span>
                    <span>Rotation: {item.rotation}°</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {/* Changement de statut */}
                  <select 
                    value={item.status} 
                    onChange={(e) => handleStatusChange(item.id, e.target.value as VendorDesignProductStatus)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PUBLISHED">Publié</option>
                    <option value="PENDING_VALIDATION">En attente</option>
                    <option value="VALIDATED">Validé</option>
                    <option value="REJECTED">Rejeté</option>
                  </select>
                  
                  {/* Bouton d'édition */}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Éditer
                    </button>
                  )}
                  
                  {/* Bouton de suppression */}
                  <button 
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pied de page avec informations */}
      {filteredAndSortedProducts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredAndSortedProducts.length} design{filteredAndSortedProducts.length > 1 ? 's' : ''}-produit{filteredAndSortedProducts.length > 1 ? 's' : ''} affiché{filteredAndSortedProducts.length > 1 ? 's' : ''}
            </span>
            {selectedIds.length > 0 && (
              <span className="font-medium">
                {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 