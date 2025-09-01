// Types pour l'API VendorDesignProduct unifiée
export enum VendorDesignProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

// DTO pour créer un design-produit
export interface CreateVendorDesignProductDto {
  productId: number;
  designUrl: string;
  designPublicId?: string;
  designFileName?: string;
  positionX: number; // 0-1
  positionY: number; // 0-1
  scale: number; // 0.1-2
  rotation: number; // 0-360
  name?: string;
  description?: string;
  status?: VendorDesignProductStatus;
}

// DTO pour mettre à jour un design-produit
export interface UpdateVendorDesignProductDto {
  positionX?: number;
  positionY?: number;
  scale?: number;
  rotation?: number;
  name?: string;
  description?: string;
  status?: VendorDesignProductStatus;
}

// Réponse d'upload de design
export interface DesignUploadResponse {
  designUrl: string;
  publicId: string;
  originalName: string;
  size: number;
  format: string;
  width: number;
  height: number;
}

// Réponse design-produit complète
export interface VendorDesignProductResponse {
  id: number;
  vendorId: number;
  productId: number;
  designUrl: string;
  designPublicId?: string;
  designFileName?: string;
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
  name?: string;
  description?: string;
  status: VendorDesignProductStatus;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: number;
    name: string;
    price: number;
    description: string;
  };
  vendor?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shop_name?: string;
  };
}

// Types pour la validation côté client
export interface ValidationErrors {
  positionX?: string;
  positionY?: string;
  scale?: string;
  rotation?: string;
  general?: string;
}

// Interface pour les transformations (compatibilité avec l'ancien système)
export interface DesignTransforms {
  positioning: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
} 