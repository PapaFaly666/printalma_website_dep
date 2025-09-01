// Types pour le système de validation en cascade design → produits V3

export type VendorProductStatus = 'PENDING' | 'DRAFT' | 'PUBLISHED';

// Enum pour PostValidationAction (compatibilité + nouvelle implémentation)
export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

export enum ProductStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT'
}

// DTO pour la structure du produit
export interface ProductStructureDto {
  // Structure du produit de base (à adapter selon votre implémentation)
  [key: string]: any;
}

// DTO pour les couleurs sélectionnées
export interface SelectedColorDto {
  id: number;
  name: string;
  hexCode: string;
  // autres propriétés selon votre implémentation
}

// DTO pour les tailles sélectionnées
export interface SelectedSizeDto {
  id: number;
  name: string;
  // autres propriétés selon votre implémentation
}

// DTO principal pour créer un produit vendeur
export interface VendorPublishDto {
  baseProductId: number;
  productStructure: ProductStructureDto;
  vendorPrice: number;
  vendorName: string;
  vendorDescription: string;
  vendorStock: number;
  selectedColors: SelectedColorDto[];
  selectedSizes: SelectedSizeDto[];
  finalImagesBase64: { design: string };
  // optionnels
  forcedStatus?: 'PENDING' | 'DRAFT';
  postValidationAction?: PostValidationAction;
}

// DTO de réponse après création de produit
export interface VendorPublishResponseDto {
  success: boolean;
  productId: number;
  message: string;
  status: VendorProductStatus;
  needsValidation: boolean;
  imagesProcessed: number;
  structure: 'admin_product_preserved';
  designUrl?: string; // Cloudinary
  designId?: number;  // ID du design créé / utilisé
}

export interface VendorProduct {
  id: number;
  name: string;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  status: VendorProductStatus;
  isValidated: boolean;
  postValidationAction: PostValidationAction;
  validatedAt?: string;
  validatedBy?: number;
  designCloudinaryUrl?: string;
  designId?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  rejectionReason?: string;
  needsValidation?: boolean;
  
  // Relations
  baseProduct?: {
    id: number;
    name: string;
  };
  design?: {
    id: number;
    name: string;
    imageUrl: string;
    isValidated: boolean;
  };
}

export interface Design {
  id: number;
  name: string;
  imageUrl: string;
  isValidated: boolean;
  isPending: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  validatedAt?: string;
  rejectionReason?: string;
}

export interface CreateProductPayload {
  vendorName: string;
  vendorPrice: number;
  designCloudinaryUrl: string;
  postValidationAction: PostValidationAction;
  forcedStatus?: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  productStructure: any;
}

export interface ValidationActionChoice {
  value: PostValidationAction;
  label: string;
  description: string;
  icon: string;
}

export interface CascadeNotificationPayload {
  type: 'PRODUCTS_AUTO_PUBLISHED' | 'PRODUCTS_VALIDATED_TO_DRAFT' | 'PRODUCT_MANUALLY_PUBLISHED';
  productIds: number[];
  message: string;
  timestamp: string;
}

export interface DesignValidationPayload {
  designId: number;
  action: 'VALIDATE' | 'REJECT';
  rejectionReason?: string;
}

export interface ProductFilters {
  status?: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  isValidated?: boolean;
  postValidationAction?: PostValidationAction;
}

export interface CascadeStats {
  pendingDesigns: number;
  pendingAutoPublish: number;
  pendingToDraft: number;
  validatedDrafts: number;
  recentCascades: number;
}

export interface CascadeValidationResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  cascadeResults?: {
    productsUpdated: number;
    autoPublished: number;
    toDraft: number;
  };
}

export interface CascadeValidationStats {
  total: number;
  pending: number;
  published: number;
  readyToPublish: number;
  totalProducts: number;
  pendingProducts: number;
  publishedProducts: number;
  draftProducts: number;
  validatedProducts: number;
}

// Réponse pour mise à jour d'action post-validation
export interface PostValidationActionResponse {
  success: boolean;
  message: string;
  product: VendorProduct;
}

// Réponse pour publication manuelle
export interface PublishProductResponse {
  success: boolean;
  message: string;
  product: VendorProduct;
}

// Pagination
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} 