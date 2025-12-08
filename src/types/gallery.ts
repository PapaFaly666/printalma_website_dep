/**
 * Types pour le système de galerie vendeur
 * Un vendeur a une seule galerie contenant exactement 5 images
 */

export interface GalleryImage {
  id?: number;
  url: string;
  imageUrl?: string; // Pour la compatibilité avec l'API
  file?: File;
  caption?: string;
  order: number; // Position dans la galerie (1-5)
  orderPosition?: number; // Pour la compatibilité avec l'API
  preview?: string; // URL de prévisualisation locale
}

export interface VendorGallery {
  id?: number;
  vendorId: number;
  title: string;
  description?: string;
  images: GalleryImage[]; // Exactement 5 images
  status: GalleryStatus;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum GalleryStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface CreateGalleryRequest {
  title: string;
  description?: string;
  images: File[]; // Exactement 5 images
  captions?: string[]; // Optionnel, tableau de 5 légendes (sera converti en format JSON)
}

export interface UpdateGalleryRequest {
  title?: string;
  description?: string;
  images?: (File | string)[]; // Mix de nouveaux fichiers et URLs existantes
  captions?: string[];
  status?: GalleryStatus;
  isPublished?: boolean;
}

export interface VendorGalleryResponse {
  gallery: VendorGallery | null; // null si le vendeur n'a pas encore de galerie
}

export interface GalleryValidationError {
  field: string;
  message: string;
}

// Constantes de validation
export const GALLERY_CONSTRAINTS = {
  IMAGES_COUNT: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CAPTION_MAX_LENGTH: 200
} as const;
