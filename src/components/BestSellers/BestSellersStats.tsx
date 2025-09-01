import React, { useState, useEffect } from 'react';
import { fetchBestSellersStats } from '../../services/bestSellersService';
import { QuickStats } from '../../types/bestSellers';

interface BestSellersStatsProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

export const BestSellersStats: React.FC<BestSellersStatsProps> = ({
  className = '',
  showDetails = true,
  autoRefresh = false,
  refreshInterval = 60000 // 1 minute par défaut
}) => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchBestSellersStats();
      
      if (response.success && response.data) {
        setStats(response.data);
        setLastUpdate(new Date());
      } else {
        setError('Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('❌ [BestSellersStats] Error:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (loading && !stats) {
    return (
      <div className={`best-sellers-stats-loading ${className}`}>
        <div className="stats-skeleton">
          <div className="stat-card-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-value"></div>
          </div>
          <div className="stat-card-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-value"></div>
          </div>
          <div className="stat-card-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-value"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className={`best-sellers-stats-error ${className}`}>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={fetchStats} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`best-sellers-stats ${className}`}>
      {/* Header avec dernière mise à jour */}
      <div className="stats-header">
        <h3>📊 Statistiques des Best Sellers</h3>
        {lastUpdate && (
          <span className="last-update">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            {loading && <span className="loading-indicator">🔄</span>}
          </span>
        )}
      </div>

      {/* Statistiques principales */}
      <div className="main-stats-grid">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Revenus Totaux</div>
          </div>
        </div>

        <div className="stat-card products">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.totalProducts)}</div>
            <div className="stat-label">Best Sellers</div>
          </div>
        </div>

        <div className="stat-card average">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.averageOrderValue)}</div>
            <div className="stat-label">Panier Moyen</div>
          </div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Top Vendeurs */}
          {stats.topVendors && stats.topVendors.length > 0 && (
            <div className="top-vendors-section">
              <h4>🏪 Top Vendeurs</h4>
              <div className="vendors-list">
                {stats.topVendors.slice(0, 5).map((vendor, index) => (
                  <div key={vendor.id} className="vendor-item">
                    <span className="vendor-rank">#{index + 1}</span>
                    <span className="vendor-name">{vendor.name}</span>
                    <span className="vendor-sales">{formatCurrency(vendor.totalSales)}</span>
                    <span className="vendor-products">{vendor.productCount} produits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Catégories */}
          {stats.topCategories && stats.topCategories.length > 0 && (
            <div className="top-categories-section">
              <h4>📂 Top Catégories</h4>
              <div className="categories-list">
                {stats.topCategories.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="category-item">
                    <span className="category-rank">#{index + 1}</span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-sales">{formatCurrency(category.totalSales)}</span>
                    <span className="category-products">{category.productCount} produits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Évolution par période */}
          {stats.periods && (
            <div className="periods-section">
              <h4>📈 Évolution par Période</h4>
              <div className="periods-grid">
                <div className="period-card">
                  <div className="period-label">Dernières 24h</div>
                  <div className="period-sales">{formatCurrency(stats.periods.day.totalSales)}</div>
                  <div className="period-products">{stats.periods.day.productCount} produits</div>
                </div>
                
                <div className="period-card">
                  <div className="period-label">7 derniers jours</div>
                  <div className="period-sales">{formatCurrency(stats.periods.week.totalSales)}</div>
                  <div className="period-products">{stats.periods.week.productCount} produits</div>
                </div>
                
                <div className="period-card">
                  <div className="period-label">30 derniers jours</div>
                  <div className="period-sales">{formatCurrency(stats.periods.month.totalSales)}</div>
                  <div className="period-products">{stats.periods.month.productCount} produits</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="stats-actions">
        <button 
          onClick={fetchStats} 
          disabled={loading}
          className="refresh-button"
        >
          {loading ? '🔄 Actualisation...' : '🔄 Actualiser'}
        </button>
      </div>
    </div>
  );
};

// Styles CSS intégrés (à déplacer vers un fichier CSS séparé si nécessaire)
const styles = `
.best-sellers-stats {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.stats-header h3 {
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

.main-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.revenue {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
}

.stat-card.products {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
}

.stat-card.average {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
}

.stat-icon {
  font-size: 2rem;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.top-vendors-section, .top-categories-section {
  margin-bottom: 24px;
}

.top-vendors-section h4, .top-categories-section h4 {
  color: #1f2937;
  margin-bottom: 12px;
  font-size: 1.125rem;
}

.vendors-list, .categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vendor-item, .category-item {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.vendor-item:hover, .category-item:hover {
  background: #f3f4f6;
}

.vendor-rank, .category-rank {
  font-weight: 600;
  color: #6b7280;
}

.vendor-name, .category-name {
  font-weight: 500;
  color: #1f2937;
}

.vendor-sales, .category-sales {
  font-weight: 600;
  color: #059669;
}

.vendor-products, .category-products {
  font-size: 0.875rem;
  color: #6b7280;
}

.periods-section {
  margin-bottom: 24px;
}

.periods-section h4 {
  color: #1f2937;
  margin-bottom: 12px;
  font-size: 1.125rem;
}

.periods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.period-card {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.period-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 8px;
}

.period-sales {
  font-size: 1.25rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 4px;
}

.period-products {
  font-size: 0.75rem;
  color: #64748b;
}

.stats-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.refresh-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
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

.best-sellers-stats-error {
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
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.retry-button:hover {
  background: #b91c1c;
}

.stats-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card-skeleton {
  height: 80px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.skeleton-title, .skeleton-value {
  background: #e5e7eb;
  border-radius: 4px;
  height: 16px;
}

.skeleton-value {
  height: 24px;
  width: 60%;
}

@media (max-width: 640px) {
  .main-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .periods-grid {
    grid-template-columns: 1fr;
  }
  
  .vendor-item, .category-item {
    grid-template-columns: 30px 1fr;
    gap: 8px;
  }
  
  .vendor-sales, .category-sales,
  .vendor-products, .category-products {
    grid-column: 2;
    text-align: right;
  }
}
`;

// Injecter les styles dans le document
if (typeof document !== 'undefined') {
  const styleId = 'best-sellers-stats-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
} 