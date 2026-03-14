import React from 'react';
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
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { VendorStatsData, MonthlyRevenueData, RevenueStats as VendorRevenueStats } from '../../services/vendorStatsService';

// React Query Hooks pour le dashboard vendeur
import {
  useVendorStats,
  useMonthlyRevenue,
  useRevenueStats,
  useShopClicksHistory,
  useVendorFinances,
  useExtendedVendorProfile,
  useDesignRevenue
} from '../../hooks/vendor';

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

// Composant de skeleton pour les cartes KPI
const KpiCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
    <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
  </div>
);

export const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🔄 React Query Hooks - Gestion automatique du cache et des requêtes
  const statsQuery = useVendorStats();
  const monthlyRevenueQuery = useMonthlyRevenue(7);
  const revenueStatsQuery = useRevenueStats();
  const shopClicksQuery = useShopClicksHistory(7);
  const financesQuery = useVendorFinances();
  const profileQuery = useExtendedVendorProfile();
  const designRevenueQuery = useDesignRevenue();

  // État de chargement global
  const isLoading =
    statsQuery.isLoading ||
    monthlyRevenueQuery.isLoading ||
    revenueStatsQuery.isLoading ||
    financesQuery.isLoading ||
    profileQuery.isLoading;

  const isRefetching =
    statsQuery.isRefetching ||
    monthlyRevenueQuery.isRefetching ||
    revenueStatsQuery.isRefetching ||
    financesQuery.isRefetching ||
    profileQuery.isRefetching;

  // Statut API
  const apiStatus =
    statsQuery.error || financesQuery.error ? 'offline' :
    (isLoading ? 'offline' : 'connected');

  // Données avec valeurs par défaut
  const stats = statsQuery.data || {
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
  } as VendorStatsData;

  const finances = financesQuery.data || {
    yearlyRevenue: 0,
    monthlyRevenue: 0,
    availableAmount: 0
  };

  const monthlyRevenueData = monthlyRevenueQuery.data || [];
  const revenueStats = revenueStatsQuery.data || null;
  const shopClicksHistory = shopClicksQuery.data
    ? shopClicksQuery.data.map(h => h.clicks)
    : Array(7).fill(0);

  const extendedProfile = profileQuery.data || null;

  // Données pour les graphiques
  const monthlyRevenueChartData = monthlyRevenueData.length > 0
    ? monthlyRevenueData.map(m => m.revenue)
    : Array(7).fill(0);

  // Fonction pour tout rafraîchir
  const refetchAll = () => {
    statsQuery.refetch();
    monthlyRevenueQuery.refetch();
    revenueStatsQuery.refetch();
    shopClicksQuery.refetch();
    financesQuery.refetch();
    profileQuery.refetch();
    designRevenueQuery.refetch();
  };

  const vendorName = user ? `${user.firstName} ${user.lastName}` : 'Vendeur';
  const shopName = extendedProfile?.shop_name || 'Mon Shop';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* 🔔 Bannière de profil incomplet */}
        <ProfileCompletionBanner
          onComplete={() => navigate('/vendeur/profile-setup')}
        />

        {/* Header moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-6 py-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Tableau de bord
              </h1>
              <p className="text-gray-600 text-sm">
                Bonjour {vendorName}, bienvenue dans votre espace Printalma
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  apiStatus === 'connected'
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  apiStatus === 'connected' ? "bg-green-400" : "bg-red-400"
                }`}></div>
                {apiStatus === 'connected' ? "Connectée" : "Mode hors ligne"}
              </Badge>
              <button
                onClick={refetchAll}
                disabled={isLoading}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="px-6 pb-8 space-y-8">
          {/* Stats principales - 6 KPIs modernes */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* État de chargement */}
            {isLoading ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <>
                {/* 1. Chiffre d'affaires annuel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">CA Annuel</span>
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {revenueStats?.annual.currentYearRevenue
                        ? `${revenueStats.annual.currentYearRevenue.toLocaleString()} F`
                        : `${finances.yearlyRevenue.toLocaleString()} F`}
                    </div>
                    <div className="mt-3">
                      <MiniChart
                        data={revenueStats?.annual.monthlyData || Array(12).fill(0)}
                        color="#10b981"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* 2. Chiffre d'affaires mensuel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">CA Mensuel</span>
                      <div className="w-8 h-8 rounded-lg bg-[rgb(20,104,154)]/10 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-[rgb(20,104,154)]" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {revenueStats?.monthly.currentMonthRevenue
                        ? `${revenueStats.monthly.currentMonthRevenue.toLocaleString()} F`
                        : `${finances.monthlyRevenue.toLocaleString()} F`}
                    </div>
                    <div className="mt-3">
                      <MiniChart
                        data={revenueStats?.monthly.weeklyData || Array(7).fill(0)}
                        color="#14689a"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* 3. Solde */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Solde disponible</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {`${finances.availableAmount.toLocaleString()} F`}
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Statut</span>
                        <span className="text-gray-700">{finances.availableAmount > 0 ? 'Disponible' : 'Vide'}</span>
                      </div>
                      <Progress value={finances.availableAmount > 0 ? 85 : 0} className="h-2" />
                    </div>
                  </div>
                </motion.div>

                {/* 4. Nombre de produits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Produits</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalProducts}
                    </div>
                    <div className="mt-3 flex justify-center">
                      <CircularProgress value={stats.totalProducts} max={50} color="#8b5cf6" />
                    </div>
                  </div>
                </motion.div>

                {/* 5. Nombre de designs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Designs</span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalDesigns}
                    </div>
                    <div className="mt-3 flex justify-center">
                      <CircularProgress value={stats.totalDesigns} max={25} color="#6366f1" />
                    </div>
                  </div>
                </motion.div>

                {/* 6. Vues boutique */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Visites boutique</span>
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.shopViews.toLocaleString()}
                    </div>
                    <div className="mt-3">
                      <MiniChart data={shopClicksHistory} color="#ea580c" />
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Section analytique moderne */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Performance des ventes */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des ventes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Produits publiés</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.publishedProducts}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Brouillons</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.draftProducts}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-600">En attente</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.pendingProducts}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-600">Designs validés</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.validatedDesigns}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-600">Designs en attente</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.pendingDesigns}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span className="text-sm text-gray-600">Commandes traitées</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-sm text-gray-600">Commission moyenne</span>
                  </div>
                  <span className="font-semibold text-gray-900">{`${stats.averageCommissionRate}%`}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-sm text-gray-600">Designs publiés</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.publishedDesigns}</span>
                </div>
              </div>
            </div>

            {/* Évolution mensuelle */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution mensuelle</h3>
              {monthlyRevenueQuery.isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-[rgb(20,104,154)]" />
                </div>
              ) : (
                <>
                  <div className="h-32">
                    <MiniChart data={monthlyRevenueChartData} color="#14689a" />
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
                  <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenus totaux</span>
                      <span className="font-semibold text-gray-900">
                        {monthlyRevenueData.length > 0
                          ? `${monthlyRevenueData[monthlyRevenueData.length - 1].revenue.toLocaleString()} F`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">├─ Produits</span>
                      <span className="text-gray-700">
                        {monthlyRevenueData.length > 0
                          ? `${(monthlyRevenueData[monthlyRevenueData.length - 1].productRevenue || 0).toLocaleString()} F`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[rgb(20,104,154)]">└─ Designs</span>
                      <span className="font-semibold text-[rgb(20,104,154)]">
                        {monthlyRevenueData.length > 0
                          ? `${(monthlyRevenueData[monthlyRevenueData.length - 1].designRevenue || 0).toLocaleString()} F`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-600">Commandes</span>
                      <span className="font-semibold text-gray-900">
                        {monthlyRevenueData.length > 0
                          ? monthlyRevenueData[monthlyRevenueData.length - 1].orders
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usages designs</span>
                      <span className="font-semibold text-[rgb(20,104,154)]">
                        {monthlyRevenueData.length > 0
                          ? (monthlyRevenueData[monthlyRevenueData.length - 1].designUsages || 0)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
