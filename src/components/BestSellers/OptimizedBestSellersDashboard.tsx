import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Package, Users, Clock, Database, Zap } from 'lucide-react';
import { useQuickStats } from '../../hooks/useOptimizedBestSellers';

interface OptimizedBestSellersDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const OptimizedBestSellersDashboard: React.FC<OptimizedBestSellersDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 10 * 60 * 1000 // 10 minutes
}) => {
  const { stats, meta, loading, error, refresh, executionTime, dataSource } = useQuickStats(
    autoRefresh, 
    refreshInterval
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      allTime: '🏆 Tout temps',
      thisMonth: '📅 Ce mois',
      thisWeek: '📆 Cette semaine',
      today: '📍 Aujourd\'hui'
    };
    return labels[period as keyof typeof labels] || period;
  };

  const getPeriodIcon = (period: string) => {
    const icons = {
      allTime: TrendingUp,
      thisMonth: Package,
      thisWeek: Users,
      today: Zap
    };
    return icons[period as keyof typeof icons] || TrendingUp;
  };

  if (loading && !stats) {
    return (
      <div className={`optimized-dashboard-loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className={`optimized-dashboard-error ${className}`}>
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={refresh} className="retry-button">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`optimized-best-sellers-dashboard ${className}`}>
      {/* Header avec informations de performance */}
      <div className="dashboard-header">
        <div className="title-section">
          <h2>📊 Tableau de Bord - Meilleures Ventes</h2>
          <p className="subtitle">Système optimisé avec cache intelligent</p>
        </div>
        
        <div className="performance-info">
          <div className="perf-metric">
            <Clock className="w-4 h-4" />
            <span>{executionTime}ms</span>
          </div>
          <div className="perf-metric">
            <Database className="w-4 h-4" />
            <span>{dataSource}</span>
          </div>
          <button onClick={refresh} disabled={loading} className="refresh-btn">
            {loading ? '🔄 Actualisation...' : '🔄 Actualiser'}
          </button>
        </div>
      </div>

      {/* Grille des statistiques */}
      {stats && (
        <div className="stats-grid">
          {Object.entries(stats).map(([period, data]: [string, any], index) => {
            const Icon = getPeriodIcon(period);
            
            return (
              <motion.div
                key={period}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="stat-card"
              >
                <div className="card-header">
                  <div className="period-info">
                    <Icon className="w-5 h-5" />
                    <h3>{getPeriodLabel(period)}</h3>
                  </div>
                  
                  {data.totalProducts > 0 && (
                    <div className="trend-indicator positive">
                      <TrendingUp className="w-4 h-4" />
                      <span>Actif</span>
                    </div>
                  )}
                </div>

                <div className="stats-content">
                  <div className="primary-stats">
                    <div className="stat-item large">
                      <div className="stat-icon">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="stat-details">
                        <span className="stat-value">{formatNumber(data.totalProducts)}</span>
                        <span className="stat-label">Produits</span>
                      </div>
                    </div>

                    <div className="stat-item large">
                      <div className="stat-icon revenue">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div className="stat-details">
                        <span className="stat-value">{formatCurrency(data.totalRevenue)}</span>
                        <span className="stat-label">Revenus</span>
                      </div>
                    </div>
                  </div>

                  <div className="secondary-stats">
                    <div className="stat-row">
                      <span className="label">🏆 Top produit:</span>
                      <span className="value">{data.topProduct}</span>
                    </div>
                    <div className="stat-row">
                      <span className="label">👤 Top vendeur:</span>
                      <span className="value">{data.topVendor}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="dashboard-actions">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refresh}
          disabled={loading}
          className="action-button primary"
        >
          🔄 Actualiser les données
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button secondary"
          onClick={() => window.open('/best-sellers', '_blank')}
        >
          📊 Voir les détails
        </motion.button>
      </div>
    </div>
  );
};

// Styles CSS intégrés
const styles = `
.optimized-best-sellers-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  min-height: 400px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.title-section h2 {
  margin: 0 0 4px 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.performance-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.perf-metric {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  background: #f9fafb;
  padding: 6px 12px;
  border-radius: 6px;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.period-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.period-info h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.trend-indicator.positive {
  background: #d1fae5;
  color: #065f46;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.primary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item.large .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
}

.stat-icon.revenue {
  background: #10b981;
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.secondary-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-row .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-row .value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  text-align: right;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.primary {
  background: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background: #2563eb;
}

.action-button.secondary {
  background: white;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.action-button.secondary:hover {
  background: #3b82f6;
  color: white;
}

.optimized-dashboard-loading,
.optimized-dashboard-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-container,
.error-container {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.error-container h3 {
  margin: 0 0 8px 0;
  color: #dc2626;
}

.error-container p {
  margin: 0 0 16px 0;
  color: #6b7280;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-button:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .optimized-best-sellers-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .performance-info {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .primary-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .dashboard-actions {
    flex-direction: column;
    align-items: center;
  }
}
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleId = 'optimized-dashboard-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
} 