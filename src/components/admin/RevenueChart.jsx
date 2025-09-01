import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import analyticsService from '../../services/AnalyticsService';

const RevenueChart = ({ data, period = '30d', loading = false }) => {
  if (loading) {
    return (
      <Card className="revenue-chart">
        <CardHeader>
          <CardTitle>📈 Évolution des Revenus</CardTitle>
          <CardDescription>Chargement des données...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="chart-skeleton">
            <div className="skeleton h-64 w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="revenue-chart">
        <CardHeader>
          <CardTitle>📈 Évolution des Revenus</CardTitle>
          <CardDescription>Aucune donnée disponible pour la période sélectionnée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            Aucune donnée à afficher
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    switch(period) {
      case '7d':
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      case '30d':
        return date.getDate();
      case '90d':
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      case '365d':
        return date.toLocaleDateString('fr-FR', { month: 'short' });
      default:
        return date.toLocaleDateString('fr-FR');
    }
  };

  const formatTooltip = (value, name, props) => {
    if (name === 'revenue') {
      return [analyticsService.formatCurrency(value), 'Revenus'];
    }
    if (name === 'orders') {
      return [value, 'Commandes'];
    }
    if (name === 'averageOrderValue') {
      return [analyticsService.formatCurrency(value), 'Panier moyen'];
    }
    return [value, name];
  };

  const formatTooltipLabel = (label) => {
    return new Date(label).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const maxRevenue = Math.max(...data.map(item => item.revenue || 0));
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const averageRevenue = totalRevenue / data.length;

  return (
    <Card className="revenue-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Évolution des Revenus
        </CardTitle>
        <CardDescription>
          Total: {analyticsService.formatCurrency(totalRevenue)} • 
          Moyenne: {analyticsService.formatCurrency(averageRevenue)} • 
          Maximum: {analyticsService.formatCurrency(maxRevenue)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => analyticsService.formatCurrency(value)}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Métriques supplémentaires */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500">Commandes totales</div>
            <div className="text-lg font-semibold text-gray-900">
              {data.reduce((sum, item) => sum + (item.orders || 0), 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Panier moyen</div>
            <div className="text-lg font-semibold text-gray-900">
              {analyticsService.formatCurrency(
                data.reduce((sum, item) => sum + (item.averageOrderValue || 0), 0) / data.length
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Jours actifs</div>
            <div className="text-lg font-semibold text-gray-900">
              {data.filter(item => (item.orders || 0) > 0).length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart; 