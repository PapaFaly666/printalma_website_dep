export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

export interface VendorProduct {
  id: number;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  isValidated: boolean;
  postValidationAction: PostValidationAction;
  validatedAt?: string;
  rejectionReason?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  designUrl?: string;
  view?: any;
  vendorProductId?: number;
  vendorProduct?: any;
  baseProductId?: number;
}

export interface ValidationChoice {
  action: PostValidationAction;
  label: string;
  description: string;
  icon: string;
} 
 