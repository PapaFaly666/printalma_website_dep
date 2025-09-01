// Types pour l'authentification et la gestion des comptes
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  role: 'admin' | 'client' | 'vendor';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token?: string; // Si vous utilisez des tokens JWT en plus des cookies
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Nouveaux types pour la gestion des clients par l'admin
export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  isLocked?: boolean;
  failedLoginAttempts?: number;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  password: string;
  confirmPassword: string;
}

export interface CreateClientResponse {
  client: Client;
  message: string;
}

export interface ClientsListResponse {
  clients: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClientStatItem {
  label: string;
  value: number;
  change?: number; // Variation en %
  changeType?: 'increase' | 'decrease' | 'stable';
}

export interface ClientsStatsResponse {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newThisMonth: number;
  stats: ClientStatItem[];
}

export interface ToggleClientStatusResponse {
  client: Client;
  message: string;
}

// Nouveaux types pour les vendeurs
export interface VendorInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  joinedAt: string;
  vendorType?: string;
  rating?: number;
  totalSales?: number;
}

export interface VendorsListResponse {
  vendors: VendorInfo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VendorStatItem {
  label: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
}

export interface VendorsStatsResponse {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  topPerformers: VendorInfo[];
  stats: VendorStatItem[];
}

// Nouveaux types pour la réinitialisation de mot de passe
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetTokenRequest {
  token: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  message: string;
  userEmail: string;
  userName: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  userEmail: string;
}

export interface CleanupResetTokensResponse {
  deletedCount: number;
} 