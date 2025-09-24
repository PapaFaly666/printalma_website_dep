// Types communs de validation (designs, produits, produits vendeur)

export enum DesignStatus {
  ALL = 'ALL',
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED'
}

export enum ProductStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT'
}

// Nouveau enum pour les statuts VendorProduct étendu
export enum VendorProductStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED'
}

export interface DesignWithValidation {
  id: number;
  name: string;
  description?: string;
  category: string;
  imageUrl: string;
  price: number;
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  validator?: {
    id: number; 
    firstName: string; 
    lastName: string;
  };
  associatedProducts?: number; // Nombre de VendorProducts associés
}

export interface ProductWithValidation {
  id: number;
  name: string;
  description?: string;
  price: number;
  designId?: number;
  designName?: string;
  vendorId: number;
  vendorName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  validatedAt?: string;
  rejectionReason?: string;
  images?: string[];
  baseProductId: number;

  // ✅ Support pour produits WIZARD
  isWizardProduct?: boolean;
  productType?: 'WIZARD' | 'TRADITIONAL';
  hasDesign?: boolean;
  vendorImages?: Array<{
    id: number;
    imageType: 'base' | 'detail' | 'admin_reference';
    cloudinaryUrl: string;
    colorName?: string;
    colorCode?: string;
  }>;
  adminProductName?: string;
  baseProduct?: {
    id: number;
    name: string;
  };
  vendor?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shop_name?: string;
  };
}

export interface VendorProductWithValidation {
  id: number;
  vendorName: string;
  vendorDescription?: string;
  price: number;
  status: VendorProductStatus;
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  // Informations sur le design associé
  designValidationStatus?: {
    isValidated: boolean;
    isPending: boolean;
    rejectionReason?: string;
    validatedAt?: string;
    designId?: number;
    designName?: string;
  };
  
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  baseProduct: {
    id: number;
    name: string;
    categories: Array<{ id: number; name: string }>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  productId?: number;
  designId?: number;
  validatedAt?: string;
  rejectionReason?: string;
  affectedProducts?: number; // Nombre de produits affectés par la validation
  newStatus?: VendorProductStatus;
}

export interface DesignValidationStatus {
  id: number;
  name: string;
  isValidated: boolean;
  isPending: boolean;
  isDraft: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  associatedProducts: number;
  validator?: { firstName: string; lastName: string; };
}

// Nouveaux types pour la synchronisation Design ↔ VendorProduct
export interface DesignValidationSyncRequest {
  designId: number;
  isValidated: boolean;
  rejectionReason?: string;
  validatorNote?: string;
  syncedAt: string;
}

export interface DesignValidationSyncResponse {
  success: boolean;
  affectedProducts: number;
  newStatus: VendorProductStatus;
  products: VendorProductWithValidation[];
  message: string;
}

// Types pour les statistiques de validation
export interface ValidationStats {
  totalDesigns: number;
  pendingValidation: number;
  validated: number;
  rejected: number;
  draft: number;
  avgValidationTime: number; // en heures
  todaySubmissions: number;
  
  // Stats pour les VendorProducts
  vendorProductStats?: {
    totalProducts: number;
    validatedProducts: number;
    pendingProducts: number;
    draftProducts: number;
  };
}

// Types pour les filtres de recherche avancée
export interface ValidationFilters {
  page?: number;
  limit?: number;
  search?: string;
  validationStatus?: 'PENDING' | 'VALIDATED' | 'DRAFT' | 'ALL';
  designValidation?: 'VALIDATED' | 'PENDING' | 'REJECTED' | 'ALL';
  vendorId?: number;
  sortBy?: 'submittedAt' | 'createdAt' | 'price' | 'validatedAt';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

// Types pour les notifications de validation
export interface ValidationNotification {
  id: number;
  type: 'DESIGN_VALIDATED' | 'DESIGN_REJECTED' | 'DESIGN_SUBMITTED' | 'PRODUCTS_SYNCED';
  designId: number;
  designName: string;
  vendorId: number;
  adminId?: number;
  message: string;
  affectedProducts?: number;
  createdAt: string;
  isRead: boolean;
}

// Types pour l'historique de validation
export interface ValidationHistory {
  id: number;
  designId: number;
  designName: string;
  vendorId: number;
  validatorId: number;
  action: 'SUBMITTED' | 'VALIDATED' | 'REJECTED' | 'RESUBMITTED';
  previousStatus?: DesignStatus;
  newStatus: DesignStatus;
  rejectionReason?: string;
  validatorNote?: string;
  affectedProducts: number;
  createdAt: string;
  
  vendor: { firstName: string; lastName: string; email: string; };
  validator: { firstName: string; lastName: string; };
} 