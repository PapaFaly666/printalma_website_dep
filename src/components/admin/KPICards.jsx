import React from 'react';
import { Card, CardContent } from '../ui/card';
import analyticsService from '../../services/AnalyticsService';

const KPICards = ({ overview, loading = false }) => {
  if (loading) {
    return (
      <div className="kpi-cards">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="kpi-card loading">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="kpi-icon-skeleton"></div>
              <div className="flex-1">
                <div className="skeleton h-4 w-20 mb-2"></div>
                <div className="skeleton h-8 w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="kpi-cards">
        <Card className="kpi-card">
          <CardContent className="flex items-center justify-center p-6">
            <span className="text-gray-500">Aucune donnée disponible</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Revenus Total',
      value: analyticsService.formatCurrency(overview.totalRevenue || 0),
      change: overview.growthRate?.revenue,
      icon: '💰',
      color: 'green',
      description: 'Chiffre d\'affaires total'
    },
    {
      title: 'Commandes',
      value: analyticsService.formatNumber(overview.totalOrders || 0),
      change: overview.growthRate?.orders,
      icon: '📦',
      color: 'blue',
      description: 'Nombre total de commandes'
    },
    {
      title: 'Panier Moyen',
      value: analyticsService.formatCurrency(overview.averageOrderValue || 0),
      icon: '🛒',
      color: 'purple',
      description: 'Valeur moyenne par commande'
    },
    {
      title: 'Aujourd\'hui',
      value: analyticsService.formatCurrency(overview.revenueToday || 0),
      subValue: `${overview.ordersToday || 0} commande${(overview.ordersToday || 0) > 1 ? 's' : ''}`,
      icon: '📅',
      color: 'orange',
      description: 'Revenus du jour'
    }
  ];

  return (
    <div className="kpi-cards">
      {kpis.map((kpi, index) => (
        <Card key={index} className={`kpi-card ${kpi.color}`}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="kpi-icon" title={kpi.description}>
              {kpi.icon}
            </div>
            <div className="kpi-content flex-1">
              <h3 className="kpi-title">{kpi.title}</h3>
              <div className="kpi-value">{kpi.value}</div>
              {kpi.subValue && (
                <div className="kpi-sub-value">{kpi.subValue}</div>
              )}
              {kpi.change !== undefined && kpi.change !== null && (
                <div className={`kpi-change ${analyticsService.getTrendClass(kpi.change)}`}>
                  {analyticsService.getTrendIcon(kpi.change)} {Math.abs(kpi.change).toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards; 