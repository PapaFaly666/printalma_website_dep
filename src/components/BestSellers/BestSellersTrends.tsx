import React, { useState, useEffect } from 'react';
import { fetchBestSellersTrends } from '../../services/bestSellersService';
import { TrendsData, TrendProduct, ConsistentSeller, EmergingTrend } from '../../types/bestSellers';

interface BestSellersTrendsProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const BestSellersTrends: React.FC<BestSellersTrendsProps> = ({
  className = '',
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes par défaut
}) => {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchBestSellersTrends();
      
      if (response.success && response.data) {
        setTrends(response.data);
        setLastUpdate(new Date());
      } else {
        setError('Erreur lors de la récupération des tendances');
      }
    } catch (error) {
      console.error('❌ [BestSellersTrends] Error:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchTrends, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0;
    return (
      <span className={`growth-rate ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '+' : ''}{rate.toFixed(1)}%
      </span>
    );
  };

  const getRankChangeIcon = (previous: number, current: number) => {
    if (current < previous) return '📈'; // Montée
    if (current > previous) return '📉'; // Descente
    return '➡️'; // Stable
  };

  if (loading && !trends) {
    return (
      <div className={`best-sellers-trends-loading ${className}`}>
        <div className="trends-skeleton">
          <div className="section-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-items">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-item"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !trends) {
    return (
      <div className={`best-sellers-trends-error ${className}`}>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={fetchTrends} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!trends) {
    return null;
  }

  return (
    <div className={`best-sellers-trends ${className}`}>
      {/* Header */}
      <div className="trends-header">
        <h3>📈 Analyse des Tendances</h3>
        {lastUpdate && (
          <span className="last-update">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            {loading && <span className="loading-indicator">🔄</span>}
          </span>
        )}
      </div>

      <div className="trends-content">
        {/* Produits en hausse */}
        {trends.risingProducts && trends.risingProducts.length > 0 && (
          <div className="trends-section rising-products">
            <div className="section-header">
              <h4>🚀 Produits en Hausse</h4>
              <span className="section-badge">{trends.risingProducts.length}</span>
            </div>
            <div className="products-list">
              {trends.risingProducts.slice(0, 5).map((product: TrendProduct) => (
                <div key={product.id} className="product-trend-item">
                  <div className="product-info">
                    <span className="rank-change">
                      {getRankChangeIcon(product.previousRank, product.currentRank)}
                    </span>
                    <div className="product-details">
                      <span className="product-name">{product.name}</span>
                      <span className="rank-info">
                        #{product.previousRank} → #{product.currentRank}
                      </span>
                    </div>
                  </div>
                  <div className="product-growth">
                    {formatGrowthRate(product.growthRate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendeurs consistants */}
        {trends.consistentSellers && trends.consistentSellers.length > 0 && (
          <div className="trends-section consistent-sellers">
            <div className="section-header">
              <h4>🎯 Vendeurs Consistants</h4>
              <span className="section-badge">{trends.consistentSellers.length}</span>
            </div>
            <div className="sellers-list">
              {trends.consistentSellers.slice(0, 5).map((seller: ConsistentSeller) => (
                <div key={seller.id} className="seller-item">
                  <div className="seller-info">
                    <span className="stability-icon">
                      {seller.stabilityScore >= 0.9 ? '🏆' : 
                       seller.stabilityScore >= 0.7 ? '🥈' : '🥉'}
                    </span>
                    <div className="seller-details">
                      <span className="seller-name">{seller.name}</span>
                      <span className="average-rank">Rang moyen: #{seller.averageRank.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="stability-score">
                    <div className="score-value">
                      {(seller.stabilityScore * 100).toFixed(0)}%
                    </div>
                    <div className="score-label">Stabilité</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tendances émergentes */}
        {trends.emergingTrends && trends.emergingTrends.length > 0 && (
          <div className="trends-section emerging-trends">
            <div className="section-header">
              <h4>✨ Tendances Émergentes</h4>
              <span className="section-badge">{trends.emergingTrends.length}</span>
            </div>
            <div className="trends-grid">
              {trends.emergingTrends.slice(0, 6).map((trend: EmergingTrend, index) => (
                <div key={trend.category} className="trend-card">
                  <div className="trend-category">{trend.category}</div>
                  <div className="trend-metrics">
                    <div className="trend-growth">
                      {formatGrowthRate(trend.growthRate)}
                    </div>
                    <div className="trend-products">
                      {trend.productCount} produits
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performers */}
        {trends.topPerformers && (
          <div className="trends-section top-performers">
            <div className="section-header">
              <h4>🏅 Top Performers</h4>
            </div>
            <div className="performers-grid">
              {trends.topPerformers.bestRevenue && (
                <div className="performer-card revenue">
                  <div className="performer-icon">💰</div>
                  <div className="performer-content">
                    <div className="performer-title">Meilleur Chiffre d'Affaires</div>
                    <div className="performer-name">{trends.topPerformers.bestRevenue.name}</div>
                    <div className="performer-value">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(trends.topPerformers.bestRevenue.revenue)}
                    </div>
                  </div>
                </div>
              )}

              {trends.topPerformers.bestVolume && (
                <div className="performer-card volume">
                  <div className="performer-icon">📦</div>
                  <div className="performer-content">
                    <div className="performer-title">Meilleur Volume</div>
                    <div className="performer-name">{trends.topPerformers.bestVolume.name}</div>
                    <div className="performer-value">
                      {new Intl.NumberFormat('fr-FR').format(trends.topPerformers.bestVolume.quantity)} unités
                    </div>
                  </div>
                </div>
              )}

              {trends.topPerformers.bestGrowth && (
                <div className="performer-card growth">
                  <div className="performer-icon">📊</div>
                  <div className="performer-content">
                    <div className="performer-title">Meilleure Croissance</div>
                    <div className="performer-name">{trends.topPerformers.bestGrowth.name}</div>
                    <div className="performer-value">
                      {formatGrowthRate(trends.topPerformers.bestGrowth.growth)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="trends-actions">
        <button 
          onClick={fetchTrends} 
          disabled={loading}
          className="refresh-button"
        >
          {loading ? '🔄 Actualisation...' : '🔄 Actualiser les Tendances'}
        </button>
      </div>
    </div>
  );
};

// Styles CSS
const styles = `
.best-sellers-trends {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.trends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.trends-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.last-update {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-indicator {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.trends-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.trends-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.section-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.products-list, .sellers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-trend-item, .seller-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.product-trend-item:hover, .seller-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-info, .seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-change, .stability-icon {
  font-size: 1.25rem;
}

.product-details, .seller-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name, .seller-name {
  font-weight: 500;
  color: #1f2937;
}

.rank-info, .average-rank {
  font-size: 0.75rem;
  color: #6b7280;
}

.product-growth {
  font-weight: 600;
}

.growth-rate.positive {
  color: #059669;
}

.growth-rate.negative {
  color: #dc2626;
}

.stability-score {
  text-align: right;
}

.score-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #059669;
}

.score-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.trend-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;
}

.trend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.trend-category {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  font-size: 1rem;
}

.trend-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-growth {
  font-size: 1.25rem;
  font-weight: 600;
}

.trend-products {
  font-size: 0.875rem;
  color: #6b7280;
}

.performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.performer-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.performer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.performer-card.revenue {
  border-left: 4px solid #10b981;
}

.performer-card.volume {
  border-left: 4px solid #3b82f6;
}

.performer-card.growth {
  border-left: 4px solid #8b5cf6;
}

.performer-icon {
  font-size: 2rem;
}

.performer-content {
  flex: 1;
}

.performer-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.performer-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  display: block;
}

.performer-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #059669;
}

.trends-actions {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  margin-top: 24px;
}

.refresh-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.best-sellers-trends-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dc2626;
}

.error-icon {
  font-size: 1.25rem;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.retry-button:hover {
  background: #b91c1c;
}

.trends-skeleton {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-skeleton {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 20px;
}

.skeleton-title {
  height: 20px;
  background: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 16px;
  width: 200px;
}

.skeleton-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-item {
  height: 60px;
  background: #e5e7eb;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .trends-grid {
    grid-template-columns: 1fr;
  }
  
  .performers-grid {
    grid-template-columns: 1fr;
  }
  
  .product-trend-item, .seller-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .product-growth, .stability-score {
    align-self: flex-end;
  }
}
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleId = 'best-sellers-trends-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
} 