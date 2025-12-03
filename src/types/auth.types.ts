// Types d'authentification basés sur la documentation API
export enum VendeurType {
  DESIGNER = 'DESIGNER',
  INFLUENCEUR = 'INFLUENCEUR',
  ARTISTE = 'ARTISTE'
}

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'VENDEUR';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  vendeur_type: VendeurType | null;
  status: boolean;
  must_change_password?: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
  profile_photo_url?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  user: User;
  token?: string;
  jwt?: string;
  accessToken?: string;
  access_token?: string;
  cookie?: string;
  cookies?: string;
}

export interface LoginPasswordChangeRequiredResponse {
  mustChangePassword: true;
  userId: number;
  message: string;
}

export type LoginResponse = LoginSuccessResponse | LoginPasswordChangeRequiredResponse;

export interface AuthCheckResponse {
  isAuthenticated: boolean;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 🆕 NOUVEAU - Interface pour changement de mot de passe forcé
export interface ForceChangePasswordRequest {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  phone?: string;
  country?: string;
  address?: string;
  shopName?: string;
  profilePhoto?: File | null;
  commissionRate?: number;
}

export interface CreateClientResponse {
  message: string;
  user: User;
}

// ========== NOUVEAUX TYPES POUR GESTION AVANCÉE DES CLIENTS ==========

export interface ClientInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  role: UserRole;
  status: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until: string | null;
}

export interface ListClientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  vendeur_type?: VendeurType;
  sort_by?: 'created_at' | 'last_login_at' | 'firstName' | 'lastName';
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListClientsResponse {
  clients: ClientInfo[];
  pagination: PaginationInfo;
}

export interface ToggleClientStatusResponse {
  message: string;
  client: ClientInfo;
}

export type ClientStatusFilter = 'all' | 'active' | 'inactive';

// ========== NOUVEAUX TYPES POUR VENDEURS ==========

export interface VendorInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  created_at: string;
  last_login_at: string | null;
}

export interface VendorsListResponse {
  vendors: VendorInfo[];
  total: number;
  message: string;
}

export interface VendorStatItem {
  type: VendeurType;
  count: number;
  label: string;
  icon: string;
}

export interface VendorsStatsResponse {
  stats: VendorStatItem[];
  total: number;
  message: string;
}

// ========== CONFIGURATION DES TYPES DE VENDEURS ==========

export interface SellerTypeConfig {
  value: VendeurType;
  label: string;
  icon: string;
  description: string;
}

export const SELLER_TYPE_CONFIG: Record<VendeurType, SellerTypeConfig> = {
  [VendeurType.DESIGNER]: {
    value: VendeurType.DESIGNER,
    label: 'Designer',
    icon: '🎨',
    description: 'Spécialiste en création graphique et design visuel'
  },
  [VendeurType.INFLUENCEUR]: {
    value: VendeurType.INFLUENCEUR,
    label: 'Influenceur',
    icon: '📱',
    description: 'Expert en marketing digital et influence sociale'
  },
  [VendeurType.ARTISTE]: {
    value: VendeurType.ARTISTE,
    label: 'Artiste',
    icon: '🎭',
    description: 'Créateur d\'œuvres artistiques originales'
  }
};

// ========== FONCTIONS UTILITAIRES ==========

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getSellerTypeIcon = (type: VendeurType): string => {
  return SELLER_TYPE_CONFIG[type]?.icon || '👤';
};

export const getSellerTypeLabel = (type: VendeurType): string => {
  return SELLER_TYPE_CONFIG[type]?.label || type;
};

export const getClientStatusColor = (status: boolean): string => {
  return status ? 'success' : 'danger';
};

export const formatLastLoginDate = (date: string | null): string => {
  if (!date) return 'Jamais connecté';
  
  const loginDate = new Date(date);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'À l\'instant';
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInHours < 24 * 7) return `Il y a ${Math.floor(diffInHours / 24)} jours`;
  
  return loginDate.toLocaleDateString('fr-FR');
};

export const formatJoinDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export const isAdmin = (user: User | null): boolean => {
  return user ? ['ADMIN', 'SUPERADMIN'].includes(user.role) : false;
};

export const isSuperAdmin = (user: User | null): boolean => {
  return user ? user.role === 'SUPERADMIN' : false;
};

export const isVendeur = (user: User | null): boolean => {
  return user ? user.role === 'VENDEUR' : false;
};

// Type guards pour les réponses de login
export const isLoginSuccess = (response: LoginResponse): response is LoginSuccessResponse => {
  return 'user' in response;
};

export const isPasswordChangeRequired = (response: LoginResponse): response is LoginPasswordChangeRequiredResponse => {
  return 'mustChangePassword' in response;
};

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  mustChangePassword: boolean;
  loading: boolean;
  error: string | null;
}

// Métadonnées pour les types de vendeurs (conservé pour compatibilité)
export interface VendeurTypeMetadata {
  type: VendeurType;
  icon: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  features: string[];
}

export const VENDEUR_TYPE_METADATA: Record<VendeurType, VendeurTypeMetadata> = {
  [VendeurType.DESIGNER]: {
    type: VendeurType.DESIGNER,
    icon: '🎨',
    label: 'Designer',
    description: 'Création de designs graphiques et visuels',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    features: ['Outils de design', 'Templates', 'Galerie', 'Portfolio']
  },
  [VendeurType.INFLUENCEUR]: {
    type: VendeurType.INFLUENCEUR,
    icon: '📱',
    label: 'Influenceur',
    description: 'Promotion via réseaux sociaux et influence',
    color: 'text-gray-900',
    bgColor: 'bg-gray-100',
    features: ['Analytics', 'Codes promo', 'Marketing', 'Réseaux sociaux']
  },
  [VendeurType.ARTISTE]: {
    type: VendeurType.ARTISTE,
    icon: '🎭',
    label: 'Artiste',
    description: 'Création artistique et œuvres originales',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    features: ['Portfolio', 'Galerie d\'œuvres', 'Ventes d\'art', 'Expositions']
  }
};

// 🆕 NOUVEAUX TYPES POUR PROFIL VENDEUR ÉTENDU

export interface ExtendedVendorProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  phone?: string;
  country?: string;
  address?: string;
  shop_name?: string;
  profile_photo_url?: string;
  created_at: string;
  last_login_at?: string;
}

export interface ExtendedVendorProfileResponse {
  success: boolean;
  vendor: ExtendedVendorProfile;
  message: string;
}

export interface UpdateVendorProfileRequest {
  phone?: string;
  country?: string;
  address?: string;
  shop_name?: string;
  profilePhoto?: File | null;
}

export interface UpdateVendorProfileResponse {
  success: boolean;
  message: string;
  vendor: ExtendedVendorProfile;
}

// Statistiques vendeurs par pays
export interface VendorCountryStats {
  country: string;
  count: number;
  percentage: number;
}

export interface VendorStatsByCountryResponse {
  success: boolean;
  stats: VendorCountryStats[];
  total: number;
  message: string;
}

// Configuration des pays disponibles
export interface CountryOption {
  value: string;
  label: string;
  flag?: string;
}

export const COUNTRIES_LIST: CountryOption[] = [
  { value: 'France', label: 'France', flag: '🇫🇷' },
  { value: 'Belgique', label: 'Belgique', flag: '🇧🇪' },
  { value: 'Suisse', label: 'Suisse', flag: '🇨🇭' },
  { value: 'Canada', label: 'Canada', flag: '🇨🇦' },
  { value: 'Maroc', label: 'Maroc', flag: '🇲🇦' },
  { value: 'Tunisie', label: 'Tunisie', flag: '🇹🇳' },
  { value: 'Algérie', label: 'Algérie', flag: '🇩🇿' },
  { value: 'Sénégal', label: 'Sénégal', flag: '🇸🇳' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { value: 'Cameroun', label: 'Cameroun', flag: '🇨🇲' },
  { value: 'Mali', label: 'Mali', flag: '🇲🇱' },
  { value: 'Burkina Faso', label: 'Burkina Faso', flag: '🇧🇫' },
  { value: 'Niger', label: 'Niger', flag: '🇳🇪' },
  { value: 'Madagascar', label: 'Madagascar', flag: '🇲🇬' },
  { value: 'Maurice', label: 'Maurice', flag: '🇲🇺' },
  { value: 'Réunion', label: 'Réunion', flag: '🇷🇪' },
  { value: 'Guadeloupe', label: 'Guadeloupe', flag: '🇬🇵' },
  { value: 'Martinique', label: 'Martinique', flag: '🇲🇶' },
  { value: 'Guyane', label: 'Guyane', flag: '🇬🇫' },
  { value: 'États-Unis', label: 'États-Unis', flag: '🇺🇸' },
  { value: 'Royaume-Uni', label: 'Royaume-Uni', flag: '🇬🇧' },
  { value: 'Allemagne', label: 'Allemagne', flag: '🇩🇪' },
  { value: 'Espagne', label: 'Espagne', flag: '🇪🇸' },
  { value: 'Italie', label: 'Italie', flag: '🇮🇹' },
  { value: 'Portugal', label: 'Portugal', flag: '🇵🇹' },
  { value: 'Pays-Bas', label: 'Pays-Bas', flag: '🇳🇱' },
  { value: 'Suède', label: 'Suède', flag: '🇸🇪' },
  { value: 'Norvège', label: 'Norvège', flag: '🇳🇴' },
  { value: 'Danemark', label: 'Danemark', flag: '🇩🇰' },
  { value: 'Finlande', label: 'Finlande', flag: '🇫🇮' }
];

// Utilitaires pour validation des uploads
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Fichier trop volumineux. Taille maximale : 5MB'
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 