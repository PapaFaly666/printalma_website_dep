// Types pour les données du dashboard superadmin

export interface VendorInfo {
  vendorId: number;
  vendorName: string;
  shopName: string;
  email: string;
  vendorType: string;
  commissionRate: number;
  profileImage: string | null;
}

export interface TopVendorByRevenue extends VendorInfo {
  totalRevenue: number;
}

export interface TopVendorBySales extends VendorInfo {
  totalSales: number;
}

export interface TopVendorByProducts extends VendorInfo {
  totalProducts: number;
}

export interface TopVendors {
  byRevenue: TopVendorByRevenue[];
  bySales: TopVendorBySales[];
  byProducts: TopVendorByProducts[];
}

export interface FinancialStats {
  totalPlatformRevenue: number;
  thisMonthPlatformRevenue: number;
  totalVendorEarnings: number;
  thisMonthVendorEarnings: number;
  pendingPayouts: number;
  availableForPayout: number;
  averageCommissionRate: number;
  totalAdminGains: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  thisYearRevenue: number;
}

export interface VendorsByType {
  designers: number;
  influencers: number;
  artists: number;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  suspendedVendors: number;
  vendorsByType: VendorsByType;
  newVendorsThisMonth: number;
}

export interface ProductAwaitingValidation {
  id: number;
  name: string;
  vendorId: number;
  vendorName: string;
  submittedAt: string;
  thumbnailUrl: string;
  category?: string;
}

export interface ProductStats {
  totalProducts: number;
  publishedProducts: number;
  pendingProducts: number;
  draftProducts: number;
  rejectedProducts: number;
  productsAwaitingValidation: ProductAwaitingValidation[];
}

export interface DesignAwaitingValidation {
  id: number;
  name: string;
  price: number;
  vendorId: number;
  vendorName: string;
  shopName: string;
  submittedAt: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
}

export interface DesignStats {
  totalDesigns: number;
  publishedDesigns: number;
  pendingDesigns: number;
  draftDesigns: number;
  validatedDesigns: number;
  designsAwaitingValidation: DesignAwaitingValidation[];
  totalDesignUsage: number;
  thisMonthDesignUsage: number;
}

export interface OrderStats {
  totalOrders: number;
  thisMonthOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  thisMonthRevenue: number;
}

export interface FundRequest {
  id: number;
  vendorId: number;
  vendorName: string;
  amount: number;
  requestedAt: string;
  status: string;
}

export interface PendingFundRequests {
  count: number;
  totalAmount: number;
  requests: FundRequest[];
}

export interface DashboardData {
  currentMonth: string;
  currentMonthNumber: number;
  currentYear: number;
  financialStats: FinancialStats;
  vendorStats: VendorStats;
  topVendors: TopVendors;
  productStats: ProductStats;
  designStats: DesignStats;
  orderStats: OrderStats;
  pendingFundRequests: PendingFundRequests;
}
