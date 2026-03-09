import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import {
  TrendingUp,
  Loader2,
  DollarSign,
  Users,
  Package,
  Palette,
  ShoppingCart,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { DashboardData, MonthlyRevenueData } from '../types/dashboard';
import MonthlyRevenueChart from '../components/admin/MonthlyRevenueChart';
import '../styles/admin/dashboard.css';

const Dashboard = () => {
  // Fetch dashboard data using React Query
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['adminDashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 60000, // Rafraîchir toutes les 60 secondes
  });

  // Fetch monthly revenue data
  const { data: monthlyRevenueData, isLoading: isLoadingMonthlyRevenue } = useQuery<MonthlyRevenueData[]>({
    queryKey: ['monthlyRevenue'],
    queryFn: () => dashboardService.getMonthlyRevenue(),
    refetchInterval: 60000, // Rafraîchir toutes les 60 secondes
  });

  // Formatter pour les valeurs en FCFA
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  // Formatter compact pour les grands nombres
  const formatCompactNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Affichage de l'état de chargement
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
        <p className="mt-6 text-gray-600 font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white">
        <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-900">
          <p className="text-gray-900 font-semibold text-lg">Erreur de chargement</p>
          <p className="text-gray-600 mt-2">Veuillez réessayer plus tard.</p>
        </div>
      </div>
    );
  }

  // Si pas de données, afficher un message
  if (!dashboardData) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Aucune donnée disponible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {dashboardData.currentMonth} {dashboardData.currentYear}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-300">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-900" />
                <span className="text-sm font-medium text-gray-900">En ligne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Simple Design */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* CA Annuel */}
          <Card className="dashboard-card border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">CA Annuel</CardTitle>
              <div className="p-2 bg-gray-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-gray-900" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{formatCompactNumber(dashboardData.financialStats.thisYearRevenue)} FCFA</div>
              <p className="text-xs text-gray-500 mt-2">Chiffre d'affaires 2026</p>
            </CardContent>
          </Card>

          {/* CA Mensuel */}
          <Card className="dashboard-card border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">CA Mensuel</CardTitle>
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-900" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{formatCompactNumber(dashboardData.financialStats.thisMonthRevenue)} FCFA</div>
              <p className="text-xs text-gray-500 mt-2">Ce mois</p>
            </CardContent>
          </Card>

          {/* Vendeurs */}
          <Card className="dashboard-card border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vendeurs</CardTitle>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-900" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.totalVendors}</div>
              <p className="text-xs text-gray-500 mt-2">+{dashboardData.vendorStats.newVendorsThisMonth} ce mois</p>
            </CardContent>
          </Card>

          {/* Commandes */}
          <Card className="dashboard-card border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes</CardTitle>
              <div className="p-2 bg-gray-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-gray-900" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dashboardData.orderStats.totalOrders}</div>
              <p className="text-xs text-gray-500 mt-2">{dashboardData.orderStats.thisMonthOrders} ce mois</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Produits Card */}
          <Card className="border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Produits</CardTitle>
                  <CardDescription className="text-gray-500">Statut des produits vendeurs</CardDescription>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold text-lg text-gray-900">{dashboardData.productStats.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Publiés</span>
                  <span className="font-semibold text-gray-900">{dashboardData.productStats.publishedProducts}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">En attente</span>
                  <span className="font-semibold text-gray-900">{dashboardData.productStats.productsAwaitingValidation.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Designs Card */}
          <Card className="border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Designs</CardTitle>
                  <CardDescription className="text-gray-500">Créations des vendeurs</CardDescription>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Palette className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold text-lg text-gray-900">{dashboardData.designStats.totalDesigns}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Publiés</span>
                  <span className="font-semibold text-gray-900">{dashboardData.designStats.publishedDesigns}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">En attente</span>
                  <span className="font-semibold text-gray-900">{dashboardData.designStats.designsAwaitingValidation.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques Financières */}
          <Card className="border border-gray-300 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900">Finances</CardTitle>
                  <CardDescription className="text-gray-500">Revenus et commissions</CardDescription>
                </div>
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  <DollarSign className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Gains Admin</span>
                  <span className="font-bold text-gray-900 text-sm">{formatCompactNumber(dashboardData.financialStats.totalAdminGains)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Revenus vendeurs</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatCompactNumber(dashboardData.financialStats.thisMonthVendorEarnings)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Commission moy.</span>
                  <span className="font-semibold text-gray-900 text-sm">{(dashboardData.financialStats.averageCommissionRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique d'évolution du CA */}
        <MonthlyRevenueChart
          data={monthlyRevenueData || []}
          isLoading={isLoadingMonthlyRevenue}
        />

        {/* Commandes & Meilleurs Vendeurs */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Statistiques Commandes - 2 colonnes */}
          <Card className="lg:col-span-2 border border-gray-300 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">Statistiques Commandes</CardTitle>
                  <CardDescription className="text-gray-500">Suivi des commandes par statut</CardDescription>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.totalOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Ce mois</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.thisMonthOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.pendingOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Confirmées</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.confirmedOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Traitement</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.processingOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Expédiées</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.shippedOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Livrées</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.deliveredOrders}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Annulées</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.orderStats.cancelledOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meilleurs Vendeurs - 1 colonne */}
          <Card className="border border-gray-300 shadow-sm bg-gray-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white border border-gray-300 rounded-lg">
                  <Users className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">Top Vendeurs</CardTitle>
                  <CardDescription className="text-xs text-gray-500">Par nombre de produits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.topVendors.byProducts.slice(0, 5).map((vendor, index) => (
                  <div
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    key={vendor.vendorId}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-gray-300">
                        {vendor.profileImage ? (
                          <img src={vendor.profileImage} alt={vendor.vendorName} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                            {vendor.vendorName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                      <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{vendor.vendorName}</p>
                      <p className="text-xs text-gray-500 truncate">{vendor.shopName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{vendor.totalProducts}</p>
                      <p className="text-xs text-gray-500">produits</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques Vendeurs */}
        <Card className="border border-gray-300 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Répartition des Vendeurs</CardTitle>
                <CardDescription className="text-gray-500">Statut et types de vendeurs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.activeVendors}</p>
                <p className="text-sm text-gray-600 mt-1">Actifs</p>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.inactiveVendors}</p>
                <p className="text-sm text-gray-600 mt-1">Inactifs</p>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.suspendedVendors}</p>
                <p className="text-sm text-gray-600 mt-1">Suspendus</p>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.vendorsByType.designers}</p>
                <p className="text-sm text-gray-600 mt-1">Designers</p>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.vendorsByType.influencers}</p>
                <p className="text-sm text-gray-600 mt-1">Influenceurs</p>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{dashboardData.vendorStats.vendorsByType.artists}</p>
                <p className="text-sm text-gray-600 mt-1">Artistes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;