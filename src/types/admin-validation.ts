// Types pour l'administration et la validation des produits WIZARD et traditionnels

export interface VendorProduct {
  id: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice?: number; // Optionnel car pas toujours présent
  vendorStock: number;
  status: 'PENDING' | 'DRAFT' | 'PUBLISHED';
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  postValidationAction: 'AUTO_PUBLISH' | 'TO_DRAFT';
  designCloudinaryUrl?: string;
  rejectionReason?: string;

  // ✅ Nouvelles propriétés pour distinction WIZARD/TRADITIONAL
  isWizardProduct: boolean;
  productType: 'WIZARD' | 'TRADITIONAL';
  hasDesign: boolean;
  adminValidated: boolean | null; // null = pas concerné, false = en attente, true = validé
  adminProductName?: string; // Nom du produit de base
  baseProduct?: {
    id: number;
    name: string;
  };

  // ✅ Images spécifiques pour produits WIZARD
  vendorImages?: Array<{
    id: number;
    imageType: 'base' | 'detail' | 'reference' | 'admin_reference';
    cloudinaryUrl: string;
    colorName?: string;
    colorCode?: string;
  }>;

  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shop_name?: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  productType?: 'ALL' | 'WIZARD' | 'TRADITIONAL';
  vendor?: string;
  status?: string;
}

export interface ProductStats {
  pending: number;
  validated: number;
  rejected: number;
  total: number;
  wizardProducts?: number; // Nombre de produits WIZARD
  traditionalProducts?: number; // Nombre de produits traditionnels
}

export interface AdminValidationResponse {
  success: boolean;
  message: string;
  data: {
    products: VendorProduct[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    stats: ProductStats;
  };
}

export interface ValidationRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  data?: {
    productId: number;
    status: string;
    action: string;
  };
}