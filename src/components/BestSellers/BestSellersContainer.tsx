import React, { useState } from 'react';
import { BestSellersDisplay } from './BestSellersDisplay';
import { useBestSellers } from '../../hooks/useBestSellers';
import { BestSellersPeriod, RealBestSellerProduct } from '../../types/bestSellers';
import './BestSellersContainer.css';

interface BestSellersContainerProps {
  initialPeriod?: BestSellersPeriod;
  initialLimit?: number;
  showFilters?: boolean;
  showRefreshButton?: boolean;
  onProductClick?: (product: RealBestSellerProduct) => void;
  className?: string;
}

export const BestSellersContainer: React.FC<BestSellersContainerProps> = ({
  initialPeriod = 'month',
  initialLimit = 10,
  showFilters = true,
  showRefreshButton = true,
  onProductClick,
  className = ''
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const {
    data: products,
    loading,
    error,
    pagination,
    stats,
    params,
    updateParams,
    loadMore,
    resetPagination,
    refreshCache,
    hasMore,
    total,
    currentPage,
    totalPages
  } = useBestSellers({
    period: initialPeriod,
    limit: initialLimit
  });

  const handlePeriodChange = (period: BestSellersPeriod) => {
    updateParams({ period });
    resetPagination();
  };

  const handleLimitChange = (limit: number) => {
    updateParams({ limit });
    resetPagination();
  };

  const handleRefreshCache = async () => {
    try {
      const result = await refreshCache();
      if (result.success) {
        console.log('Cache rafraîchi avec succès:', result.message);
      } else {
        console.error('Erreur lors du rafraîchissement du cache:', result.message);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du cache:', error);
    }
  };

  const handleProductClick = (product: RealBestSellerProduct) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Navigation par défaut vers la page du produit
      console.log('Produit cliqué:', product);
      // Ici vous pouvez ajouter la logique de navigation
    }
  };

  return (
    <div className={`best-sellers-container-wrapper ${className}`}>
      {/* Bouton de rafraîchissement du cache */}
      {showRefreshButton && (
        <div className="cache-refresh-section">
          <button
            className="refresh-cache-btn"
            onClick={handleRefreshCache}
            disabled={loading}
          >
            🔄 Rafraîchir le cache
          </button>
          <span className="cache-info">
            Dernière mise à jour: {stats?.periodAnalyzed || 'Inconnue'}
          </span>
        </div>
      )}

      {/* Filtres avancés */}
      {showFilters && (
        <div className="advanced-filters">
          <button
            className="toggle-filters-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Masquer' : 'Afficher'} les filtres avancés
          </button>
          
          {showAdvancedFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label htmlFor="limit-select">Nombre de résultats:</label>
                <select
                  id="limit-select"
                  value={params.limit || 10}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="min-sales">Ventes minimum:</label>
                <input
                  id="min-sales"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={params.minSales || ''}
                  onChange={(e) => updateParams({ 
                    minSales: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affichage des meilleures ventes */}
      <BestSellersDisplay
        products={products.map(p => ({
          ...p,
          vendorProductId: p.id,
          productName: p.name,
          vendorName: p.vendor?.name || 'Vendeur inconnu',
          category: p.baseProduct?.categories?.[0] || 'Non catégorisé',
          businessName: p.vendor?.shopName,
          vendorId: p.vendor?.id || 0,
          baseProductId: p.baseProduct?.id || 0,
          firstSaleDate: p.firstSaleDate ? new Date(p.firstSaleDate) : new Date(),
          lastSaleDate: p.lastSaleDate ? new Date(p.lastSaleDate) : new Date()
        }))}
        loading={loading}
        error={error}
        selectedPeriod={params.period || 'month'}
        onPeriodChange={handlePeriodChange}
        onProductClick={handleProductClick}
        showStats={true}
        stats={{
          totalProducts: stats?.totalBestSellers || 0,
          totalRevenue: stats?.totalRevenue || 0,
          totalQuantitySold: products.reduce((sum, p) => sum + p.totalQuantitySold, 0),
          period: stats?.periodAnalyzed || 'month'
        }}
      />

      {/* Pagination et bouton "Charger plus" */}
      {hasMore && (
        <div className="load-more-section">
          <button
            className="load-more-btn"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Charger plus de produits'}
          </button>
          <div className="pagination-info">
            Page {currentPage} sur {totalPages} • {total} produits au total
          </div>
        </div>
      )}

      {/* Informations de pagination */}
      {pagination && (
        <div className="pagination-details">
          <div className="pagination-stats">
            <span>Affichage de {products.length} sur {pagination.total} produits</span>
            {pagination.hasMore && (
              <span> • Plus de résultats disponibles</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 