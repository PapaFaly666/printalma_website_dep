import React from 'react';
import { RealBestSellerProduct } from '../../types/bestSellers';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import './BestSellerProductDetail.css';

interface BestSellerProductDetailProps {
  product: RealBestSellerProduct;
  onClose?: () => void;
  showModal?: boolean;
}

export const BestSellerProductDetail: React.FC<BestSellerProductDetailProps> = ({
  product,
  onClose,
  showModal = false
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const content = (
    <div className="product-detail-content">
      {/* En-tête avec rang et bouton de fermeture */}
      <div className="detail-header">
        <div className="rank-section">
          <div className={`rank-badge rank-${product.rank}`}>
            <span className="rank-number">{product.rank}</span>
            <span className="rank-icon">
              {product.rank === 1 ? '🥇' : product.rank === 2 ? '🥈' : product.rank === 3 ? '🥉' : '🏆'}
            </span>
          </div>
          <h1 className="product-title">{product.productName}</h1>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="detail-body">
        {/* Image et informations principales */}
        <div className="main-info-section">
          <div className="product-image-section">
            {product.productImage ? (
              <img 
                src={product.productImage} 
                alt={product.productName}
                className="product-detail-image"
              />
            ) : (
              <div className="placeholder-image-large">
                <span>🖼️</span>
                <p>Aucune image disponible</p>
              </div>
            )}
          </div>

          <div className="product-meta">
            <div className="vendor-info">
              <h3>Vendeur</h3>
              <p className="vendor-name">{product.vendorName}</p>
              {product.businessName && (
                <p className="business-name">{product.businessName}</p>
              )}
            </div>

            <div className="category-info">
              <h3>Catégorie</h3>
              <p className="category-tag">{product.category}</p>
            </div>

            <div className="product-ids">
              <div className="id-item">
                <span className="id-label">ID Produit:</span>
                <span className="id-value">{product.id}</span>
              </div>
              <div className="id-item">
                <span className="id-label">ID Vendeur:</span>
                <span className="id-value">{product.vendorProductId}</span>
              </div>
              <div className="id-item">
                <span className="id-label">ID Base:</span>
                <span className="id-value">{product.baseProductId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques de vente */}
        <div className="sales-stats-section">
          <h2>📊 Statistiques de Vente</h2>
          
          <div className="stats-grid">
            <div className="stat-item primary">
              <div className="stat-icon">🛒</div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(product.totalQuantitySold)}</div>
                <div className="stat-label">Quantité Vendue</div>
              </div>
            </div>

            <div className="stat-item primary">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(product.totalRevenue)}</div>
                <div className="stat-label">Revenus Totaux</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(product.averageUnitPrice)}</div>
                <div className="stat-label">Prix Moyen</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{formatNumber(product.uniqueCustomers)}</div>
                <div className="stat-label">Clients Uniques</div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations temporelles */}
        <div className="temporal-info-section">
          <h2>⏰ Informations Temporelles</h2>
          
          <div className="temporal-grid">
            <div className="temporal-item">
              <h4>Première Vente</h4>
              <p className="date-value">{formatDate(product.firstSaleDate)}</p>
              <p className="date-relative">({formatRelativeDate(product.firstSaleDate)})</p>
            </div>

            <div className="temporal-item">
              <h4>Dernière Vente</h4>
              <p className="date-value">{formatDate(product.lastSaleDate)}</p>
              <p className="date-relative">({formatRelativeDate(product.lastSaleDate)})</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-section">
          <button className="action-btn primary">
            Voir le Produit
          </button>
          <button className="action-btn secondary">
            Contacter le Vendeur
          </button>
          <button className="action-btn secondary">
            Partager
          </button>
        </div>
      </div>
    </div>
  );

  if (showModal) {
    return (
      <div className="product-detail-modal" onClick={handleBackdropClick}>
        {content}
      </div>
    );
  }

  return (
    <div className="product-detail-standalone">
      {content}
    </div>
  );
};

// Fonction utilitaire pour formater les dates relatives
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Il y a ${months} mois`;
  
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
} 