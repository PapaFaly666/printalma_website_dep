import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { MonthlyRevenueData } from '../../types/dashboard';

interface MonthlyRevenueChartProps {
  data: MonthlyRevenueData[];
  isLoading?: boolean;
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data, isLoading }) => {
  // Formatter pour les valeurs en FCFA
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Formatter pour l'axe Y (plus compact)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Calculer la tendance
  const calculateTrend = () => {
    if (data.length < 2) return 0;
    const lastMonth = data[data.length - 1].revenue;
    const previousMonth = data[data.length - 2].revenue;
    if (previousMonth === 0) return 0;
    return ((lastMonth - previousMonth) / previousMonth) * 100;
  };

  const trend = calculateTrend();
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-900">
          <p className="font-bold text-gray-900 text-base mb-3">
            {data.month}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Chiffre d'affaires:</span>
              <span className="font-bold text-gray-900 text-base">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="h-px bg-gray-300"></div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Commandes:</span>
              <span className="font-semibold text-gray-900">{data.orderCount}</span>
            </div>
            <div className="h-px bg-gray-300"></div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">CA moyen/cmd:</span>
              <span className="font-semibold text-gray-900">
                {data.orderCount > 0 ? formatCurrency(data.revenue / data.orderCount) : '0 FCFA'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-300 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Évolution du Chiffre d'Affaires</CardTitle>
          <CardDescription className="text-gray-500">12 derniers mois</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-300 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">Évolution du Chiffre d'Affaires</CardTitle>
              <CardDescription className="text-gray-500">Performance mensuelle sur les 12 derniers mois</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50">
            {trend >= 0 ? (
              <TrendingUp className="w-5 h-5 text-gray-900" />
            ) : (
              <TrendingDown className="w-5 h-5 text-gray-900" />
            )}
            <span className="text-lg font-bold text-gray-900">
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-900 p-5 rounded-lg shadow-sm text-white">
            <p className="text-sm opacity-90 mb-1">CA Total (12 mois)</p>
            <p className="text-3xl font-bold">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-gray-100 border border-gray-300 p-5 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">CA Moyen par mois</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(averageRevenue)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#000000" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '11px', fontWeight: '500' }}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: '#374151' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '500' }}
              tickFormatter={formatYAxis}
              tick={{ fill: '#374151' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#000000', strokeWidth: 2, strokeDasharray: '5 5' }} />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '25px', fontWeight: '600' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Chiffre d'affaires (FCFA)"
              stroke="#000000"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyRevenueChart;
