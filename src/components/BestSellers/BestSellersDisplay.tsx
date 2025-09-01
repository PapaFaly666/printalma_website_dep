import React from 'react';
import { RealBestSellerProduct, BestSellersPeriod } from '../../types/bestSellers';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './BestSellersDisplay.css';

interface BestSellersDisplayProps {
  products: RealBestSellerProduct[];
  loading: boolean;
  error: string | null;
  selectedPeriod: BestSellersPeriod;
  onPeriodChange: (period: BestSellersPeriod) => void;
  onProductClick?: (product: RealBestSellerProduct) => void;
  showStats?: boolean;
  stats?: {
    totalProducts: number;
    totalRevenue: number;
    totalQuantitySold: number;
    period: string;
  };
}

const periodLabels: Record<BestSellersPeriod, string> = {
  day: 'Aujourd\'hui',
  week: '7 derniers jours',
  month: '30 derniers jours',
  year: '12 derniers mois',
  all: 'Tous les temps'
};

export const BestSellersDisplay: React.FC<BestSellersDisplayProps> = ({
  products,
  loading,
  error,
  selectedPeriod,
  onPeriodChange,
  onProductClick,
  showStats = true,
  stats
}) => {
  if (loading) {
    return (
      <div className="best-sellers-container">
        <div className="best-sellers-header">
          <h2>🏆 Meilleures Ventes</h2>
          <div className="period-selector">
            {Object.entries(periodLabels).map(([period, label]) => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => onPeriodChange(period as BestSellersPeriod)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des meilleures ventes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="best-sellers-container">
        <div className="best-sellers-header">
          <h2>🏆 Meilleures Ventes</h2>
        </div>
        <div className="error-message">
          <p>❌ {error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="best-sellers-container">
        <div className="best-sellers-header">
          <h2>🏆 Meilleures Ventes</h2>
          <div className="period-selector">
            {Object.entries(periodLabels).map(([period, label]) => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => onPeriodChange(period as BestSellersPeriod)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="no-products">
          <p>Aucune vente trouvée pour cette période</p>
        </div>
      </div>
    );
  }

  return (
    <div className="best-sellers-container">
      <div className="best-sellers-header">
        <h2>🏆 Meilleures Ventes</h2>
        <div className="period-selector">
          {Object.entries(periodLabels).map(([period, label]) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => onPeriodChange(period as BestSellersPeriod)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showStats && stats && (
        <div className="best-sellers-stats">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalProducts}</div>
              <div className="stat-label">Produits</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
              <div className="stat-label">Revenus</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalQuantitySold}</div>
              <div className="stat-label">Vendus</div>
            </div>
          </div>
        </div>
      )}

      <div className="best-sellers-grid">
        {products.map((product) => (
          <div
            key={product.id}
            className={`best-seller-card rank-${product.rank}`}
            onClick={() => onProductClick?.(product)}
          >
            <div className="rank-badge">
              <span className="rank-number">{product.rank}</span>
              <span className="rank-icon">
                {product.rank === 1 ? '🥇' : product.rank === 2 ? '🥈' : product.rank === 3 ? '🥉' : '🏆'}
              </span>
            </div>
            
            <div className="product-image">
              {product.productImage ? (
                <img src={product.productImage} alt={product.productName} />
              ) : (
                <div className="placeholder-image">
                  <span>🖼️</span>
                </div>
              )}
            </div>

            <div className="product-info">
              <h3 className="product-name">{product.productName}</h3>
              <p className="vendor-name">par {product.vendorName}</p>
              {product.businessName && (
                <p className="business-name">{product.businessName}</p>
              )}
              <p className="category">{product.category}</p>
            </div>

            <div className="sales-info">
              <div className="sales-stat">
                <span className="stat-label">Vendus:</span>
                <span className="stat-value">{product.totalQuantitySold}</span>
              </div>
              <div className="sales-stat">
                <span className="stat-label">Revenus:</span>
                <span className="stat-value">{formatCurrency(product.totalRevenue)}</span>
              </div>
              <div className="sales-stat">
                <span className="stat-label">Prix moyen:</span>
                <span className="stat-value">{formatCurrency(product.averageUnitPrice)}</span>
              </div>
              <div className="sales-stat">
                <span className="stat-label">Clients uniques:</span>
                <span className="stat-value">{product.uniqueCustomers}</span>
              </div>
            </div>

            <div className="dates-info">
              <div className="date-stat">
                <span className="stat-label">Première vente:</span>
                <span className="stat-value">{formatDate(product.firstSaleDate)}</span>
              </div>
              <div className="date-stat">
                <span className="stat-label">Dernière vente:</span>
                <span className="stat-value">{formatDate(product.lastSaleDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 