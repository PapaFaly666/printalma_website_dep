// Types pour l'administration et la validation des produits WIZARD et traditionnels

export interface VendorProduct {
  id: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
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
  adminProductName?: string; // Nom du produit de base
  baseProduct?: {
    id: number;
    name: string;
  };

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
  wizardCount?: number;
  traditionalCount?: number;
}

export interface AdminValidationResponse {
  success: boolean;
  message: string;
  data: {
    products: VendorProduct[];
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