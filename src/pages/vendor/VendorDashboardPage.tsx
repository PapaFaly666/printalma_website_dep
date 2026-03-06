import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { VendorDashboardGuard } from '../../components/vendor/VendorDashboardGuard';
import { ProfileCompletionBanner } from '../../components/ProfileCompletionBanner';
import {
  Package,
  Image as ImageIcon,
  Eye,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { vendorProductService } from '../../services/vendorProductService';
import { vendorFundsService, VendorEarnings } from '../../services/vendorFundsService';
import { vendorStatsService, VendorStatsData, MonthlyRevenueData, RevenueStats as VendorRevenueStats } from '../../services/vendorStatsService';
import { ordersService, OrdersResponse } from '../../services/ordersService';
import vendorDesignRevenueService, { RevenueStats } from '../../services/vendorDesignRevenueService';

// Types pour les données financières depuis /orders/my-orders
interface DashboardFinances {
  // 💰 DONNÉES FINANCIÈRES PRINCIPALES (seulement les 3 métriques demandées)
  yearlyRevenue: number;      // CA annuel en FCFA (depuis statistics.annualRevenue)
  monthlyRevenue: number;     // CA mensuel en FCFA (depuis statistics.monthlyRevenue)
  availableAmount: number;    // Solde = total gains vendeur (depuis statistics.totalVendorAmount)
}

// Types pour les statistiques du dashboard - maintenant basées sur l'API /vendor/stats
interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  pendingProducts: number;
  totalValue: number;
  averagePrice: number;
  totalDesigns: number;
  publishedDesigns: number;
  draftDesigns: number;
  pendingDesigns: number;
  validatedDesigns: number;
  shopViews: number;
  totalOrders: number;
  averageCommissionRate: number;
  totalEarnings: number;
  pendingAmount: number;
  memberSince: string;
  lastLoginAt: string;
}

interface ChartData {
  name: string;
  value: number;
  change: number;
}

// Composant pour les courbes/graphiques simples
const MiniChart = ({ data, color = "#3b82f6" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range === 0 ? 50 : 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-16 w-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill={`url(#gradient-${color.replace('#', '')})`}
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    </div>
  );
};

// Composant pour les graphiques en barres circulaires
const CircularProgress = ({ value, max, color, size = 60 }: { value: number; max: number; color: string; size?: number }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size/2}
          cy={size/2}
          r="18"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size/2}
          cy={size/2}
          r="18"
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-gray-700">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

export const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finances, setFinances] = useState<DashboardFinances>({
    yearlyRevenue: 0,
    monthlyRevenue: 0,
    availableAmount: 0
  });
  
  // État pour les statistiques du dashboard - maintenant basées sur l'API /vendor/stats
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    pendingProducts: 0,
    totalValue: 0,
    averagePrice: 0,
    totalDesigns: 0,
    publishedDesigns: 0,
    draftDesigns: 0,
    validatedDesigns: 0,
    pendingDesigns: 0,
    shopViews: 0,
    totalOrders: 0,
    averageCommissionRate: 0,
    totalEarnings: 0,
    pendingAmount: 0,
    memberSince: '',
    lastLoginAt: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [extendedProfile, setExtendedProfile] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'connected' | 'partial' | 'offline'>('offline');

  // État pour les revenus des designs
  const [designRevenueStats, setDesignRevenueStats] = useState<RevenueStats | null>(null);
  const [designRevenueLoading, setDesignRevenueLoading] = useState(false);

  // État pour les données mensuelles
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenueData[]>([]);
  const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(false);

  // État pour les statistiques de revenus avec pourcentages
  const [revenueStats, setRevenueStats] = useState<VendorRevenueStats | null>(null);
  const [revenueStatsLoading, setRevenueStatsLoading] = useState(false);

  // Données pour les graphiques des vues
  const viewsData = [1200, 1350, 1100, 1450, 1600, 1800, 2100];

  // Données pour les revenus mensuels (graphique évolution)
  const monthlyRevenueChartData = monthlyRevenueData.length > 0
    ? monthlyRevenueData.map(m => m.revenue)
    : Array(7).fill(0);

  // Chargement des données des revenus des designs
  const loadDesignRevenueData = async () => {
    try {
      setDesignRevenueLoading(true);
      const revenueStats = await vendorDesignRevenueService.getRevenueStats('all');
      setDesignRevenueStats(revenueStats);
      console.log('✅ Statistiques de revenus des designs chargées:', revenueStats);
    } catch (error) {
      console.error('❌ Erreur chargement revenus des designs:', error);
      // Garder null en cas d'erreur
      setDesignRevenueStats(null);
    } finally {
      setDesignRevenueLoading(false);
    }
  };

  // Chargement des données mensuelles
  const loadMonthlyRevenueData = async () => {
    try {
      setMonthlyRevenueLoading(true);
      console.log('🔄 [Dashboard] Chargement des données mensuelles...');
      const monthlyData = await vendorStatsService.getMonthlyRevenue(7);
      console.log('✅ [Dashboard] Données mensuelles chargées:', monthlyData);

      if (monthlyData && Array.isArray(monthlyData)) {
        setMonthlyRevenueData(monthlyData);
      } else {
        console.warn('⚠️ [Dashboard] Données mensuelles invalides, utilisation de données vides');
        setMonthlyRevenueData([]);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erreur chargement données mensuelles:', error);
      // Garder un tableau vide en cas d'erreur
      setMonthlyRevenueData([]);
    } finally {
      setMonthlyRevenueLoading(false);
    }
  };

  // Chargement des statistiques de revenus avec pourcentages
  const loadRevenueStats = async () => {
    try {
      setRevenueStatsLoading(true);
      console.log('🔄 [Dashboard] Chargement des statistiques de revenus...');
      const stats = await vendorStatsService.getRevenueStats();
      console.log('✅ [Dashboard] Statistiques de revenus chargées:', stats);

      if (stats) {
        setRevenueStats(stats);
      } else {
        console.warn('⚠️ [Dashboard] Statistiques de revenus invalides');
        setRevenueStats(null);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erreur chargement statistiques de revenus:', error);
      setRevenueStats(null);
    } finally {
      setRevenueStatsLoading(false);
    }
  };

  // Chargement des données financières via /orders/my-orders (endpoint qui retourne les statistiques)
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Charger le profil étendu du vendeur
      const profileData = await authService.getExtendedVendorProfile();
      if (profileData.success) {
        setExtendedProfile(profileData.vendor);
      }

      // Charger les revenus des designs, données mensuelles et statistiques de revenus en parallèle
      loadDesignRevenueData();
      loadMonthlyRevenueData();
      loadRevenueStats();

      // 🎯 Utiliser /orders/my-orders qui retourne les statistiques financières
      console.log('🔄 Chargement des données financières depuis /orders/my-orders...');
      const ordersResponse: OrdersResponse = await ordersService.getMyOrders();

      console.log('💰 Données reçues depuis /orders/my-orders:', ordersResponse);
      console.log('📊 Statistiques:', ordersResponse.statistics);

      // ✅ Utiliser les statistiques de l'API /orders/my-orders
      const statistics = ordersResponse.statistics;
      const vendorFinances = ordersResponse.vendorFinances;
      const dashboardFinances: DashboardFinances = {
        yearlyRevenue: statistics?.annualRevenue || 0, // CA annuel depuis l'API
        monthlyRevenue: statistics?.monthlyRevenue || 0, // CA mensuel depuis l'API
        availableAmount: statistics?.totalVendorAmount || 0 // Solde = total gains vendeur (pas le disponible pour retrait)
      };

      setFinances(dashboardFinances);

      console.log('💰 Montants financiers:', {
        yearlyRevenue: dashboardFinances.yearlyRevenue,
        monthlyRevenue: dashboardFinances.monthlyRevenue,
        availableAmount: dashboardFinances.availableAmount,
        ordersCount: ordersResponse.orders.length
      });

      // 🎯 Utiliser les statistiques de /orders/my-orders pour les données de commandes
      const orderStats = statistics || {
        totalOrders: 0,
        totalCommission: 0,
        totalRevenue: 0,
        totalVendorAmount: 0
      };

      // 🎯 Charger les statistiques de produits/designs depuis /vendor/stats
      try {
        console.log('📊 Chargement des statistiques produits/designs depuis /vendor/stats...');
        const statsData = await vendorStatsService.getVendorStats();

        console.log('📊 Données statistiques reçues depuis /vendor/stats:', statsData);

        // ✅ Combiner les données de /orders/my-orders (commandes) et /vendor/stats (produits/designs)
        setStats({
          // Données produits depuis /vendor/stats
          totalProducts: statsData.totalProducts,
          publishedProducts: statsData.publishedProducts,
          draftProducts: statsData.draftProducts,
          pendingProducts: statsData.pendingProducts,
          totalValue: statsData.totalValue,
          averagePrice: statsData.averagePrice,
          totalDesigns: statsData.totalDesigns,
          publishedDesigns: statsData.publishedDesigns,
          draftDesigns: statsData.draftDesigns,
          pendingDesigns: statsData.pendingDesigns,
          validatedDesigns: statsData.validatedDesigns,
          shopViews: statsData.shopViews,

          // Données de commandes depuis /orders/my-orders
          totalOrders: orderStats.totalOrders || 0,
          averageCommissionRate: (orderStats.totalCommission && orderStats.totalRevenue)
            ? Math.round((orderStats.totalCommission / orderStats.totalRevenue) * 100)
            : 0,
          totalEarnings: orderStats.totalVendorAmount || 0,
          pendingAmount: vendorFinances?.pendingWithdrawalAmount || 0,

          memberSince: statsData.memberSince,
          lastLoginAt: statsData.lastLoginAt
        });

        console.log('✅ Statistiques combinées chargées avec succès');
        console.log('📈 Nombre de produits:', statsData.totalProducts);
        console.log('💰 Total earnings:', orderStats.totalVendorAmount);
        console.log('🛒 Commandes totales:', orderStats.totalOrders);

      } catch (error) {
        console.warn('⚠️ Erreur lors du chargement des statistiques depuis /vendor/stats:', error);
        // Utiliser les données de /orders/my-orders comme fallback
        setStats({
          totalProducts: 0,
          publishedProducts: 0,
          draftProducts: 0,
          pendingProducts: 0,
          totalValue: 0,
          averagePrice: 0,
          totalDesigns: 0,
          publishedDesigns: 0,
          draftDesigns: 0,
          pendingDesigns: 0,
          validatedDesigns: 0,
          shopViews: 0,
          totalOrders: orderStats.totalOrders || 0,
          averageCommissionRate: (orderStats.totalCommission && orderStats.totalRevenue)
            ? Math.round((orderStats.totalCommission / orderStats.totalRevenue) * 100)
            : 0,
          totalEarnings: orderStats.totalVendorAmount || 0,
          pendingAmount: vendorFinances?.pendingWithdrawalAmount || 0,
          memberSince: '',
          lastLoginAt: ''
        });
      }

      setApiStatus('connected');
      console.log('✅ Dashboard alimenté par /orders/my-orders pour les données financières');
      console.log('🔗 CA Annuel:', dashboardFinances.yearlyRevenue);
      console.log('🔗 CA Mensuel:', dashboardFinances.monthlyRevenue);
      console.log('🔗 Solde disponible:', dashboardFinances.availableAmount);

    } catch (error) {
      console.error('❌ Erreur chargement données financières depuis /orders/my-orders:', error);
      setApiStatus('offline');
      // Données par défaut en cas d'erreur (basées sur les données de pub.md)
      setStats({
        totalProducts: 9,
        publishedProducts: 5,
        draftProducts: 1,
        pendingProducts: 3,
        totalValue: 81000,
        averagePrice: 9000,
        totalDesigns: 4,
        publishedDesigns: 2,
        draftDesigns: 2,
        pendingDesigns: 1,
        validatedDesigns: 2,
        shopViews: 860,
        totalOrders: 0,
        averageCommissionRate: 10,
        totalEarnings: 2500000,
        pendingAmount: 250,
        memberSince: '2025-09-01T11:55:28.104Z',
        lastLoginAt: '2025-09-25T16:28:25.808Z'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const vendorName = user ? `${user.firstName} ${user.lastName}` : 'Vendeur';
  const shopName = extendedProfile?.shop_name || 'Mon Shop';

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* 🔔 Bannière de profil incomplet - S'affiche à chaque connexion tant que non complet */}
        <ProfileCompletionBanner
          onComplete={() => navigate('/vendeur/profile-setup')}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Tableau de bord
            </h1>
            <p className="text-gray-600 mt-1">
              Bonjour {vendorName}, bienvenue dans ton espace de gestion de votre boutique Printalma
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className={
                apiStatus === 'connected'
                  ? "bg-green-50 text-green-700 border-green-200"
                  : apiStatus === 'partial'
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                apiStatus === 'connected'
                  ? "bg-green-400"
                  : apiStatus === 'partial'
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}></div>
              {apiStatus === 'connected'
                ? "Connectée"
                : apiStatus === 'partial'
                ? "Connexion partielle"
                : "Mode hors ligne"
              }
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats principales - Seulement les 3 métriques demandées plus 3 autres */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* 1. Chiffre d'affaires annuel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'affaires annuel</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {revenueStatsLoading || loading ? '...' : `${(revenueStats?.annual.currentYearRevenue || 0).toLocaleString()} F`}
                </div>
                <div className={`flex items-center text-xs ${
                  (revenueStats?.annual.yearOverYearGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(revenueStats?.annual.yearOverYearGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  <span>
                    {revenueStatsLoading ? '...' : `${(revenueStats?.annual.yearOverYearGrowth || 0) >= 0 ? '+' : ''}${(revenueStats?.annual.yearOverYearGrowth || 0).toFixed(1)}% par rapport à l'année dernière`}
                  </span>
                </div>
                <div className="mt-4">
                  <MiniChart
                    data={revenueStats?.annual.monthlyData || Array(12).fill(0)}
                    color="#10b981"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. Chiffre d'affaires mensuel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'affaires mensuel</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {revenueStatsLoading || loading ? '...' : `${(revenueStats?.monthly.currentMonthRevenue || 0).toLocaleString()} F`}
                </div>
                <div className={`flex items-center text-xs ${
                  (revenueStats?.monthly.monthOverMonthGrowth || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {(revenueStats?.monthly.monthOverMonthGrowth || 0) >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  <span>
                    {revenueStatsLoading ? '...' : `${(revenueStats?.monthly.monthOverMonthGrowth || 0) >= 0 ? '+' : ''}${(revenueStats?.monthly.monthOverMonthGrowth || 0).toFixed(1)}% ce mois`}
                  </span>
                </div>
                <div className="mt-4">
                  <MiniChart
                    data={revenueStats?.monthly.weeklyData || Array(7).fill(0)}
                    color="#3b82f6"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 3. Solde (remplace Total restant) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solde</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {/* 🎯 Solde = total des gains vendeur depuis statistics.totalVendorAmount */}
                  {loading ? '...' : `${finances.availableAmount.toLocaleString()} F`}
                </div>
                <div className="flex items-center text-xs text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>Gains totaux</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Solde</span>
                    <span className="text-gray-700">{finances.availableAmount > 0 ? 'Disponible' : 'Vide'}</span>
                  </div>
                  <Progress value={finances.availableAmount > 0 ? 85 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 4. Nombre de produits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nombre de produits</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalProducts}
                </div>
                <div className="flex items-center text-xs text-purple-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+2 ce mois</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <CircularProgress value={stats.totalProducts} max={50} color="#8b5cf6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 5. Nombre de designs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nombre de designs</CardTitle>
                <ImageIcon className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalDesigns}
                </div>
                <div className="flex items-center text-xs text-indigo-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+3 ce mois</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <CircularProgress value={stats.totalDesigns} max={25} color="#6366f1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 6. Revenus des Designs - NOUVELLE CARTE CLIQUABLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate('/vendeur/design-revenues')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus des Designs</CardTitle>
                <Sparkles className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {designRevenueLoading || loading ? '...' : (designRevenueStats?.totalRevenue.toLocaleString() || '0') + ' F'}
                </div>
                <div className="flex items-center text-xs text-pink-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>Voir les détails →</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Utilisations</span>
                    <span className="text-gray-700 font-medium">{designRevenueStats?.totalUsages || 0}</span>
                  </div>
                  <Progress
                    value={designRevenueStats ? Math.min((designRevenueStats.totalUsages / 100) * 100, 100) : 0}
                    className="h-2"
                  />  
                </div>  
              </CardContent>
            </Card>
          </motion.div>

          {/* 7. Nombre de vues de la boutique */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vues de la boutique</CardTitle>
                <Eye className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.shopViews.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-orange-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+18.2% ce mois</span>
                </div>
                <div className="mt-4">
                  <MiniChart data={viewsData} color="#ea580c" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Section avec onglets - Analytiques restaurée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="analytics">Analytiques</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance des ventes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Produits publiés</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.publishedProducts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Brouillons</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.draftProducts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">En attente</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.pendingProducts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">Designs validés</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.validatedDesigns}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Designs en attente</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.pendingDesigns}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                          <span className="text-sm">Commandes traitées</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.totalOrders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                          <span className="text-sm">Commission moyenne</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : `${stats.averageCommissionRate}%`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          <span className="text-sm">Designs publiés</span>
                        </div>
                        <span className="font-medium">{loading ? '...' : stats.publishedDesigns}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Évolution mensuelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {monthlyRevenueLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        <div className="h-32">
                          <MiniChart data={monthlyRevenueChartData} color="#6366f1" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          {monthlyRevenueData.length > 0 ? (
                            monthlyRevenueData.map((item, index) => (
                              <span key={index}>{item.month}</span>
                            ))
                          ) : (
                            <>
                              <span>Jan</span>
                              <span>Fév</span>
                              <span>Mar</span>
                              <span>Avr</span>
                              <span>Mai</span>
                              <span>Jun</span>
                              <span>Jul</span>
                            </>
                          )}
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Revenus totaux</span>
                            <span className="text-gray-700 font-medium">
                              {monthlyRevenueData.length > 0
                                ? `${monthlyRevenueData[monthlyRevenueData.length - 1].revenue.toLocaleString()} F`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">├─ Produits</span>
                            <span className="text-gray-600 font-medium">
                              {monthlyRevenueData.length > 0
                                ? `${(monthlyRevenueData[monthlyRevenueData.length - 1].productRevenue || 0).toLocaleString()} F`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">└─ Designs</span>
                            <span className="text-pink-600 font-medium">
                              {monthlyRevenueData.length > 0
                                ? `${(monthlyRevenueData[monthlyRevenueData.length - 1].designRevenue || 0).toLocaleString()} F`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs border-t pt-2 mt-2">
                            <span className="text-gray-500">Commandes</span>
                            <span className="text-gray-700 font-medium">
                              {monthlyRevenueData.length > 0
                                ? monthlyRevenueData[monthlyRevenueData.length - 1].orders
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Usages designs</span>
                            <span className="text-pink-600 font-medium">
                              {monthlyRevenueData.length > 0
                                ? (monthlyRevenueData[monthlyRevenueData.length - 1].designUsages || 0)
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;