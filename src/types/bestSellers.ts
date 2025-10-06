// 🏆 Types pour les meilleures ventes selon la nouvelle documentation API PrintAlma

export type BestSellersPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export interface BestSellersQueryParams {
  period?: BestSellersPeriod;
  limit?: number;
  offset?: number;
  vendorId?: number;
  categoryId?: number;
  minSales?: number;
}

// 🚀 NOUVEAU: Structure complète selon la documentation API
export interface BestSellerProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  uniqueCustomers: number;
  firstSaleDate: string;
  lastSaleDate: string;
  rank: number;
  vendor: {
    id: number;
    name: string;
    shopName: string;
    profilePhotoUrl?: string;
  };
  baseProduct: {
    id: number;
    name: string;
    categories: string[];
  };
  design: {
    id: number;
    name: string;
    cloudinaryUrl: string;
  };
  mainImage: string;
}

// 🔄 LEGACY: Maintenir la compatibilité avec l'ancien système
export interface RealBestSellerProduct {
  id: number;
  vendorProductId: number;
  productName: string;
  vendorName: string;
  businessName?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  firstSaleDate: Date;
  lastSaleDate: Date;
  uniqueCustomers: number;
  productImage?: string;
  category: string;
  vendorId: number;
  baseProductId: number;
  rank: number;
}

export interface BestSellersPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// 🚀 NOUVEAU: Statistiques enrichies selon la documentation
export interface BestSellersStats {
  totalBestSellers: number;
  totalRevenue: number;
  averageOrderValue: number;
  periodAnalyzed: string;
}

// 🚀 NOUVEAU: Informations de cache
export interface CacheInfo {
  cached: boolean;
  cacheAge: number;
}

// 🚀 NOUVEAU: Format de réponse standard API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: BestSellersPagination;
  stats?: BestSellersStats;
  cacheInfo?: CacheInfo;
  message?: string;
  error?: string;
}

export interface BestSellersResponse extends ApiResponse<BestSellerProduct[]> {}

// 📊 NOUVEAU: Types pour les statistiques rapides
export interface QuickStats {
  totalProducts: number;
  totalRevenue: number;
  averageOrderValue: number;
  topVendors: Array<{
    id: number;
    name: string;
    totalSales: number;
    productCount: number;
  }>;
  topCategories: Array<{
    name: string;
    totalSales: number;
    productCount: number;
  }>;
  periods: {
    day: { totalSales: number; productCount: number };
    week: { totalSales: number; productCount: number };
    month: { totalSales: number; productCount: number };
  };
}

export interface BestSellersStatsResponse extends ApiResponse<QuickStats> {}

// 📈 NOUVEAU: Types pour l'analyse des tendances
export interface TrendProduct {
  id: number;
  name: string;
  growthRate: number;
  previousRank: number;
  currentRank: number;
}

export interface ConsistentSeller {
  id: number;
  name: string;
  stabilityScore: number;
  averageRank: number;
}

export interface EmergingTrend {
  category: string;
  growthRate: number;
  productCount: number;
}

export interface TopPerformer {
  bestRevenue: { id: number; name: string; revenue: number };
  bestVolume: { id: number; name: string; quantity: number };
  bestGrowth: { id: number; name: string; growth: number };
}

export interface TrendsData {
  risingProducts: TrendProduct[];
  consistentSellers: ConsistentSeller[];
  emergingTrends: EmergingTrend[];
  topPerformers: TopPerformer;
}

export interface BestSellersTrendsResponse extends ApiResponse<TrendsData> {}

// 🏪 NOUVEAU: Types pour les vendeurs spécifiques
export interface VendorBestSellersResponse extends ApiResponse<BestSellerProduct[]> {}

// 🔐 NOUVEAU: Types pour les endpoints admin
export interface AdminDashboardOverview {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface AdminDashboardPerformance {
  topProducts: BestSellerProduct[];
  topVendors: Array<{
    id: number;
    name: string;
    totalSales: number;
    productCount: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    totalSales: number;
    productCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface AdminSystemHealth {
  cacheSize: number;
  lastUpdate: string;
  recommendations: string[];
}

export interface AdminDashboardData {
  overview: AdminDashboardOverview;
  performance: AdminDashboardPerformance;
  systemHealth: AdminSystemHealth;
}

export interface AdminDashboardResponse extends ApiResponse<AdminDashboardData> {}

export interface RecalculateStatsResponse extends ApiResponse<{
  message: string;
  estimatedDuration: string;
  affectedProducts: number;
  affectedOrders: number;
}> {}

export interface MarkBestSellersResponse extends ApiResponse<{
  message: string;
  period: string;
  criteria: {
    minSales: number;
    limit: number;
  };
  results: {
    markedProducts: number;
    topRevenue: number;
    topSales: number;
  };
}> {}

export interface CacheStatsData {
  cacheSize: number;
  keys: string[];
  memoryUsage: string;
  hitRate: number;
}

export interface CacheStatsResponse extends ApiResponse<CacheStatsData> {}

export interface CacheRefreshResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface PerformanceReportSummary {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface PerformanceReportTrends {
  growth: number;
  seasonality: string;
  predictions: any[];
}

export interface PerformanceReportData {
  summary: PerformanceReportSummary;
  topPerformers: {
    products: BestSellerProduct[];
    vendors: Array<{ id: number; name: string; totalSales: number }>;
    categories: Array<{ name: string; totalSales: number }>;
  };
  trends: PerformanceReportTrends;
  recommendations: string[];
}

export interface PerformanceReportResponse extends ApiResponse<PerformanceReportData> {}

// 🔄 LEGACY: État du hook useBestSellers (mis à jour)
export interface BestSellersState {
  data: BestSellerProduct[];
  loading: boolean;
  error: string | null;
  pagination: BestSellersPagination | null;
  stats: BestSellersStats | null;
  cacheInfo?: CacheInfo;
} 