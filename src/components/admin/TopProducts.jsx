import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import analyticsService from '../../services/AnalyticsService';

const TopProducts = ({ products, loading = false }) => {
  if (loading) {
    return (
      <Card className="top-products">
        <CardHeader>
          <CardTitle>🏆 Top Produits</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="products-list">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="product-item loading">
                <div className="product-rank skeleton w-8 h-8"></div>
                <div className="product-info flex-1">
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-3 w-20"></div>
                </div>
                <div className="product-stats">
                  <div className="skeleton h-4 w-16 mb-1"></div>
                  <div className="skeleton h-3 w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="top-products">
        <CardHeader>
          <CardTitle>🏆 Top Produits</CardTitle>
          <CardDescription>Aucun produit trouvé pour cette période</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            Aucune donnée à afficher
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (index) => {
    switch(index) {
      case 0: return 'text-yellow-600'; // 🥇
      case 1: return 'text-gray-500';   // 🥈
      case 2: return 'text-amber-600';  // 🥉
      default: return 'text-blue-600';
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getTrendBadgeVariant = (growthRate) => {
    if (growthRate > 0) return 'default';
    if (growthRate < 0) return 'destructive';
    return 'secondary';
  };

  return (
    <Card className="top-products">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Top Produits
        </CardTitle>
        <CardDescription>
          Classement par revenus générés • {products.length} produit{products.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="products-list space-y-4">
          {products.map((product, index) => (
            <div key={product.productId} className="product-item">
              <div className={`product-rank ${getRankColor(index)}`}>
                {getRankIcon(index)}
              </div>
              
              <div className="product-info flex-1">
                <h4 className="product-name">{product.productName}</h4>
                <div className="product-meta">
                  <span className="category">{product.categoryName}</span>
                  {product.sku && (
                    <span className="sku">SKU: {product.sku}</span>
                  )}
                </div>
                <div className="product-details">
                  <span className="quantity">
                    {product.totalQuantity} unité{product.totalQuantity > 1 ? 's' : ''} vendues
                  </span>
                  {product.averagePrice && (
                    <span className="price">
                      Prix moyen: {analyticsService.formatCurrency(product.averagePrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="product-stats">
                <div className="revenue">
                  {analyticsService.formatCurrency(product.totalRevenue)}
                </div>
                <div className="orders">
                  {product.totalOrders} commande{product.totalOrders > 1 ? 's' : ''}
                </div>
                
                {product.growthRate !== undefined && product.growthRate !== null && (
                  <Badge 
                    variant={getTrendBadgeVariant(product.growthRate)}
                    className="trend-badge"
                  >
                    {analyticsService.getTrendIcon(product.growthRate)} 
                    {Math.abs(product.growthRate).toFixed(1)}%
                  </Badge>
                )}

                {product.profit && (
                  <div className="profit">
                    Profit: {analyticsService.formatCurrency(product.profit)}
                  </div>
                )}

                {product.profitMargin && (
                  <div className="profit-margin">
                    Marge: {product.profitMargin.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Résumé en bas */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Revenus totaux</div>
              <div className="font-semibold text-gray-900">
                {analyticsService.formatCurrency(
                  products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Commandes</div>
              <div className="font-semibold text-gray-900">
                {products.reduce((sum, p) => sum + (p.totalOrders || 0), 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Unités vendues</div>
              <div className="font-semibold text-gray-900">
                {products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Prix moyen</div>
              <div className="font-semibold text-gray-900">
                {analyticsService.formatCurrency(
                  products.reduce((sum, p) => sum + (p.averagePrice || 0), 0) / products.length
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProducts; 